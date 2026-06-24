import { NextResponse } from 'next/server'
import { dbQuery } from '@/lib/db'
import crypto from 'crypto'

export async function POST(request: Request) {
  try {
    const { email, code, purpose } = await request.json()

    if (!email || !code || !purpose) {
      return NextResponse.json(
        { message: 'Data tidak lengkap. Coba lagi ya!' },
        { status: 400 }
      )
    }

    if (!['register', 'forgot_password'].includes(purpose)) {
      return NextResponse.json(
        { message: 'Tujuan verifikasi tidak valid.' },
        { status: 400 }
      )
    }

    // Cari OTP yang valid (belum kedaluarsa dan belum dipakai)
    const otps = await dbQuery<any>(
      `SELECT id, code, expires_at, used_at
       FROM otp_codes
       WHERE email = ? AND purpose = ? AND used_at IS NULL
       ORDER BY created_at DESC LIMIT 1`,
      [email, purpose]
    )

    if (otps.length === 0) {
      return NextResponse.json(
        { message: 'Kode OTP nggak ketemu. Kirim ulang kode dulu ya!' },
        { status: 400 }
      )
    }

    const otpRow = otps[0]

    // Cek apakah OTP sudah expired
    if (new Date() > new Date(otpRow.expires_at)) {
      return NextResponse.json(
        {
          message: 'Kode kamu udah kedaluarsa nih. Kirim ulang kode biar bisa lanjut!',
          expired: true,
        },
        { status: 400 }
      )
    }

    // Cek apakah kode cocok
    if (otpRow.code !== code.trim()) {
      return NextResponse.json(
        { message: 'Kode OTP-nya salah nih. Cek lagi emailmu ya!' },
        { status: 400 }
      )
    }

    // Tandai OTP sebagai sudah dipakai
    await dbQuery(
      'UPDATE otp_codes SET used_at = NOW() WHERE id = ?',
      [otpRow.id]
    )

    if (purpose === 'register') {
      // Aktifkan akun user
      await dbQuery(
        'UPDATE users SET email_verified = 1, is_active = 1 WHERE email = ?',
        [email]
      )

      // Ambil userId untuk setup initial data
      const users = await dbQuery<any>(
        'SELECT id FROM users WHERE email = ? LIMIT 1',
        [email]
      )

      if (users.length > 0) {
        const userId = users[0].id

        // Buat default journal jika belum ada
        const existingJournal = await dbQuery(
          'SELECT id FROM journals WHERE user_id = ? LIMIT 1',
          [userId]
        )
        if (existingJournal.length === 0) {
          const profileRows = await dbQuery<any>(
            'SELECT nickname FROM user_profiles WHERE user_id = ? LIMIT 1',
            [userId]
          )
          const nick = profileRows[0]?.nickname || 'Kamu'
          await dbQuery(
            'INSERT INTO journals (id, user_id, title) VALUES (?, ?, ?)',
            [crypto.randomUUID(), userId, `Jurnal ${nick}`]
          )
        }

        // Buat default subscription gratis jika belum ada
        const existingSub = await dbQuery(
          'SELECT id FROM subscriptions WHERE user_id = ? LIMIT 1',
          [userId]
        )
        if (existingSub.length === 0) {
          await dbQuery(
            'INSERT INTO subscriptions (id, user_id, plan_id, status, starts_at, ends_at) VALUES (?, ?, "free", "active", NOW(), NULL)',
            [crypto.randomUUID(), userId]
          )
        }

        // Kirim notifikasi selamat datang
        const profileRes = await dbQuery<any>(
          'SELECT nickname FROM user_profiles WHERE user_id = ? LIMIT 1',
          [userId]
        )
        const name = profileRes[0]?.nickname || 'Kamu'
        await dbQuery(
          'INSERT INTO notifications (id, user_id, title, message, is_read, priority) VALUES (?, ?, ?, ?, 0, ?)',
          [
            crypto.randomUUID(),
            userId,
            'Selamat Datang!',
            `Halo ${name}! Selamat bergabung di Insight Hub. Platform self-awareness berbasis sains ini siap membantumu kenali diri dan dinamika relasi kamu.`,
            'medium',
          ]
        )

        await dbQuery(
          'INSERT INTO audit_logs (user_id, action, details) VALUES (?, ?, ?)',
          [userId, 'email_verified', 'Akun berhasil diverifikasi via OTP']
        )
      }

      return NextResponse.json({
        success: true,
        purpose: 'register',
        message: 'Akun kamu udah aktif! Silakan masuk sekarang.',
      })
    }

    if (purpose === 'forgot_password') {
      // Generate reset token sementara
      const resetToken = crypto.randomBytes(32).toString('hex')
      const resetExpiry = new Date(Date.now() + 15 * 60 * 1000) // 15 menit

      // Hapus reset token lama
      await dbQuery('DELETE FROM password_reset_tokens WHERE email = ?', [email])

      // Simpan reset token baru
      await dbQuery(
        'INSERT INTO password_reset_tokens (id, email, token, expires_at) VALUES (?, ?, ?, ?)',
        [crypto.randomUUID(), email, resetToken, resetExpiry]
      )

      return NextResponse.json({
        success: true,
        purpose: 'forgot_password',
        resetToken,
        message: 'Kode valid! Sekarang kamu bisa buat password baru.',
      })
    }

    return NextResponse.json({ success: false, message: 'Terjadi kesalahan.' }, { status: 500 })

  } catch (error) {
    console.error('Error verify-otp:', error)
    return NextResponse.json(
      { message: 'Gagal verifikasi. Coba lagi ya!' },
      { status: 500 }
    )
  }
}
