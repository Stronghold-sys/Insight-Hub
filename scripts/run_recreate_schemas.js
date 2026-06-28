const fs = require('fs');
const path = require('path');
const { Client } = require('pg');

// Load env
function loadEnv() {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
  const envPath = path.resolve(process.cwd(), '.env');
  if (fs.existsSync(envPath)) {
    const content = fs.readFileSync(envPath, 'utf8');
    content.split(/\r?\n/).forEach(line => {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) return;
      const match = trimmed.match(/^([\w.-]+)\s*=\s*(.*)$/);
      if (match) {
        const key = match[1];
        let value = match[2].trim();
        if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1);
        else if (value.startsWith("'") && value.endsWith("'")) value = value.slice(1, -1);
        process.env[key] = value;
      }
    });
  }
}

loadEnv();

const pgUrl = process.env.SUPABASE_DB_URL;

async function run() {
  if (!pgUrl) {
    console.error('ERROR: SUPABASE_DB_URL is not set in .env!');
    process.exit(1);
  }

  const sqlPath = path.resolve(__dirname, 'recreate_schemas.sql');
  const sqlContent = fs.readFileSync(sqlPath, 'utf8');

  console.log('Connecting to Supabase PostgreSQL...');
  const client = new Client({
    connectionString: pgUrl,
    ssl: { rejectUnauthorized: false }
  });
  await client.connect();

  try {
    console.log('Executing recreate_schemas.sql...');
    await client.query(sqlContent);
    console.log('Recreate schemas executed successfully! 🎉');
  } catch (err) {
    console.error('ERROR executing recreate_schemas.sql:', err.message);
  } finally {
    await client.end();
  }
}

run();
