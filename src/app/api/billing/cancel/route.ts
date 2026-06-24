import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import { dbQuery } from '@/lib/db';

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
      'SELECT status FROM orders WHERE id = ? AND user_id = ?',
      [orderId, user.id]
    );

    if (orders.length === 0) {
      return NextResponse.json({ success: false, error: 'Pesanan tidak ditemukan' }, { status: 404 });
    }

    const currentStatus = orders[0].status;

    // Do not allow cancelling if already paid/success
    if (currentStatus === 'success' || currentStatus === 'paid') {
      return NextResponse.json({ 
        success: false, 
        error: 'Transaksi sudah lunas dibayar, tidak bisa dibatalkan ya.' 
      }, { status: 400 });
    }

    if (currentStatus === 'cancelled') {
      return NextResponse.json({ 
        success: true, 
        message: 'Pesanan ini memang sudah dibatalkan sebelumnya.' 
      });
    }

    // 1. Update order status
    await dbQuery('UPDATE orders SET status = "cancelled" WHERE id = ?', [orderId]);

    // 2. Update payment status
    await dbQuery('UPDATE payments SET status = "cancelled" WHERE order_id = ?', [orderId]);

    // Get payment ID for status logs
    const payments = await dbQuery<any>('SELECT id FROM payments WHERE order_id = ?', [orderId]);
    if (payments.length > 0) {
      const paymentId = payments[0].id;
      
      // Log transition
      await dbQuery(
        'INSERT INTO transaction_status_history (payment_id, from_status, to_status) VALUES (?, ?, "cancelled")',
        [paymentId, currentStatus]
      );

      // Add payment log
      await dbQuery(
        'INSERT INTO payment_logs (id, payment_id, event_type, message) VALUES (UUID(), ?, "payment_cancelled", "Pesanan dibatalkan secara manual oleh user")',
        [paymentId]
      );
    }

    // 3. Log user activity
    await dbQuery(
      'INSERT INTO user_activities (user_id, activity_type, description) VALUES (?, "order_cancel", ?)',
      [user.id, `Membatalkan pesanan pending: ${orderId}`]
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
