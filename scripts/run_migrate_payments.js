import postgres from 'postgres';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const connStr = process.env.SUPABASE_DB_URL.replace(/[?&]sslmode=[^&]+/g,'').replace(':5432/',':6543/');
const sql = postgres(connStr, { ssl:{ rejectUnauthorized:false }, prepare:false, max:1 });

async function run() {
  try {
    const sqlFile = path.resolve(__dirname, 'migrate_payments_schema.sql');
    const migration = fs.readFileSync(sqlFile, 'utf-8');

    console.log('🚀 Menjalankan migration: payments schema...');
    await sql.unsafe(migration);
    console.log('✅ Migration berhasil!');

    // Verifikasi tabel
    const tables = ['orders','payments','invoices','transaction_status_history','audit_logs','payment_callbacks','payment_logs'];
    for (const t of tables) {
      const res = await sql`SELECT COUNT(*) as cnt FROM information_schema.tables WHERE table_schema='public' AND table_name=${t}`;
      const exists = Number(res[0].cnt) > 0;
      console.log(`  ${exists ? '✅' : '❌'} ${t}: ${exists ? 'ada' : 'TIDAK ADA'}`);
    }

    // Verifikasi kolom replay attack protection
    const refCol = await sql`SELECT column_name FROM information_schema.columns WHERE table_name='payment_callbacks' AND column_name='duitku_reference'`;
    console.log(`\n  ${refCol.length > 0 ? '✅' : '❌'} payment_callbacks.duitku_reference (Replay Attack Protection): ${refCol.length > 0 ? 'ada' : 'TIDAK ADA'}`);

    console.log('\n🎉 Schema siap untuk production!');
  } catch(e) {
    console.error('❌ Migration gagal:', e.message);
    console.error(e);
    process.exit(1);
  } finally {
    await sql.end();
  }
}

run();
