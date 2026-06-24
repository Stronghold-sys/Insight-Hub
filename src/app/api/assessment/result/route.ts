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
    const assessmentType = searchParams.get('assessmentType')

    if (!sessionId && !assessmentType) {
      return NextResponse.json({ message: 'Session ID atau Assessment Type wajib diisi' }, { status: 400 })
    }

    let results
    if (sessionId) {
      // Fetch result by sessionId
      results = await dbQuery(
        `SELECT r.id, r.session_id, r.analysis_json, r.summary_text, r.confidence_score, r.data_quality_score, r.dominant_result, s.category_id as assessment_type
         FROM assessment_results r
         JOIN assessment_sessions s ON r.session_id = s.id
         WHERE r.session_id = ? AND s.user_id = ? LIMIT 1`,
        [sessionId, user.id]
      )
    } else {
      // Fetch latest completed result by assessmentType
      results = await dbQuery(
        `SELECT r.id, r.session_id, r.analysis_json, r.summary_text, r.confidence_score, r.data_quality_score, r.dominant_result, s.category_id as assessment_type
         FROM assessment_results r
         JOIN assessment_sessions s ON r.session_id = s.id
         WHERE s.category_id = ? AND s.user_id = ? AND s.status = 'selesai'
         ORDER BY r.created_at DESC LIMIT 1`,
        [assessmentType, user.id]
      )
    }

    if (results.length === 0) {
      return NextResponse.json({ message: 'Hasil assessment tidak ditemukan' }, { status: 404 })
    }

    const result = results[0]

    // Fetch details from assessment_result_details V2 table
    const details = await dbQuery(
      'SELECT type, title, content FROM assessment_result_details WHERE result_id = ?',
      [result.id]
    )

    const insights = details.filter((d: any) => d.type === 'insight').map((d: any) => ({
      title: d.title,
      description: d.content
    }))
    const saran_praktis = details.filter((d: any) => d.type === 'saran').map((d: any) => d.content)
    const rekomendasi_lanjutan = details.filter((d: any) => d.type === 'rekomendasi').map((d: any) => d.content)

    let parsedJson: any = {}
    try {
      parsedJson = typeof result.analysis_json === 'string' ? JSON.parse(result.analysis_json) : result.analysis_json
    } catch (e) {
      console.error('Failed to parse analysis_json:', e)
    }

    return NextResponse.json({
      success: true,
      result: {
        id: result.id,
        sessionId: result.session_id,
        assessmentType: result.assessment_type,
        dominant: result.dominant_result,
        scores: parsedJson.scores || {},
        confidenceScore: result.confidence_score,
        dataQuality: result.data_quality_score,
        summary: result.summary_text,
        insights,
        saran_praktis,
        rekomendasi_lanjutan
      }
    })
  } catch (error) {
    console.error('Error fetching result:', error)
    return NextResponse.json({ message: 'Gagal memuat hasil assessment' }, { status: 500 })
  }
}
