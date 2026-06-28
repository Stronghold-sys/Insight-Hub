const fs = require('fs');
const path = require('path');
const { Client } = require('pg');

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
const activeUserId = '3f74b136-de89-4983-a4ef-1728ca8ad779'; // rahmatakbar2088@gmail.com ID

async function run() {
  if (!pgUrl) {
    console.error('ERROR: SUPABASE_DB_URL is not set in .env!');
    process.exit(1);
  }

  console.log('Connecting to Supabase PostgreSQL...');
  const client = new Client({
    connectionString: pgUrl,
    ssl: { rejectUnauthorized: false }
  });
  await client.connect();

  try {
    console.log('Disabling triggers...');
    await client.query("SET session_replication_role = 'replica'");

    // Tables to completely empty (no exceptions)
    const tablesToEmpty = [
      'mood_entries',
      'user_activities',
      'chat_sessions',
      'chat_messages',
      'chat_analysis',
      'notifications',
      'notification_logs',
      'analysis_results',
      'assessment_sessions',
      'assessment_answers',
      'assessment_results',
      'assessment_progress',
      'assessment_scores',
      'library_bookmarks',
      'library_read_history',
      'user_bookmarks'
    ];

    for (const t of tablesToEmpty) {
      console.log(`Emptying table: ${t}`);
      await client.query(`TRUNCATE TABLE "${t}" CASCADE`);
    }

    // Clean up users: Keep only our active user
    console.log('Cleaning up old users, keeping active user:', activeUserId);
    await client.query('DELETE FROM user_roles WHERE user_id::text <> $1', [activeUserId]);
    await client.query('DELETE FROM user_profiles WHERE user_id::text <> $1', [activeUserId]);
    await client.query('DELETE FROM sessions WHERE user_id::text <> $1', [activeUserId]);
    await client.query('DELETE FROM refresh_tokens WHERE user_id::text <> $1', [activeUserId]);
    await client.query('DELETE FROM users WHERE id::text <> $1', [activeUserId]);

    console.log('Enabling triggers...');
    await client.query("SET session_replication_role = 'origin'");

    console.log('DATABASE CLEANUP COMPLETED SUCCESSFULLY! 🧹');
  } catch (err) {
    console.error('ERROR during cleanup:', err.message);
  } finally {
    await client.end();
  }
}

run();
