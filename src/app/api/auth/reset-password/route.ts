import { NextResponse } from 'next/server'
import { dbQuery } from '@/lib/db'
import { hashPassword } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabaseAdmin'

export async function POST(request: Request) {
  try {
    const { token, password, confirmPassword } = await request.json()

    if (!token || !password || !confirmPassword) {
      return NextResponse.json(
        { message: 'Semua field harus diisi ya!' },
        { status: 400 }
      )
    }

    if (password !== confirmPassword) {
      return NextResponse.json(
        { message: 'Password baru dan konfirmasi password-nya nggak sama nih, cek lagi ya!' },
        { status: 400 }
      )
    }

    if (password.length < 8) {
      return NextResponse.json(
        { message: 'Password baru minimal 8 karakter ya!' },
        { status: 400 }
      )
    }

    // Cari reset token yang valid
    const tokens = await dbQuery<any>(
      `SELECT id, email, expires_at, used_at
       FROM password_reset_tokens
       WHERE token = ? AND used_at IS NULL LIMIT 1`,
      [token]
    )

    if (tokens.length === 0) {
      return NextResponse.json(
        { message: 'Token reset kamu nggak valid atau udah kedaluarsa. Minta kode baru ya!' },
        { status: 400 }
      )
    }

    const tokenRow = tokens[0]

    if (new Date() > new Date(tokenRow.expires_at)) {
      return NextResponse.json(
        { message: 'Token reset kamu udah expired. Minta kode baru lagi ya!' },
        { status: 400 }
      )
    }

    const { email } = tokenRow

    // Update password
    const newHash = hashPassword(password)
    await dbQuery(
      'UPDATE users SET password_hash = ? WHERE email = ?',
      [newHash, email]
    )

    // Invalidate token yang dipakai
    await dbQuery(
      'UPDATE password_reset_tokens SET used_at = NOW() WHERE token = ?',
      [token]
    )

    // Hapus semua OTP forgot_password lama untuk email ini
    await dbQuery(
      'DELETE FROM otp_codes WHERE email = ? AND purpose = "forgot_password"',
      [email]
    )

    // Catat audit log & update Supabase Auth
    const userRows = await dbQuery<any>('SELECT id FROM users WHERE email = ? LIMIT 1', [email])
    if (userRows.length > 0) {
      const userId = userRows[0].id
      
      // Update password in Supabase Auth
      const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(userId, {
        password: password
      })
      if (updateError) {
        console.error('[Reset Password] Failed to update password in Supabase Auth:', updateError.message)
      }

      await dbQuery(
        'INSERT INTO audit_logs (user_id, action, details) VALUES (?, ?, ?)',
        [userId, 'password_reset', 'Password berhasil direset via OTP']
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Password kamu berhasil diubah! Sekarang bisa masuk dengan password baru.',
    })

  } catch (error) {
    console.error('Error reset-password:', error)
    return NextResponse.json(
      { message: 'Gagal reset password. Coba lagi ya!' },
      { status: 500 }
    )
  }
}
