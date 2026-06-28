import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import { uploadToSupabase } from '@/lib/supabaseAdmin';

export async function POST(request: Request) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ success: false, error: 'Harus login dulu ya!' }, { status: 401 });
    }

    const formData = await request.formData().catch(() => null);
    if (!formData) {
      return NextResponse.json({ success: false, error: 'Data form kosong' }, { status: 400 });
    }

    const file = formData.get('avatar') as File | null;
    if (!file) {
      return NextResponse.json({ success: false, error: 'Foto profil wajib diupload' }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const mimeType = file.type || 'image/png';
    const ext = file.name.split('.').pop() || 'png';
    const fileName = `avatars/${user.id}-${Date.now()}.${ext}`;

    try {
      const publicUrl = await uploadToSupabase('insight-hub', fileName, buffer, mimeType);
      return NextResponse.json({ success: true, url: publicUrl });
    } catch (err: any) {
      console.warn('[Upload Avatar] Supabase storage upload failed, falling back to Base64:', err.message);
      // Fallback to base64 so user onboarding is never blocked
      const base64Url = `data:${mimeType};base64,${buffer.toString('base64')}`;
      return NextResponse.json({ success: true, url: base64Url });
    }
  } catch (error: any) {
    console.error('[Upload Avatar API] Error:', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}
