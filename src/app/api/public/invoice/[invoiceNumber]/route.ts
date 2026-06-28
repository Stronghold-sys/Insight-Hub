import { NextResponse } from 'next/server';
import { dbQuery } from '@/lib/db';

export async function GET(
  request: Request,
  { params }: { params: { invoiceNumber: string } }
) {
  try {
    const { invoiceNumber } = params;

    const results = await dbQuery<any>(
      `SELECT p.id, p.amount, p.status, p.payment_method as method, p.payment_channel as channel, p.order_id as orderId,
              p.reference as reference, p.va_number as vaNumber, p.payment_url as paymentUrl,
              p.expires_at as expiresAt, p.paid_at as paidAt, p.created_at as date,
              COALESCE(s.plan_id, o.plan_id) as plan, 
              o.amount as basePrice, o.discount_amount as discount, o.admin_fee as adminFee, o.coupon_code as couponCode,
              i.invoice_number as invoiceNumber, i.pdf_url as pdfUrl,
              u.email as email, COALESCE(up.full_name, up.nickname, 'User') as userFullName
       FROM invoices i
       JOIN payments p ON i.payment_id = p.id
       LEFT JOIN subscriptions s ON p.subscription_id::text = s.id::text
       LEFT JOIN orders o ON p.order_id = o.id
       LEFT JOIN users u ON o.user_id = u.id::text
       LEFT JOIN user_profiles up ON u.id::text = up.user_id
       WHERE i.invoice_number = ?
       LIMIT 1`,
      [invoiceNumber]
    );

    if (results.length === 0) {
      return NextResponse.json({ success: false, error: 'Invoice tidak ditemukan' }, { status: 404 });
    }

    return NextResponse.json({ success: true, invoice: results[0] });
  } catch (error: any) {
    console.error('[Public Invoice API] Error:', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}
