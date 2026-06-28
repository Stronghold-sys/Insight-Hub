import { cookies } from 'next/headers';
import { dbQuery } from './db';

export interface AuthUser {
  id: string;
  email: string;
  role: string;
  fullName: string;
  nickname: string;
  avatarUrl: string;
  mode: string;
  onboardingCompleted: number;
}

function getCrypto() {
  return eval("require")('crypto');
}

// Helper untuk hash password dengan SHA-256
export function hashPassword(password: string): string {
  return getCrypto().createHash('sha256').update(password).digest('hex');
}

// Generate token random untuk session
export function generateToken(): string {
  return getCrypto().randomBytes(32).toString('hex');
}

// Cookie name constant
export const SESSION_COOKIE_NAME = 'insighthub_session';

// Cookie options untuk konsistensi di semua tempat
export function getSessionCookieOptions(expiresAt: Date) {
  return {
    httpOnly: true,
    secure: true,
    sameSite: 'lax' as const,
    expires: expiresAt,
    path: '/',
  };
}

// Ambil user yang sedang login dari session cookie (untuk Server Components/Route Handlers)
export async function getSessionUser(): Promise<AuthUser | null> {
  try {
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get(SESSION_COOKIE_NAME)?.value;

    if (!sessionToken) {
      return null;
    }

    return await getUserByToken(sessionToken);
  } catch {
    return null;
  }
}

// Ambil user berdasarkan token (reusable helper)
export async function getUserByToken(sessionToken: string): Promise<AuthUser | null> {
  const sql = `
    SELECT 
      u.id, 
      u.email, 
      r.id AS role,
      p.full_name AS fullName,
      p.nickname,
      p.avatar_url AS avatarUrl,
      p.mode,
      COALESCE(p.onboarding_completed, 0) AS onboardingCompleted
    FROM sessions s
    JOIN users u ON s.user_id::uuid = u.id
    JOIN user_roles ur ON u.id::text = ur.user_id
    JOIN roles r ON ur.role_id = r.id
    LEFT JOIN user_profiles p ON u.id::text = p.user_id
    WHERE s.token = ? AND s.expires_at > NOW()
    LIMIT 1
  `;

  const results = await dbQuery<any>(sql, [sessionToken]);

  if (results.length === 0) {
    return null;
  }

  return results[0] as AuthUser;
}

// Buat session di database dan return token + expiry (TANPA set cookie — dilakukan di Route Handler)
export async function createSessionToken(userId: string): Promise<{ token: string; expiresAt: Date }> {
  const token = generateToken();
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7); // Valid selama 7 hari

  // Hapus session lama
  await dbQuery('DELETE FROM sessions WHERE user_id = ?', [userId]);

  // Insert session baru
  const sessionId = getCrypto().randomUUID();
  await dbQuery(
    'INSERT INTO sessions (id, user_id, token, expires_at) VALUES (?, ?, ?, ?)',
    [sessionId, userId, token, expiresAt]
  );

  // Catat audit log
  await dbQuery(
    'INSERT INTO audit_logs (user_id, action, details) VALUES (?, ?, ?)',
    [userId, 'login', 'User berhasil login dan membuat sesi baru']
  );

  return { token, expiresAt };
}

// Legacy: Buat session dan set cookie (backward-compat, mungkin tidak bekerja di Cloudflare)
export async function createSession(userId: string): Promise<string> {
  const { token, expiresAt } = await createSessionToken(userId);

  try {
    const cookieStore = await cookies();
    cookieStore.set(SESSION_COOKIE_NAME, token, getSessionCookieOptions(expiresAt));
  } catch {
    // cookies() may fail in some environments — caller should set cookie on NextResponse
  }

  return token;
}

// Hapus session dari database (tanpa cookie — dilakukan di Route Handler)
export async function destroySessionToken(sessionToken: string): Promise<void> {
  const sessionRes = await dbQuery<any>('SELECT user_id FROM sessions WHERE token = ?', [sessionToken]);
  if (sessionRes.length > 0) {
    const userId = sessionRes[0].user_id;
    await dbQuery(
      'INSERT INTO audit_logs (user_id, action, details) VALUES (?, ?, ?)',
      [userId, 'logout', 'User log out dan menghapus sesi']
    );
  }
  await dbQuery('DELETE FROM sessions WHERE token = ?', [sessionToken]);
}

// Hapus session di database dan bersihkan cookie (legacy)
export async function destroySession(): Promise<void> {
  try {
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get(SESSION_COOKIE_NAME)?.value;

    if (sessionToken) {
      await destroySessionToken(sessionToken);
    }

    cookieStore.delete(SESSION_COOKIE_NAME);
  } catch {
    // ignore
  }
}
