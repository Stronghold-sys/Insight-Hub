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
    const sessions = await dbQuery(
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

    // Fetch all questions for this category to determine index
    const questions = await dbQuery(
      'SELECT id FROM assessment_questions WHERE category_id = ? AND status = "active" ORDER BY order_number ASC',
      [assessmentType]
    )

    let currentQuestionIndex = 0
    if (session.current_question_id) {
      currentQuestionIndex = questions.findIndex((q: any) => q.id === session.current_question_id)
      if (currentQuestionIndex === -1) currentQuestionIndex = 0
    }

    return NextResponse.json({
      success: true,
      hasSession: true,
      sessionId: session.session_id,
      currentQuestionIndex: currentQuestionIndex,
      totalQuestions: session.total_count || questions.length
    })
  } catch (error) {
    console.error('Error resuming session:', error)
    return NextResponse.json({ message: 'Gagal memulihkan sesi assessment' }, { status: 500 })
  }
}
