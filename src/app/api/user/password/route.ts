import { NextResponse } from 'next/server';
import { getSessionUser, hashPassword } from '@/lib/auth';
import { dbQuery } from '@/lib/db';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export async function POST(req: Request) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { oldPassword, newPassword } = await req.json();

    if (!oldPassword || !newPassword) {
      return NextResponse.json({ success: false, error: 'Password lama dan baru wajib diisi' }, { status: 400 });
    }

    // 1. Verify old password
    const userRow = await dbQuery('SELECT password_hash FROM users WHERE id = ? LIMIT 1', [user.id]);
    if (userRow.length === 0) {
      return NextResponse.json({ success: false, error: 'User tidak ditemukan' }, { status: 404 });
    }

    const oldHash = hashPassword(oldPassword);
    if (userRow[0].password_hash !== oldHash) {
      return NextResponse.json({ success: false, error: 'Password lama kamu salah!' }, { status: 400 });
    }

    // 2. Update to new password
    const newHash = hashPassword(newPassword);
    await dbQuery('UPDATE users SET password_hash = ? WHERE id = ?', [newHash, user.id]);

    // Update in Supabase Auth
    const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(user.id, {
      password: newPassword
    });
    if (updateError) {
      console.error('[User Password] Failed to update password in Supabase Auth:', updateError.message);
    }

    // 3. Log audit event
    await dbQuery(
      'INSERT INTO audit_logs (user_id, action, details) VALUES (?, ?, ?)',
      [user.id, 'password_change', 'User berhasil merubah password akun secara mandiri']
    );

    return NextResponse.json({ success: true, message: 'Password updated successfully!' });
  } catch (error) {
    console.error('Error during password update API:', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}
