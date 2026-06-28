import { NextResponse } from 'next/server'
import { getSessionUser } from '@/lib/auth'
import { dbQuery } from '@/lib/db'
import crypto from 'crypto'
import { getUserActivePlan, checkFeatureAccess } from '@/lib/accessControl'

// ============================================================
// Fisher-Yates Shuffle — distribusi acak yang tidak bias
// ============================================================
function fisherYatesShuffle<T>(arr: T[]): T[] {
  const shuffled = [...arr]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  return shuffled
}

export async function POST(request: Request) {
  try {
    const user = await getSessionUser()
    if (!user) {
      return NextResponse.json({ message: 'Harus login dulu ya' }, { status: 401 })
    }

    const { assessmentType } = await request.json()
    if (!assessmentType) {
      return NextResponse.json({ message: 'Assessment type harus diisi' }, { status: 400 })
    }

    // Access Control: Check active subscription plan
    const plan = await getUserActivePlan(user.id)
    if (!checkFeatureAccess(plan, 'assessment', assessmentType)) {
      return NextResponse.json({
        success: false,
        message: 'Akses ditolak! Kuis seru ini berada di luar paket aktif kamu saat ini. Upgrade paket kamu dulu yuk!'
      }, { status: 403 })
    }

    // 1. Cancel previous incomplete sessions of this category for this user
    await dbQuery(
      'UPDATE assessment_sessions SET status = \'cancelled\' WHERE user_id = ? AND category_id = ? AND status IN (\'belum mulai\', \'sedang berjalan\', \'terhenti sementara\')',
      [user.id, assessmentType]
    )

    // 2. Fetch all active questions for this category
    const questions = await dbQuery<any>(
      'SELECT id FROM assessment_questions WHERE category_id = ? AND status = \'active\' ORDER BY order_number ASC',
      [assessmentType]
    )

    if (questions.length === 0) {
      return NextResponse.json({ message: 'Belum ada pertanyaan di bank soal untuk kategori ini.' }, { status: 404 })
    }

    // 3. Generate a new session (= new Attempt)
    const sessionId = crypto.randomUUID()
    await dbQuery(
      'INSERT INTO assessment_sessions (id, user_id, category_id, status) VALUES (?, ?, ?, ?)',
      [sessionId, user.id, assessmentType, 'sedang berjalan']
    )

    // 4. Fisher-Yates Shuffle — acak urutan question IDs
    const questionIds = questions.map((q: any) => q.id)
    const shuffledIds = fisherYatesShuffle(questionIds)

    // 5. Simpan urutan acak ke assessment_attempt_questions
    //    Setiap insert: (id, session_id, question_id, display_order)
    for (let i = 0; i < shuffledIds.length; i++) {
      await dbQuery(
        'INSERT INTO assessment_attempt_questions (id, session_id, question_id, display_order) VALUES (?, ?, ?, ?)',
        [crypto.randomUUID(), sessionId, shuffledIds[i], i]
      )
    }

    // 6. Set initial progress — current_question_id = pertanyaan pertama dalam urutan acak
    const firstQuestionId = shuffledIds[0]
    const progressId = crypto.randomUUID()
    await dbQuery(
      'INSERT INTO assessment_progress (id, session_id, category_id, current_question_id, answered_count, total_count, completion_percentage, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [progressId, sessionId, assessmentType, firstQuestionId, 0, questions.length, 0, 'sedang berjalan']
    )

    // 7. Fetch category details
    const cats = await dbQuery<any>(
      'SELECT name FROM assessment_categories WHERE id = ? LIMIT 1',
      [assessmentType]
    )
    const categoryName = cats.length > 0 ? cats[0].name : assessmentType

    // 8. Fetch distinct dimensions
    const dims = await dbQuery<any>(
      `SELECT DISTINCT option_value FROM assessment_question_options 
       WHERE question_id IN (SELECT id FROM assessment_questions WHERE category_id = ?)
       AND option_value NOT IN ('scale', 'text')`,
      [assessmentType]
    )
    const dimensions = dims.map((d: any) => ({
      key: d.option_value,
      label: d.option_value.replace(/([A-Z])/g, ' $1').replace(/^./, (str: string) => str.toUpperCase())
    }))

    return NextResponse.json({
      success: true,
      sessionId,
      totalQuestions: questions.length,
      title: categoryName,
      dimensions
    })

  } catch (error: any) {
    console.error('Error starting assessment:', error)
    return NextResponse.json({ message: error.message || 'Gagal memulai assessment' }, { status: 500 })
  }
}
