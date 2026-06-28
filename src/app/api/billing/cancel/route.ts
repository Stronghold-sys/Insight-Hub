import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import { dbQuery } from '@/lib/db';
import { processCancelledPayment } from '@/lib/paymentService';
import crypto from 'crypto';

export async function POST(request: Request) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const { orderId } = body;

    if (!orderId) {
      return NextResponse.json({ success: false, error: 'Order ID is required' }, { status: 400 });
    }

    // Check current status in the database
    const orders = await dbQuery<any>(
      'SELECT status FROM orders WHERE id = ? AND user_id::text = ?',
      [orderId, user.id]
    );

    if (orders.length === 0) {
      return NextResponse.json({ success: false, error: 'Pesanan tidak ditemukan' }, { status: 404 });
    }

    const currentStatus = orders[0].status || 'PENDING';

    // Do not allow cancelling if already paid/success
    if (['success', 'paid'].includes(currentStatus.toLowerCase())) {
      return NextResponse.json({ 
        success: false, 
        error: 'Transaksi sudah lunas dibayar, tidak bisa dibatalkan ya.' 
      }, { status: 400 });
    }

    if (currentStatus.toLowerCase() === 'cancelled') {
      return NextResponse.json({ 
        success: true, 
        message: 'Pesanan ini memang sudah dibatalkan sebelumnya.' 
      });
    }

    // Get payment ID for status logs
    const payments = await dbQuery<any>('SELECT id FROM payments WHERE order_id = ?', [orderId]);
    if (payments.length > 0) {
      const paymentId = payments[0].id;
      await processCancelledPayment({ id: orderId, paymentId });
    } else {
      // Fallback update order status if payment record doesn't exist yet
      await dbQuery('UPDATE orders SET status = \'CANCELLED\' WHERE id = ?', [orderId]);
    }

    // 3. Log user activity (audit_logs.id bertipe uuid)
    await dbQuery(
      'INSERT INTO audit_logs (id, user_id, action, details, created_at) VALUES (?, ?, ?, ?, NOW())',
      [crypto.randomUUID(), user.id, 'order_cancel', `Membatalkan pesanan pending: ${orderId}`]
    );

    return NextResponse.json({
      success: true,
      message: 'Pesanan berhasil dibatalkan.'
    });

  } catch (error) {
    console.error('[Cancel Order API] Error:', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}
