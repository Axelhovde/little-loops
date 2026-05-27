-- =============================================
-- Cozy Loops Studio — Migration Script
-- Safe to run multiple times (fully idempotent).
-- Uses ADD COLUMN IF NOT EXISTS so existing columns
-- are left untouched; existing tables are never dropped.
-- =============================================

-- ── 1. items: new columns ─────────────────────────────────────────
ALTER TABLE items
  ADD COLUMN IF NOT EXISTS item_type TEXT NOT NULL DEFAULT 'necklace';

ALTER TABLE items
  ADD COLUMN IF NOT EXISTS sizes JSONB NOT NULL DEFAULT '[]'::jsonb;

-- ── 2. orders: add user_email for admin display ───────────────────
--    (existing columns: order_id serial, profile_id uuid, order_date,
--     status, total_price, created_at)
ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS user_email TEXT NOT NULL DEFAULT '';

-- ── 3. order_items: add detail columns ───────────────────────────
--    (existing columns: order_item_id serial, order_id int,
--     item_id int, quantity int, price_per_item float8, created_at)
ALTER TABLE order_items
  ADD COLUMN IF NOT EXISTS selected_size TEXT;

ALTER TABLE order_items
  ADD COLUMN IF NOT EXISTS item_name TEXT NOT NULL DEFAULT '';

ALTER TABLE order_items
  ADD COLUMN IF NOT EXISTS item_photo TEXT;

-- ── 4. Indexes (all idempotent) ───────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_orders_profile_id   ON orders(profile_id);
CREATE INDEX IF NOT EXISTS idx_orders_status        ON orders(status);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_items_item_type      ON items(item_type);

-- ── 5. Row Level Security — orders ───────────────────────────────
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- Users can read their own orders (profile page)
DROP POLICY IF EXISTS "users_read_own_orders"    ON orders;
CREATE POLICY "users_read_own_orders" ON orders
  FOR SELECT USING (auth.uid() = profile_id);

-- Users can insert their own orders
DROP POLICY IF EXISTS "users_insert_own_orders"  ON orders;
CREATE POLICY "users_insert_own_orders" ON orders
  FOR INSERT WITH CHECK (auth.uid() = profile_id);

-- All authenticated users can read all orders (admin panel).
-- NOTE: This matches the existing app security model where /admin is
-- protected by login only. Upgrade to custom claims for stricter control.
DROP POLICY IF EXISTS "auth_read_all_orders"     ON orders;
CREATE POLICY "auth_read_all_orders" ON orders
  FOR SELECT TO authenticated USING (true);

-- Authenticated users can update order status (admin)
DROP POLICY IF EXISTS "auth_update_orders"       ON orders;
CREATE POLICY "auth_update_orders" ON orders
  FOR UPDATE TO authenticated USING (true);

-- ── 6. Row Level Security — order_items ──────────────────────────
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

-- Users can read items in their own orders
DROP POLICY IF EXISTS "users_read_own_order_items"   ON order_items;
CREATE POLICY "users_read_own_order_items" ON order_items
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM orders
      WHERE orders.order_id   = order_items.order_id
        AND orders.profile_id = auth.uid()
    )
  );

-- Users can insert items into their own orders
DROP POLICY IF EXISTS "users_insert_own_order_items" ON order_items;
CREATE POLICY "users_insert_own_order_items" ON order_items
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM orders
      WHERE orders.order_id   = order_items.order_id
        AND orders.profile_id = auth.uid()
    )
  );

-- All authenticated users can read all order_items (admin panel)
DROP POLICY IF EXISTS "auth_read_all_order_items"    ON order_items;
CREATE POLICY "auth_read_all_order_items" ON order_items
  FOR SELECT TO authenticated USING (true);

-- ── 7. material_care_guides ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS material_care_guides (
  guide_id    SERIAL PRIMARY KEY,
  title       TEXT NOT NULL,
  description TEXT NOT NULL,
  created_at  TIMESTAMPTZ DEFAULT now()
);

-- ── 8. items: add material_care_id FK ────────────────────────────
ALTER TABLE items
  ADD COLUMN IF NOT EXISTS material_care_id INTEGER
  REFERENCES material_care_guides(guide_id) ON DELETE SET NULL;

-- ── 9. collections ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS collections (
  collection_id SERIAL PRIMARY KEY,
  name          TEXT NOT NULL,
  description   TEXT,
  created_at    TIMESTAMPTZ DEFAULT now()
);

-- ── 10. items: add collection_id FK + ishidden ───────────────────
ALTER TABLE items
  ADD COLUMN IF NOT EXISTS collection_id INTEGER
  REFERENCES collections(collection_id) ON DELETE SET NULL;

ALTER TABLE items
  ADD COLUMN IF NOT EXISTS ishidden BOOLEAN NOT NULL DEFAULT false;

-- ── 11. orders: Stripe payment columns ───────────────────────────
ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS stripe_payment_intent_id TEXT;

ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS payment_status TEXT;

DROP POLICY IF EXISTS "users_update_own_orders" ON orders;
CREATE POLICY "users_update_own_orders" ON orders
  FOR UPDATE USING (auth.uid() = profile_id);

-- ── 12. RLS for material_care_guides ─────────────────────────────
ALTER TABLE material_care_guides ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public_read_guides" ON material_care_guides;
CREATE POLICY "public_read_guides" ON material_care_guides
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "auth_manage_guides" ON material_care_guides;
CREATE POLICY "auth_manage_guides" ON material_care_guides
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ── 13. RLS for collections ───────────────────────────────────────
ALTER TABLE collections ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public_read_collections" ON collections;
CREATE POLICY "public_read_collections" ON collections
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "auth_manage_collections" ON collections;
CREATE POLICY "auth_manage_collections" ON collections
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ── 14. Per-size inventory ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS item_size_quantities (
  id        SERIAL PRIMARY KEY,
  item_id   INTEGER NOT NULL REFERENCES items(item_id) ON DELETE CASCADE,
  size      TEXT    NOT NULL,
  quantity  INTEGER NOT NULL DEFAULT 0,
  CONSTRAINT uq_item_size UNIQUE (item_id, size)
);

ALTER TABLE item_size_quantities ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public_read_size_qty" ON item_size_quantities;
CREATE POLICY "public_read_size_qty" ON item_size_quantities
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "auth_manage_size_qty" ON item_size_quantities;
CREATE POLICY "auth_manage_size_qty" ON item_size_quantities
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ── 15. Atomic stock-decrement RPC ───────────────────────────────
CREATE OR REPLACE FUNCTION decrement_stock(
  p_item_id  INT,
  p_size     TEXT,
  p_quantity INT
) RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  IF p_size IS NOT NULL AND p_size != '' THEN
    UPDATE item_size_quantities
       SET quantity = quantity - p_quantity
     WHERE item_id = p_item_id
       AND size    = p_size
       AND quantity >= p_quantity;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'insufficient_stock: item % size %', p_item_id, p_size;
    END IF;

    UPDATE items
       SET quantity = (
             SELECT COALESCE(SUM(quantity), 0)
               FROM item_size_quantities
              WHERE item_id = p_item_id
           )
     WHERE item_id = p_item_id;
  ELSE
    UPDATE items
       SET quantity = quantity - p_quantity
     WHERE item_id = p_item_id
       AND quantity >= p_quantity;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'insufficient_stock: item %', p_item_id;
    END IF;
  END IF;
END;
$$;

-- ── 11. orders: add Stripe payment columns ───────────────────────
ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS stripe_payment_intent_id TEXT;

ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS payment_status TEXT;

-- Allow users to update their own orders (needed for cart clearing after payment)
DROP POLICY IF EXISTS "users_update_own_orders" ON orders;
CREATE POLICY "users_update_own_orders" ON orders
  FOR UPDATE USING (auth.uid() = profile_id);
