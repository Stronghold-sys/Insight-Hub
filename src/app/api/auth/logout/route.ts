import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { destroySessionToken, SESSION_COOKIE_NAME } from '@/lib/auth';

export async function POST() {
  try {
    // Baca token dari cookie
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get(SESSION_COOKIE_NAME)?.value;

    if (sessionToken) {
      await destroySessionToken(sessionToken);
    }

    // Hapus cookie langsung di NextResponse untuk memastikan browser menerimanya
    const response = NextResponse.json({ success: true, message: 'Sampai jumpa lagi!' });
    response.cookies.set(SESSION_COOKIE_NAME, '', {
      httpOnly: true,
      secure: true,
      sameSite: 'lax',
      maxAge: 0,  // Expire immediately
      path: '/',
    });
    return response;
  } catch (error) {
    console.error('Error during logout API:', error);
    return NextResponse.json({ message: 'Terjadi kesalahan saat logout.' }, { status: 500 });
  }
}
