import { NextResponse } from 'next/server'
import { getSessionUser } from '@/lib/auth'
import { dbQuery } from '@/lib/db'

export async function GET(request: Request) {
  try {
    const user = await getSessionUser()
    if (!user) {
      return NextResponse.json({ message: 'Harus login dulu ya' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const assessmentType = searchParams.get('assessmentType')

    if (!assessmentType) {
      return NextResponse.json({ message: 'Assessment type wajib diisi' }, { status: 400 })
    }

    // Find active session joining with progress
    const sessions = await dbQuery<any>(
      `SELECT s.id as session_id, p.current_question_id, p.total_count
       FROM assessment_sessions s
       JOIN assessment_progress p ON s.id = p.session_id
       WHERE s.user_id = ? AND s.category_id = ? AND s.status IN ('sedang berjalan', 'terhenti sementara', 'gagal sinkron')
       LIMIT 1`,
      [user.id, assessmentType]
    )

    if (sessions.length === 0) {
      return NextResponse.json({ success: true, hasSession: false })
    }

    const session = sessions[0]

    // ============================================================
    // RANDOM ENGINE: Cari display_order dari current_question_id
    // pada tabel assessment_attempt_questions (urutan yang sudah tersimpan)
    // ============================================================
    let currentQuestionIndex = 0

    const attemptRow = await dbQuery<any>(
      'SELECT display_order FROM assessment_attempt_questions WHERE session_id = ? AND question_id = ? LIMIT 1',
      [session.session_id, session.current_question_id]
    )

    if (attemptRow.length > 0) {
      // Gunakan display_order yang sudah tersimpan (urutan acak)
      currentQuestionIndex = attemptRow[0].display_order
    } else {
      // Fallback: cari index berdasarkan order_number (session lama)
      const questions = await dbQuery<any>(
        'SELECT id FROM assessment_questions WHERE category_id = ? AND status = \'active\' ORDER BY order_number ASC',
        [assessmentType]
      )
      if (session.current_question_id) {
        const idx = questions.findIndex((q: any) => q.id === session.current_question_id)
        if (idx !== -1) currentQuestionIndex = idx
      }
    }

    // Hitung total questions dari attempt_questions (lebih akurat)
    const attemptCount = await dbQuery<any>(
      'SELECT COUNT(*) as cnt FROM assessment_attempt_questions WHERE session_id = ?',
      [session.session_id]
    )
    const totalFromAttempt = attemptCount.length > 0 ? Number(attemptCount[0].cnt) : 0
    const totalQuestions = totalFromAttempt > 0 ? totalFromAttempt : (session.total_count || 0)

    return NextResponse.json({
      success: true,
      hasSession: true,
      sessionId: session.session_id,
      currentQuestionIndex,
      totalQuestions
    })
  } catch (error) {
    console.error('Error resuming session:', error)
    return NextResponse.json({ message: 'Gagal memulihkan sesi assessment' }, { status: 500 })
  }
}
