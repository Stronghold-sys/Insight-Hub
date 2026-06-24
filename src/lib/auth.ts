import { cookies } from 'next/headers';
import { dbQuery } from './db';
import crypto from 'crypto';

export interface AuthUser {
  id: string;
  email: string;
  role: string;
  fullName: string;
  nickname: string;
  avatarUrl: string;
  mode: string;
}

// Helper untuk hash password dengan SHA-256
export function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password).digest('hex');
}

// Generate token random untuk session
export function generateToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

// Ambil user yang sedang login dari session cookie
export async function getSessionUser(): Promise<AuthUser | null> {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get('insighthub_session')?.value;

  if (!sessionToken) {
    return null;
  }

  // Query session dan hubungkan ke user & profile
  const sql = `
    SELECT 
      u.id, 
      u.email, 
      r.id AS role,
      p.full_name AS fullName,
      p.nickname,
      p.avatar_url AS avatarUrl,
      p.mode
    FROM sessions s
    JOIN users u ON s.user_id = u.id
    JOIN user_roles ur ON u.id = ur.user_id
    JOIN roles r ON ur.role_id = r.id
    LEFT JOIN user_profiles p ON u.id = p.user_id
    WHERE s.token = ? AND s.expires_at > NOW()
    LIMIT 1
  `;

  const results = await dbQuery<any>(sql, [sessionToken]);

  if (results.length === 0) {
    return null;
  }

  return results[0] as AuthUser;
}

// Buat session baru di database dan pasang cookie
export async function createSession(userId: string): Promise<string> {
  const token = generateToken();
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7); // Valid selama 7 hari

  // Hapus session lama biar rapi (optional)
  await dbQuery('DELETE FROM sessions WHERE user_id = ?', [userId]);

  // Insert session baru
  const sessionId = crypto.randomUUID();
  await dbQuery(
    'INSERT INTO sessions (id, user_id, token, expires_at) VALUES (?, ?, ?, ?)',
    [sessionId, userId, token, expiresAt]
  );

  // Pasang cookie
  const cookieStore = await cookies();
  cookieStore.set('insighthub_session', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    expires: expiresAt,
    path: '/',
  });

  // Catat audit log
  await dbQuery(
    'INSERT INTO audit_logs (user_id, action, details) VALUES (?, ?, ?)',
    [userId, 'login', 'User berhasil login dan membuat sesi baru']
  );

  return token;
}

// Hapus session di database dan bersihkan cookie
export async function destroySession(): Promise<void> {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get('insighthub_session')?.value;

  if (sessionToken) {
    // Ambil userId dari session sebelum dihapus untuk audit log
    const sessionRes = await dbQuery('SELECT user_id FROM sessions WHERE token = ?', [sessionToken]);
    if (sessionRes.length > 0) {
      const userId = sessionRes[0].user_id;
      await dbQuery(
        'INSERT INTO audit_logs (user_id, action, details) VALUES (?, ?, ?)',
        [userId, 'logout', 'User log out dan menghapus sesi']
      );
    }

    // Hapus dari database
    await dbQuery('DELETE FROM sessions WHERE token = ?', [sessionToken]);
  }

  // Hapus cookie
  cookieStore.delete('insighthub_session');
}
