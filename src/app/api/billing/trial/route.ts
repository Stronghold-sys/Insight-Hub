import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import { dbQuery } from '@/lib/db';
import crypto from 'crypto';
import { calculateExpirationDate } from '@/lib/dateUtils';


export async function POST(request: Request) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ success: false, error: 'Harus login dulu ya!' }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const { planId } = body;

    if (!planId || (planId !== 'basic' && planId !== 'premium')) {
      return NextResponse.json({ 
        success: false, 
        error: 'Paket trial yang kamu pilih nggak valid nih.' 
      }, { status: 400 });
    }

    // 1. Cek apakah user sudah pernah memakai trial sebelumnya
    const trialCheck = await dbQuery<any>(
      'SELECT COUNT(*) as count FROM subscriptions WHERE user_id = ? AND is_trial = 1',
      [user.id]
    );

    const hasUsedTrial = (trialCheck[0]?.count || 0) > 0;

    if (hasUsedTrial) {
      return NextResponse.json({
        success: false,
        error: 'Waduh, kamu udah pernah coba trial sebelumnya nih. Gas langsung langganan berbayar aja ya!'
      }, { status: 400 });
    }

    // 2. Tentukan durasi trial
    const durationDays = planId === 'basic' ? 7 : 14;
    const endsAt = calculateExpirationDate(new Date(), durationDays);


    // 3. Batalkan subskripsi aktif saat ini jika ada (misal status active gratis atau lainnya)
    await dbQuery(
      'UPDATE subscriptions SET status = "expired" WHERE user_id = ? AND status = "active"',
      [user.id]
    );

    // 4. Masukkan subskripsi trial baru
    const subId = crypto.randomUUID();
    await dbQuery(
      `INSERT INTO subscriptions (id, user_id, plan_id, status, starts_at, ends_at, is_trial) 
       VALUES (?, ?, ?, 'active', NOW(), ?, 1)`,
      [subId, user.id, planId, endsAt]
    );

    // 5. Catat log aktivitas user
    await dbQuery(
      'INSERT INTO user_activities (user_id, activity_type, description) VALUES (?, "trial_activated", ?)',
      [user.id, `Mengaktifkan trial ${planId} selama ${durationDays} hari`]
    );

    // 6. Kirim notifikasi ke user
    await dbQuery(
      'INSERT INTO notifications (id, user_id, title, message, is_read, priority) VALUES (?, ?, ?, ?, false, ?)',
      [
        crypto.randomUUID(),
        user.id,
        `Trial ${planId.toUpperCase()} Aktif!`,
        `Yeay! Masa trial ${planId.toUpperCase()} kamu selama ${durationDays} hari sudah aktif. Nikmati semua fiturnya sampai tanggal ${endsAt.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}!`,
        'high'
      ]
    );

    return NextResponse.json({
      success: true,
      message: `Yeay, trial ${planId.toUpperCase()} kamu berhasil diaktifkan!`,
      endsAt: endsAt.toISOString()
    });

  } catch (error) {
    console.error('[Trial Activation API] Error:', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}
