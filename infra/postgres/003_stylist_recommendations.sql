-- Backfill the stylist recommender schema for databases created from earlier prototypes.
-- Safe to apply more than once; preserves existing catalog and order data.

ALTER TABLE categories ADD COLUMN IF NOT EXISTS slug varchar(120);
UPDATE categories SET slug = CASE category_id::text
  WHEN '20000000-0000-0000-0000-000000000001' THEN 'ao'
  WHEN '20000000-0000-0000-0000-000000000002' THEN 'quan'
  WHEN '20000000-0000-0000-0000-000000000003' THEN 'vay'
  WHEN '20000000-0000-0000-0000-000000000004' THEN 'ao-khoac'
  WHEN '20000000-0000-0000-0000-000000000005' THEN 'phu-kien'
  WHEN '20000000-0000-0000-0000-000000000006' THEN 'ao-so-mi'
END
WHERE category_id::text IN (
  '20000000-0000-0000-0000-000000000001',
  '20000000-0000-0000-0000-000000000002',
  '20000000-0000-0000-0000-000000000003',
  '20000000-0000-0000-0000-000000000004',
  '20000000-0000-0000-0000-000000000005',
  '20000000-0000-0000-0000-000000000006'
);
UPDATE categories
SET slug = CASE
  WHEN lower(name) LIKE '%áo sơ mi%' OR lower(name) LIKE '%ao so mi%' THEN 'ao-so-mi'
  WHEN lower(name) LIKE '%áo khoác%' OR lower(name) LIKE '%ao khoac%' THEN 'ao-khoac'
  WHEN lower(name) LIKE '%phụ kiện%' OR lower(name) LIKE '%phu kien%' THEN 'phu-kien'
  WHEN lower(name) LIKE '%váy%' OR lower(name) LIKE '%vay%' THEN 'vay'
  WHEN lower(name) LIKE '%quần%' OR lower(name) LIKE '%quan%' THEN 'quan'
  WHEN lower(name) LIKE '%áo%' OR lower(name) LIKE '%ao%' THEN 'ao'
  ELSE 'category-' || replace(category_id::text, '-', '')
END
WHERE slug IS NULL OR slug = '';
CREATE UNIQUE INDEX IF NOT EXISTS categories_slug_unique ON categories(slug);
ALTER TABLE categories ALTER COLUMN slug SET NOT NULL;

ALTER TABLE products ADD COLUMN IF NOT EXISTS sold_count integer NOT NULL DEFAULT 0;
ALTER TABLE products ADD COLUMN IF NOT EXISTS rating real NOT NULL DEFAULT 4.8;
ALTER TABLE products ADD COLUMN IF NOT EXISTS image_url text;
ALTER TABLE products ADD COLUMN IF NOT EXISTS image_alt_url text;

CREATE TABLE IF NOT EXISTS stylist_sessions (
  stylist_session_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_photo_url text NOT NULL DEFAULT '',
  input_mode varchar(20) NOT NULL DEFAULT 'quiz' CHECK (input_mode IN ('quiz', 'voice')),
  body_shape varchar(80) NOT NULL DEFAULT 'Chưa phân tích',
  preferences jsonb NOT NULL DEFAULT '{}'::jsonb,
  voice_transcript text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS outfits (
  outfit_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  stylist_session_id uuid REFERENCES stylist_sessions(stylist_session_id) ON DELETE CASCADE,
  title varchar(180) NOT NULL,
  style_tag varchar(120) NOT NULL DEFAULT '',
  occasion varchar(120) NOT NULL DEFAULT '',
  stylist_note text NOT NULL DEFAULT '',
  total_price numeric(12,2) NOT NULL DEFAULT 0 CHECK (total_price >= 0),
  created_by uuid
);
ALTER TABLE outfits ADD COLUMN IF NOT EXISTS stylist_session_id uuid REFERENCES stylist_sessions(stylist_session_id) ON DELETE CASCADE;
ALTER TABLE outfits ADD COLUMN IF NOT EXISTS occasion varchar(120) NOT NULL DEFAULT '';
ALTER TABLE outfits ADD COLUMN IF NOT EXISTS stylist_note text NOT NULL DEFAULT '';
ALTER TABLE outfits ADD COLUMN IF NOT EXISTS total_price numeric(12,2) NOT NULL DEFAULT 0;

CREATE TABLE IF NOT EXISTS outfit_items (
  outfit_item_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  outfit_id uuid NOT NULL REFERENCES outfits(outfit_id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES products(product_id) ON DELETE CASCADE,
  variant_id uuid REFERENCES product_variants(variant_id) ON DELETE SET NULL,
  slot_role varchar(60) NOT NULL DEFAULT 'Áo chủ đạo',
  is_main_item boolean NOT NULL DEFAULT false
);
ALTER TABLE outfit_items ADD COLUMN IF NOT EXISTS variant_id uuid REFERENCES product_variants(variant_id) ON DELETE SET NULL;
ALTER TABLE outfit_items ADD COLUMN IF NOT EXISTS slot_role varchar(60) NOT NULL DEFAULT 'Áo chủ đạo';
CREATE INDEX IF NOT EXISTS outfits_stylist_session_idx ON outfits(stylist_session_id);
CREATE INDEX IF NOT EXISTS outfit_items_outfit_idx ON outfit_items(outfit_id);
