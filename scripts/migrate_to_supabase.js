const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');
const { Client } = require('pg');

// Simple .env loader
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
        // Strip quotes
        if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1);
        else if (value.startsWith("'") && value.endsWith("'")) value = value.slice(1, -1);
        process.env[key] = value;
      }
    });
  }
}

loadEnv();

const dbName = process.env.DB_DATABASE || 'pemahaman';
const mysqlConfig = {
  host: process.env.DB_HOST || '127.0.0.1',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: dbName,
};

const pgUrl = process.env.SUPABASE_DB_URL;

async function runMigration() {
  if (!pgUrl) {
    console.error('ERROR: SUPABASE_DB_URL is not configured in .env file!');
    process.exit(1);
  }

  console.log('Connecting to MySQL database:', dbName);
  const mysqlConn = await mysql.createConnection(mysqlConfig);

  console.log('Connecting to Supabase PostgreSQL database...');
  const pgClient = new Client({ 
    connectionString: pgUrl,
    ssl: { rejectUnauthorized: false }
  });
  await pgClient.connect();

  try {
    // 1. Get all tables
    const [tables] = await mysqlConn.query(
      `SELECT table_name FROM information_schema.tables 
       WHERE table_schema = ? AND table_type = 'BASE TABLE'`,
      [dbName]
    );

    const tableNames = tables.map(t => t.TABLE_NAME || t.table_name);
    console.log(`Found ${tableNames.length} tables to migrate.`);

    // Disable triggers and constraints for bulk load
    console.log('Temporarily disabling constraints in PostgreSQL...');
    await pgClient.query("SET session_replication_role = 'replica'");

    // Keep track of foreign keys to create later
    const foreignKeysList = [];

    // 2. Loop tables to build schema and copy data
    for (const tableName of tableNames) {
      console.log(`\n----------------------------------------`);
      console.log(`Processing table: ${tableName}`);

      // Get MySQL Columns
      const [columns] = await mysqlConn.query(
        `SELECT column_name, data_type, is_nullable, column_default, extra, column_type, character_maximum_length
         FROM information_schema.columns
         WHERE table_schema = ? AND table_name = ?
         ORDER BY ordinal_position`,
        [dbName, tableName]
      );

      // Get MySQL Primary Keys
      const [pks] = await mysqlConn.query(
        `SELECT column_name
         FROM information_schema.key_column_usage
         WHERE table_schema = ? AND table_name = ? AND constraint_name = 'PRIMARY'`,
        [dbName, tableName]
      );
      const pkCols = pks.map(p => p.COLUMN_NAME || p.column_name);

      // Get MySQL Foreign Keys
      const [fks] = await mysqlConn.query(
        `SELECT constraint_name, column_name, referenced_table_name, referenced_column_name
         FROM information_schema.key_column_usage
         WHERE table_schema = ? AND table_name = ? AND referenced_table_name IS NOT NULL`,
        [dbName, tableName]
      );
      fks.forEach(fk => {
        foreignKeysList.push({
          table: tableName,
          column: fk.COLUMN_NAME || fk.column_name,
          refTable: fk.REFERENCED_TABLE_NAME || fk.referenced_table_name,
          refColumn: fk.REFERENCED_COLUMN_NAME || fk.referenced_column_name,
        });
      });

      // Map Columns to Postgres syntax
      const columnDefs = [];
      const autoIncrementCols = [];

      columns.forEach(col => {
        const name = col.COLUMN_NAME || col.column_name;
        const dataType = (col.DATA_TYPE || col.data_type).toLowerCase();
        const extra = (col.EXTRA || col.extra || '').toLowerCase();
        const isNullable = (col.IS_NULLABLE || col.is_nullable) === 'YES';
        const defaultVal = col.COLUMN_DEFAULT || col.column_default;
        const colType = (col.COLUMN_TYPE || col.column_type || '').toLowerCase();

        let pgType = '';
        if (extra.includes('auto_increment')) {
          pgType = 'SERIAL';
          autoIncrementCols.push(name);
        } else {
          switch (dataType) {
            case 'int':
            case 'integer':
            case 'mediumint':
              pgType = 'INTEGER';
              break;
            case 'tinyint':
              // TINYINT(1) mapped to SMALLINT to prevent boolean query casting errors
              pgType = colType.includes('tinyint(1)') ? 'SMALLINT' : 'SMALLINT';
              break;
            case 'smallint':
              pgType = 'SMALLINT';
              break;
            case 'bigint':
              pgType = 'BIGINT';
              break;
            case 'varchar':
              const maxLen = col.CHARACTER_MAXIMUM_LENGTH || col.character_maximum_length || 255;
              pgType = `VARCHAR(${maxLen})`;
              break;
            case 'text':
            case 'longtext':
            case 'mediumtext':
            case 'tinytext':
              pgType = 'TEXT';
              break;
            case 'datetime':
            case 'timestamp':
              pgType = 'TIMESTAMP';
              break;
            case 'float':
              pgType = 'REAL';
              break;
            case 'double':
              pgType = 'DOUBLE PRECISION';
              break;
            case 'decimal':
              pgType = 'NUMERIC';
              break;
            case 'enum':
              // Map MySQL enum to TEXT with constraint, or simple TEXT
              pgType = 'TEXT';
              break;
            default:
              pgType = 'TEXT';
          }
        }

        let defClause = '';
        if (defaultVal !== null && defaultVal !== undefined && defaultVal.toString().toUpperCase() !== 'NULL' && !extra.includes('auto_increment')) {
          let cleanDefault = defaultVal.toString().trim();
          if (cleanDefault.startsWith("'") && cleanDefault.endsWith("'")) {
            cleanDefault = cleanDefault.slice(1, -1);
          }
          if (cleanDefault.toLowerCase() === 'current_timestamp()') {
            defClause = ' DEFAULT CURRENT_TIMESTAMP';
          } else {
            const isNumeric = !isNaN(cleanDefault) && cleanDefault !== '';
            defClause = ` DEFAULT ${isNumeric ? cleanDefault : `'${cleanDefault}'`}`;
          }
        }

        const nullClause = isNullable ? '' : ' NOT NULL';
        columnDefs.push(`"${name}" ${pgType}${defClause}${nullClause}`);
      });

      // Drop Table if Exists in PostgreSQL
      await pgClient.query(`DROP TABLE IF EXISTS "${tableName}" CASCADE`);

      // Build CREATE TABLE query
      let createSql = `CREATE TABLE "${tableName}" (\n  ${columnDefs.join(',\n  ')}`;
      if (pkCols.length > 0) {
        createSql += `,\n  PRIMARY KEY (${pkCols.map(c => `"${c}"`).join(', ')})`;
      }
      createSql += `\n)`;

      console.log(`Creating table: ${tableName}`);
      await pgClient.query(createSql);

      // Copy Data
      const [rows] = await mysqlConn.query(`SELECT * FROM \`${tableName}\``);
      if (rows.length > 0) {
        console.log(`Copying ${rows.length} rows...`);

        const cols = Object.keys(rows[0]);
        const colString = cols.map(c => `"${c}"`).join(', ');

        // Insert in batches of 500 rows
        const batchSize = 500;
        for (let i = 0; i < rows.length; i += batchSize) {
          const batch = rows.slice(i, i + batchSize);
          const valuePlaceholders = [];
          const flatValues = [];
          let valIndex = 1;

          batch.forEach(row => {
            const rowPlaceholders = [];
            cols.forEach(col => {
              rowPlaceholders.push(`$${valIndex++}`);
              let val = row[col];
              if (val === 'NULL' || val === 'null' || val === 'NULL' || val === 'null') {
                val = null;
              }
              if (typeof val === 'string' && val.toUpperCase() === 'NULL') {
                val = null;
              }
              // Convert JS dates to ISO strings for Postgres
              if (val instanceof Date) {
                val = val.toISOString();
              }
              flatValues.push(val);
            });
            valuePlaceholders.push(`(${rowPlaceholders.join(', ')})`);
          });

          const insertSql = `INSERT INTO "${tableName}" (${colString}) VALUES ${valuePlaceholders.join(', ')}`;
          try {
            await pgClient.query(insertSql, flatValues);
          } catch (insertErr) {
            console.error(`ERROR inserting into table ${tableName}:`, insertErr.message);
            console.error(`SQL Query:`, insertSql);
            console.error(`Batch Values:`, JSON.stringify(flatValues));
            throw insertErr;
          }
        }
      } else {
        console.log('No rows to copy.');
      }

      // Sync Sequences for Serial Columns
      for (const col of autoIncrementCols) {
        const seqQuery = `
          SELECT setval(
            pg_get_serial_sequence('"${tableName}"', '${col}'), 
            COALESCE(MAX("${col}"), 1)
          ) FROM "${tableName}"
        `;
        try {
          await pgClient.query(seqQuery);
          console.log(`Synced auto-increment sequence for ${tableName}.${col}`);
        } catch (seqErr) {
          console.warn(`Warning: Could not sync sequence for ${tableName}.${col}:`, seqErr.message);
        }
      }
    }

    // 3. Create Foreign Keys
    console.log(`\n----------------------------------------`);
    console.log('Creating Foreign Keys...');
    for (const fk of foreignKeysList) {
      const fkSql = `
        ALTER TABLE "${fk.table}" 
        ADD CONSTRAINT "${fk.table}_${fk.column}_fkey" 
        FOREIGN KEY ("${fk.column}") 
        REFERENCES "${fk.refTable}" ("${fk.refColumn}") 
        ON DELETE CASCADE
      `;
      try {
        await pgClient.query(fkSql);
        console.log(`Created FK: ${fk.table}.${fk.column} -> ${fk.refTable}.${fk.refColumn}`);
      } catch (fkErr) {
        console.warn(`Warning: Could not create foreign key for ${fk.table}.${fk.column}:`, fkErr.message);
      }
    }

    // 4. Create compatibility function DATE_SUB in PostgreSQL
    console.log(`\nCreating DATE_SUB compatibility function...`);
    await pgClient.query(`
      CREATE OR REPLACE FUNCTION date_sub(t timestamp, i interval)
      RETURNS timestamp AS $$
      BEGIN
        RETURN t - i;
      END;
      $$ LANGUAGE plpgsql;
    `);
    console.log('DATE_SUB compatibility function created successfully!');

    // Re-enable triggers and constraints
    console.log('Re-enabling constraints in PostgreSQL...');
    await pgClient.query("SET session_replication_role = 'origin'");

    console.log('\n========================================');
    console.log('MIGRATION COMPLETED SUCCESSFULLY! 🎉');
    console.log('========================================');

  } catch (err) {
    console.error('ERROR during migration:', err);
    // Ensure replication role is reset on error
    await pgClient.query("SET session_replication_role = 'origin'").catch(() => {});
  } finally {
    await mysqlConn.end();
    await pgClient.end();
  }
}

runMigration();
