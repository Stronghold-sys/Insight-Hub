import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import { dbQuery } from '@/lib/db';
import crypto from 'crypto';

export async function GET(request: Request) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ message: 'Harus login dulu ya' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (id) {
      // Ambil assessment beserta pertanyaannya
      const assessments = await dbQuery<any>(
        'SELECT * FROM assessments WHERE id = ? AND is_active = 1 LIMIT 1',
        [id]
      );

      if (assessments.length === 0) {
        return NextResponse.json({ message: 'Assessment tidak ditemukan' }, { status: 404 });
      }

      const assessment = assessments[0];

      // Ambil pertanyaan untuk assessment ini
      const questions = await dbQuery<any>(
        'SELECT id, question_text FROM questions WHERE assessment_id = ? ORDER BY order_number ASC',
        [id]
      );

      // Ambil opsi jawaban untuk setiap pertanyaan
      const questionsWithOptions = await Promise.all(
        questions.map(async (q: any) => {
          const options = await dbQuery(
            'SELECT id, option_text, dimension, weight FROM question_options WHERE question_id = ?',
            [q.id]
          );
          return {
            ...q,
            options,
          };
        })
      );

      return NextResponse.json({
        success: true,
        assessment: {
          ...assessment,
          questions: questionsWithOptions,
        },
      });
    }

    // Jika tidak ada ID, ambil semua assessment dan status penyelesaiannya untuk user saat ini
    const allAssessments = await dbQuery<any>('SELECT * FROM assessments WHERE is_active = 1');
    const results = await dbQuery<any>('SELECT assessment_id, dominant_category, completed_at FROM analysis_results WHERE user_id = ?', [user.id]);

    const completedMap = new Map(results.map((r: any) => [r.assessment_id, r]));

    const assessmentsWithStatus = allAssessments.map((a: any) => {
      const completion = completedMap.get(a.id);
      return {
        ...a,
        completed: !!completion,
        dominant: completion ? completion.dominant_category : null,
        completedAt: completion ? completion.completed_at : null,
      };
    });

    return NextResponse.json({ success: true, assessments: assessmentsWithStatus });

  } catch (error) {
    console.error('Error fetching assessments:', error);
    return NextResponse.json({ message: 'Gagal memproses request' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ message: 'Harus login dulu ya' }, { status: 401 });
    }

    const { assessmentId, answers } = await request.json(); // answers is an array of { questionId, optionId }

    if (!assessmentId || !answers || !Array.isArray(answers) || answers.length === 0) {
      return NextResponse.json({ message: 'Jawaban kamu kosong, diisi dulu ya!' }, { status: 400 });
    }

    // Ambil total pertanyaan dari assessment ini
    const totalQuestionsRes = await dbQuery(
      'SELECT COUNT(*) as count FROM questions WHERE assessment_id = ?',
      [assessmentId]
    );
    const totalCount = totalQuestionsRes[0].count;
    const answeredCount = answers.length;

    // Hapus jawaban lama user untuk assessment ini
    await dbQuery('DELETE FROM answers WHERE user_id = ? AND assessment_id = ?', [user.id, assessmentId]);

    // Insert jawaban baru ke DB
    for (const ans of answers) {
      const answerId = crypto.randomUUID();
      await dbQuery(
        'INSERT INTO answers (id, user_id, assessment_id, question_id, option_id) VALUES (?, ?, ?, ?, ?)',
        [answerId, user.id, assessmentId, ans.questionId, ans.optionId]
      );
    }

    // --- Scoring Engine ---
    // Hitung bobot per dimensi berdasarkan jawaban yang dimasukkan
    const optionIds = answers.map(a => a.optionId);
    const placeholders = optionIds.map(() => '?').join(',');

    const dimensionScores = await dbQuery<any>(
      `SELECT dimension, SUM(weight) as total_score
       FROM question_options
       WHERE id IN (${placeholders})
       GROUP BY dimension`,
      optionIds
    );

    // Bikin format score map
    const scores: Record<string, number> = {};
    let dominantDimension = '';
    let maxScore = -1;

    dimensionScores.forEach((d: any) => {
      scores[d.dimension] = parseInt(d.total_score, 10);
      if (parseInt(d.total_score, 10) > maxScore) {
        maxScore = parseInt(d.total_score, 10);
        dominantDimension = d.dimension;
      }
    });

    // Kalkulasi Confidence Score & Data Quality Score
    const confidenceScore = Math.min(100, Math.round((answeredCount / totalCount) * 95 + 5));
    const dataQuality = answeredCount === totalCount ? 100 : Math.round((answeredCount / totalCount) * 100);

    // Format nama dominant agar user-friendly (Gen-Z style)
    let dominantLabel = dominantDimension;
    if (assessmentId === 'love-language') {
      const mapping: Record<string, string> = {
        wordsOfAffirmation: 'Words of Affirmation',
        qualityTime: 'Quality Time',
        actsOfService: 'Acts of Service',
        physicalTouch: 'Physical Touch',
        receivingGifts: 'Receiving Gifts'
      };
      dominantLabel = mapping[dominantDimension] || dominantDimension;
    } else if (assessmentId === 'attachment-style') {
      const mapping: Record<string, string> = {
        secure: 'Secure (Aman & Waras)',
        anxious: 'Anxious (Butuh Validasi Terus)',
        avoidant: 'Avoidant (Suka Menjauh Tiba-tiba)',
        disorganized: 'Fearful-Avoidant (Bingung Antara Pengen Deket tapi Takut)'
      };
      dominantLabel = mapping[dominantDimension] || dominantDimension;
    }

    // Hapus hasil analisis lama jika ada
    await dbQuery('DELETE FROM analysis_results WHERE user_id = ? AND assessment_id = ?', [user.id, assessmentId]);

    const resultId = crypto.randomUUID();
    // Simpan hasil ke database
    await dbQuery(
      `INSERT INTO analysis_results (id, user_id, assessment_id, dominant_category, score_summary, confidence_score, data_quality)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        resultId,
        user.id,
        assessmentId,
        dominantLabel,
        JSON.stringify(scores),
        confidenceScore,
        dataQuality
      ]
    );

    // Catat log audit hasil tes
    await dbQuery(
      'INSERT INTO audit_logs (user_id, action, details) VALUES (?, ?, ?)',
      [user.id, 'assessment_completed', `Menyelesaikan assessment: ${assessmentId}. Hasil: ${dominantLabel}`]
    );

    // Catat user activity
    await dbQuery(
      'INSERT INTO user_activities (user_id, activity_type, description) VALUES (?, ?, ?)',
      [user.id, 'assessment_taken', `Mengambil test ${assessmentId}`]
    );

    return NextResponse.json({
      success: true,
      result: {
        id: resultId,
        assessmentId,
        dominant: dominantLabel,
        scores,
        confidenceScore,
        dataQuality,
        completedAt: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Error scoring assessment:', error);
    return NextResponse.json({ message: 'Gagal menghitung hasil assessment' }, { status: 500 });
  }
}
