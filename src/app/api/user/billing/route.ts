import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import { dbQuery } from '@/lib/db';
import { getUserActivePlan } from '@/lib/accessControl';
import { checkDuitkuTransactionStatus } from '@/lib/duitku';
import { processSuccessfulPayment, processExpiredPayment, processCancelledPayment, PaymentStatus, mapDuitkuResultCode } from '@/lib/paymentService';
import { formatToWIB } from '@/lib/dateUtils';


export async function GET() {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    // Auto-Sync: Reconcile status with Duitku for any pending payments of the user
    const pendingPayments = await dbQuery<any>(
      `SELECT o.id as \`orderId\`, p.id as \`paymentId\`, p.expires_at as \`expiresAt\`, o.plan_id as \`planId\`, p.amount
       FROM orders o
       JOIN payments p ON o.id = p.order_id
       WHERE o.user_id = ?::text AND (LOWER(o.status) = 'pending' OR LOWER(p.status) = 'pending')`,
      [user.id]
    );

    for (const item of pendingPayments) {
      const expiresAtDate = new Date(item.expiresAt);
      let isStillPending = true;

      try {
        const checkRes = await checkDuitkuTransactionStatus(item.orderId);
        const mapped = mapDuitkuResultCode(checkRes.statusCode);

        if (mapped === PaymentStatus.SUCCESS) {
          await processSuccessfulPayment({
            id: item.orderId,
            paymentId: item.paymentId,
            planId: item.planId,
            userId: user.id,
            amount: item.amount
          });
          isStillPending = false;
        } else if (mapped === PaymentStatus.EXPIRED || mapped === PaymentStatus.FAILED) {
          await processExpiredPayment({ id: item.orderId, paymentId: item.paymentId });
          isStillPending = false;
        } else if (mapped === PaymentStatus.CANCELLED) {
          await processCancelledPayment({ id: item.orderId, paymentId: item.paymentId });
          isStillPending = false;
        }
      } catch (err: any) {
        console.warn(`[Billing Sync] Failed to sync status with Duitku for order ${item.orderId}:`, err.message);
      }

      if (isStillPending && expiresAtDate < new Date()) {
        await processExpiredPayment({ id: item.orderId, paymentId: item.paymentId });
      }
    }

    // Ambil data subskripsi aktif
    let activeSub = await dbQuery<any>(
      `SELECT s.id, s.plan_id as planId, s.status, s.starts_at as startsAt, s.ends_at as endsAt, s.cancel_at_period_end as cancelAtPeriodEnd, s.is_trial as isTrial
       FROM subscriptions s
       WHERE s.user_id::text = ? AND LOWER(s.status) = 'active' AND (s.ends_at IS NULL OR s.ends_at > NOW())
       ORDER BY s.starts_at DESC
       LIMIT 1`,
      [user.id]
    );

    if (activeSub.length === 0) {
      await getUserActivePlan(user.id);
      activeSub = await dbQuery<any>(
        `SELECT s.id, s.plan_id as planId, s.status, s.starts_at as startsAt, s.ends_at as endsAt, s.cancel_at_period_end as cancelAtPeriodEnd, s.is_trial as isTrial
         FROM subscriptions s
         WHERE s.user_id::text = ? AND LOWER(s.status) = 'active' AND (s.ends_at IS NULL OR s.ends_at > NOW())
         ORDER BY s.starts_at DESC
         LIMIT 1`,
        [user.id]
      );
    }

    // Ambil riwayat pembayaran & invoice dengan lengkap (mendukung order pending tanpa subskripsi)
    const payments = await dbQuery<any>(
      `SELECT p.id, p.amount, p.status, p.payment_method as method, p.payment_channel as channel, p.order_id as orderId,
              p.reference as reference, p.va_number as vaNumber, p.payment_url as paymentUrl,
              p.expires_at as expiresAt,
              p.paid_at as paidAt,
              p.created_at as date,
              COALESCE(s.plan_id, o.plan_id) as plan, 
              o.amount as basePrice, o.discount_amount as discount, o.admin_fee as adminFee, o.coupon_code as couponCode,
              i.invoice_number as invoiceNumber, i.pdf_url as pdfUrl,
              u.email as email, COALESCE(up.full_name, up.nickname, 'User') as userFullName
       FROM payments p
       LEFT JOIN subscriptions s ON p.subscription_id::text = s.id::text
       LEFT JOIN orders o ON p.order_id = o.id
       LEFT JOIN invoices i ON p.id = i.payment_id
       LEFT JOIN users u ON o.user_id = u.id::text
       LEFT JOIN user_profiles up ON u.id::text = up.user_id
       WHERE o.user_id = ?::text OR s.user_id::text = ?
       ORDER BY p.created_at DESC`,
      [user.id, user.id]
    );

    const trialSub = await dbQuery<any>(
      'SELECT COUNT(*) as count FROM subscriptions WHERE user_id::text = ? AND is_trial = 1',
      [user.id]
    );
    const hasUsedTrial = (trialSub[0]?.count || 0) > 0;

    // Format fields with WIB timezone in Javascript
    const activeSubFormatted = activeSub.length > 0 ? {
      ...activeSub[0],
      startsAt: formatToWIB(activeSub[0].startsAt, 'date-only'),
      endsAt: formatToWIB(activeSub[0].endsAt, 'date-only'),
      endsAtFull: formatToWIB(activeSub[0].endsAt, 'full'),
      cancelAtPeriodEnd: activeSub[0].cancelAtPeriodEnd,
      isTrial: activeSub[0].isTrial
    } : null;

    const paymentsFormatted = (payments || []).map((p: any) => ({
      ...p,
      expiresAt: p.expiresAt ? formatToWIB(p.expiresAt, 'full') : null,
      paidAt: p.paidAt ? formatToWIB(p.paidAt, 'full') : null,
      date: p.date ? formatToWIB(p.date, 'full') : null
    }));

    return NextResponse.json({
      success: true,
      activeSubscription: activeSubFormatted,
      hasUsedTrial,
      payments: paymentsFormatted
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
      const active = await dbQuery('SELECT id FROM subscriptions WHERE user_id::text = ? AND LOWER(status) = \'active\'', [user.id]);
      if (active.length === 0) {
        return NextResponse.json({ success: false, error: 'Tidak ada langganan aktif' }, { status: 400 });
      }

      // Update status menjadi cancelled
      await dbQuery(
        'UPDATE subscriptions SET status = \'cancelled\', cancel_at_period_end = 1 WHERE user_id::text = ? AND LOWER(status) = \'active\'',
        [user.id]
      );

      // Audit log
      await dbQuery(
        'INSERT INTO audit_logs (id, user_id, action, details, created_at) VALUES (?, ?, ?, ?, NOW())',
        [crypto.randomUUID(), user.id, 'subscription_cancelled', 'User membatalkan perpanjangan otomatis paket langganan aktif']
      );

      return NextResponse.json({ success: true, message: 'Langganan berhasil dibatalkan perpanjangannya' });
    }

    return NextResponse.json({ success: false, error: 'Action tidak dikenali' }, { status: 400 });
  } catch (error) {
    console.error('Error cancelling subscription:', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}
