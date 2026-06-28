const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const postgres = require('postgres');

const dbUrl = process.env.SUPABASE_DB_URL;
if (!dbUrl) {
  console.error('SUPABASE_DB_URL not found in .env');
  process.exit(1);
}

const cleanUrl = dbUrl.replace(/[?&]sslmode=[^&]+/, '').replace(/\?$/, '');

const sql = postgres(cleanUrl, { ssl: { rejectUnauthorized: false } });

async function main() {
  console.log('Running invoice share_token migration...');
  
  try {
    // Add share_token columns to invoices
    await sql.unsafe(`
      ALTER TABLE invoices 
        ADD COLUMN IF NOT EXISTS share_token VARCHAR(36) UNIQUE,
        ADD COLUMN IF NOT EXISTS share_enabled SMALLINT DEFAULT 0,
        ADD COLUMN IF NOT EXISTS shared_at TIMESTAMPTZ,
        ADD COLUMN IF NOT EXISTS share_expired_at TIMESTAMPTZ,
        ADD COLUMN IF NOT EXISTS view_count INTEGER DEFAULT 0,
        ADD COLUMN IF NOT EXISTS download_count INTEGER DEFAULT 0,
        ADD COLUMN IF NOT EXISTS last_viewed_at TIMESTAMPTZ
    `);
    console.log('[OK] share_token columns added to invoices table');

    await sql.unsafe(`CREATE INDEX IF NOT EXISTS idx_invoices_share_token ON invoices(share_token)`);
    console.log('[OK] Index on share_token created');

    // Create invoice_analytics table
    await sql.unsafe(`
      CREATE TABLE IF NOT EXISTS invoice_analytics (
        id BIGSERIAL PRIMARY KEY,
        invoice_number VARCHAR(100) NOT NULL,
        event_type VARCHAR(20) NOT NULL DEFAULT 'view',
        ip_address VARCHAR(45),
        user_agent TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);
    console.log('[OK] invoice_analytics table created (or already exists)');

    await sql.unsafe(`CREATE INDEX IF NOT EXISTS idx_invoice_analytics_invoice_number ON invoice_analytics(invoice_number)`);
    await sql.unsafe(`CREATE INDEX IF NOT EXISTS idx_invoice_analytics_event_type ON invoice_analytics(event_type)`);
    await sql.unsafe(`CREATE INDEX IF NOT EXISTS idx_invoice_analytics_created_at ON invoice_analytics(created_at DESC)`);
    console.log('[OK] Indexes on invoice_analytics created');

    console.log('\n[SUCCESS] Invoice share token migration completed!');
  } catch (err) {
    console.error('[ERROR] Migration failed:', err.message);
    process.exit(1);
  } finally {
    await sql.end();
  }
}

main();
