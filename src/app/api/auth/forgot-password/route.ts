import { NextResponse } from 'next/server'
import { dbQuery } from '@/lib/db'
import { sendOtpEmail } from '@/lib/email'
import crypto from 'crypto'

function generateOtp(): string {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

export async function POST(request: Request) {
  try {
    const { email } = await request.json()

    if (!email) {
      return NextResponse.json(
        { message: 'Email wajib diisi ya!' },
        { status: 400 }
      )
    }

    // Cek apakah email terdaftar
    const users = await dbQuery<any>(
      'SELECT id, email_verified FROM users WHERE email = ? LIMIT 1',
      [email]
    )

    if (users.length === 0) {
      // Jangan kasih info akun ada/tidak untuk keamanan
      return NextResponse.json({
        success: true,
        message: 'Kalau email kamu terdaftar, kode verifikasi udah kami kirim. Cek inbox atau spam ya!',
      })
    }

    const user = users[0]

    if (!user.email_verified) {
      return NextResponse.json(
        { message: 'Akun ini belum diverifikasi. Daftar ulang atau gunakan fitur kirim ulang OTP ya!' },
        { status: 400 }
      )
    }

    // Cek rate limit
    const windowStart = new Date(Date.now() - 30 * 60 * 1000)
    const recentOtps = await dbQuery<any>(
      `SELECT COUNT(*) as cnt FROM otp_codes
       WHERE email = ? AND purpose = 'forgot_password' AND created_at > ?`,
      [email, windowStart]
    )

    if (recentOtps[0]?.cnt >= 3) {
      return NextResponse.json(
        {
          message: 'Kamu udah minta kode 3x dalam 30 menit. Tunggu sebentar lagi ya, atau cek folder spam.',
          rateLimited: true,
        },
        { status: 429 }
      )
    }

    // Ambil nama user
    const profileRows = await dbQuery<any>(
      'SELECT nickname FROM user_profiles WHERE user_id = ? LIMIT 1',
      [user.id]
    )
    const name = profileRows[0]?.nickname || ''

    // Invalidate OTP lama
    await dbQuery(
      'DELETE FROM otp_codes WHERE email = ? AND purpose = "forgot_password" AND used_at IS NULL',
      [email]
    )

    // Generate OTP baru
    const otp = generateOtp()
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000)
    await dbQuery(
      'INSERT INTO otp_codes (id, email, code, purpose, expires_at) VALUES (?, ?, ?, ?, ?)',
      [crypto.randomUUID(), email, otp, 'forgot_password', expiresAt]
    )

    // Kirim email
    const emailResult = await sendOtpEmail(email, name, otp, 'forgot_password')
    if (!emailResult.success) {
      console.error('[ForgotPw] Email failed:', emailResult.error)
      return NextResponse.json(
        { message: 'Gagal kirim email. Coba lagi beberapa saat ya!' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Kalau email kamu terdaftar, kode verifikasi udah kami kirim. Cek inbox atau spam ya!',
    })

  } catch (error) {
    console.error('Error forgot-password:', error)
    return NextResponse.json(
      { message: 'Terjadi kesalahan. Coba lagi ya!' },
      { status: 500 }
    )
  }
}
