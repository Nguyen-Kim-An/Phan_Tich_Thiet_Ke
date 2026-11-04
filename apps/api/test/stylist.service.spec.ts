import { DatabaseService } from '../src/database.service';
import { StylistService } from '../src/modules/stylist.service';

const productRows = [
  {
    product_id: '30000000-0000-0000-0000-000000000001',
    name: 'Áo khoác Linen nhẹ',
    base_price: 1_100_000,
    description: 'Áo khoác linen màu be',
    sold_count: 4,
    rating: 4.7,
    image_url: '/products/jacket.svg',
    category_name: 'Áo khoác',
    category_slug: 'ao-khoac',
    colors: ['Be'],
    variants: [
      { variantId: '40000000-0000-0000-0000-000000000001', sku: 'JK-S', colorCode: '#DDD', colorName: 'Be', size: 'S', price: 1_000_000, stock: 3 },
      { variantId: '40000000-0000-0000-0000-000000000002', sku: 'JK-M', colorCode: '#DDD', colorName: 'Be', size: 'M', price: 1_100_000, stock: 2 },
    ],
  },
  {
    product_id: '30000000-0000-0000-0000-000000000002',
    name: 'Sơ mi Linen trắng',
    base_price: 600_000,
    description: 'Sơ mi linen thoáng mát màu trắng',
    sold_count: 4,
    rating: 4.8,
    image_url: '/products/shirt.svg',
    category_name: 'Áo',
    category_slug: 'ao',
    colors: ['Trắng'],
    variants: [{ variantId: '40000000-0000-0000-0000-000000000003', sku: 'SH-M', colorCode: '#FFF', colorName: 'Trắng', size: 'M', price: 600_000, stock: 5 }],
  },
  {
    product_id: '30000000-0000-0000-0000-000000000003',
    name: 'Quần suông cotton',
    base_price: 700_000,
    description: 'Quần suông đen từ cotton',
    sold_count: 2,
    rating: 4.6,
    image_url: '/products/trousers.svg',
    category_name: 'Quần',
    category_slug: 'quan',
    colors: ['Đen'],
    variants: [{ variantId: '40000000-0000-0000-0000-000000000004', sku: 'TR-M', colorCode: '#000', colorName: 'Đen', size: 'M', price: 700_000, stock: 2 }],
  },
  {
    product_id: '30000000-0000-0000-0000-000000000004',
    name: 'Váy satin tối giản',
    base_price: 1_000_000,
    description: 'Váy satin màu đen',
    sold_count: 1,
    rating: 4.9,
    image_url: '/products/dress.svg',
    category_name: 'Váy',
    category_slug: 'vay',
    colors: ['Đen'],
    variants: [{ variantId: '40000000-0000-0000-0000-000000000005', sku: 'DR-M', colorCode: '#000', colorName: 'Đen', size: 'M', price: 1_000_000, stock: 1 }],
  },
];

describe('StylistService', () => {
  it('creates only in-budget outfits with available variants and persists the session', async () => {
    let generatedId = 0;
    const client = {
      query: jest.fn(async (sql: string) => {
        if (sql.includes('FROM products p')) return { rows: productRows };
        if (sql.includes('INSERT INTO stylist_sessions')) {
          return { rows: [{ stylist_session_id: '50000000-0000-0000-0000-000000000001', created_at: new Date('2026-11-04T00:00:00Z') }] };
        }
        if (sql.includes('INSERT INTO outfits')) {
          generatedId += 1;
          return { rows: [{ outfit_id: `60000000-0000-0000-0000-${String(generatedId).padStart(12, '0')}` }] };
        }
        if (sql.includes('INSERT INTO outfit_items')) {
          generatedId += 1;
          return { rows: [{ outfit_item_id: `70000000-0000-0000-0000-${String(generatedId).padStart(12, '0')}` }] };
        }
        throw new Error(`Unexpected SQL: ${sql}`);
      }),
    };
    const database = {
      transaction: jest.fn(async (work: (transactionClient: typeof client) => unknown) => work(client)),
    } as unknown as DatabaseService;
    const service = new StylistService(database);

    const result = await service.recommend({
      inputMode: 'quiz',
      quizAnswers: {
        occasion: 'Công sở & Gặp đối tác',
        styleVibe: 'Thanh lịch tối giản',
        fitGoal: 'Thoải mái',
        budgetLimit: 2_300_000,
        preferredMaterials: ['Linen / đũi'],
        preferredColors: ['trang'],
        preferredSize: 'M',
      },
    });

    expect(result.stylistSessionId).toBe('50000000-0000-0000-0000-000000000001');
    expect(result.recommendedOutfits.length).toBeGreaterThan(0);
    expect(result.recommendedOutfits.every((outfit) => outfit.totalPrice <= 2_300_000)).toBe(true);
    expect(result.recommendedOutfits.flatMap((outfit) => outfit.items).every((item) => item.variant.stock > 0)).toBe(true);
    expect(result.recommendedOutfits.flatMap((outfit) => outfit.items).some((item) => item.variant.size === 'M')).toBe(true);
    expect(client.query).toHaveBeenCalledWith(expect.stringContaining('INSERT INTO stylist_sessions'), expect.any(Array));
  });

  it('returns no outfit when the budget cannot cover the required items', async () => {
    const client = {
      query: jest.fn(async (sql: string) => {
        if (sql.includes('FROM products p')) return { rows: productRows };
        if (sql.includes('INSERT INTO stylist_sessions')) {
          return { rows: [{ stylist_session_id: '50000000-0000-0000-0000-000000000001', created_at: new Date() }] };
        }
        throw new Error(`Unexpected SQL: ${sql}`);
      }),
    };
    const database = {
      transaction: jest.fn(async (work: (transactionClient: typeof client) => unknown) => work(client)),
    } as unknown as DatabaseService;
    const service = new StylistService(database);

    const result = await service.recommend({
      inputMode: 'quiz',
      quizAnswers: {
        occasion: 'Công sở',
        styleVibe: 'Tối giản',
        fitGoal: 'Thoải mái',
        budgetLimit: 100_000,
      },
    });

    expect(result.recommendedOutfits).toEqual([]);
  });
});
