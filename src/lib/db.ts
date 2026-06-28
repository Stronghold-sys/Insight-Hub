import postgres from 'postgres';
import { getCloudflareContext } from "@opennextjs/cloudflare";

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

// getPool fallback to preserve module exports if any
export function getPool() {
  return null;
}


function translateDateFormatString(mysqlFormat: string): string {
  let pgFormat = mysqlFormat;
  const mappings: Record<string, string> = {
    '%Y': 'YYYY',
    '%y': 'YY',
    '%m': 'MM',
    '%d': 'DD',
    '%H': 'HH24',
    '%h': 'HH12',
    '%i': 'MI',
    '%s': 'SS',
    '%b': 'Mon',
    '%M': 'Month',
    '%a': 'Dy',
    '%W': 'Day',
    '%c': 'FMMM',
    '%e': 'FMDD',
  };

  for (const [mysql, pg] of Object.entries(mappings)) {
    pgFormat = pgFormat.replace(new RegExp(mysql, 'g'), pg);
  }
  return pgFormat;
}

// Helper untuk mentranslasikan kueri MySQL ke PostgreSQL
export function convertQuery(sql: string): string {
  // Pre-process MySQL functions to PostgreSQL equivalents
  let processedSql = sql;

  // 1. DATE_FORMAT(expr, format) -> TO_CHAR(expr, format)
  processedSql = processedSql.replace(
    /DATE_FORMAT\(([^,]+?),\s*['"](.+?)['"]\)/gi,
    (match, expr, format) => {
      return `TO_CHAR(${expr}, '${translateDateFormatString(format)}')`;
    }
  );

  // 2. DATE_SUB(expr, INTERVAL interval_expr) -> (expr - INTERVAL interval_expr)
  processedSql = processedSql.replace(
    /DATE_SUB\((.+?),\s*(INTERVAL\s+.+?)\)/gi,
    '($1 - $2)'
  );

  // 3. DATE_ADD(expr, INTERVAL interval_expr) -> (expr + INTERVAL interval_expr)
  processedSql = processedSql.replace(
    /DATE_ADD\((.+?),\s*(INTERVAL\s+.+?)\)/gi,
    '($1 + $2)'
  );

  // 4. DATE(expr) -> CAST(expr AS date)
  processedSql = processedSql.replace(/DATE\(([^)]+?)\)/gi, 'CAST($1 AS date)');

  // 5. CURDATE() -> CURRENT_DATE
  processedSql = processedSql.replace(/CURDATE\(\)/gi, 'CURRENT_DATE');

  // Translate MySQL unquoted INTERVAL syntax: INTERVAL 30 DAY -> INTERVAL '30 DAY'
  const translatedSql = processedSql.replace(
    /INTERVAL\s+(\d+)\s+(DAY|WEEK|MONTH|YEAR|HOUR|MINUTE|SECOND|days|weeks|months|years|hours|minutes|seconds)/gi,
    "INTERVAL '$1 $2'"
  );

  let paramIndex = 1;
  let inSingleQuote = false;
  let inDoubleQuote = false;
  let result = '';

  for (let i = 0; i < translatedSql.length; i++) {
    const char = translatedSql[i];

    // Tangani escape backslash
    if (char === '\\') {
      result += char;
      if (i + 1 < sql.length) {
        result += sql[i + 1];
        i++;
      }
      continue;
    }

    if (char === "'") {
      inSingleQuote = !inSingleQuote;
      result += char;
    } else if (char === '"') {
      // Ubah tanda kutip ganda (literal string MySQL) menjadi tanda kutip tunggal (PostgreSQL)
      if (!inSingleQuote) {
        inDoubleQuote = !inDoubleQuote;
        result += "'";
      } else {
        result += char;
      }
    } else if (char === '`') {
      // Ubah backtick MySQL menjadi tanda kutip ganda PostgreSQL untuk identifier
      result += '"';
    } else if (char === '?' && !inSingleQuote && !inDoubleQuote) {
      result += `$${paramIndex++}`;
    } else {
      result += char;
    }
  }
  return result;
}

export function normalizeKeys(row: any) {
  if (!row || typeof row !== 'object') return row;
  
  const mapping: Record<string, string> = {
    planid: 'planId',
    startsat: 'startsAt',
    endsat: 'endsAt',
    cancelatperiodend: 'cancelAtPeriodEnd',
    istrial: 'isTrial',
    fullname: 'fullName',
    avatarurl: 'avatarUrl',
    joineddate: 'joinedDate',
    actiontype: 'actionType',
    targetemail: 'targetEmail',
    targetnickname: 'targetNickname',
    roleid: 'roleId',
    permissionid: 'permissionId',
    orderid: 'orderId',
    paymentmethod: 'paymentMethod',
    paymentchannel: 'paymentChannel',
    createdat: 'createdAt',
    updatedat: 'updatedAt',
    errorid: 'errorId',
    errormessage: 'errorMessage',
    stacktrace: 'stackTrace'
  };

  const normalized = { ...row };
  for (const key of Object.keys(row)) {
    const lowercaseKey = key.toLowerCase();
    if (mapping[lowercaseKey]) {
      normalized[mapping[lowercaseKey]] = row[key];
    }
  }
  return normalized;
}

export async function dbQuery<T = any>(sql: string, params: any[] = []): Promise<T[]> {
  const convertedSql = convertQuery(sql);

  let connectionString = process.env.SUPABASE_DB_URL;
  let isHyperdrive = false;

  try {
    const ctx = await getCloudflareContext({ async: true });
    if (ctx?.env && (ctx.env as any).HYPERDRIVE?.connectionString) {
      connectionString = (ctx.env as any).HYPERDRIVE.connectionString;
      isHyperdrive = true;
    }
  } catch (e) {
    // ignore — tidak di Cloudflare Workers environment
  }

  if (!connectionString) {
    console.warn('[DB] Database URL is UNDEFINED at runtime!');
    throw new Error('Database connection URL is undefined.');
  }

  // Strip sslmode dari URL jika non-Hyperdrive
  if (!isHyperdrive && connectionString.includes('sslmode=')) {
    connectionString = connectionString.replace(/[?&]sslmode=[^&]+/g, '');
  }

  // Gunakan transaction pooler port 6543 untuk non-Hyperdrive
  if (!isHyperdrive) {
    connectionString = connectionString.replace(':5432/', ':6543/');
  }

  console.log('[DB] Connecting via', isHyperdrive ? 'Hyperdrive' : 'Direct SSL', '→', connectionString.replace(/:[^:@/]+@/, ':***@'));

  const sqlClient = postgres(connectionString, {
    ssl: isHyperdrive ? false : { rejectUnauthorized: false },
    max: 1,
    connect_timeout: 10,
    idle_timeout: 5,
  });

  try {
    const result = await sqlClient.unsafe(convertedSql, params);
    return result.map(normalizeKeys) as T[];
  } catch (error) {
    console.error('Database Query Error:', error);
    console.error('Original SQL:', sql);
    console.error('Converted SQL:', convertedSql);
    console.error('Parameters:', params);
    throw error;
  } finally {
    await sqlClient.end().catch(() => {});
  }
}

export default getPool;
