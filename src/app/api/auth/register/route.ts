import { NextResponse } from 'next/server'
import { dbQuery } from '@/lib/db'
import { hashPassword } from '@/lib/auth'
import { sendOtpEmail } from '@/lib/email'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import crypto from 'crypto'

// Generate OTP 6 digit
function generateOtp(): string {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

export async function POST(request: Request) {
  try {
    const { name, email, password } = await request.json()

    if (!name || !email || !password) {
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

    if (password.length < 8) {
      return NextResponse.json(
        { message: 'Password minimal 8 karakter ya!' },
        { status: 400 }
      )
    }

    // Cek apakah email sudah terdaftar dan sudah aktif
    const existing = await dbQuery<any>(
      'SELECT id, email_verified FROM users WHERE email = ? LIMIT 1',
      [email]
    )

    if (existing.length > 0) {
      if (existing[0].email_verified) {
        return NextResponse.json(
          { message: 'Email ini udah terdaftar dan aktif. Langsung masuk aja!' },
          { status: 400 }
        )
      }
      // Email ada tapi belum diverifikasi — hapus dan daftar ulang
      try {
        const { data: listData } = await supabaseAdmin.auth.admin.listUsers()
        const existingAuthUser = listData?.users.find(u => u.email === email)
        if (existingAuthUser) {
          await supabaseAdmin.auth.admin.deleteUser(existingAuthUser.id)
        }
      } catch (e) {
        console.warn('[Register] Warning checking existing auth user:', e)
      }
      await dbQuery('DELETE FROM users WHERE email = ?', [email])
    }

    // 1. Create user di Supabase Auth
    const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // We confirm the email in Supabase Auth, but keep email_verified=0 in our custom database to control OTP page redirects!
    })

    if (authError) {
      console.error('[Register] Supabase Auth Error:', authError.message)
      return NextResponse.json(
        { message: authError.message || 'Gagal mendaftarkan akun di Authentication server.' },
        { status: 400 }
      )
    }

    const userId = authUser.user.id // Gunakan UUID dari Supabase Auth!
    const passHash = hashPassword(password)

    // Simpan user dengan is_active=0 dan email_verified=0
    await dbQuery(
      'INSERT INTO users (id, email, password_hash, is_active, email_verified) VALUES (?, ?, ?, 0, 0)',
      [userId, email, passHash]
    )

    // Hubungkan dengan role 'user'
    await dbQuery(
      'INSERT INTO user_roles (user_id, role_id) VALUES (?, ?)',
      [userId, 'user']
    )

    // Buat profil default
    await dbQuery(
      'INSERT INTO user_profiles (user_id, full_name, nickname, avatar_url, age, relationship_status, language_tone, mode) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [
        userId,
        name.trim(),
        name.trim(),
        'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=80&h=80&fit=crop&crop=face',
        20,
        'Single',
        'genz',
        'solo'
      ]
    )

    // Invalidate OTP lama untuk email ini
    await dbQuery(
      'DELETE FROM otp_codes WHERE email = ? AND purpose = "register"',
      [email]
    )

    // Generate dan simpan OTP
    const otp = generateOtp()
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000) // 10 menit
    await dbQuery(
      'INSERT INTO otp_codes (id, email, code, purpose, expires_at) VALUES (?, ?, ?, ?, ?)',
      [crypto.randomUUID(), email, otp, 'register', expiresAt]
    )

    // Kirim email OTP
    const emailResult = await sendOtpEmail(email, name.trim(), otp, 'register')
    if (!emailResult.success) {
      console.error('[Register] Email failed:', emailResult.error)
      // Tetap lanjut walau email gagal — user bisa kirim ulang
    }

    // Catat audit log
    await dbQuery(
      'INSERT INTO audit_logs (user_id, action, details) VALUES (?, ?, ?)',
      [userId, 'register_pending', 'Pendaftaran akun baru — menunggu verifikasi OTP']
    )

    return NextResponse.json({
      success: true,
      requiresVerification: true,
      email,
      message: 'Akun berhasil dibuat! Cek email kamu buat kode verifikasi ya.',
    })

  } catch (error) {
    console.error('Error during register API:', error)
    return NextResponse.json(
      { message: 'Gagal membuat akun, coba lagi beberapa saat.' },
      { status: 500 }
    )
  }
}
