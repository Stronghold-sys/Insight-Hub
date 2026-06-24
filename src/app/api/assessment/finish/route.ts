import { NextResponse } from 'next/server'
import { getSessionUser } from '@/lib/auth'
import { dbQuery } from '@/lib/db'

export async function POST(request: Request) {
  try {
    const user = await getSessionUser()
    if (!user) {
      return NextResponse.json({ message: 'Harus login dulu ya' }, { status: 401 })
    }

    const { sessionId } = await request.json()

    if (!sessionId) {
      return NextResponse.json({ message: 'Session ID wajib diisi' }, { status: 400 })
    }

    // Verify session
    const sessions = await dbQuery(
      `SELECT * FROM assessment_sessions 
       WHERE id = ? AND user_id = ? AND status IN ('sedang berjalan', 'terhenti sementara', 'gagal sinkron') LIMIT 1`,
      [sessionId, user.id]
    )

    if (sessions.length === 0) {
      return NextResponse.json({ message: 'Sesi assessment tidak aktif atau tidak ditemukan' }, { status: 404 })
    }

    // Update status to 'selesai' in both tables
    await dbQuery(
      "UPDATE assessment_sessions SET status = 'selesai' WHERE id = ?",
      [sessionId]
    )
    await dbQuery(
      "UPDATE assessment_progress SET status = 'selesai' WHERE session_id = ?",
      [sessionId]
    )

    return NextResponse.json({ success: true, message: 'Assessment berhasil diselesaikan' })
  } catch (error) {
    console.error('Error completing assessment:', error)
    return NextResponse.json({ message: 'Gagal menyelesaikan assessment' }, { status: 500 })
  }
}
