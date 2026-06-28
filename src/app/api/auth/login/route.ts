import { NextResponse } from 'next/server'
import { dbQuery } from '@/lib/db'
import { hashPassword, createSession } from '@/lib/auth'
import { supabase } from '@/lib/supabaseClient'
import { supabaseAdmin } from '@/lib/supabaseAdmin'

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json()

    if (!email || !password) {
      return NextResponse.json(
        { message: 'Email dan password-nya jangan dikosongkan ya!' },
        { status: 400 }
      )
    }

    // 1. Authenticate with Supabase Auth
    let { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    // Fallback: If login fails, check if user exists in local database.
    // If they exist and the password is correct locally:
    // - If they exist in Supabase Auth, update their password in Supabase Auth.
    // - If they don't exist in Supabase Auth, create them in Supabase Auth.
    if (authError) {
      console.warn('[Login] Supabase Auth sign-in failed, trying local DB fallback for:', email, authError.message)
      
      const users = await dbQuery<any>(
        'SELECT id, email, password_hash, is_active, email_verified FROM users WHERE email = ? LIMIT 1',
        [email]
      )

      if (users.length > 0) {
        const user = users[0]
        const inputHash = hashPassword(password)
        
        if (inputHash === user.password_hash) {
          console.log('[Login] Local password hash matched! Syncing user to Supabase Auth on-the-fly:', email)
          
          // Try updating password first (in case they already exist in Supabase Auth)
          const { data: updateData, error: updateError } = await supabaseAdmin.auth.admin.updateUserById(user.id, {
            password: password
          })

          if (updateError) {
            console.log('[Login] User update failed (probably does not exist in Auth), creating user:', email)
            const { data: newAuthUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
              id: user.id,
              email: user.email,
              password: password,
              email_confirm: true,
            })

            if (createError) {
              console.error('[Login] Failed to create fallback user in Supabase Auth:', createError.message)
            } else {
              // Retry signing in now that the user is created
              const retryRes = await supabase.auth.signInWithPassword({ email, password })
              if (!retryRes.error) {
                authData = retryRes.data
                authError = null
              }
            }
          } else {
            console.log('[Login] Successfully synced user password to Supabase Auth on-the-fly.')
            // Retry signing in now that the password is updated
            const retryRes = await supabase.auth.signInWithPassword({ email, password })
            if (!retryRes.error) {
              authData = retryRes.data
              authError = null
            }
          }
        }
      }
    }

    if (authError || !authData?.user) {
      await dbQuery(
        'INSERT INTO security_events (event_type, description) VALUES (?, ?)',
        ['login_failed', `Percobaan login gagal untuk email: ${email} - ${authError?.message || 'User tidak ditemukan'}`]
      )
      return NextResponse.json(
        { message: 'Waduh, email atau password kamu salah nih.' },
        { status: 401 }
      )
    }

    const authUser = authData.user

    // 2. Cari user di custom database
    const users = await dbQuery<any>(
      'SELECT id, email, is_active, email_verified FROM users WHERE id = ? LIMIT 1',
      [authUser.id]
    )

    if (users.length === 0) {
      // User ada di Supabase Auth tapi belum disinkronisasi ke custom database
      console.log('[Login] User found in Auth but not in DB. Syncing now:', authUser.email)
      const passHash = hashPassword(password)
      await dbQuery(
        'INSERT INTO users (id, email, password_hash, is_active, email_verified) VALUES (?, ?, ?, 1, 1)',
        [authUser.id, authUser.email, passHash]
      )
      await dbQuery(
        'INSERT INTO user_roles (user_id, role_id) VALUES (?, ?)',
        [authUser.id, 'user']
      )
      await dbQuery(
        'INSERT INTO user_profiles (user_id, full_name, nickname, avatar_url, age, relationship_status, language_tone, mode) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        [
          authUser.id,
          email.split('@')[0],
          email.split('@')[0],
          'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=80&h=80&fit=crop&crop=face',
          20,
          'Single',
          'genz',
          'solo'
        ]
      )
      users.push({ id: authUser.id, email: authUser.email, is_active: 1, email_verified: 1 })
    }

    const user = users[0]

    // Cek apakah akun belum diverifikasi
    if (!user.email_verified) {
      return NextResponse.json(
        {
          message: 'Akun kamu belum diverifikasi. Cek email kamu dan masukin kode OTP-nya dulu ya!',
          requiresVerification: true,
          email: user.email,
        },
        { status: 403 }
      )
    }

    // Cek apakah akun dinonaktifkan admin
    if (!user.is_active) {
      return NextResponse.json(
        { message: 'Akun kamu sedang dinonaktifkan. Hubungi support kami ya!' },
        { status: 403 }
      )
    }

    // Sukses — buat sesi
    await createSession(user.id)

    // Ambil profile info
    const profiles = await dbQuery<any>(
      'SELECT nickname, full_name, role_id FROM user_profiles p JOIN user_roles ur ON p.user_id = ur.user_id WHERE p.user_id = ?::text',
      [user.id]
    )

    const profile = profiles[0] || { nickname: 'Kamu', role_id: 'user' }

    await dbQuery(
      'INSERT INTO security_events (user_id, event_type, description) VALUES (?, ?, ?)',
      [user.id, 'login_success', 'User berhasil masuk ke platform']
    )

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        nickname: profile.nickname,
        role: profile.role_id,
      },
      session: authData?.session || null,
    })

  } catch (error) {
    console.error('Error during login API:', error)
    return NextResponse.json(
      { message: 'Terjadi kesalahan sistem, silakan coba lagi nanti.' },
      { status: 500 }
    )
  }
}
