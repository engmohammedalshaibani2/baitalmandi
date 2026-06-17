-- Performance Indexes for Critical Query Paths
-- These indexes eliminate sequential scans on the most queried tables.

-- Orders table indexes (heavily queried for admin, reports, customer views)
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders (status);
CREATE INDEX IF NOT EXISTS idx_orders_customer_phone ON orders (customer_phone);
CREATE INDEX IF NOT EXISTS idx_orders_is_deleted_is_archived ON orders (is_deleted, is_archived);
CREATE INDEX IF NOT EXISTS idx_orders_status_created ON orders (status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_customer_status ON orders (customer_phone, status);

-- Order items (joined on every order query)
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items (order_id);

-- Order status history (audit trail)
CREATE INDEX IF NOT EXISTS idx_order_status_history_order_id ON order_status_history (order_id);
CREATE INDEX IF NOT EXISTS idx_order_status_history_created_at ON order_status_history (created_at DESC);

-- Audit logs
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity ON audit_logs (entity_id, entity_type);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs (created_at DESC);

-- Order sequences (daily number generation)
CREATE INDEX IF NOT EXISTS idx_order_sequences_sequence_date ON order_sequences (sequence_date DESC);

-- Order offers (join on every order with offers)
CREATE INDEX IF NOT EXISTS idx_order_offers_order_id_created ON order_offers (order_id, created_at);

-- Order offer items
CREATE INDEX IF NOT EXISTS idx_order_offer_items_order_offer_id ON order_offer_items (order_offer_id);

-- Item prices (joined on menu queries)
CREATE INDEX IF NOT EXISTS idx_item_prices_item_id_active ON item_prices (item_id, is_active);

-- Reviews (homepage display)
CREATE INDEX IF NOT EXISTS idx_reviews_is_featured ON reviews (is_featured, created_at DESC);

-- Cart items (cleanup and queries)
CREATE INDEX IF NOT EXISTS idx_cart_items_session_id ON cart_items (session_id);

-- Customer tokens (lookup by phone)
CREATE INDEX IF NOT EXISTS idx_customer_tokens_phone ON customer_tokens (phone);

-- Site settings (lookup by key)
CREATE INDEX IF NOT EXISTS idx_site_settings_key ON site_settings (setting_key);
