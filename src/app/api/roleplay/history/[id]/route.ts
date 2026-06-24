import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import { dbQuery } from '@/lib/db';

// GET /api/roleplay/history/[id] — ambil detail satu sesi
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const user = await getSessionUser();
    if (!user) return NextResponse.json({ success: false, error: 'Harus login dulu ya!' }, { status: 401 });

    const rows = await dbQuery<any>(
      `SELECT id, title, level, user_gender, lang_style, scenario_context, scenario_goal, ai_persona, partner_name,
              messages, analysis, turn_count, avg_score, status,
              DATE_FORMAT(created_at, '%d %b %Y, %H:%i') as created_at_formatted
       FROM roleplay_sessions
       WHERE id = ? AND user_id = ?`,
      [id, user.id]
    );

    if (!rows || rows.length === 0) {
      return NextResponse.json({ success: false, error: 'Sesi tidak ditemukan.' }, { status: 404 });
    }

    const session = rows[0];
    try {
      session.messages = JSON.parse(session.messages || '[]');
    } catch {
      session.messages = [];
    }
    try {
      session.analysis = session.analysis ? JSON.parse(session.analysis) : null;
    } catch {
      session.analysis = null;
    }

    return NextResponse.json({ success: true, session });
  } catch (err) {
    console.error('[Roleplay History GET ID]', err);
    return NextResponse.json({ success: false, error: 'Gagal ambil detail sesi.' }, { status: 500 });
  }
}

// DELETE /api/roleplay/history/[id] — hapus sesi dari riwayat
export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const user = await getSessionUser();
    if (!user) return NextResponse.json({ success: false, error: 'Harus login dulu ya!' }, { status: 401 });

    await dbQuery(
      'DELETE FROM roleplay_sessions WHERE id = ? AND user_id = ?',
      [id, user.id]
    );

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[Roleplay History DELETE]', err);
    return NextResponse.json({ success: false, error: 'Gagal hapus sesi.' }, { status: 500 });
  }
}
