CREATE EXTENSION IF NOT EXISTS vector;
CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE TYPE user_role AS ENUM ('customer', 'staff', 'admin');
CREATE TYPE product_status AS ENUM ('draft', 'active', 'archived');
CREATE TYPE order_status AS ENUM ('new', 'paid', 'confirmed', 'shipping', 'completed', 'cancelled');
CREATE TYPE payment_status AS ENUM ('pending', 'paid', 'failed', 'refunded');
CREATE TYPE tryon_status AS ENUM ('queued', 'processing', 'completed', 'failed');
CREATE TYPE behavior_action AS ENUM ('view', 'click_tryon', 'add_to_cart', 'purchase');

CREATE TABLE users (
  user_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email varchar(320) NOT NULL UNIQUE,
  password_hash text NOT NULL,
  full_name varchar(160) NOT NULL,
  phone varchar(30),
  role user_role NOT NULL DEFAULT 'customer',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE categories (
  category_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name varchar(120) NOT NULL,
  parent_id uuid REFERENCES categories(category_id) ON DELETE RESTRICT,
  UNIQUE (parent_id, name),
  CHECK (parent_id IS NULL OR parent_id <> category_id)
);

CREATE TABLE products (
  product_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id uuid NOT NULL REFERENCES categories(category_id) ON DELETE RESTRICT,
  name varchar(200) NOT NULL,
  base_price numeric(12,2) NOT NULL CHECK (base_price >= 0),
  description text NOT NULL DEFAULT '',
  status product_status NOT NULL DEFAULT 'draft'
);

CREATE TABLE product_variants (
  variant_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES products(product_id) ON DELETE CASCADE,
  sku varchar(80) NOT NULL UNIQUE,
  color_code varchar(9) NOT NULL,
  color_name varchar(80) NOT NULL,
  size varchar(30) NOT NULL,
  price_override numeric(12,2) CHECK (price_override IS NULL OR price_override >= 0),
  stock_quantity integer NOT NULL DEFAULT 0 CHECK (stock_quantity >= 0),
  UNIQUE (product_id, color_code, size)
);

CREATE TABLE product_images (
  image_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES products(product_id) ON DELETE CASCADE,
  variant_id uuid REFERENCES product_variants(variant_id) ON DELETE CASCADE,
  image_url text NOT NULL,
  is_primary boolean NOT NULL DEFAULT false
);

CREATE UNIQUE INDEX one_primary_product_image
  ON product_images(product_id) WHERE is_primary AND variant_id IS NULL;
CREATE UNIQUE INDEX one_primary_variant_image
  ON product_images(variant_id) WHERE is_primary AND variant_id IS NOT NULL;

CREATE TABLE orders (
  order_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(user_id) ON DELETE RESTRICT,
  total_amount numeric(12,2) NOT NULL CHECK (total_amount >= 0),
  shipping_fee numeric(12,2) NOT NULL DEFAULT 0 CHECK (shipping_fee >= 0),
  order_status order_status NOT NULL DEFAULT 'new',
  payment_status payment_status NOT NULL DEFAULT 'pending',
  shipping_address jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE order_items (
  order_item_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES orders(order_id) ON DELETE CASCADE,
  variant_id uuid NOT NULL REFERENCES product_variants(variant_id) ON DELETE RESTRICT,
  quantity integer NOT NULL CHECK (quantity > 0),
  unit_price numeric(12,2) NOT NULL CHECK (unit_price >= 0),
  UNIQUE (order_id, variant_id)
);

CREATE TABLE product_embeddings (
  embedding_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL UNIQUE REFERENCES products(product_id) ON DELETE CASCADE,
  image_embedding vector(512),
  text_embedding vector(512),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE tryon_sessions (
  session_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  user_image_url text NOT NULL,
  variant_id uuid NOT NULL REFERENCES product_variants(variant_id) ON DELETE RESTRICT,
  result_image_url text,
  status tryon_status NOT NULL DEFAULT 'queued',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE user_behavior_logs (
  log_id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id uuid REFERENCES users(user_id) ON DELETE SET NULL,
  product_id uuid NOT NULL REFERENCES products(product_id) ON DELETE CASCADE,
  action_type behavior_action NOT NULL,
  "timestamp" timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE outfits (
  outfit_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title varchar(180) NOT NULL,
  style_tag varchar(80) NOT NULL,
  created_by uuid REFERENCES users(user_id) ON DELETE SET NULL
);

CREATE TABLE outfit_items (
  outfit_item_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  outfit_id uuid NOT NULL REFERENCES outfits(outfit_id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES products(product_id) ON DELETE CASCADE,
  is_main_item boolean NOT NULL DEFAULT false,
  UNIQUE (outfit_id, product_id)
);

CREATE TABLE vouchers (
  voucher_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code varchar(40) NOT NULL UNIQUE,
  discount_type varchar(12) NOT NULL CHECK (discount_type IN ('percent', 'fixed')),
  discount_value numeric(12,2) NOT NULL CHECK (discount_value > 0),
  min_order_amount numeric(12,2) NOT NULL DEFAULT 0,
  starts_at timestamptz NOT NULL,
  ends_at timestamptz NOT NULL,
  usage_limit integer CHECK (usage_limit IS NULL OR usage_limit > 0),
  active boolean NOT NULL DEFAULT true,
  CHECK (ends_at > starts_at),
  CHECK (discount_type <> 'percent' OR discount_value <= 100)
);

CREATE INDEX idx_products_category_status ON products(category_id, status);
CREATE INDEX idx_variants_product ON product_variants(product_id);
CREATE INDEX idx_orders_user_created ON orders(user_id, created_at DESC);
CREATE INDEX idx_orders_status ON orders(order_status);
CREATE INDEX idx_behavior_product_time ON user_behavior_logs(product_id, "timestamp" DESC);
CREATE INDEX idx_behavior_user_time ON user_behavior_logs(user_id, "timestamp" DESC);
CREATE INDEX idx_embedding_image_hnsw ON product_embeddings USING hnsw (image_embedding vector_cosine_ops);
CREATE INDEX idx_embedding_text_hnsw ON product_embeddings USING hnsw (text_embedding vector_cosine_ops);

CREATE OR REPLACE FUNCTION validate_product_image_variant()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.variant_id IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM product_variants v
    WHERE v.variant_id = NEW.variant_id AND v.product_id = NEW.product_id
  ) THEN
    RAISE EXCEPTION 'Image variant must belong to the same product';
  END IF;
  RETURN NEW;
END $$;

CREATE TRIGGER trg_product_image_variant
BEFORE INSERT OR UPDATE ON product_images
FOR EACH ROW EXECUTE FUNCTION validate_product_image_variant();

CREATE OR REPLACE FUNCTION adjust_variant_stock(p_variant_id uuid, p_delta integer)
RETURNS integer LANGUAGE plpgsql AS $$
DECLARE current_stock integer;
BEGIN
  SELECT stock_quantity INTO current_stock
  FROM product_variants WHERE variant_id = p_variant_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Variant not found'; END IF;
  IF current_stock + p_delta < 0 THEN RAISE EXCEPTION 'Insufficient stock'; END IF;
  UPDATE product_variants SET stock_quantity = stock_quantity + p_delta
  WHERE variant_id = p_variant_id RETURNING stock_quantity INTO current_stock;
  RETURN current_stock;
END $$;
