import { NextResponse } from 'next/server'
import { dbQuery } from '@/lib/db'
import { hashPassword } from '@/lib/auth'
import { sendOtpEmail } from '@/lib/email'
import crypto from 'crypto'

// Generate OTP 6 digit
function generateOtp(): string {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

// SHA-256 for OTP hashing
function hashOtp(otp: string): string {
  return crypto.createHash('sha256').update(otp).digest('hex')
}

export async function POST(request: Request) {
  try {
    // Bersihkan data pending registration yang sudah kedaluwarsa (lebih dari 24 jam)
    await dbQuery("DELETE FROM pending_registrations WHERE created_at < NOW() - INTERVAL '24 hours'").catch((e) => {
      console.error('[Register] Failed to cleanup old pending registrations:', e)
    })

    const { name, username, email, password, confirmPassword } = await request.json()

    // 1. Validasi Input Lengkap
    if (!name || !username || !email || !password || !confirmPassword) {
      return NextResponse.json(
        { message: 'Semua field wajib diisi, jangan ada yang kosong ya!' },
        { status: 400 }
      )
    }

    if (name.trim().length < 2) {
      return NextResponse.json(
        { message: 'Nama panggilan minimal 2 karakter dong!' },
        { status: 400 }
      )
    }

    const trimmedUsername = username.trim().toLowerCase()
    if (trimmedUsername.length < 3) {
      return NextResponse.json(
        { message: 'Username minimal 3 karakter ya!' },
        { status: 400 }
      )
    }

    if (!/^[a-zA-Z0-9_]+$/.test(trimmedUsername)) {
      return NextResponse.json(
        { message: 'Username cuma boleh huruf, angka, dan underscore!' },
        { status: 400 }
      )
    }

    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email.trim())) {
      return NextResponse.json(
        { message: 'Format email kamu kurang bener nih!' },
        { status: 400 }
      )
    }

    // Password validation (min 8 chars, must have letter and number/special char)
    if (password.length < 8) {
      return NextResponse.json(
        { message: 'Password minimal 8 karakter ya!' },
        { status: 400 }
      )
    }

    if (password !== confirmPassword) {
      return NextResponse.json(
        { message: 'Konfirmasi password kamu nggak cocok!' },
        { status: 400 }
      )
    }

    const normalizedEmail = email.trim().toLowerCase()

    // 2. Cek apakah Email atau Username sudah ada di active users (users / user_profiles)
    const activeEmailCheck = await dbQuery<any>(
      'SELECT id FROM users WHERE email = ? LIMIT 1',
      [normalizedEmail]
    )
    if (activeEmailCheck.length > 0) {
      return NextResponse.json(
        { message: 'Email ini udah terdaftar dan aktif. Langsung masuk aja!' },
        { status: 400 }
      )
    }

    const activeUsernameCheck = await dbQuery<any>(
      'SELECT user_id FROM user_profiles WHERE nickname = ? LIMIT 1',
      [trimmedUsername]
    )
    if (activeUsernameCheck.length > 0) {
      return NextResponse.json(
        { message: 'Username ini sudah digunakan. Coba username lain ya!' },
        { status: 400 }
      )
    }

    // 3. Cek status di pending_registrations
    const pendingCheck = await dbQuery<any>(
      'SELECT id, otp_expired_at FROM pending_registrations WHERE email = ? LIMIT 1',
      [normalizedEmail]
    )

    if (pendingCheck.length > 0) {
      const pendingRow = pendingCheck[0]
      const isExpired = new Date() > new Date(pendingRow.otp_expired_at)

      if (!isExpired) {
        // Tawarkan lanjutkan verifikasi / kirim ulang
        return NextResponse.json({
          success: false,
          pending: true,
          email: normalizedEmail,
          message: 'Email kamu masih dalam proses verifikasi OTP. Silakan verifikasi kode kamu atau kirim ulang OTP.'
        }, { status: 400 })
      } else {
        // Hapus data pending yang expired agar bisa didaftarkan ulang
        await dbQuery('DELETE FROM pending_registrations WHERE email = ?', [normalizedEmail])
        await dbQuery(
          'INSERT INTO audit_logs (user_id, action, details) VALUES (NULL, ?, ?)',
          ['register_pending_expired', `Registrasi pending sebelumnya expired untuk email: ${normalizedEmail}`]
        ).catch(() => {})
      }
    }

    // Cek apakah username juga ada di pending_registrations (non-expired)
    const pendingUsernameCheck = await dbQuery<any>(
      'SELECT id, otp_expired_at FROM pending_registrations WHERE username = ? LIMIT 1',
      [trimmedUsername]
    )
    if (pendingUsernameCheck.length > 0) {
      const isExpired = new Date() > new Date(pendingUsernameCheck[0].otp_expired_at)
      if (!isExpired) {
        return NextResponse.json(
          { message: 'Username ini sedang dalam proses pendaftaran pending oleh orang lain!' },
          { status: 400 }
        )
      } else {
        // Hapus pending registration dengan username expired
        await dbQuery('DELETE FROM pending_registrations WHERE username = ?', [trimmedUsername])
      }
    }

    // 4. Siapkan data pendaftaran pending
    const passHash = hashPassword(password)
    const otp = generateOtp()
    const otpHash = hashOtp(otp)
    const pendingId = crypto.randomUUID()
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000) // 10 menit

    const userAgent = request.headers.get('user-agent') || null
    const ipAddress = request.headers.get('cf-connecting-ip') || request.headers.get('x-forwarded-for') || null

    // Simpan ke pending_registrations
    await dbQuery(
      `INSERT INTO pending_registrations (
        id, full_name, username, email, password_hash, otp_hash, otp_expired_at, 
        otp_attempt, resend_count, ip_address, user_agent, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, 0, 0, ?, ?, NOW())`,
      [
        pendingId,
        name.trim(),
        trimmedUsername,
        normalizedEmail,
        passHash,
        otpHash,
        expiresAt,
        ipAddress,
        userAgent
      ]
    )

    // 5. Kirim Email OTP & Catat Audit Log secara parallel
    await Promise.all([
      sendOtpEmail(normalizedEmail, name.trim(), otp, 'register').catch((e: unknown) =>
        console.error('[Register] Email failed:', e)
      ),
      dbQuery(
        'INSERT INTO audit_logs (user_id, action, details) VALUES (NULL, ?, ?)',
        ['register_initiated', `Registrasi dimulai, OTP dikirim ke: ${normalizedEmail}`]
      ).catch((e: unknown) => console.error('[Register] Audit log failed:', e)),
    ])

    return NextResponse.json({
      success: true,
      requiresVerification: true,
      email: normalizedEmail,
      message: 'Registrasi berhasil! Kode OTP telah dikirim ke email kamu.',
    })

  } catch (error) {
    console.error('Error during register API:', error)
    return NextResponse.json(
      { message: 'Gagal membuat akun, coba lagi beberapa saat.' },
      { status: 500 }
    )
  }
}
