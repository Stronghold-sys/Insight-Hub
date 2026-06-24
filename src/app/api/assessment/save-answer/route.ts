import { NextResponse } from 'next/server'
import { getSessionUser } from '@/lib/auth'
import { dbQuery } from '@/lib/db'
import crypto from 'crypto'

export async function POST(request: Request) {
  try {
    const user = await getSessionUser()
    if (!user) {
      return NextResponse.json({ message: 'Harus login dulu ya' }, { status: 401 })
    }

    const { sessionId, questionId, optionId, textAnswer, optionIds } = await request.json()

    if (!sessionId || !questionId) {
      return NextResponse.json({ message: 'Session ID dan Question ID wajib diisi' }, { status: 400 })
    }

    // Verify session
    const sessions = await dbQuery(
      `SELECT * FROM assessment_sessions 
       WHERE id = ? AND user_id = ? AND status IN ('sedang berjalan', 'selesai', 'terhenti sementara', 'gagal sinkron') LIMIT 1`,
      [sessionId, user.id]
    )

    if (sessions.length === 0) {
      return NextResponse.json({ message: 'Sesi assessment tidak aktif atau tidak ditemukan' }, { status: 404 })
    }

    const session = sessions[0]

    // Delete existing answers for this question in this session
    await dbQuery(
      'DELETE FROM assessment_answers WHERE session_id = ? AND question_id = ?',
      [sessionId, questionId]
    )

    // Determine target values
    let selectedOptionId = optionId || null
    let answerText = null
    let answerNumber = null
    let answerJson = null

    if (optionIds && Array.isArray(optionIds)) {
      // Pilihan ganda multi-select
      answerJson = JSON.stringify(optionIds)
    } else if (textAnswer !== undefined && textAnswer !== null) {
      // Check if it's a JSON array (like ranking)
      if (textAnswer.trim().startsWith('[') && textAnswer.trim().endsWith(']')) {
        answerJson = textAnswer
      } else {
        // Check if numeric (scale/slider)
        const parsedNum = Number(textAnswer)
        if (!isNaN(parsedNum) && textAnswer.trim() !== '') {
          answerNumber = parsedNum
          answerText = textAnswer
        } else {
          // Regular text
          answerText = textAnswer
        }
      }
    }

    // Insert answer in V2 table
    await dbQuery(
      `INSERT INTO assessment_answers (id, session_id, question_id, selected_option_id, answer_text, answer_number, answer_json, is_draft, is_synced)
       VALUES (?, ?, ?, ?, ?, ?, ?, 0, 1)`,
      [crypto.randomUUID(), sessionId, questionId, selectedOptionId, answerText, answerNumber, answerJson]
    )

    // Recalculate and update progress
    const answeredRows = await dbQuery(
      'SELECT COUNT(DISTINCT question_id) as count FROM assessment_answers WHERE session_id = ?',
      [sessionId]
    )
    const answeredCount = answeredRows[0]?.count || 0

    const totalRows = await dbQuery(
      'SELECT COUNT(*) as count FROM assessment_questions WHERE category_id = ? AND status = "active"',
      [session.category_id]
    )
    const totalCount = totalRows[0]?.count || 0

    const completionPercentage = Math.round((answeredCount / totalCount) * 100)

    await dbQuery(
      `UPDATE assessment_progress SET 
        answered_count = ?, 
        total_count = ?, 
        completion_percentage = ?, 
        current_question_id = ?,
        status = ?
       WHERE session_id = ?`,
      [answeredCount, totalCount, completionPercentage, questionId, 'sedang berjalan', sessionId]
    )

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error saving answer:', error)
    return NextResponse.json({ message: 'Gagal menyimpan jawaban' }, { status: 500 })
  }
}
