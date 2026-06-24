import { NextResponse } from 'next/server'
import { getSessionUser } from '@/lib/auth'
import { dbQuery } from '@/lib/db'

export async function GET(request: Request) {
  try {
    const user = await getSessionUser()
    if (!user) {
      return NextResponse.json({ message: 'Harus login dulu ya' }, { status: 401 })
    }

    // Fetch all categories from MySQL
    let categories = await dbQuery(
      'SELECT id, name as title, description, duration, icon, color FROM assessment_categories'
    )

    // Fallback in case categories table is empty
    if (categories.length === 0) {
      categories = []
    }

    // Ambil history assessment_results untuk user ini (join dengan sessions untuk tahu category_id)
    const results = await dbQuery(
      `SELECT r.session_id, s.category_id as assessment_type, r.dominant_result as dominant_category, r.created_at 
       FROM assessment_results r
       JOIN assessment_sessions s ON r.session_id = s.id
       WHERE s.user_id = ?`,
      [user.id]
    )

    // Ambil sessions yang masih active / sedang berjalan
    const activeSessions = await dbQuery(
      `SELECT s.id, s.category_id as assessment_type, p.answered_count, p.total_count, p.completion_percentage
       FROM assessment_sessions s
       JOIN assessment_progress p ON s.id = p.session_id
       WHERE s.user_id = ? AND s.status IN ('sedang berjalan', 'terhenti sementara', 'gagal sinkron')`,
      [user.id]
    )

    const completedMap = new Map(results.map((r: any) => [r.assessment_type, r]))
    const activeMap = new Map(activeSessions.map((s: any) => [s.assessment_type, s]))

    const list = categories.map((a: any) => {
      const completion = completedMap.get(a.id)
      const progressSession = activeMap.get(a.id)

      return {
        ...a,
        completed: !!completion,
        dominant: completion ? completion.dominant_category : null,
        completedAt: completion ? completion.created_at : null,
        hasProgress: !!progressSession,
        progressSessionId: progressSession ? progressSession.id : null,
        progressPercent: progressSession ? progressSession.completion_percentage : 0
      }
    })

    return NextResponse.json({ success: true, assessments: list })
  } catch (error) {
    console.error('Error in assessment list API:', error)
    return NextResponse.json({ message: 'Gagal memuat assessment list' }, { status: 500 })
  }
}
