// scripts/run_migrate_attempt_questions.js
// Menjalankan migration SQL untuk tabel assessment_attempt_questions
import postgres from 'postgres';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const dbUrl = process.env.SUPABASE_DB_URL;
if (!dbUrl) {
  console.error('❌ SUPABASE_DB_URL tidak ditemukan di .env');
  process.exit(1);
}

// Gunakan port 6543 (transaction pooler) dan hapus sslmode
let connStr = dbUrl.replace(/[?&]sslmode=[^&]+/g, '').replace(':5432/', ':6543/');

const sql = postgres(connStr, {
  ssl: { rejectUnauthorized: false },
  prepare: false,
  max: 1,
  connect_timeout: 15,
});

async function run() {
  try {
    const sqlFile = path.resolve(__dirname, 'migrate_attempt_questions.sql');
    const migration = fs.readFileSync(sqlFile, 'utf-8');

    console.log('🚀 Menjalankan migration: assessment_attempt_questions...');
    await sql.unsafe(migration);
    console.log('✅ Migration berhasil! Tabel assessment_attempt_questions sudah dibuat.');

    // Verifikasi tabel ada
    const tables = await sql`
      SELECT table_name FROM information_schema.tables
      WHERE table_schema = 'public' AND table_name = 'assessment_attempt_questions'
    `;
    if (tables.length > 0) {
      console.log('✅ Verifikasi: Tabel assessment_attempt_questions ditemukan di database.');
    } else {
      console.error('❌ Verifikasi GAGAL: Tabel tidak ditemukan setelah migration!');
    }
  } catch (err) {
    console.error('❌ Migration gagal:', err.message);
    console.error(err);
    process.exit(1);
  } finally {
    await sql.end();
  }
}

run();
