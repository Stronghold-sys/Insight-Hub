import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import { dbQuery } from '@/lib/db';
import crypto from 'crypto';

export async function POST(request: Request) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ success: false, error: 'Harus login dulu ya!' }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const { invoiceNumber, expiryType } = body; // expiryType: 'forever' | '30d' | '90d'

    if (!invoiceNumber) {
      return NextResponse.json({ success: false, error: 'Nomor invoice wajib ada' }, { status: 400 });
    }

    // Verify invoice ownership
    const invoiceCheck = await dbQuery<any>(
      `SELECT i.id, o.user_id 
       FROM invoices i
       JOIN payments p ON i.payment_id = p.id
       JOIN orders o ON p.order_id = o.id
       WHERE i.invoice_number = ?
       LIMIT 1`,
      [invoiceNumber]
    );

    if (invoiceCheck.length === 0) {
      return NextResponse.json({ success: false, error: 'Invoice tidak ditemukan' }, { status: 404 });
    }

    const invoice = invoiceCheck[0];
    if (invoice.user_id !== user.id && user.role !== 'admin') {
      return NextResponse.json({ success: false, error: 'Kamu tidak memiliki akses ke invoice ini' }, { status: 403 });
    }

    // Generate unique secure token
    const shareToken = crypto.randomUUID();

    // Expiry calculation
    let expiredAt: Date | null = null;
    if (expiryType === '30d') {
      expiredAt = new Date();
      expiredAt.setDate(expiredAt.getDate() + 30);
    } else if (expiryType === '90d') {
      expiredAt = new Date();
      expiredAt.setDate(expiredAt.getDate() + 90);
    }

    // Save to database
    await dbQuery(
      `UPDATE invoices 
       SET share_token = ?, share_enabled = 1, shared_at = NOW(), share_expired_at = ?
       WHERE invoice_number = ?`,
      [shareToken, expiredAt, invoiceNumber]
    );

    return NextResponse.json({
      success: true,
      shareToken,
      expiredAt: expiredAt ? expiredAt.toISOString() : null
    });
  } catch (error: any) {
    console.error('[Generate Share Token API] Error:', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}
