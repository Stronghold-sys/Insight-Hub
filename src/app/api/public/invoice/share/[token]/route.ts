import { NextResponse } from 'next/server';
import { dbQuery } from '@/lib/db';

function getClientIp(request: Request): string {
  return request.headers.get('cf-connecting-ip') || 
         request.headers.get('x-forwarded-for')?.split(',')[0].trim() || 
         request.headers.get('x-real-ip') || 
         '127.0.0.1';
}

function getUserAgent(request: Request): string {
  return request.headers.get('user-agent') || 'Unknown Browser';
}

export async function GET(
  request: Request,
  { params }: { params: { token: string } }
) {
  try {
    const { token } = params;

    // 1. Fetch invoice details by share_token
    const results = await dbQuery<any>(
      `SELECT p.id, p.amount, p.status, p.payment_method as method, p.payment_channel as channel, p.order_id as orderId,
              p.reference as reference, p.va_number as vaNumber, p.payment_url as paymentUrl,
              p.expires_at as expiresAt, p.paid_at as paidAt, p.created_at as date,
              COALESCE(s.plan_id, o.plan_id) as plan, 
              o.amount as basePrice, o.discount_amount as discount, o.admin_fee as adminFee, o.coupon_code as couponCode,
              i.invoice_number as invoiceNumber, i.pdf_url as pdfUrl,
              i.share_enabled as shareEnabled, i.share_expired_at as shareExpiredAt,
              u.email as email, COALESCE(up.full_name, up.nickname, 'User') as userFullName
       FROM invoices i
       JOIN payments p ON i.payment_id = p.id
       LEFT JOIN subscriptions s ON p.subscription_id::text = s.id::text
       LEFT JOIN orders o ON p.order_id = o.id
       LEFT JOIN users u ON o.user_id = u.id::text
       LEFT JOIN user_profiles up ON u.id::text = up.user_id
       WHERE i.share_token = ?
       LIMIT 1`,
      [token]
    );

    if (results.length === 0) {
      return NextResponse.json({ success: false, error: 'Invoice tidak ditemukan' }, { status: 404 });
    }

    const invoice = results[0];

    // 2. Validate share link is enabled and not expired
    if (invoice.shareEnabled === 0) {
      return NextResponse.json({ success: false, error: 'Sharing untuk invoice ini dinonaktifkan' }, { status: 403 });
    }

    if (invoice.shareExpiredAt && new Date(invoice.shareExpiredAt) < new Date()) {
      return NextResponse.json({ success: false, error: 'Link sharing invoice ini sudah kedaluwarsa' }, { status: 410 });
    }

    const ipAddress = getClientIp(request);
    const userAgent = getUserAgent(request);

    // 3. Register analytics & increment view counter in parallel
    await Promise.all([
      dbQuery(
        `UPDATE invoices 
         SET view_count = COALESCE(view_count, 0) + 1, last_viewed_at = NOW() 
         WHERE share_token = ?`,
        [token]
      ),
      dbQuery(
        `INSERT INTO invoice_analytics (invoice_number, event_type, ip_address, user_agent, created_at) 
         VALUES (?, 'view', ?, ?, NOW())`,
        [invoice.invoiceNumber, ipAddress, userAgent]
      )
    ]);

    return NextResponse.json({ success: true, invoice });
  } catch (error: any) {
    console.error('[Public Share Invoice API] Error:', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(
  request: Request,
  { params }: { params: { token: string } }
) {
  try {
    const { token } = params;
    const body = await request.json().catch(() => ({}));
    const { eventType } = body; // 'download' | 'print'

    if (!['download', 'print'].includes(eventType)) {
      return NextResponse.json({ success: false, error: 'Tipe event tidak valid' }, { status: 400 });
    }

    // Fetch invoice number first
    const results = await dbQuery<any>(
      `SELECT invoice_number FROM invoices WHERE share_token = ? LIMIT 1`,
      [token]
    );

    if (results.length === 0) {
      return NextResponse.json({ success: false, error: 'Invoice tidak ditemukan' }, { status: 404 });
    }

    const invoiceNumber = results[0].invoice_number;
    const ipAddress = getClientIp(request);
    const userAgent = getUserAgent(request);

    // Save analytics
    const promises: Promise<any>[] = [
      dbQuery(
        `INSERT INTO invoice_analytics (invoice_number, event_type, ip_address, user_agent, created_at) 
         VALUES (?, ?, ?, ?, NOW())`,
        [invoiceNumber, eventType, ipAddress, userAgent]
      )
    ];

    // If download, increment download_count
    if (eventType === 'download') {
      promises.push(
        dbQuery(
          `UPDATE invoices SET download_count = COALESCE(download_count, 0) + 1 WHERE share_token = ?`,
          [token]
        )
      );
    }

    await Promise.all(promises);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('[Public Share Invoice Action API] Error:', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}
