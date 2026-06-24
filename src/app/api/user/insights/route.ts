import { NextResponse } from 'next/server'
import { getSessionUser } from '@/lib/auth'
import { dbQuery } from '@/lib/db'

export async function GET() {
  try {
    const user = await getSessionUser()
    if (!user) {
      return NextResponse.json({ message: 'Harus login dulu ya' }, { status: 401 })
    }

    // 1. Ambil semua assessment results dari V2 tables (selesai)
    const assessmentResults = await dbQuery(
      `SELECT 
        r.id, r.session_id, r.dominant_result, r.confidence_score, r.data_quality_score, 
        r.summary_text, r.analysis_json, r.created_at,
        s.category_id,
        COALESCE(c.name, s.category_id) as category_name
       FROM assessment_results r
       JOIN assessment_sessions s ON r.session_id = s.id
       LEFT JOIN assessment_categories c ON s.category_id = c.id
       WHERE s.user_id = ? AND s.status = 'selesai'
       ORDER BY r.created_at DESC`,
      [user.id]
    )

    // 2. Ambil scores per assessment result
    const assessmentScores = await dbQuery(
      `SELECT sc.session_id, sc.category, sc.score
       FROM assessment_scores sc
       JOIN assessment_sessions s ON sc.session_id = s.id
       WHERE s.user_id = ?`,
      [user.id]
    )

    // Group scores by session_id
    const scoresMap: Record<string, Record<string, number>> = {}
    for (const sc of assessmentScores as any[]) {
      if (!scoresMap[sc.session_id]) scoresMap[sc.session_id] = {}
      scoresMap[sc.session_id][sc.category] = sc.score
    }

    // Buat array hasil assessment yang lengkap
    const formattedResults = (assessmentResults as any[]).map((r) => {
      let parsedJson: any = {}
      try {
        parsedJson = typeof r.analysis_json === 'string' ? JSON.parse(r.analysis_json) : r.analysis_json
      } catch {}

      // Prioritas: pakai scores dari assessment_scores, fallback ke analysis_json
      const scores = scoresMap[r.session_id] || parsedJson.scores || {}

      return {
        id: r.id,
        sessionId: r.session_id,
        categoryId: r.category_id,
        title: r.category_name,
        dominant: r.dominant_result,
        scores,
        confidenceScore: r.confidence_score,
        dataQuality: r.data_quality_score,
        summary: r.summary_text,
        completedAt: r.created_at
      }
    })

    // 3. Hitung statistik general
    const totalCompleted = formattedResults.length

    // Total assessment categories dari DB
    const totalCategoriesRes = await dbQuery('SELECT COUNT(*) as cnt FROM assessment_categories')
    const totalCategories = (totalCategoriesRes as any[])[0]?.cnt || 19

    // 4. Ambil mood data 30 hari terakhir
    const moodData = await dbQuery(
      `SELECT mood, energy, stress, DATE_FORMAT(date, '%Y-%m-%d') as date
       FROM mood_entries
       WHERE user_id = ?
       ORDER BY date ASC
       LIMIT 30`,
      [user.id]
    )

    // Total hari tracking mood
    const moodTrackingDays = (moodData as any[]).length

    // 5. Jurnal count
    const journalCountRes = await dbQuery(
      `SELECT COUNT(*) as count FROM journal_entries je
       JOIN journals j ON je.journal_id = j.id
       WHERE j.user_id = ?`,
      [user.id]
    )
    const totalJournals = (journalCountRes as any[])[0]?.count || 0

    // 6. Bangun radar chart data dari rata-rata scores semua assessment
    // Mapping dimensi penting ke dimensi radar
    const dimensionMap: Record<string, string> = {
      // Love Language → Empati proxy
      wordsOfAffirmation: 'Empati',
      qualityTime: 'Keterbukaan',
      actsOfService: 'Kepercayaan',
      physicalTouch: 'Kepercayaan',
      receivingGifts: 'Empati',
      // Attachment style → Komunikasi
      secure: 'Komunikasi',
      anxious: 'Boundary',
      avoidant: 'Boundary',
      disorganized: 'Konflik',
      // Communication style
      assertive: 'Komunikasi',
      passive: 'Konflik',
      aggressive: 'Konflik',
      passiveAggressive: 'Konflik',
      // Generic
      communication: 'Komunikasi',
      empathy: 'Empati',
      boundary: 'Boundary',
      conflict: 'Konflik',
      trust: 'Kepercayaan',
      openness: 'Keterbukaan',
    }

    const radarAccumulator: Record<string, { total: number; count: number }> = {
      Komunikasi: { total: 0, count: 0 },
      Empati: { total: 0, count: 0 },
      Boundary: { total: 0, count: 0 },
      Konflik: { total: 0, count: 0 },
      Kepercayaan: { total: 0, count: 0 },
      Keterbukaan: { total: 0, count: 0 },
    }

    // Mapping kategori assessment langsung ke radar dimension
    const categoryToRadar: Record<string, string> = {
      'love-language': 'Empati',
      'attachment-style': 'Boundary',
      'communication-style': 'Komunikasi',
      'conflict-response': 'Konflik',
      'trust': 'Kepercayaan',
      'trust-style': 'Kepercayaan',
      'boundaries': 'Boundary',
      'self-awareness': 'Keterbukaan',
      'emotion-regulation': 'Empati',
      'validation-needs': 'Kepercayaan',
      'stress-reaction': 'Konflik',
      'relationship-patterns': 'Keterbukaan',
      'emotional-needs': 'Empati',
      'intimacy': 'Keterbukaan',
      'relationship-readiness': 'Komunikasi',
    }

    for (const result of formattedResults) {
      const scores = result.scores as Record<string, number>
      for (const [dim, score] of Object.entries(scores)) {
        const cleanDim = dim.toLowerCase().replace(/[-_\s]/g, '')
        // Try to map dimension key to a radar dimension
        let radarDim: string | null = null

        // Try direct match first (case-insensitive)
        const dimLower = dim.toLowerCase()
        if (dimLower.includes('communication') || dimLower.includes('assertive')) radarDim = 'Komunikasi'
        else if (dimLower.includes('empathy') || dimLower.includes('emotion') || dimLower.includes('words')) radarDim = 'Empati'
        else if (dimLower.includes('boundary') || dimLower.includes('avoidant') || dimLower.includes('anxious')) radarDim = 'Boundary'
        else if (dimLower.includes('conflict') || dimLower.includes('passive') || dimLower.includes('aggressive')) radarDim = 'Konflik'
        else if (dimLower.includes('trust') || dimLower.includes('secure') || dimLower.includes('validation')) radarDim = 'Kepercayaan'
        else if (dimLower.includes('open') || dimLower.includes('self') || dimLower.includes('aware') || dimLower.includes('intimacy')) radarDim = 'Keterbukaan'
        else {
          // Fallback: map by category
          radarDim = categoryToRadar[result.categoryId] || null
        }

        if (radarDim && radarAccumulator[radarDim] !== undefined) {
          radarAccumulator[radarDim].total += Number(score)
          radarAccumulator[radarDim].count += 1
        }
      }
    }

    // If no real data, use defaults
    const radarData = Object.entries(radarAccumulator).map(([subject, { total, count }]) => ({
      subject,
      A: count > 0 ? Math.round(total / count) : 0
    }))

    // If all zeros, return empty indicator
    const hasRealData = radarData.some(d => d.A > 0)

    // 7. Hitung dominant score (untuk topline stat)
    let topScore = 0
    if (formattedResults.length > 0) {
      const allScores: number[] = formattedResults.flatMap(r =>
        Object.values(r.scores as Record<string, number>).map(Number)
      )
      topScore = allScores.length > 0 ? Math.round(allScores.reduce((a, b) => a + b, 0) / allScores.length) : 0
    }

    // 8. Mood trend (last 7 entries for the chart)
    const moodTrend = (moodData as any[]).slice(-7).map((m: any) => ({
      date: m.date?.slice(5) || '',
      energy: m.energy || 0,
      stress: m.stress || 0,
      mood: m.mood || ''
    }))

    return NextResponse.json({
      success: true,
      stats: {
        assessmentsCompleted: totalCompleted,
        totalAssessments: totalCategories,
        avgScore: topScore,
        moodTrackingDays,
        totalJournals
      },
      assessmentResults: formattedResults,
      moodTrend,
      radarData,
      hasRealData
    })

  } catch (error: any) {
    console.error('Error fetching insights data:', error)
    return NextResponse.json({ message: 'Gagal memuat data insight' }, { status: 500 })
  }
}
