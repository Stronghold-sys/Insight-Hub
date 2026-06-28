import { NextResponse } from 'next/server';
import postgres from 'postgres';
import { getCloudflareContext } from "@opennextjs/cloudflare";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const skipDb = searchParams.get('nodb') === '1';

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

  let connectionString = process.env.SUPABASE_DB_URL;
  let isHyperdrive = false;

  try {
    const ctx = await getCloudflareContext({ async: true });
    if (ctx?.env && (ctx.env as any).HYPERDRIVE?.connectionString) {
      connectionString = (ctx.env as any).HYPERDRIVE.connectionString;
      isHyperdrive = true;
      hyperdriveStatus = `Hyperdrive bound (has connectionString: true)`;
    } else {
      hyperdriveStatus = 'No Hyperdrive binding found';
    }
  } catch (e: any) {
    hyperdriveStatus = `Error getting context: ${e.message}`;
  }

  if (skipDb) {
    return NextResponse.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      envStatus,
      hyperdriveStatus,
      dbConnection: 'Skipped via nodb=1',
      dbError: null,
    });
  }

  if (!connectionString) {
    return NextResponse.json({
      status: 'error',
      timestamp: new Date().toISOString(),
      envStatus,
      hyperdriveStatus,
      dbConnection: 'Skipped (no connection string)',
      dbError: 'SUPABASE_DB_URL is not set',
    });
  }

  // Strip sslmode, switch to transaction pooler port untuk non-Hyperdrive
  if (!isHyperdrive) {
    connectionString = connectionString.replace(/[?&]sslmode=[^&]+/g, '');
    connectionString = connectionString.replace(':5432/', ':6543/');
  }

  const sqlClient = postgres(connectionString, {
    ssl: isHyperdrive ? false : { rejectUnauthorized: false },
    max: 1,
    connect_timeout: 10,
    idle_timeout: 5,
  });

  try {
    const res = await sqlClient`SELECT 1 as val`;
    dbConnection = `Connected successfully via ${isHyperdrive ? 'Hyperdrive' : 'Direct SSL'} (Result: ${JSON.stringify(res)})`;
  } catch (err: any) {
    dbConnection = 'Failed';
    dbError = { message: err.message, code: err.code };
  } finally {
    await sqlClient.end().catch(() => {});
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
