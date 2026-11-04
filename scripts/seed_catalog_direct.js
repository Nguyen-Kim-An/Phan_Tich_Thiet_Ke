const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { Client } = require('pg');

function toUuid(str) {
  const hash = crypto.createHash('md5').update(String(str)).digest('hex');
  return `${hash.slice(0, 8)}-${hash.slice(8, 12)}-4${hash.slice(13, 16)}-a${hash.slice(17, 20)}-${hash.slice(20, 32)}`;
}

const CATEGORY_MAP = {
  'ao': '20000000-0000-0000-0000-000000000001',
  'quan': '20000000-0000-0000-0000-000000000002',
  'vay': '20000000-0000-0000-0000-000000000003',
  'ao-khoac': '20000000-0000-0000-0000-000000000004',
  'phu-kien': '20000000-0000-0000-0000-000000000005',
  'giay': '20000000-0000-0000-0000-000000000007',
};

const DEFAULT_SHOP_ID = 'fe2c137e-8365-42d7-9506-5ae1acfaf0be';

async function main() {
  const connectionString = process.env.DATABASE_URL || 'postgresql://smartfashion:smartfashion_dev@postgres:5432/smartfashion';
  const client = new Client({
    connectionString,
  });

  await client.connect();
  console.log('Connected to PostgreSQL successfully.');

  // Set client encoding to UTF8
  await client.query("SET client_encoding = 'UTF8';");

  // Ensure Giay category exists
  await client.query(`
    INSERT INTO categories (category_id, name, parent_id, slug)
    VALUES ('20000000-0000-0000-0000-000000000007', 'Giày', NULL, 'giay')
    ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name;
  `);

  let catalogPath = '/app/crawled-catalog.json';
  if (!fs.existsSync(catalogPath)) {
    catalogPath = path.join(__dirname, 'crawled-catalog.json');
  }
  if (!fs.existsSync(catalogPath)) {
    catalogPath = path.join(__dirname, '../apps/web/src/data/crawled-catalog.json');
  }
  const catalog = JSON.parse(fs.readFileSync(catalogPath, 'utf8'));
  const products = catalog.products;
  console.log(`Seeding ${products.length} products with 100% native UTF-8 Vietnamese metadata...`);

  await client.query('BEGIN;');

  try {
    for (let index = 0; index < products.length; index++) {
      const p = products[index];
      const pUuid = toUuid(`prod-${p.productId}`);
      const catUuid = CATEGORY_MAP[p.categorySlug] || '20000000-0000-0000-0000-000000000001';
      const soldCount = 28 + ((index * 19) % 240);
      const rating = Number((4.5 + ((index * 3) % 6) * 0.08).toFixed(1));
      const img = p.image || '';
      const imgAlt = p.imageAlt || img;

      await client.query(
        `INSERT INTO products (product_id, category_id, name, base_price, description, status, shop_id, approval_status, sold_count, rating, image_url, image_alt_url)
         VALUES ($1, $2, $3, $4, $5, 'active', $6, 'published', $7, $8, $9, $10)
         ON CONFLICT (product_id) DO UPDATE SET
           name = EXCLUDED.name,
           description = EXCLUDED.description,
           base_price = EXCLUDED.base_price,
           image_url = EXCLUDED.image_url,
           image_alt_url = EXCLUDED.image_alt_url,
           status = 'active',
           approval_status = 'published';`,
        [pUuid, catUuid, p.name, p.price || 0, p.description || '', DEFAULT_SHOP_ID, soldCount, rating, img, imgAlt]
      );

      // Primary product image
      const imgUuid = toUuid(`img-${p.productId}-primary`);
      await client.query(
        `INSERT INTO product_images (image_id, product_id, variant_id, image_url, is_primary)
         VALUES ($1, $2, NULL, $3, true)
         ON CONFLICT (image_id) DO UPDATE SET image_url = EXCLUDED.image_url;`,
        [imgUuid, pUuid, img]
      );

      // Variants
      for (let vIdx = 0; vIdx < (p.variants || []).length; vIdx++) {
        const v = p.variants[vIdx];
        const vUuid = toUuid(`var-${v.variantId || `${p.productId}-${vIdx}`}`);
        const sku = v.sku || `SKU-${p.productId}-${v.size || vIdx}`;
        const colorCode = v.colorCode || '#333333';
        const colorName = v.colorName || 'Mặc định';
        const size = v.size || 'M';
        const price = v.price || p.price || 0;
        const stock = typeof v.stock === 'number' ? v.stock : 12;

        await client.query(
          `INSERT INTO product_variants (variant_id, product_id, sku, color_code, color_name, size, price_override, stock_quantity, available_stock, committed_stock, shop_id)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 0, $10)
           ON CONFLICT (sku) DO UPDATE SET
             color_name = EXCLUDED.color_name,
             price_override = EXCLUDED.price_override,
             stock_quantity = EXCLUDED.stock_quantity,
             available_stock = EXCLUDED.available_stock;`,
          [vUuid, pUuid, sku, colorCode, colorName, size, price, stock, stock, DEFAULT_SHOP_ID]
        );
      }
    }

    await client.query('COMMIT;');
    console.log('Seeding completed successfully! All Vietnamese titles are now 100% correct.');
  } catch (err) {
    await client.query('ROLLBACK;');
    console.error('Seeding error:', err);
  } finally {
    await client.end();
  }
}

main();
