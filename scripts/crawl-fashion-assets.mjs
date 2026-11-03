import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

const ROOT = process.cwd();
const ASSET_DIR = path.join(ROOT, 'apps', 'web', 'public', 'fashion');
const DATA_FILE = path.join(ROOT, 'apps', 'web', 'src', 'data', 'crawled-catalog.json');
const SOURCE = 'https://www.everlane.com';
const USER_AGENT = 'Mozilla/5.0 (compatible; SmartFashionAcademicCrawler/1.0; +coursework; contact: Nguyen-Kim-An@users.noreply.github.com)';

const collections = [
  { handle: 'womens-tops', category: 'ao', label: 'Áo', limit: 3 },
  { handle: 'womens-pants-trousers', category: 'quan', label: 'Quần', limit: 3 },
  { handle: 'womens-dresses', category: 'vay', label: 'Váy', limit: 3 },
  { handle: 'womens-outerwear', category: 'ao-khoac', label: 'Áo khoác', limit: 3 },
  { handle: 'womens-shoes', category: 'giay', label: 'Giày', limit: 2 },
  { handle: 'womens-all-accessories', category: 'phu-kien', label: 'Phụ kiện', limit: 2 },
];

const demoPriceByCategory = {
  ao: 1390000,
  quan: 1690000,
  vay: 1890000,
  'ao-khoac': 3490000,
  giay: 2290000,
  'phu-kien': 1590000,
};

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
const clean = value => value.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
const stripHtml = value => value.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();

async function fetchWithRetry(url, responseType = 'json') {
  for (let attempt = 1; attempt <= 6; attempt += 1) {
    const response = await fetch(url, { headers: { 'User-Agent': USER_AGENT, 'Accept-Language': 'en-US,en;q=0.9', 'X-Crawler-Purpose': 'non-commercial academic prototype', From: 'Nguyen-Kim-An@users.noreply.github.com', Accept: responseType === 'json' ? 'application/json' : 'image/avif,image/webp,image/*' } });
    if (response.ok) return responseType === 'json' ? response.json() : Buffer.from(await response.arrayBuffer());
    if (response.status !== 429 || attempt === 6) throw new Error(`${response.status} ${response.statusText}: ${url}`);
    const retryAfter = Number(response.headers.get('retry-after')) || attempt * 8;
    console.log(`Rate limited; retrying in ${Math.min(retryAfter, 20)}s (${attempt}/6)`);
    await sleep(Math.min(retryAfter, 20) * 1000);
  }
}

async function downloadImage(url, filename) {
  const separator = url.includes('?') ? '&' : '?';
  const optimizedUrl = `${url}${separator}width=1200`;
  const bytes = await fetchWithRetry(optimizedUrl, 'buffer');
  await writeFile(path.join(ASSET_DIR, filename), bytes);
  await sleep(350);
  return { local: `/fashion/${filename}`, source: url };
}

async function main() {
  await mkdir(ASSET_DIR, { recursive: true });
  await mkdir(path.dirname(DATA_FILE), { recursive: true });
  const catalog = [];

  for (const collection of collections) {
    const sourcePage = `${SOURCE}/collections/${collection.handle}`;
    const feed = `${sourcePage}/products.json?limit=16`;
    console.log(`Fetching ${collection.label}: ${feed}`);
    const payload = await fetchWithRetry(feed);
    const products = payload.products
      .filter(product => product.images?.length >= 2 && product.variants?.length)
      .slice(0, collection.limit);

    for (const [productIndex, product] of products.entries()) {
      const base = `${collection.category}-${clean(product.handle)}`.slice(0, 90);
      const primary = await downloadImage(product.images[0].src, `${base}-01.jpg`);
      const alternate = await downloadImage(product.images[1].src, `${base}-02.jpg`);
      const availableVariants = product.variants.filter(variant => variant.available);
      const available = (availableVariants.length ? availableVariants : product.variants).slice(0, 5);
      const demoPrice = demoPriceByCategory[collection.category] + productIndex * 190000;
      catalog.push({
        productId: String(product.id),
        handle: product.handle,
        name: product.title.replace(/\s*\|\s*/g, ' — '),
        category: collection.label,
        categorySlug: collection.category,
        price: demoPrice,
        description: stripHtml(product.body_html || '') || 'Thiết kế hiện đại với chất liệu được chọn lọc.',
        image: primary.local,
        imageAlt: alternate.local,
        colors: [...new Set(product.tags.filter(tag => /^(black|white|brown|blue|green|red|pink|grey|gray|beige|yellow)$/i.test(tag)))],
        variants: available.map((variant, index) => ({
          variantId: String(variant.id), sku: variant.sku || `${product.id}-${index + 1}`,
          colorCode: '#d8d4cd', colorName: product.title.split('|')[1]?.trim() || 'Màu ảnh',
          size: variant.title, price: demoPrice,
          stock: 4 + ((Number(String(variant.id).slice(-2)) + index) % 15),
        })),
        source: { retailer: 'Everlane', sourcePage, productPage: `${SOURCE}/products/${product.handle}`, images: [primary.source, alternate.source] },
      });
      console.log(`  saved ${product.title}`);
    }
    await sleep(1600);
  }

  const output = {
    generatedAt: new Date().toISOString(),
    source: { name: 'Everlane', collection: `${SOURCE}/collections/womens-new-arrivals`, robots: `${SOURCE}/robots.txt` },
    note: 'Images are downloaded for a non-commercial academic prototype. Product metadata remains attributed to its source; VND prices and stock are simulated for the coursework demo.',
    products: catalog,
  };
  await writeFile(DATA_FILE, `${JSON.stringify(output, null, 2)}\n`, 'utf8');
  console.log(`Wrote ${catalog.length} products to ${DATA_FILE}`);
}

main().catch(error => { console.error(error); process.exitCode = 1; });
