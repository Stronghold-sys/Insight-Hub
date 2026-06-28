-- Migration: Add share token system to invoices table and create analytics
-- Run this on your database

-- 1. Add share token columns to invoices
ALTER TABLE invoices 
  ADD COLUMN IF NOT EXISTS share_token VARCHAR(36) UNIQUE,
  ADD COLUMN IF NOT EXISTS share_enabled SMALLINT DEFAULT 0,
  ADD COLUMN IF NOT EXISTS shared_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS share_expired_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS view_count INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS download_count INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_viewed_at TIMESTAMPTZ;

-- 2. Create index for fast share_token lookup
CREATE INDEX IF NOT EXISTS idx_invoices_share_token ON invoices(share_token);

-- 3. Create invoice_analytics table for tracking views, downloads, prints
CREATE TABLE IF NOT EXISTS invoice_analytics (
  id BIGSERIAL PRIMARY KEY,
  invoice_number VARCHAR(100) NOT NULL,
  event_type VARCHAR(20) NOT NULL DEFAULT 'view',   -- 'view' | 'download' | 'print'
  ip_address VARCHAR(45),
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_invoice_analytics_invoice_number ON invoice_analytics(invoice_number);
CREATE INDEX IF NOT EXISTS idx_invoice_analytics_event_type ON invoice_analytics(event_type);
CREATE INDEX IF NOT EXISTS idx_invoice_analytics_created_at ON invoice_analytics(created_at DESC);
