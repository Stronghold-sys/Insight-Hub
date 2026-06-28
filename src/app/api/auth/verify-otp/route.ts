import { NextResponse } from 'next/server'
import { dbQuery } from '@/lib/db'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import crypto from 'crypto'

function hashOtp(otp: string): string {
  return crypto.createHash('sha256').update(otp).digest('hex')
}

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

    const normalizedEmail = email.trim().toLowerCase()

    // ==========================================
    // VERIFIKASI UNTUK REGISTRASI (PENDING FLOW)
    // ==========================================
    if (purpose === 'register') {
      // Cari data pending registration
      const pendingRows = await dbQuery<any>(
        `SELECT id, full_name, username, email, password_hash, otp_hash, otp_expired_at, otp_attempt 
         FROM pending_registrations
         WHERE email = ? LIMIT 1`,
        [normalizedEmail]
      )

      if (pendingRows.length === 0) {
        return NextResponse.json(
          { message: 'Pendaftaran kamu nggak ketemu atau sudah kedaluarsa. Silakan daftar ulang ya!' },
          { status: 400 }
        )
      }

      const pendingUser = pendingRows[0]

      // 1. Cek batas percobaan OTP (max 5)
      if (pendingUser.otp_attempt >= 5) {
        // Hapus data pendaftaran pending agar bersih
        await dbQuery('DELETE FROM pending_registrations WHERE id = ?', [pendingUser.id])
        await dbQuery(
          'INSERT INTO audit_logs (user_id, action, details) VALUES (NULL, ?, ?)',
          ['otp_blocked', `Percobaan OTP melebihi batas (5x) untuk email: ${normalizedEmail}. Pendaftaran pending dihapus.`]
        ).catch(() => {})

        return NextResponse.json(
          { message: 'Kamu udah salah masukkan kode OTP 5x. Silakan daftar ulang akun kamu dari awal ya!' },
          { status: 400 }
        )
      }

      // 2. Cek apakah OTP sudah expired
      if (new Date() > new Date(pendingUser.otp_expired_at)) {
        await dbQuery(
          'INSERT INTO audit_logs (user_id, action, details) VALUES (NULL, ?, ?)',
          ['otp_expired', `OTP expired untuk email: ${normalizedEmail}`]
        ).catch(() => {})

        return NextResponse.json(
          {
            message: 'Kode kamu udah kedaluarsa nih. Kirim ulang kode biar bisa lanjut!',
            expired: true,
          },
          { status: 400 }
        )
      }

      // 3. Cek apakah kode cocok (hashing comparison)
      const inputOtpHash = hashOtp(code.trim())
      if (pendingUser.otp_hash !== inputOtpHash) {
        // Tambah attempt
        const newAttempt = pendingUser.otp_attempt + 1
        await dbQuery(
          'UPDATE pending_registrations SET otp_attempt = ? WHERE id = ?',
          [newAttempt, pendingUser.id]
        )

        // Log audit log
        await dbQuery(
          'INSERT INTO audit_logs (user_id, action, details) VALUES (NULL, ?, ?)',
          ['otp_failed', `Gagal memverifikasi OTP (salah kode) ke-${newAttempt} untuk email: ${normalizedEmail}`]
        ).catch(() => {})

        return NextResponse.json(
          { message: `Kode OTP-nya salah nih. Sisa percobaan: ${5 - newAttempt}x lagi!` },
          { status: 400 }
        )
      }

      // 4. OTP VALID! Baru buat akun di Supabase Auth (auth.users)
      // Kita pakai password_hash dari database sebagai password awal di Supabase Auth
      const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email: normalizedEmail,
        password: pendingUser.password_hash,
        email_confirm: true,
      })

      if (authError) {
        console.error('[Verify OTP] Supabase Auth creation failed:', authError.message)
        return NextResponse.json(
          { message: `Gagal membuat akun di Authentication server: ${authError.message}` },
          { status: 400 }
        )
      }

      const userId = authUser.user.id

      // 5. Buat data profile, roles, settings, subscription, dll secara parallel
      await Promise.all([
        dbQuery(
          'INSERT INTO users (id, email, password_hash, is_active, email_verified) VALUES (?, ?, ?, 1, 1)',
          [userId, normalizedEmail, pendingUser.password_hash]
        ),
        dbQuery(
          'INSERT INTO user_roles (user_id, role_id) VALUES (?, ?)',
          [userId, 'user']
        ),
        dbQuery(
          'INSERT INTO user_profiles (user_id, full_name, nickname, avatar_url) VALUES (?, ?, ?, ?)',
          [
            userId,
            pendingUser.full_name,
            pendingUser.username,
            'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=80&h=80&fit=crop&crop=face'
          ]
        ),
        dbQuery(
          'INSERT INTO subscriptions (id, user_id, plan_id, status, starts_at, ends_at) VALUES (?, ?, "free", "active", NOW(), NULL)',
          [crypto.randomUUID(), userId]
        )
      ])

      // 6. Catat Audit Logs & Hapus dari pending_registrations
      await Promise.all([
        dbQuery(
          'INSERT INTO audit_logs (user_id, action, details) VALUES (?, ?, ?)',
          [userId, 'email_verified', 'Akun berhasil diverifikasi via OTP pendaftaran']
        ).catch(() => {}),
        dbQuery(
          'INSERT INTO audit_logs (user_id, action, details) VALUES (?, ?, ?)',
          [userId, 'user_created', 'Akun berhasil dibuat di auth.users Supabase dan database lokal']
        ).catch(() => {}),
        dbQuery(
          'DELETE FROM pending_registrations WHERE id = ?',
          [pendingUser.id]
        ).catch(() => {})
      ])

      return NextResponse.json({
        success: true,
        purpose: 'register',
        message: 'Akun kamu udah aktif! Silakan masuk sekarang.',
      })
    }

    // ==========================================
    // VERIFIKASI UNTUK FORGOT PASSWORD
    // ==========================================
    if (purpose === 'forgot_password') {
      const otps = await dbQuery<any>(
        `SELECT id, code, expires_at, used_at
         FROM otp_codes
         WHERE email = ? AND purpose = 'forgot_password' AND used_at IS NULL
         ORDER BY created_at DESC LIMIT 1`,
        [normalizedEmail]
      )

      if (otps.length === 0) {
        return NextResponse.json(
          { message: 'Kode OTP nggak ketemu. Kirim ulang kode dulu ya!' },
          { status: 400 }
        )
      }

      const otpRow = otps[0]

      if (new Date() > new Date(otpRow.expires_at)) {
        return NextResponse.json(
          {
            message: 'Kode kamu udah kedaluarsa nih. Kirim ulang kode biar bisa lanjut!',
            expired: true,
          },
          { status: 400 }
        )
      }

      if (otpRow.code !== code.trim()) {
        return NextResponse.json(
          { message: 'Kode OTP-nya salah nih. Cek lagi emailmu ya!' },
          { status: 400 }
        )
      }

      // Gunakan OTP
      await dbQuery(
        "UPDATE otp_codes SET used_at = NOW() WHERE id = ?",
        [otpRow.id]
      )

      // Generate reset token sementara
      const resetToken = crypto.randomBytes(32).toString('hex')
      const resetExpiry = new Date(Date.now() + 15 * 60 * 1000) // 15 menit

      await dbQuery('DELETE FROM password_reset_tokens WHERE email = ?', [normalizedEmail])
      await dbQuery(
        'INSERT INTO password_reset_tokens (id, email, token, expires_at) VALUES (?, ?, ?, ?)',
        [crypto.randomUUID(), normalizedEmail, resetToken, resetExpiry]
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
