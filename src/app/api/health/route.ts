import { NextResponse } from 'next/server';
import { Client } from 'pg';
import { getCloudflareContext } from "@opennextjs/cloudflare";

export async function GET() {
  const envStatus = {
    SUPABASE_DB_URL: !!process.env.SUPABASE_DB_URL,
    NEXT_PUBLIC_SUPABASE_URL: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    SUPABASE_SERVICE_ROLE_KEY: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
    GEMINI_API_KEY: !!process.env.GEMINI_API_KEY,
    XAI_API_KEY: !!process.env.XAI_API_KEY,
    RESEND_API_KEY: !!process.env.RESEND_API_KEY,
  };

  let dbConnection = 'Not tested';
  let dbError = null;
  let hyperdriveStatus = 'No Hyperdrive Context';

  try {
    const ctx = getCloudflareContext();
    if (ctx && ctx.env && (ctx.env as any).HYPERDRIVE) {
      hyperdriveStatus = `Hyperdrive bound (has connectionString: ${!!(ctx.env as any).HYPERDRIVE.connectionString})`;
    }
  } catch (e: any) {
    hyperdriveStatus = `Error getting context: ${e.message}`;
  }

  let dbUrl = process.env.SUPABASE_DB_URL;
  let isHyperdrive = false;

  try {
    const ctx = getCloudflareContext();
    if (ctx && ctx.env && (ctx.env as any).HYPERDRIVE && (ctx.env as any).HYPERDRIVE.connectionString) {
      dbUrl = (ctx.env as any).HYPERDRIVE.connectionString;
      isHyperdrive = true;
    }
  } catch (e) {
    // ignore
  }

  if (dbUrl) {
    let servername: string | undefined = undefined;
    let cleanedUrl = dbUrl;
    if (!isHyperdrive) {
      if (cleanedUrl.includes('sslmode=')) {
        cleanedUrl = cleanedUrl.replace(/[?&]sslmode=[^&]+/g, '');
      }
      cleanedUrl = cleanedUrl.replace(':5432/', ':6543/');
      const hostMatch = cleanedUrl.match(/@([^:/]+)/);
      if (hostMatch) {
        servername = hostMatch[1];
      }
    }

    const client = new Client({
      connectionString: cleanedUrl,
      ssl: isHyperdrive ? false : { 
        rejectUnauthorized: false,
        servername: servername
      }
    });

    try {
      await client.connect();
      const res = await client.query('SELECT 1 as val');
      dbConnection = `Connected successfully (Result: ${JSON.stringify(res.rows)})`;
    } catch (err: any) {
      dbConnection = 'Failed';
      dbError = {
        message: err.message,
        stack: err.stack,
      };
    } finally {
      await client.end().catch(() => {});
    }
  } else {
    dbConnection = 'Skipped (no connection string)';
  }

  return NextResponse.json({
    status: dbError ? 'error' : 'ok',
    timestamp: new Date().toISOString(),
    envStatus,
    hyperdriveStatus,
    dbConnection,
    dbError,
  });
}
