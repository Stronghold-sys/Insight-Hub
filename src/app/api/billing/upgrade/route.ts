import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import { dbQuery } from '@/lib/db';
import crypto from 'crypto';

export async function POST(req: Request) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const { planId, promoCode, price: inputPrice, amount: inputAmount } = body;

    if (!planId) {
      return NextResponse.json({ success: false, error: 'Plan ID required' }, { status: 400 });
    }

    // 1. Anti-Tampering Check: Jika request body mengirim parameter price/amount/discount, tolak & log
    if (inputPrice !== undefined || inputAmount !== undefined || body.discount !== undefined) {
      console.warn(`[Tampering Detected] User ${user.id} tried to send pricing values from browser.`);
      await dbQuery(
        'INSERT INTO security_events (user_id, event_type, description, ip_address) VALUES (?, ?, ?, ?)',
        [
          user.id,
          'price_tampering_attempt',
          `Percobaan manipulasi harga: terdeteksi parameter harga (${inputPrice}) atau jumlah (${inputAmount}) di request body untuk paket ${planId}`,
          '127.0.0.1'
        ]
      );
      return NextResponse.json(
        { success: false, error: 'Akses ditolak karena terdeteksi manipulasi data.' },
        { status: 400 }
      );
    }

    // 2. Tentukan harga secara aman dari database (pricing_plans)
    let price = 0;
    if (planId !== 'free') {
      const plans = await dbQuery<any>('SELECT price FROM pricing_plans WHERE id = ?', [planId]);
      if (plans.length === 0) {
        return NextResponse.json({ success: false, error: 'Plan tidak valid' }, { status: 400 });
      }
      price = parseFloat(plans[0].price);
    }

    // 3. Validasi promo code langsung ke database (promo_codes)
    let discount = 0;
    if (promoCode) {
      const codes = await dbQuery<any>(
        'SELECT * FROM promo_codes WHERE code = ? AND is_active = 1 AND (expires_at IS NULL OR expires_at > NOW())',
        [promoCode]
      );
      if (codes.length > 0) {
        const codeData = codes[0];
        if (codeData.max_uses === null || codeData.used_count < codeData.max_uses) {
          discount = price * (codeData.discount_pct / 100);
          // Update pemakaian promo code
          await dbQuery('UPDATE promo_codes SET used_count = used_count + 1 WHERE id = ?', [codeData.id]);
        }
      }
    }
    const finalAmount = price - discount;

    // Start database updates
    const subscriptionId = crypto.randomUUID();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30); // 30 days validity

    // 1. Remove old subscriptions
    await dbQuery('DELETE FROM subscriptions WHERE user_id = ?', [user.id]);

    // 2. Insert new subscription
    await dbQuery(
      'INSERT INTO subscriptions (id, user_id, plan_id, status, starts_at, ends_at) VALUES (?, ?, ?, ?, NOW(), ?)',
      [subscriptionId, user.id, planId, 'active', expiresAt]
    );

    // 3. Insert payment record (only if amount > 0)
    if (finalAmount > 0) {
      const paymentId = crypto.randomUUID();
      await dbQuery(
        'INSERT INTO payments (id, subscription_id, amount, status, payment_method) VALUES (?, ?, ?, ?, ?)',
        [paymentId, subscriptionId, finalAmount, 'success', 'QRIS Simulasi']
      );

      // Create invoice
      const invoiceId = crypto.randomUUID();
      const invoiceNumber = `INV-${Date.now()}`;
      await dbQuery(
        'INSERT INTO invoices (id, payment_id, invoice_number, pdf_url) VALUES (?, ?, ?, ?)',
        [invoiceId, paymentId, invoiceNumber, `/invoices/${invoiceNumber}.pdf`]
      );
    }

    // 4. Log audit event
    await dbQuery(
      'INSERT INTO audit_logs (user_id, action, details) VALUES (?, ?, ?)',
      [user.id, 'subscription_upgrade', `User berhasil upgrade ke paket ${planId} dengan pembayaran simulasi Rp ${finalAmount}`]
    );

    return NextResponse.json({ success: true, message: `Upgraded to ${planId} successfully!` });
  } catch (error) {
    console.error('Error during billing upgrade API:', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}
