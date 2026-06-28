-- ============================================================
-- Payment Gateway Schema Migration — PRODUCTION READY
-- Mempersiapkan tabel-tabel pembayaran sesuai spesifikasi user
-- Kompatibel dengan PostgreSQL / Supabase
-- ============================================================

-- Drop old tables because they are empty or incompatible
DROP TABLE IF EXISTS payments CASCADE;
DROP TABLE IF EXISTS payment_callbacks CASCADE;
DROP TABLE IF EXISTS payment_logs CASCADE;
DROP TABLE IF EXISTS payment_invoices CASCADE;
DROP TABLE IF EXISTS invoices CASCADE;

-- 1. Tabel payments
CREATE TABLE IF NOT EXISTS payments (
  id              VARCHAR(36)   PRIMARY KEY,
  order_id        VARCHAR(100)  NOT NULL,
  subscription_id VARCHAR(36),
  amount          NUMERIC(12,2) NOT NULL,
  status          VARCHAR(50)   NOT NULL DEFAULT 'pending', -- pending, paid, expired, failed, cancelled, refunded
  payment_method  VARCHAR(100)  NOT NULL, -- Channel code, e.g. "BC", "SP"
  payment_channel VARCHAR(100),            -- Virtual Account / Redirect / Retail
  reference       VARCHAR(100),            -- Duitku transaction reference
  va_number       VARCHAR(100),            -- Virtual Account number (if VA)
  payment_url     TEXT,                    -- Redirect URL (if e-wallet/card)
  expires_at      TIMESTAMPTZ   NOT NULL,
  paid_at         TIMESTAMPTZ,
  created_at      TIMESTAMPTZ   DEFAULT NOW(),
  updated_at      TIMESTAMPTZ   DEFAULT NOW()
);

-- 2. Tabel payment_items
CREATE TABLE IF NOT EXISTS payment_items (
  id         VARCHAR(36)   PRIMARY KEY,
  payment_id VARCHAR(36)   NOT NULL REFERENCES payments(id) ON DELETE CASCADE,
  item_name  VARCHAR(255)  NOT NULL,
  qty        INT           NOT NULL DEFAULT 1,
  price      NUMERIC(12,2) NOT NULL,
  created_at TIMESTAMPTZ   DEFAULT NOW()
);

-- 3. Tabel payment_logs
CREATE TABLE IF NOT EXISTS payment_logs (
  id         VARCHAR(36)   PRIMARY KEY,
  payment_id VARCHAR(36)   NOT NULL,
  event_type VARCHAR(100)  NOT NULL,
  message    TEXT,
  payload    TEXT,
  created_at TIMESTAMPTZ   DEFAULT NOW()
);

-- 4. Tabel payment_callbacks
CREATE TABLE IF NOT EXISTS payment_callbacks (
  id                 VARCHAR(36)   PRIMARY KEY,
  payment_id         VARCHAR(36)   NOT NULL,
  duitku_reference   VARCHAR(100),
  result_code        VARCHAR(10),
  callback_payload   TEXT,
  signature_verified SMALLINT      NOT NULL DEFAULT 0,
  client_ip          VARCHAR(50),
  created_at         TIMESTAMPTZ   DEFAULT NOW()
);

-- 5. Tabel payment_methods
CREATE TABLE IF NOT EXISTS payment_methods (
  payment_method VARCHAR(50)   PRIMARY KEY,
  name           VARCHAR(100)  NOT NULL,
  payment_image  TEXT,
  total_fee      NUMERIC(12,2) DEFAULT 0,
  is_active      SMALLINT      DEFAULT 1,
  created_at     TIMESTAMPTZ   DEFAULT NOW()
);

-- 6. Tabel payment_refunds
CREATE TABLE IF NOT EXISTS payment_refunds (
  id         VARCHAR(36)   PRIMARY KEY,
  payment_id VARCHAR(36)   NOT NULL REFERENCES payments(id) ON DELETE CASCADE,
  amount     NUMERIC(12,2) NOT NULL,
  reason     TEXT,
  status     VARCHAR(50)   NOT NULL DEFAULT 'pending', -- pending, approved, rejected
  created_at TIMESTAMPTZ   DEFAULT NOW()
);

-- 7. Tabel payment_history (log per-transition status)
CREATE TABLE IF NOT EXISTS payment_history (
  id          BIGSERIAL     PRIMARY KEY,
  payment_id  VARCHAR(36)   NOT NULL,
  from_status VARCHAR(50)   NOT NULL DEFAULT 'none',
  to_status   VARCHAR(50)   NOT NULL,
  created_at  TIMESTAMPTZ   DEFAULT NOW()
);

-- 7b. Tabel payment_status_history (spesifikasi tabel tambahan user)
CREATE TABLE IF NOT EXISTS payment_status_history (
  id          BIGSERIAL     PRIMARY KEY,
  payment_id  VARCHAR(36)   NOT NULL,
  from_status VARCHAR(50)   NOT NULL,
  to_status   VARCHAR(50)   NOT NULL,
  created_at  TIMESTAMPTZ   DEFAULT NOW()
);

-- 8. Tabel payment_attempts (log attempt request ke Duitku)
CREATE TABLE IF NOT EXISTS payment_attempts (
  id               VARCHAR(36)   PRIMARY KEY,
  payment_id       VARCHAR(36)   NOT NULL,
  attempt_number   INT           NOT NULL DEFAULT 1,
  status           VARCHAR(50)   NOT NULL,
  response_payload TEXT,
  created_at       TIMESTAMPTZ   DEFAULT NOW()
);

-- 9. Tabel payment_notifications
CREATE TABLE IF NOT EXISTS payment_notifications (
  id         VARCHAR(36)   PRIMARY KEY,
  user_id    VARCHAR(36)   NOT NULL,
  payment_id VARCHAR(36),
  title      VARCHAR(255)  NOT NULL,
  message    TEXT,
  is_read    SMALLINT      DEFAULT 0,
  created_at TIMESTAMPTZ   DEFAULT NOW()
);

-- 10. Tabel payment_invoices
CREATE TABLE IF NOT EXISTS payment_invoices (
  id             VARCHAR(36)   PRIMARY KEY,
  payment_id     VARCHAR(36)   NOT NULL REFERENCES payments(id) ON DELETE CASCADE,
  invoice_number VARCHAR(100)  NOT NULL UNIQUE,
  pdf_url        TEXT,
  created_at     TIMESTAMPTZ   DEFAULT NOW()
);

-- 11. Tabel invoices (Compatibility table for existing billing history routes)
CREATE TABLE IF NOT EXISTS invoices (
  id             VARCHAR(36)   PRIMARY KEY,
  payment_id     VARCHAR(36)   NOT NULL REFERENCES payments(id) ON DELETE CASCADE,
  invoice_number VARCHAR(100)  NOT NULL UNIQUE,
  pdf_url        TEXT,
  created_at     TIMESTAMPTZ   DEFAULT NOW()
);

-- ============================================================
-- INDEXES & PERFORMANCE
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_payments_order ON payments(order_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);
CREATE INDEX IF NOT EXISTS idx_payments_expires ON payments(expires_at);
CREATE INDEX IF NOT EXISTS idx_payment_items_payment ON payment_items(payment_id);
CREATE INDEX IF NOT EXISTS idx_payment_callbacks_ref ON payment_callbacks(duitku_reference, result_code);
CREATE INDEX IF NOT EXISTS idx_payment_history_payment ON payment_history(payment_id);
CREATE INDEX IF NOT EXISTS idx_payment_notifications_user ON payment_notifications(user_id, is_read);
CREATE INDEX IF NOT EXISTS idx_invoices_payment ON invoices(payment_id);

-- ============================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_notifications ENABLE ROW LEVEL SECURITY;

-- users only see their own payments (linked via order)
DROP POLICY IF EXISTS "users_own_payments" ON payments;
CREATE POLICY "users_own_payments" ON payments
  FOR SELECT USING (
    order_id IN (
      SELECT id FROM orders WHERE user_id = auth.uid()::text
    )
  );

DROP POLICY IF EXISTS "service_manage_payments" ON payments;
CREATE POLICY "service_manage_payments" ON payments
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- users only see their own payment items
DROP POLICY IF EXISTS "users_own_payment_items" ON payment_items;
CREATE POLICY "users_own_payment_items" ON payment_items
  FOR SELECT USING (
    payment_id IN (
      SELECT p.id FROM payments p
      JOIN orders o ON p.order_id = o.id
      WHERE o.user_id = auth.uid()::text
    )
  );

DROP POLICY IF EXISTS "service_manage_payment_items" ON payment_items;
CREATE POLICY "service_manage_payment_items" ON payment_items
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- users only see their own invoices
DROP POLICY IF EXISTS "users_own_payment_invoices" ON payment_invoices;
CREATE POLICY "users_own_payment_invoices" ON payment_invoices
  FOR SELECT USING (
    payment_id IN (
      SELECT p.id FROM payments p
      JOIN orders o ON p.order_id = o.id
      WHERE o.user_id = auth.uid()::text
    )
  );

DROP POLICY IF EXISTS "service_manage_payment_invoices" ON payment_invoices;
CREATE POLICY "service_manage_payment_invoices" ON payment_invoices
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- users only see their own invoices (compatibility)
DROP POLICY IF EXISTS "users_own_invoices" ON invoices;
CREATE POLICY "users_own_invoices" ON invoices
  FOR SELECT USING (
    payment_id IN (
      SELECT p.id FROM payments p
      JOIN orders o ON p.order_id = o.id
      WHERE o.user_id = auth.uid()::text
    )
  );

DROP POLICY IF EXISTS "service_manage_invoices" ON invoices;
CREATE POLICY "service_manage_invoices" ON invoices
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- users only see their own notifications
DROP POLICY IF EXISTS "users_own_payment_notifications" ON payment_notifications;
CREATE POLICY "users_own_payment_notifications" ON payment_notifications
  FOR SELECT USING (user_id = auth.uid()::text);

DROP POLICY IF EXISTS "service_manage_payment_notifications" ON payment_notifications;
CREATE POLICY "service_manage_payment_notifications" ON payment_notifications
  FOR ALL TO service_role USING (true) WITH CHECK (true);
