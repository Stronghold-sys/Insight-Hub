import { NextResponse } from 'next/server';
import { dbQuery } from '@/lib/db';
import crypto from 'crypto';

export async function GET(request: Request) {
  try {
    const now = new Date();

    // 1. Process expired subscriptions (ends_at <= NOW() and status = 'active')
    const expiredSubs = await dbQuery<any>(
      `SELECT id, user_id, plan_id, ends_at, COALESCE(notification_sent_flags, '') as flags 
       FROM subscriptions 
       WHERE status = 'active' AND ends_at IS NOT NULL AND ends_at <= NOW()`
    );

    for (const sub of expiredSubs) {
      // Mark as expired
      await dbQuery(
        `UPDATE subscriptions 
         SET status = 'expired', notification_sent_flags = ? 
         WHERE id = ?`,
        [`${sub.flags},expired`, sub.id]
      );

      // Create user notification
      const notifId = crypto.randomUUID();
      const planName = sub.plan_id.toUpperCase();
      await dbQuery(
        `INSERT INTO notifications (id, user_id, title, message, is_read, priority, created_at)
         VALUES (?, ?, 'Masa Aktif Paket Berakhir 🔴', ?, false, 'high', NOW())`,
        [
          notifId,
          sub.user_id,
          `Masa aktif paket ${planName} kamu telah berakhir. Akun kamu otomatis diturunkan ke paket FREE.`
        ]
      );

      // Log in user activity
      await dbQuery(
        `INSERT INTO user_activities (user_id, activity_type, description)
         VALUES (?, 'subscription_expired', ?)`,
        [sub.user_id, `Paket ${sub.plan_id} telah berakhir (expired)`]
      );

      console.log(`[Cron] Subscription ${sub.id} of user ${sub.user_id} expired successfully.`);
    }

    // 2. Check for upcoming expirations (7d, 3d, 1d, 6h, 1h)
    const activeSubs = await dbQuery<any>(
      `SELECT id, user_id, plan_id, ends_at, COALESCE(notification_sent_flags, '') as flags 
       FROM subscriptions 
       WHERE status = 'active' AND ends_at IS NOT NULL AND ends_at > NOW()`
    );

    for (const sub of activeSubs) {
      const endsAt = new Date(sub.ends_at);
      const diffMs = endsAt.getTime() - now.getTime();
      const diffHours = diffMs / (3600 * 1000);
      const diffDays = diffHours / 24;

      const flags = sub.flags.split(',').map((f: string) => f.trim()).filter(Boolean);
      let updatedFlags = [...flags];
      let shouldNotify = false;
      let title = '';
      let message = '';

      if (diffHours <= 1 && !flags.includes('1h')) {
        shouldNotify = true;
        updatedFlags.push('1h');
        title = 'Paket Berakhir Dalam 1 Jam! ⏳';
        message = `Waduh! Paket ${sub.plan_id.toUpperCase()} kamu akan habis dalam 1 jam lagi (pukul 23:59 WIB). Yuk perpanjang paketmu sekarang biar nggak kehilangan akses fitur premium!`;
      } else if (diffHours <= 6 && !flags.includes('6h')) {
        shouldNotify = true;
        updatedFlags.push('6h');
        title = 'Paket Berakhir Dalam 6 Jam! ⏳';
        message = `Paket ${sub.plan_id.toUpperCase()} kamu akan berakhir dalam 6 jam lagi hari ini pukul 23:59 WIB. Jangan lupa untuk perpanjang ya!`;
      } else if (diffDays <= 1 && !flags.includes('1d')) {
        shouldNotify = true;
        updatedFlags.push('1d');
        title = 'Paket Berakhir Besok! ⚠️';
        message = `Masa aktif paket ${sub.plan_id.toUpperCase()} kamu tersisa 1 hari lagi dan akan berakhir besok pukul 23:59 WIB. Yuk perpanjang sekarang!`;
      } else if (diffDays <= 3 && !flags.includes('3d')) {
        shouldNotify = true;
        updatedFlags.push('3d');
        title = 'Paket Berakhir Dalam 3 Hari! ⚠️';
        message = `Masa aktif paket ${sub.plan_id.toUpperCase()} kamu tersisa 3 hari lagi. Pastikan perpanjang sebelum berakhir ya!`;
      } else if (diffDays <= 7 && !flags.includes('7d')) {
        shouldNotify = true;
        updatedFlags.push('7d');
        title = 'Paket Berakhir Dalam 7 Hari! ℹ️';
        message = `Masa aktif paket ${sub.plan_id.toUpperCase()} kamu tersisa 7 hari lagi. Tetap terhubung dengan insight relasimu dengan memperpanjang paket.`;
      }

      if (shouldNotify) {
        // Update flags in DB
        await dbQuery(
          `UPDATE subscriptions SET notification_sent_flags = ? WHERE id = ?`,
          [updatedFlags.join(','), sub.id]
        );

        // Insert notification
        await dbQuery(
          `INSERT INTO notifications (id, user_id, title, message, is_read, priority, created_at)
           VALUES (?, ?, ?, ?, false, 'high', NOW())`,
          [crypto.randomUUID(), sub.user_id, title, message]
        );
        
        console.log(`[Cron] Sent warning notification (${updatedFlags[updatedFlags.length - 1]}) to user ${sub.user_id}`);
      }
    }

    return NextResponse.json({
      success: true,
      processedExpired: expiredSubs.length,
      timestamp: now.toISOString()
    });

  } catch (error: any) {
    console.error('[Cron Error] Error running subscription checks:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
