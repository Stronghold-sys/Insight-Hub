import { NextResponse } from 'next/server'
import { dbQuery } from '@/lib/db'
import { sendOtpEmail } from '@/lib/email'
import crypto from 'crypto'

const OTP_COOLDOWN_SECONDS = 60      // Tunggu 60 detik sebelum kirim ulang
const MAX_RESEND_PER_WINDOW = 3      // Maks 3x dalam 30 menit
const RESEND_WINDOW_MINUTES = 30

function generateOtp(): string {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

function hashOtp(otp: string): string {
  return crypto.createHash('sha256').update(otp).digest('hex')
}

export async function POST(request: Request) {
  try {
    const { email, purpose } = await request.json()

    if (!email || !purpose) {
      return NextResponse.json(
        { message: 'Email dan tujuannya harus diisi ya!' },
        { status: 400 }
      )
    }

    if (!['register', 'forgot_password'].includes(purpose)) {
      return NextResponse.json({ message: 'Tujuan tidak valid.' }, { status: 400 })
    }

    const normalizedEmail = email.trim().toLowerCase()

    // 1. Cek last OTP untuk cooldown & rate limit
    if (purpose === 'register') {
      const pendingCheck = await dbQuery<any>(
        `SELECT id, full_name, resend_count, last_resend_at, created_at
         FROM pending_registrations
         WHERE email = ? LIMIT 1`,
        [normalizedEmail]
      )

      if (pendingCheck.length === 0) {
        // Cek apakah sudah terdaftar
        const activeUser = await dbQuery<any>('SELECT id FROM users WHERE email = ? LIMIT 1', [normalizedEmail])
        if (activeUser.length > 0) {
          return NextResponse.json(
            { message: 'Akun kamu udah aktif! Langsung masuk aja.' },
            { status: 400 }
          )
        }
        return NextResponse.json(
          { message: 'Akun nggak ditemukan. Coba daftar dulu ya!' },
          { status: 404 }
        )
      }

      const pendingRow = pendingCheck[0]

      // Cooldown check (60 detik)
      const lastSent = pendingRow.last_resend_at
        ? new Date(pendingRow.last_resend_at)
        : new Date(pendingRow.created_at)
      const secondsSinceLast = (Date.now() - lastSent.getTime()) / 1000

      if (secondsSinceLast < OTP_COOLDOWN_SECONDS) {
        const remaining = Math.ceil(OTP_COOLDOWN_SECONDS - secondsSinceLast)
        return NextResponse.json(
          {
            message: `Sabar dulu ya! Tunggu ${remaining} detik lagi baru bisa kirim ulang.`,
            cooldown: remaining,
          },
          { status: 429 }
        )
      }

      // Rate limit check (3x dalam 30 menit)
      if (pendingRow.resend_count >= MAX_RESEND_PER_WINDOW) {
        return NextResponse.json(
          {
            message: `Kamu udah minta kode ${MAX_RESEND_PER_WINDOW}x. Tunggu beberapa saat lagi ya, atau cek folder spam kamu.`,
            rateLimited: true,
          },
          { status: 429 }
        )
      }

      // Generate OTP baru & update data pending
      const otp = generateOtp()
      const otpHash = hashOtp(otp)
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000) // 10 menit

      await dbQuery(
        `UPDATE pending_registrations 
         SET otp_hash = ?, otp_expired_at = ?, resend_count = resend_count + 1, last_resend_at = NOW(), otp_attempt = 0 
         WHERE id = ?`,
        [otpHash, expiresAt, pendingRow.id]
      )

      // Kirim email & audit log
      await Promise.all([
        sendOtpEmail(normalizedEmail, pendingRow.full_name, otp, 'register').catch((e: unknown) =>
          console.error('[Resend OTP Register] Email failed:', e)
        ),
        dbQuery(
          'INSERT INTO audit_logs (user_id, action, details) VALUES (NULL, ?, ?)',
          ['otp_resent', `OTP registrasi berhasil dikirim ulang ke: ${normalizedEmail}`]
        ).catch(() => {})
      ])

      return NextResponse.json({
        success: true,
        message: 'Kode baru udah dikirim! Cek inbox, spam, atau folder promosi kamu.',
      })
    }

    if (purpose === 'forgot_password') {
      const lastOtps = await dbQuery<any>(
        `SELECT id, created_at, resend_count, last_resend_at
         FROM otp_codes
         WHERE email = ? AND purpose = 'forgot_password' AND used_at IS NULL
         ORDER BY created_at DESC LIMIT 1`,
        [normalizedEmail]
      )

      if (lastOtps.length > 0) {
        const lastOtp = lastOtps[0]
        const lastSent = lastOtp.last_resend_at
          ? new Date(lastOtp.last_resend_at)
          : new Date(lastOtp.created_at)
        const secondsSinceLast = (Date.now() - lastSent.getTime()) / 1000

        if (secondsSinceLast < OTP_COOLDOWN_SECONDS) {
          const remaining = Math.ceil(OTP_COOLDOWN_SECONDS - secondsSinceLast)
          return NextResponse.json(
            {
              message: `Sabar dulu ya! Tunggu ${remaining} detik lagi baru bisa kirim ulang.`,
              cooldown: remaining,
            },
            { status: 429 }
          )
        }

        const windowStart = new Date(Date.now() - RESEND_WINDOW_MINUTES * 60 * 1000)
        const recentOtps = await dbQuery<any>(
          `SELECT COUNT(*) as cnt FROM otp_codes
           WHERE email = ? AND purpose = 'forgot_password' AND created_at > ?`,
          [normalizedEmail, windowStart]
        )

        if (recentOtps[0]?.cnt >= MAX_RESEND_PER_WINDOW) {
          return NextResponse.json(
            {
              message: `Kamu udah minta kode ${MAX_RESEND_PER_WINDOW}x dalam 30 menit terakhir. Tunggu sebentar lagi ya, atau cek folder spam kamu.`,
              rateLimited: true,
            },
            { status: 429 }
          )
        }
      }

      // Pastikan email terdaftar
      const users = await dbQuery<any>(
        'SELECT id, email_verified FROM users WHERE email = ? LIMIT 1',
        [normalizedEmail]
      )
      if (users.length === 0) {
        return NextResponse.json(
          { message: 'Email ini belum terdaftar. Cek lagi ya, atau daftar dulu!' },
          { status: 404 }
        )
      }

      // Ambil nama user untuk email
      const profileRows = await dbQuery<any>(
        `SELECT nickname FROM user_profiles WHERE user_id = ? LIMIT 1`,
        [users[0].id]
      )
      const name = profileRows[0]?.nickname || ''

      // Invalidate OTP lama
      await dbQuery(
        "DELETE FROM otp_codes WHERE email = ? AND purpose = 'forgot_password' AND used_at IS NULL",
        [normalizedEmail]
      )

      // Generate OTP baru
      const otp = generateOtp()
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000)
      await dbQuery(
        'INSERT INTO otp_codes (id, email, code, purpose, expires_at, resend_count, last_resend_at) VALUES (?, ?, ?, ?, ?, 1, NOW())',
        [crypto.randomUUID(), normalizedEmail, otp, 'forgot_password', expiresAt]
      )

      // Kirim email & log
      await Promise.all([
        sendOtpEmail(normalizedEmail, name, otp, 'forgot_password').catch((e: unknown) =>
          console.error('[Resend OTP ForgotPassword] Email failed:', e)
        ),
        dbQuery(
          'INSERT INTO audit_logs (user_id, action, details) VALUES (?, ?, ?)',
          [users[0].id, 'otp_resent', `OTP reset password berhasil dikirim ulang ke: ${normalizedEmail}`]
        ).catch(() => {})
      ])

      return NextResponse.json({
        success: true,
        message: 'Kode baru udah dikirim! Cek inbox, spam, atau folder promosi kamu.',
      })
    }

    return NextResponse.json({ message: 'Tujuan tidak valid.' }, { status: 400 })

  } catch (error) {
    console.error('Error resend-otp:', error)
    return NextResponse.json(
      { message: 'Gagal kirim ulang kode. Coba lagi ya!' },
      { status: 500 }
    )
  }
}
