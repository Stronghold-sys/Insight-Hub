import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import { dbQuery } from '@/lib/db';
import { createDuitkuInvoice } from '@/lib/duitku';
import crypto from 'crypto';

export async function POST(request: Request) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const { planId, paymentMethodCode, promoCode } = body;

    if (!planId || !paymentMethodCode) {
      return NextResponse.json({ success: false, error: 'Plan ID and Payment Method are required' }, { status: 400 });
    }

    // 1. Anti-Tampering Check: Get price from database, NOT from client request
    const plans = await dbQuery<any>('SELECT name, price FROM pricing_plans WHERE id = ?', [planId]);
    if (plans.length === 0) {
      return NextResponse.json({ success: false, error: 'Pricing plan not found' }, { status: 404 });
    }

    const plan = plans[0];
    const basePrice = parseFloat(plan.price);
    let discount = 0;

    // 2. Validate promo code from database
    if (promoCode) {
      const codes = await dbQuery<any>(
        'SELECT * FROM promo_codes WHERE code = ? AND is_active = 1 AND (expires_at IS NULL OR expires_at > NOW())',
        [promoCode]
      );
      if (codes.length > 0) {
        const codeData = codes[0];
        if (codeData.max_uses === null || codeData.used_count < codeData.max_uses) {
          discount = basePrice * (codeData.discount_pct / 100);
          // Increment promo use count
          await dbQuery('UPDATE promo_codes SET used_count = used_count + 1 WHERE id = ?', [codeData.id]);
        }
      }
    }

    const adminFee = 0.00; // Can be customized per payment channel if desired
    const finalAmount = basePrice - discount + adminFee;

    if (finalAmount <= 0) {
      return NextResponse.json({ success: false, error: 'Invalid total amount' }, { status: 400 });
    }

    // 3. Prevent double pending orders for the same user
    const pendingOrders = await dbQuery<any>(
      `SELECT o.id FROM orders o 
       JOIN payments p ON o.id = p.order_id 
       WHERE o.user_id = ? AND o.plan_id = ? AND o.status = 'pending' AND p.expires_at > NOW()`,
      [user.id, planId]
    );

    if (pendingOrders.length > 0) {
      return NextResponse.json({ 
        success: false, 
        error: 'Kamu sudah memiliki transaksi pending untuk paket ini. Selesaikan pembayaran atau tunggu sampai expired.',
        orderId: pendingOrders[0].id
      }, { status: 400 });
    }

    // 4. Create Order & Items
    const orderId = `ORD-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;
    await dbQuery(
      `INSERT INTO orders (id, user_id, plan_id, amount, discount_amount, admin_fee, total_amount, status, coupon_code) 
       VALUES (?, ?, ?, ?, ?, ?, ?, 'pending', ?)`,
      [orderId, user.id, planId, basePrice, discount, adminFee, finalAmount, promoCode || null]
    );

    const orderItemId = crypto.randomUUID();
    await dbQuery(
      `INSERT INTO order_items (id, order_id, item_name, qty, price) VALUES (?, ?, ?, 1, ?)`,
      [orderItemId, orderId, `Langganan Insight Hub - Paket ${plan.name}`, finalAmount]
    );

    // 5. Build Callback & Return URLs dynamically
    const host = request.headers.get('host') || 'insighthubidn.my.id';
    const protocol = host.includes('localhost') ? 'http' : 'https';
    
    // Webhook callback URL
    const callbackUrl = `${protocol}://${host}/api/billing/callback`;
    const returnUrl = `${protocol}://${host}/langganan`;

    // 6. Initiate Duitku Payment Gateway
    let duitkuResponse;
    try {
      duitkuResponse = await createDuitkuInvoice({
        paymentAmount: Math.round(finalAmount),
        merchantOrderId: orderId,
        productDetails: `Aktivasi Paket ${plan.name}`,
        email: user.email,
        paymentMethod: paymentMethodCode,
        customerVaName: user.fullName || user.nickname || 'Customer',
        callbackUrl,
        returnUrl,
        expiryPeriod: 1440, // 24 hours
        customerDetail: {
          firstName: user.fullName || user.nickname || 'Customer',
          email: user.email,
        }
      });
    } catch (err: any) {
      console.error('[Checkout] Duitku Inquiry failed:', err);
      // Rollback order database entries on Duitku gateway failure
      await dbQuery('DELETE FROM order_items WHERE order_id = ?', [orderId]);
      await dbQuery('DELETE FROM orders WHERE id = ?', [orderId]);
      return NextResponse.json({ success: false, error: `Gagal memproses ke payment gateway: ${err.message}` }, { status: 520 });
    }

    // 7. Insert Payment record
    const paymentId = crypto.randomUUID();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 1); // 24 hours expiry

    await dbQuery(
      `INSERT INTO payments (id, order_id, amount, status, payment_method, payment_channel, reference, va_number, payment_url, expires_at) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        paymentId,
        orderId,
        finalAmount,
        'pending',
        paymentMethodCode, // e.g. "BC"
        duitkuResponse.paymentUrl ? 'E-Wallet/Retail' : 'Virtual Account',
        duitkuResponse.reference,
        duitkuResponse.vaNumber || null,
        duitkuResponse.paymentUrl || null,
        expiresAt
      ]
    );

    // 8. Log initial checkout status
    await dbQuery(
      `INSERT INTO payment_logs (id, payment_id, event_type, message, payload) VALUES (?, ?, ?, ?, ?)`,
      [
        crypto.randomUUID(),
        paymentId,
        'checkout_initiated',
        `Checkout dibuat untuk paket ${planId} nominal Rp ${finalAmount} menggunakan channel ${paymentMethodCode}`,
        JSON.stringify(duitkuResponse)
      ]
    );

    // Initial status history log
    await dbQuery(
      `INSERT INTO transaction_status_history (payment_id, from_status, to_status) VALUES (?, 'none', 'pending')`,
      [paymentId]
    );

    return NextResponse.json({
      success: true,
      orderId,
      payment: {
        amount: finalAmount,
        vaNumber: duitkuResponse.vaNumber || null,
        paymentUrl: duitkuResponse.paymentUrl || null,
        reference: duitkuResponse.reference,
        channel: paymentMethodCode
      }
    });

  } catch (error) {
    console.error('[Checkout] Internal Server Error:', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}
