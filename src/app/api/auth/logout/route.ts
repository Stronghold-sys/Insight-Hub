import { NextResponse } from 'next/server';
import { destroySession } from '@/lib/auth';

export async function POST() {
  try {
    await destroySession();
    return NextResponse.json({ success: true, message: 'Sampai jumpa lagi!' });
  } catch (error) {
    console.error('Error during logout API:', error);
    return NextResponse.json({ message: 'Terjadi kesalahan saat logout.' }, { status: 500 });
  }
}
