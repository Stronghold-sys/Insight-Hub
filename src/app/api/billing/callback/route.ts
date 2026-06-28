import { NextResponse } from 'next/server';
import { dbQuery } from '@/lib/db';
import { verifyDuitkuCallbackSignature } from '@/lib/duitku';
import crypto from 'crypto';

export async function POST(request: Request) {
  try {
    // 1. Parse incoming url-encoded or json body
    const contentType = request.headers.get('content-type') || '';
    let params: Record<string, string> = {};

    if (contentType.includes('application/x-www-form-urlencoded')) {
      const text = await request.text();
      const searchParams = new URLSearchParams(text);
      searchParams.forEach((value, key) => {
        params[key] = value;
      });
    } else {
      params = await request.json().catch(() => ({}));
    }

    const {
      merchantCode,
      amount,
      merchantOrderId,
      productDetail,
      additionalParam,
      paymentCode,
      resultCode,
      merchantUserId,
      reference,
      signature
    } = params;

    console.log('[Duitku Callback] Received payment notification for Order:', merchantOrderId, 'ResultCode:', resultCode);

    // 2. Validate parameters presence
    if (!merchantCode || !amount || !merchantOrderId || !signature) {
      console.warn('[Duitku Callback] Missing required signature parameters.');
      return new NextResponse('BAD REQUEST', { status: 400 });
    }

    // 3. Verify Duitku signature
    const isVerified = verifyDuitkuCallbackSignature({
      merchantCode,
      amount,
      merchantOrderId,
      signature
    });

    if (!isVerified) {
      console.error('[Duitku Callback] Signature verification failed for order:', merchantOrderId);
      return new NextResponse('INVALID SIGNATURE', { status: 400 });
    }

    // 4. Fetch local order and payment
    const orderRes = await dbQuery<any>(
      `SELECT o.id, o.plan_id as planId, o.status as orderStatus, o.total_amount as amount, o.user_id as userId,
              p.id as paymentId, p.status as paymentStatus, p.reference
       FROM orders o
       JOIN payments p ON o.id = p.order_id
       WHERE o.id = ?`,
      [merchantOrderId]
    );

    if (orderRes.length === 0) {
      console.error('[Duitku Callback] Order ID not found in database:', merchantOrderId);
      return new NextResponse('ORDER NOT FOUND', { status: 404 });
    }

    const orderData = orderRes[0];

    // 5. Verify transaction amount matches order total to prevent tampering
    if (Math.round(parseFloat(orderData.amount)) !== Math.round(parseFloat(amount))) {
      console.error('[Duitku Callback] Price mismatch! DB total:', orderData.amount, 'Callback total:', amount);
      
      await dbQuery(
        `INSERT INTO payment_logs (id, payment_id, event_type, message, payload) VALUES (?, ?, 'price_mismatch', ?, ?)`,
        [
          crypto.randomUUID(),
          orderData.paymentId,
          `Jumlah pembayaran callback (${amount}) tidak cocok dengan tagihan order (${orderData.amount}).`,
          JSON.stringify(params)
        ]
      );
      return new NextResponse('PRICE MISMATCH', { status: 400 });
    }

    // 6. Log raw callback response
    await dbQuery(
      `INSERT INTO payment_callbacks (id, payment_id, callback_payload, signature_verified) VALUES (?, ?, ?, 1)`,
      [
        crypto.randomUUID(),
        orderData.paymentId,
        JSON.stringify(params)
      ]
    );

    // 7. Process based on Duitku resultCode
    if (resultCode === '00') {
      // Success paid
      await processSuccessfulPayment(orderData);
    } else if (resultCode === '02') {
      // Failed / Expired
      await processExpiredPayment(orderData);
    } else {
      console.log('[Duitku Callback] Ignored callback status change. ResultCode:', resultCode);
    }

    // 8. Respond with raw string 'SUCCESS' as expected by Duitku to acknowledge receipt
    return new NextResponse('SUCCESS', {
      status: 200,
      headers: { 'Content-Type': 'text/plain' }
    });

  } catch (error) {
    console.error('[Duitku Callback] Error handling callback webhook:', error);
    return new NextResponse('INTERNAL SERVER ERROR', { status: 500 });
  }
}

/**
 * Handle success billing actions in database
 */
async function processSuccessfulPayment(order: any) {
  // Check if already processed
  const current = await dbQuery('SELECT status FROM orders WHERE id = ?', [order.id]);
  if (current.length > 0 && current[0].status === 'success') {
    return;
  }

  const subscriptionId = crypto.randomUUID();
  const endsAt = new Date();
  endsAt.setDate(endsAt.getDate() + 30); // 30 days validity

  // 1. Remove old user subscriptions to keep billing clean
  await dbQuery('DELETE FROM subscriptions WHERE user_id = ?', [order.userId]);

  // 2. Create new subscription first (so payment table's FK can reference it)
  await dbQuery(
    'INSERT INTO subscriptions (id, user_id, plan_id, status, starts_at, ends_at) VALUES (?, ?, ?, "active", NOW(), ?)',
    [subscriptionId, order.userId, order.planId, endsAt]
  );

  // 3. Update payment status linking to the subscription
  await dbQuery(
    'UPDATE payments SET status = "success", paid_at = NOW(), subscription_id = ? WHERE id = ?',
    [subscriptionId, order.paymentId]
  );

  // 4. Update order status
  await dbQuery('UPDATE orders SET status = "success" WHERE id = ?', [order.id]);

  // 5. Generate invoice record
  const invoiceId = crypto.randomUUID();
  const invoiceNumber = `INV-${Date.now()}`;
  await dbQuery(
    'INSERT INTO invoices (id, payment_id, invoice_number, pdf_url) VALUES (?, ?, ?, ?)',
    [invoiceId, order.paymentId, invoiceNumber, `/invoices/${invoiceNumber}.pdf`]
  );

  // 6. Log transaction status transition
  await dbQuery(
    `INSERT INTO transaction_status_history (payment_id, from_status, to_status) VALUES (?, 'pending', 'success')`,
    [order.paymentId]
  );

  await dbQuery(
    `INSERT INTO payment_logs (id, payment_id, event_type, message) VALUES (?, ?, 'payment_success', ?)`,
    [
      crypto.randomUUID(),
      order.paymentId,
      `Callback Pembayaran sukses diterima untuk order ${order.id}. Paket ${order.planId} aktif.`
    ]
  );

  // 7. Audit log
  await dbQuery(
    'INSERT INTO audit_logs (user_id, action, details) VALUES (?, ?, ?)',
    [order.userId, 'subscription_upgrade', `User upgrade ke paket ${order.planId} sukses via Duitku Callback. OrderID: ${order.id}`]
  );

  // 8. Notification popup to user
  await dbQuery(
    'INSERT INTO notifications (id, user_id, title, message, is_read, priority) VALUES (?, ?, ?, ?, false, ?)',
    [
      crypto.randomUUID(),
      order.userId,
      'Pembayaran Sukses!',
      `Selamat! Pembayaran untuk paket "${order.planId.toUpperCase()}" berhasil diproses. Fitur premium kamu sekarang sudah aktif.`,
      'high'
    ]
  );
}

/**
 * Handle expired/failed status updates
 */
async function processExpiredPayment(order: any) {
  // Check if already processed
  const current = await dbQuery('SELECT status FROM orders WHERE id = ?', [order.id]);
  if (current.length > 0 && current[0].status === 'expired') {
    return;
  }

  await dbQuery('UPDATE orders SET status = "expired" WHERE id = ?', [order.id]);
  await dbQuery('UPDATE payments SET status = "expired" WHERE id = ?', [order.paymentId]);

  await dbQuery(
    `INSERT INTO transaction_status_history (payment_id, from_status, to_status) VALUES (?, 'pending', 'expired')`,
    [order.paymentId]
  );

  await dbQuery(
    `INSERT INTO payment_logs (id, payment_id, event_type, message) VALUES (?, ?, 'payment_expired', ?)`,
    [
      crypto.randomUUID(),
      order.paymentId,
      `Batas waktu pembayaran untuk order ${order.id} telah habis (expired/failed via callback).`
    ]
  );
}
