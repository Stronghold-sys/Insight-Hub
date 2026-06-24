import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import { dbQuery } from '@/lib/db';
import { getUserActivePlan } from '@/lib/accessControl';

export async function GET() {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    // Ambil data subskripsi aktif
    let activeSub = await dbQuery<any>(
      `SELECT s.id, s.plan_id as planId, s.status, DATE_FORMAT(s.starts_at, '%Y-%m-%d') as startsAt, DATE_FORMAT(s.ends_at, '%Y-%m-%d') as endsAt, s.cancel_at_period_end as cancelAtPeriodEnd, s.is_trial as isTrial
       FROM subscriptions s
       WHERE s.user_id = ? AND s.status = 'active' AND (s.ends_at IS NULL OR s.ends_at > NOW())
       ORDER BY s.starts_at DESC
       LIMIT 1`,
      [user.id]
    );

    if (activeSub.length === 0) {
      await getUserActivePlan(user.id);
      activeSub = await dbQuery<any>(
        `SELECT s.id, s.plan_id as planId, s.status, DATE_FORMAT(s.starts_at, '%Y-%m-%d') as startsAt, DATE_FORMAT(s.ends_at, '%Y-%m-%d') as endsAt, s.cancel_at_period_end as cancelAtPeriodEnd, s.is_trial as isTrial
         FROM subscriptions s
         WHERE s.user_id = ? AND s.status = 'active' AND (s.ends_at IS NULL OR s.ends_at > NOW())
         ORDER BY s.starts_at DESC
         LIMIT 1`,
        [user.id]
      );
    }

    // Ambil riwayat pembayaran & invoice (mendukung order pending tanpa subskripsi)
    const payments = await dbQuery(
      `SELECT p.id, p.amount, p.status, p.payment_method as method, p.payment_channel as channel, p.order_id as orderId,
              DATE_FORMAT(p.created_at, '%Y-%m-%d %H:%i') as date, COALESCE(s.plan_id, o.plan_id) as plan, 
              i.invoice_number as invoiceNumber, i.pdf_url as pdfUrl
       FROM payments p
       LEFT JOIN subscriptions s ON p.subscription_id = s.id
       LEFT JOIN orders o ON p.order_id = o.id
       LEFT JOIN invoices i ON p.id = i.payment_id
       WHERE o.user_id = ? OR s.user_id = ?
       ORDER BY p.created_at DESC`,
      [user.id, user.id]
    );

    const trialSub = await dbQuery<any>(
      'SELECT COUNT(*) as count FROM subscriptions WHERE user_id = ? AND is_trial = 1',
      [user.id]
    );
    const hasUsedTrial = (trialSub[0]?.count || 0) > 0;

    return NextResponse.json({
      success: true,
      activeSubscription: activeSub[0] || null,
      hasUsedTrial,
      payments
    });
  } catch (error) {
    console.error('Error fetching billing history:', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { action } = await req.json();

    if (action === 'cancel_subscription') {
      // Dapatkan subskripsi aktif
      const active = await dbQuery('SELECT id FROM subscriptions WHERE user_id = ? AND status = "active"', [user.id]);
      if (active.length === 0) {
        return NextResponse.json({ success: false, error: 'Tidak ada langganan aktif' }, { status: 400 });
      }

      // Update status menjadi cancelled
      await dbQuery(
        'UPDATE subscriptions SET status = "cancelled", cancel_at_period_end = 1 WHERE user_id = ? AND status = "active"',
        [user.id]
      );

      // Audit log
      await dbQuery(
        'INSERT INTO audit_logs (user_id, action, details) VALUES (?, ?, ?)',
        [user.id, 'subscription_cancelled', 'User membatalkan perpanjangan otomatis paket langganan aktif']
      );

      return NextResponse.json({ success: true, message: 'Langganan berhasil dibatalkan perpanjangannya' });
    }

    return NextResponse.json({ success: false, error: 'Action tidak dikenali' }, { status: 400 });
  } catch (error) {
    console.error('Error cancelling subscription:', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}
