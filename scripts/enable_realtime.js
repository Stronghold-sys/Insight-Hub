import postgres from 'postgres';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const sql = postgres(
  process.env.SUPABASE_DB_URL.replace(/[?&]sslmode=[^&]+/g,'').replace(':5432/',':6543/'),
  { ssl:{ rejectUnauthorized:false }, prepare:false, max:1 }
);

try {
  console.log('🚀 Enabling Realtime for orders and payments in Supabase...');
  
  // Try adding orders table to realtime publication
  await sql`ALTER PUBLICATION supabase_realtime ADD TABLE orders`.catch(e => {
    console.log('Info/Error on orders realtime:', e.message);
  });

  // Try adding payments table to realtime publication
  await sql`ALTER PUBLICATION supabase_realtime ADD TABLE payments`.catch(e => {
    console.log('Info/Error on payments realtime:', e.message);
  });

  console.log('✅ Realtime setup completed!');
} catch (e) {
  console.error('❌ Realtime setup failed:', e.message);
} finally {
  await sql.end();
}
