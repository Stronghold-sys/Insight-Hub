import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import { dbQuery } from '@/lib/db';
import { checkDuitkuTransactionStatus } from '@/lib/duitku';
import crypto from 'crypto';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ orderId: string }> }
) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { orderId } = await params;

    // 1. Fetch local order and payment
    const orderRes = await dbQuery<any>(
      `SELECT o.id, o.plan_id as planId, o.status as orderStatus, o.total_amount as amount,
              p.id as paymentId, p.status as paymentStatus, p.reference, p.va_number as vaNumber, 
              p.payment_url as paymentUrl, p.payment_method as channel,
              DATE_FORMAT(p.expires_at, '%Y-%m-%d %H:%i:%s') as expiresAt,
              DATE_FORMAT(p.paid_at, '%Y-%m-%d %H:%i:%s') as paidAt
       FROM orders o
       JOIN payments p ON o.id = p.order_id
       WHERE o.id = ? AND o.user_id = ?`,
      [orderId, user.id]
    );

    if (orderRes.length === 0) {
      return NextResponse.json({ success: false, error: 'Order not found' }, { status: 404 });
    }

    const orderData = orderRes[0];

    // 2. If locally pending, query Duitku status to get absolute state update
    if (orderData.orderStatus === 'pending') {
      try {
        const statusResponse = await checkDuitkuTransactionStatus(orderId);
        console.log('[Status API] Duitku status check for', orderId, 'Response:', statusResponse);

        if (statusResponse.statusCode === '00') {
          // Transaction PAID successfully!
          await processSuccessfulPayment(orderData, user.id);
          
          // Re-fetch updated order status
          const updatedOrder = await dbQuery<any>(
            `SELECT o.status as orderStatus, p.status as paymentStatus, DATE_FORMAT(p.paid_at, '%Y-%m-%d %H:%i:%s') as paidAt
             FROM orders o JOIN payments p ON o.id = p.order_id WHERE o.id = ?`,
            [orderId]
          );
          
          return NextResponse.json({
            success: true,
            status: 'success',
            order: {
              ...orderData,
              orderStatus: updatedOrder[0]?.orderStatus || 'success',
              paymentStatus: updatedOrder[0]?.paymentStatus || 'success',
              paidAt: updatedOrder[0]?.paidAt
            }
          });
        } else if (statusResponse.statusCode === '02') {
          // Transaction EXPIRED or FAILED
          await processExpiredPayment(orderData);
          
          return NextResponse.json({
            success: true,
            status: 'expired',
            order: { ...orderData, orderStatus: 'expired', paymentStatus: 'expired' }
          });
        }
      } catch (err) {
        console.error('[Status API] Failed checking status against Duitku:', err);
        // Fallback to local database state if network error
      }
    }

    return NextResponse.json({
      success: true,
      status: orderData.orderStatus,
      order: orderData
    });

  } catch (error) {
    console.error('[Status API] Error handling status request:', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}

/**
 * Handle success billing actions in database
 */
async function processSuccessfulPayment(order: any, userId: string) {
  // Check if already processed
  const current = await dbQuery('SELECT status FROM orders WHERE id = ?', [order.id]);
  if (current.length > 0 && current[0].status === 'success') {
    return;
  }

  const subscriptionId = crypto.randomUUID();
  const startsAt = new Date();
  const endsAt = new Date();
  endsAt.setDate(endsAt.getDate() + 30); // 30 days validity

  // 1. Remove old user subscriptions to keep billing clean
  await dbQuery('DELETE FROM subscriptions WHERE user_id = ?', [userId]);

  // 2. Create new subscription first (so payment table's FK can reference it)
  await dbQuery(
    'INSERT INTO subscriptions (id, user_id, plan_id, status, starts_at, ends_at) VALUES (?, ?, ?, "active", NOW(), ?)',
    [subscriptionId, userId, order.planId, endsAt]
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
      `Pembayaran sukses terverifikasi untuk order ${order.id}. Paket ${order.planId} aktif.`
    ]
  );

  // 7. Audit log
  await dbQuery(
    'INSERT INTO audit_logs (user_id, action, details) VALUES (?, ?, ?)',
    [userId, 'subscription_upgrade', `User upgrade ke paket ${order.planId} sukses via Duitku. OrderID: ${order.id}`]
  );

  // 8. Notification popup to user
  await dbQuery(
    'INSERT INTO notifications (id, user_id, title, message, is_read, priority) VALUES (?, ?, ?, ?, false, ?)',
    [
      crypto.randomUUID(),
      userId,
      'Pembayaran Sukses!',
      `Selamat! Pembayaran untuk paket "${order.planId.toUpperCase()}" berhasil diproses. Fitur premium kamu sekarang sudah aktif.`,
      'high'
    ]
  );
}

/**
 * Handle expired status updates
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
      `Batas waktu pembayaran untuk order ${order.id} telah habis (expired).`
    ]
  );
}
