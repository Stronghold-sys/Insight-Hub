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

    // Cek last OTP untuk cooldown & rate limit
    const lastOtps = await dbQuery<any>(
      `SELECT id, created_at, resend_count, last_resend_at
       FROM otp_codes
       WHERE email = ? AND purpose = ? AND used_at IS NULL
       ORDER BY created_at DESC LIMIT 1`,
      [email, purpose]
    )

    if (lastOtps.length > 0) {
      const lastOtp = lastOtps[0]

      // Cek cooldown (60 detik sejak kirim terakhir)
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

      // Cek rate limit (max 3x dalam 30 menit)
      const windowStart = new Date(Date.now() - RESEND_WINDOW_MINUTES * 60 * 1000)
      const recentOtps = await dbQuery<any>(
        `SELECT COUNT(*) as cnt FROM otp_codes
         WHERE email = ? AND purpose = ? AND created_at > ?`,
        [email, purpose, windowStart]
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

    // Untuk forgot_password: pastikan email terdaftar
    if (purpose === 'forgot_password') {
      const users = await dbQuery<any>(
        'SELECT id, email_verified FROM users WHERE email = ? LIMIT 1',
        [email]
      )
      if (users.length === 0) {
        return NextResponse.json(
          { message: 'Email ini belum terdaftar. Cek lagi ya, atau daftar dulu!' },
          { status: 404 }
        )
      }
    }

    // Untuk register: pastikan user ada (mungkin belum verifikasi)
    if (purpose === 'register') {
      const users = await dbQuery<any>(
        'SELECT id, email_verified FROM users WHERE email = ? LIMIT 1',
        [email]
      )
      if (users.length === 0) {
        return NextResponse.json(
          { message: 'Akun nggak ditemukan. Coba daftar dulu ya!' },
          { status: 404 }
        )
      }
      if (users[0].email_verified) {
        return NextResponse.json(
          { message: 'Akun kamu udah aktif! Langsung masuk aja.' },
          { status: 400 }
        )
      }
    }

    // Ambil nama user untuk email
    const profileRows = await dbQuery<any>(
      `SELECT up.nickname FROM users u
       LEFT JOIN user_profiles up ON u.id = up.user_id
       WHERE u.email = ? LIMIT 1`,
      [email]
    )
    const name = profileRows[0]?.nickname || ''

    // Invalidate OTP lama
    await dbQuery(
      'DELETE FROM otp_codes WHERE email = ? AND purpose = ? AND used_at IS NULL',
      [email, purpose]
    )

    // Generate OTP baru
    const otp = generateOtp()
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000)
    await dbQuery(
      'INSERT INTO otp_codes (id, email, code, purpose, expires_at, resend_count, last_resend_at) VALUES (?, ?, ?, ?, ?, 1, NOW())',
      [crypto.randomUUID(), email, otp, purpose, expiresAt]
    )

    // Kirim email
    const emailResult = await sendOtpEmail(email, name, otp, purpose)
    if (!emailResult.success) {
      console.error('[Resend OTP] Email failed:', emailResult.error)
      return NextResponse.json(
        { message: 'Gagal kirim email. Coba lagi beberapa saat ya!' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Kode baru udah dikirim! Cek inbox, spam, atau folder promosi kamu.',
    })

  } catch (error) {
    console.error('Error resend-otp:', error)
    return NextResponse.json(
      { message: 'Gagal kirim ulang kode. Coba lagi ya!' },
      { status: 500 }
    )
  }
}
