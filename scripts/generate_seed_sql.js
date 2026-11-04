const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

function toUuid(str) {
  const hash = crypto.createHash('md5').update(String(str)).digest('hex');
  return `${hash.slice(0, 8)}-${hash.slice(8, 12)}-4${hash.slice(13, 16)}-a${hash.slice(17, 20)}-${hash.slice(20, 32)}`;
}

function escapeSql(str) {
  if (str === null || str === undefined) return 'NULL';
  return `'${String(str).replace(/'/g, "''")}'`;
}

const catalogPath = path.join(__dirname, '../apps/web/src/data/crawled-catalog.json');
const catalog = JSON.parse(fs.readFileSync(catalogPath, 'utf8'));

const CATEGORY_MAP = {
  'ao': '20000000-0000-0000-0000-000000000001',
  'quan': '20000000-0000-0000-0000-000000000002',
  'vay': '20000000-0000-0000-0000-000000000003',
  'ao-khoac': '20000000-0000-0000-0000-000000000004',
  'phu-kien': '20000000-0000-0000-0000-000000000005',
  'giay': '20000000-0000-0000-0000-000000000007',
};

const DEFAULT_SHOP_ID = 'fe2c137e-8365-42d7-9506-5ae1acfaf0be';

const lines = [];
lines.push('-- 004_seed_real_catalog.sql: Seed 330+ real Everlane fashion products with high-res photography');
lines.push('BEGIN;');
lines.push(`
INSERT INTO categories (category_id, name, parent_id, slug)
VALUES ('20000000-0000-0000-0000-000000000007', 'Giày', NULL, 'giay')
ON CONFLICT (slug) DO NOTHING;
`);

lines.push(`
-- Clean old placeholder SVG products
DELETE FROM outfit_items WHERE product_id IN ('30000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000002', '30000000-0000-0000-0000-000000000003', '30000000-0000-0000-0000-000000000004');
DELETE FROM product_images WHERE product_id IN ('30000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000002', '30000000-0000-0000-0000-000000000003', '30000000-0000-0000-0000-000000000004');
DELETE FROM product_variants WHERE product_id IN ('30000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000002', '30000000-0000-0000-0000-000000000003', '30000000-0000-0000-0000-000000000004');
DELETE FROM products WHERE product_id IN ('30000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000002', '30000000-0000-0000-0000-000000000003', '30000000-0000-0000-0000-000000000004');
`);

const products = catalog.products;
console.log(`Processing ${products.length} products...`);

products.forEach((p, index) => {
  const pUuid = toUuid(`prod-${p.productId}`);
  const catUuid = CATEGORY_MAP[p.categorySlug] || '20000000-0000-0000-0000-000000000001';
  const soldCount = 28 + ((index * 19) % 240);
  const rating = (4.5 + ((index * 3) % 6) * 0.08).toFixed(1);
  const img = p.image || '';
  const imgAlt = p.imageAlt || img;

  lines.push(`
INSERT INTO products (product_id, category_id, name, base_price, description, status, shop_id, approval_status, sold_count, rating, image_url, image_alt_url)
VALUES ('${pUuid}', '${catUuid}', ${escapeSql(p.name)}, ${p.price || 0}, ${escapeSql(p.description)}, 'active', '${DEFAULT_SHOP_ID}', 'published', ${soldCount}, ${rating}, ${escapeSql(img)}, ${escapeSql(imgAlt)})
ON CONFLICT (product_id) DO UPDATE SET
  image_url = EXCLUDED.image_url,
  image_alt_url = EXCLUDED.image_alt_url,
  base_price = EXCLUDED.base_price,
  description = EXCLUDED.description;
`);

  const imgUuid = toUuid(`img-${p.productId}-primary`);
  lines.push(`
INSERT INTO product_images (image_id, product_id, variant_id, image_url, is_primary)
VALUES ('${imgUuid}', '${pUuid}', NULL, ${escapeSql(img)}, true)
ON CONFLICT (image_id) DO UPDATE SET image_url = EXCLUDED.image_url;
`);

  if (p.imageAlt && p.imageAlt !== img) {
    const altImgUuid = toUuid(`img-${p.productId}-alt`);
    lines.push(`
INSERT INTO product_images (image_id, product_id, variant_id, image_url, is_primary)
VALUES ('${altImgUuid}', '${pUuid}', NULL, ${escapeSql(p.imageAlt)}, false)
ON CONFLICT (image_id) DO UPDATE SET image_url = EXCLUDED.image_url;
`);
  }

  (p.variants || []).forEach((v, vIdx) => {
    const vUuid = toUuid(`var-${v.variantId || `${p.productId}-${vIdx}`}`);
    const sku = v.sku || `SKU-${p.productId}-${v.size || vIdx}`;
    const colorCode = v.colorCode || '#333333';
    const colorName = v.colorName || 'Mặc định';
    const size = v.size || 'M';
    const price = v.price || p.price || 0;
    const stock = typeof v.stock === 'number' ? v.stock : 12;

    lines.push(`
INSERT INTO product_variants (variant_id, product_id, sku, color_code, color_name, size, price_override, stock_quantity, available_stock, committed_stock, shop_id)
VALUES ('${vUuid}', '${pUuid}', ${escapeSql(sku)}, ${escapeSql(colorCode)}, ${escapeSql(colorName)}, ${escapeSql(size)}, ${price}, ${stock}, ${stock}, 0, '${DEFAULT_SHOP_ID}')
ON CONFLICT (sku) DO UPDATE SET
  price_override = EXCLUDED.price_override,
  stock_quantity = EXCLUDED.stock_quantity,
  available_stock = EXCLUDED.available_stock;
`);
  });
});

lines.push('COMMIT;');

const outPath = path.join(__dirname, '../infra/postgres/004_seed_real_catalog.sql');
fs.writeFileSync(outPath, lines.join('\n'), 'utf8');
console.log(`Generated ${lines.length} SQL lines to ${outPath}`);
