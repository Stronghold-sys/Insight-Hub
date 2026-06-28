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
    const sessionId = searchParams.get('sessionId')
    const questionIndexStr = searchParams.get('questionIndex')

    if (!sessionId || questionIndexStr === null) {
      return NextResponse.json({ message: 'Session ID dan Question Index wajib diisi' }, { status: 400 })
    }

    const questionIndex = parseInt(questionIndexStr, 10)

    // Check if session exists and is active
    const sessions = await dbQuery<any>(
      `SELECT * FROM assessment_sessions 
       WHERE id = ? AND user_id = ? AND status IN ('sedang berjalan', 'terhenti sementara', 'gagal sinkron') LIMIT 1`,
      [sessionId, user.id]
    )

    if (sessions.length === 0) {
      return NextResponse.json({ message: 'Sesi assessment tidak aktif atau tidak ditemukan' }, { status: 404 })
    }

    const session = sessions[0]

    // ============================================================
    // RANDOM ENGINE: Ambil question_id berdasarkan display_order
    // dari tabel assessment_attempt_questions (urutan acak)
    // ============================================================
    let question: any = null

    const attemptRows = await dbQuery<any>(
      'SELECT question_id FROM assessment_attempt_questions WHERE session_id = ? AND display_order = ? LIMIT 1',
      [sessionId, questionIndex]
    )

    if (attemptRows.length > 0) {
      // Gunakan urutan acak yang sudah tersimpan
      const targetQuestionId = attemptRows[0].question_id
      const qRows = await dbQuery<any>(
        'SELECT * FROM assessment_questions WHERE id = ? AND status = \'active\' LIMIT 1',
        [targetQuestionId]
      )
      if (qRows.length > 0) question = qRows[0]
    }

    // ============================================================
    // FALLBACK: Jika belum ada data di attempt_questions (session lama),
    // gunakan order_number lama agar backward compatible
    // ============================================================
    if (!question) {
      const qRows = await dbQuery<any>(
        'SELECT * FROM assessment_questions WHERE category_id = ? AND order_number = ? AND status = \'active\' LIMIT 1',
        [session.category_id, questionIndex + 1]
      )
      if (qRows.length > 0) question = qRows[0]
    }

    if (!question) {
      return NextResponse.json({ message: 'Pertanyaan tidak ditemukan' }, { status: 404 })
    }

    // Fetch options
    const options = await dbQuery<any>(
      'SELECT id, option_text, option_value, score_value, order_number FROM assessment_question_options WHERE question_id = ? ORDER BY order_number ASC',
      [question.id]
    )

    // Filter virtual options
    const regularOptions = options.filter((opt: any) => opt.option_text !== '__scale__' && opt.option_text !== '__text__')

    // Check previously saved answer
    const answers = await dbQuery<any>(
      'SELECT selected_option_id, answer_text, answer_json FROM assessment_answers WHERE session_id = ? AND question_id = ? LIMIT 1',
      [sessionId, question.id]
    )

    const savedAnswer = answers.length > 0 ? {
      optionId: answers[0].selected_option_id,
      textAnswer: answers[0].answer_text,
      answerJson: answers[0].answer_json
    } : null

    // Evaluate skip condition based on dependency
    let isSkipped = false
    if (question.depends_on_question_id) {
      const parentAnswers = await dbQuery<any>(
        'SELECT selected_option_id, answer_text FROM assessment_answers WHERE session_id = ? AND question_id = ? LIMIT 1',
        [sessionId, question.depends_on_question_id]
      )
      if (parentAnswers.length === 0) {
        isSkipped = true
      } else {
        const parentAns = parentAnswers[0]
        const parentOpts = await dbQuery<any>(
          'SELECT option_value FROM assessment_question_options WHERE id = ? LIMIT 1',
          [parentAns.selected_option_id]
        )
        const parentVal = parentOpts.length > 0 ? parentOpts[0].option_value : parentAns.answer_text
        if (parentVal !== question.depends_on_option_value) {
          isSkipped = true
        }
      }
    }

    return NextResponse.json({
      success: true,
      question: {
        id: question.id,
        question_text: question.question_text,
        question_type: question.question_type,
        category: question.category_id,
        order_number: question.order_number,
        options: regularOptions,
        savedAnswer,
        isSkipped
      }
    })
  } catch (error) {
    console.error('Error fetching question:', error)
    return NextResponse.json({ message: 'Gagal memuat pertanyaan' }, { status: 500 })
  }
}
