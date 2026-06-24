import { NextResponse } from 'next/server'
import { getSessionUser } from '@/lib/auth'
import { dbQuery } from '@/lib/db'

export async function POST(request: Request) {
  try {
    const user = await getSessionUser()
    if (!user) {
      return NextResponse.json({ message: 'Harus login dulu ya' }, { status: 401 })
    }

    const { sessionId, direction = 'next' } = await request.json()

    if (!sessionId) {
      return NextResponse.json({ message: 'Session ID wajib diisi' }, { status: 400 })
    }

    // Verify session
    const sessions = await dbQuery(
      `SELECT s.id as session_id, s.category_id, p.current_question_id 
       FROM assessment_sessions s
       JOIN assessment_progress p ON s.id = p.session_id
       WHERE s.id = ? AND s.user_id = ? AND s.status IN ('sedang berjalan', 'terhenti sementara', 'gagal sinkron') LIMIT 1`,
      [sessionId, user.id]
    )

    if (sessions.length === 0) {
      return NextResponse.json({ message: 'Sesi assessment tidak aktif atau tidak ditemukan' }, { status: 404 })
    }

    const session = sessions[0]

    // Fetch all active questions for this category
    const questions = await dbQuery(
      'SELECT id, depends_on_question_id, depends_on_option_value FROM assessment_questions WHERE category_id = ? AND status = "active" ORDER BY order_number ASC',
      [session.category_id]
    )

    const currentIndex = questions.findIndex((q: any) => q.id === session.current_question_id)
    if (currentIndex === -1) {
      return NextResponse.json({ message: 'Indeks pertanyaan tidak valid' }, { status: 400 })
    }

    // Helper to evaluate dependencies
    const shouldSkipQuestion = async (q: any) => {
      if (!q.depends_on_question_id) return false

      const parentAnswers = await dbQuery(
        'SELECT selected_option_id, answer_text FROM assessment_answers WHERE session_id = ? AND question_id = ? LIMIT 1',
        [sessionId, q.depends_on_question_id]
      )
      if (parentAnswers.length === 0) return true

      const ans = parentAnswers[0]
      const parentOpts = await dbQuery(
        'SELECT option_value FROM assessment_question_options WHERE id = ? LIMIT 1',
        [ans.selected_option_id]
      )
      const parentVal = parentOpts.length > 0 ? parentOpts[0].option_value : ans.answer_text
      return parentVal !== q.depends_on_option_value
    }

    let finalIndex = currentIndex
    while (true) {
      if (direction === 'next') {
        if (finalIndex < questions.length - 1) {
          finalIndex += 1
        } else {
          break
        }
      } else {
        if (finalIndex > 0) {
          finalIndex -= 1
        } else {
          break
        }
      }

      const q = questions[finalIndex]
      const skip = await shouldSkipQuestion(q)
      if (!skip) {
        break // Stop at the first question that is NOT skipped
      }

      // Check boundary conditions to avoid infinite loops
      if (direction === 'next' && finalIndex === questions.length - 1) break
      if (direction === 'prev' && finalIndex === 0) break
    }

    const newQuestion = questions[finalIndex]

    // Update progress in DB
    await dbQuery(
      'UPDATE assessment_progress SET current_question_id = ? WHERE session_id = ?',
      [newQuestion.id, sessionId]
    )

    return NextResponse.json({ success: true, currentQuestionIndex: finalIndex })
  } catch (error) {
    console.error('Error navigating index:', error)
    return NextResponse.json({ message: 'Gagal merubah indeks pertanyaan' }, { status: 500 })
  }
}
