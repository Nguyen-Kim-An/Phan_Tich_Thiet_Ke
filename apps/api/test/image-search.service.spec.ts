import sharp from 'sharp';
import { DatabaseService } from '../src/database.service';
import { groundMatches, ImageSearchService, retrieveProducts, SearchProduct, validateAnalysis, validateBoxes } from '../src/modules/image-search.service';
import catalog from '../src/data/crawled-catalog.json';

const analysis = { isClothing: true, categorySlug: 'ao', garmentType: 'white oxford shirt áo sơ mi trắng',
  colors: ['white', 'trắng'], materials: ['cotton'], patterns: ['solid'], details: ['collar', 'buttons'],
  searchTerms: ['oxford', 'shirt', 'so mi'], description: 'Áo sơ mi trắng có cổ và cúc.' };
const products: SearchProduct[] = catalog.products.map(product => ({ ...product, basePrice: product.price,
  soldCount: 0, rating: 0, variants: product.variants.map(v => ({ ...v, productId: product.productId, stockQuantity: v.stock })) }));
const response = (value: unknown) => ({ ok: true, status: 200,
  json: async () => ({ choices: [{ finish_reason: 'stop', message: { content: JSON.stringify(value) } }] }),
} as Response);

describe('grounded image RAG', () => {
  const originalEnv = { ...process.env };
  let image: Buffer;
  let fetchMock: jest.SpyInstance;
  let thumbnailMock: jest.SpyInstance;
  const db = { query: jest.fn() };

  beforeAll(async () => { image = await sharp({ create: { width: 16, height: 16, channels: 3, background: 'white' } }).png().toBuffer(); });
  beforeEach(() => {
    process.env.SHOPAIKEY_API_KEY = 'unit-test-provider-key';
    process.env.SHOPAIKEY_BASE_URL = 'https://api.shopaikey.com/v1';
    process.env.SHOPAIKEY_MODEL = 'gpt-4o-mini';
    process.env.IMAGE_SEARCH_SOURCE = 'catalog';
    fetchMock = jest.spyOn(global, 'fetch');
    thumbnailMock = jest.spyOn(ImageSearchService.prototype as any, 'thumbnail').mockResolvedValue(null);
    db.query.mockReset();
  });
  afterEach(() => { fetchMock.mockRestore(); thumbnailMock.mockRestore(); process.env = { ...originalEnv }; });

  it('retrieves current records by garment semantics rather than filenames or image layout', () => {
    const found = retrieveProducts(analysis, products);
    expect(found.length).toBeGreaterThan(0);
    expect(found.length).toBeLessThanOrEqual(30);
    expect(found.every(product => product.categorySlug === 'ao')).toBe(true);
    expect(found.slice(0, 5).some(product => product.name.includes('Oxford'))).toBe(true);
  });

  it('rejects invalid model analysis', () => {
    expect(() => validateAnalysis({ isClothing: true, categorySlug: 'invented-category' })).toThrow();
  });

  it('keeps real region coordinates and rejects invented/out-of-bounds boxes', () => {
    const boxes = validateBoxes([
      { label: 'Áo sơ mi', categorySlug: 'ao', x: 15, y: 10, width: 60, height: 40, confidence: 0.8 },
      { label: 'invalid', categorySlug: 'ao', x: 90, y: 0, width: 60, height: 40, confidence: 0.8 },
      { label: 'invalid', categorySlug: 'unknown', x: 10, y: 0, width: 60, height: 40, confidence: 0.8 },
    ]);
    expect(boxes).toHaveLength(1);
    expect(boxes[0]).toMatchObject({ categorySlug: 'ao', x: 15, y: 10, width: 60, height: 40 });
  });

  it('accepts valid coordinates when the provider omits optional confidence', () => {
    const boxes = validateBoxes([{ label: 'shirt', categorySlug: 'ao', x: 20, y: 10, width: 60, height: 40 }]);
    expect(boxes).toHaveLength(1);
    expect(boxes[0].confidence).toBe(0);
  });

  it('does not turn a documented puffer into a leather jacket', () => {
    const puffer = { ...products[0], name: 'Nylon puffer jacket', description: 'Recycled nylon and down insulation.' };
    const result = groundMatches({ matches: [{ productId: puffer.productId, score: 0.9, reason: 'Leather jacket' }] },
      [puffer], { ...analysis, materials: ['leather'], categorySlug: 'ao-khoac' });
    expect(result).toEqual([]);
  });

  it('detects only the regions returned by Vision, not a fixed shirt/pants template', async () => {
    fetchMock.mockResolvedValueOnce(response({ boxes: [
      { label: 'Áo trắng', categorySlug: 'ao', x: 20, y: 10, width: 60, height: 70, confidence: 0.9 },
    ] }));
    const service = new ImageSearchService(db as unknown as DatabaseService);
    const detected = await service.detect(image);
    expect(detected.boxes).toHaveLength(1);
    expect(detected.boxes[0].categorySlug).toBe('ao');
    await service.detect(image);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('crops the selected image region before analysing it', async () => {
    const id = retrieveProducts(analysis, products)[0].productId;
    fetchMock.mockResolvedValueOnce(response(analysis))
      .mockResolvedValueOnce(response({ matches: [{ productId: id, score: 0.8 }] }));
    const service = new ImageSearchService(db as unknown as DatabaseService);
    await service.search(image, '', { id: 'region-1', label: 'Áo', categorySlug: 'ao', x: 0, y: 0, width: 50, height: 100, confidence: 0.8 });
    const body = JSON.parse(fetchMock.mock.calls[0][1].body);
    const sent = Buffer.from(body.messages[1].content[1].image_url.url.split(',')[1], 'base64');
    expect(await sharp(sent).metadata()).toMatchObject({ width: 8, height: 16 });
    expect(body.messages[1].content[0].text).toContain('categorySlug=ao');
  });

  it('discards fabricated IDs, duplicates and invalid relevance scores', () => {
    const id = products[0].productId;
    const result = groundMatches({ matches: [
      { productId: 'invented-id', score: 1 }, { productId: id, score: 0.9, reason: 'Cùng kiểu sơ mi.' },
      { productId: id, score: 0.8 }, { productId: products[1].productId, score: 9 },
      { productId: products[2].productId, score: 0.2 },
    ] }, products);
    expect(result).toHaveLength(1);
    expect(result[0].productId).toBe(id);
    expect(result[0].product).toEqual(products[0]);
  });

  it('calls the real API format twice: vision extraction, then grounded reranking', async () => {
    const id = retrieveProducts(analysis, products)[0].productId;
    fetchMock.mockResolvedValueOnce(response(analysis))
      .mockResolvedValueOnce(response({ matches: [{ productId: id, score: 0.85, reason: 'Cùng cổ áo và màu.' }] }));
    const service = new ImageSearchService(db as unknown as DatabaseService);
    const result = await service.search(image);
    expect(result.source).toBe('catalog');
    expect(result.strategy).toBe('vision-rag');
    expect(result.matches[0].productId).toBe(id);
    expect(fetchMock).toHaveBeenCalledTimes(2);
    for (const [url, options] of fetchMock.mock.calls) {
      expect(url).toBe('https://api.shopaikey.com/v1/chat/completions');
      const body = JSON.parse(options.body);
      expect(body.model).toBe('gpt-4o-mini');
      expect(body.messages[1].content[1].image_url.url).toMatch(/^data:image\/jpeg;base64,/);
    }
    await service.search(image);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('does not rank random products when there is no clothing', async () => {
    fetchMock.mockResolvedValueOnce(response({ ...analysis, isClothing: false }));
    const result = await new ImageSearchService(db as unknown as DatabaseService).search(image);
    expect(result.matches).toEqual([]);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('returns actual PostgreSQL IDs and product snapshots when configured', async () => {
    process.env.IMAGE_SEARCH_SOURCE = 'postgres';
    const id = 'db-product-uuid';
    db.query.mockResolvedValue({ rows: [{ product_id: id, name: 'Sơ mi trắng', base_price: 600000,
      description: 'white cotton oxford shirt', category_name: 'Áo', category_slug: 'ao', image_url: '/shirt.jpg', variants: [] }] });
    fetchMock.mockResolvedValueOnce(response(analysis))
      .mockResolvedValueOnce(response({ matches: [{ productId: id, score: 0.8, reason: 'Cùng loại áo.' }] }));
    const result = await new ImageSearchService(db as unknown as DatabaseService).search(image);
    expect(db.query).toHaveBeenCalledTimes(1);
    expect(result.source).toBe('postgres');
    expect(result.matches[0].product.productId).toBe(id);
  });

  it('reports a database failure instead of silently searching a different data source', async () => {
    process.env.IMAGE_SEARCH_SOURCE = 'postgres';
    db.query.mockRejectedValue(new Error('database offline'));
    await expect(new ImageSearchService(db as unknown as DatabaseService).search(image)).rejects.toMatchObject({ status: 503 });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('reports provider authentication errors without creating fake matches or leaking credentials', async () => {
    fetchMock.mockResolvedValueOnce({ ok: false, status: 401 } as Response);
    await expect(new ImageSearchService(db as unknown as DatabaseService).search(image))
      .rejects.toMatchObject({ status: 502, message: 'ShopAIKey từ chối API key.' });
  });

  it('rejects invalid image bytes before calling the model', async () => {
    await expect(new ImageSearchService(db as unknown as DatabaseService).search(Buffer.from('bad image')))
      .rejects.toMatchObject({ status: 422 });
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
