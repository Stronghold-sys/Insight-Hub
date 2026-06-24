import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import { dbQuery } from '@/lib/db';
import crypto from 'crypto';

// GET /api/roleplay/history — ambil daftar riwayat user
export async function GET() {
  try {
    const user = await getSessionUser();
    if (!user) return NextResponse.json({ success: false, error: 'Harus login dulu ya!' }, { status: 401 });

    const rows = await dbQuery<any>(
      `SELECT id, title, level, user_gender, lang_style, partner_name, turn_count, avg_score, status,
              DATE_FORMAT(created_at, '%d %b %Y, %H:%i') as created_at_formatted
       FROM roleplay_sessions
       WHERE user_id = ?
       ORDER BY created_at DESC
       LIMIT 30`,
      [user.id]
    );

    return NextResponse.json({ success: true, sessions: rows });
  } catch (err) {
    console.error('[Roleplay History GET]', err);
    return NextResponse.json({ success: false, error: 'Gagal ambil riwayat.' }, { status: 500 });
  }
}

// POST /api/roleplay/history — simpan sesi yang sudah selesai dan generate analisis
export async function POST(request: Request) {
  try {
    const user = await getSessionUser();
    if (!user) return NextResponse.json({ success: false, error: 'Harus login dulu ya!' }, { status: 401 });

    const body = await request.json().catch(() => ({}));
    const {
      title, level, userGender, langStyle,
      scenarioContext, scenarioGoal, aiPersona, partnerName,
      messages, turnCount, avgScore
    } = body;

    const id = crypto.randomUUID();

    // 1. Generate Analisis menggunakan Gemini API
    const geminiKey = process.env.GEMINI_ASSESSMENT_API_KEY || process.env.GEMINI_API_KEY || '';
    let analysisStr = '';

    if (geminiKey && (geminiKey.startsWith('AIza') || geminiKey.startsWith('AQ.')) && messages && messages.length > 0) {
      const systemPrompt = `Anda adalah konsultan hubungan dan ahli komunikasi interpersonal untuk platform 'Insight Hub'.
Tugas Anda adalah memberikan hasil analisis yang lengkap, jelas, mendalam, dan personal setelah pengguna menyelesaikan sesi simulasi percakapan.

DILARANG menggunakan emoji atau icon emoji apapun di dalam teks keluaran Anda.

INFORMASI PENGGUNA:
- Gender Pengguna (User): ${userGender || 'tidak ditentukan'}
- Nama Anda (Lawan Bicara di simulasi): ${partnerName || 'Lawan Bicara'}

KONTEKS SIMULASI:
- Judul Skenario: ${title || 'Simulasi Percakapan'}
- Konteks Situasi: ${scenarioContext || ''}
- Tujuan Latihan (Goal): ${scenarioGoal || ''}
- Persona Lawan Bicara: ${aiPersona || ''}

TRANSKRIP PERCAKAPAN:
${JSON.stringify(messages || [])}

PANDUAN GAYA BAHASA AI:
- Gunakan bahasa Indonesia sehari-hari yang santai, natural, luwes, dan akrab khas Gen Z (misalnya gunakan "kamu", "aku", "nyambung", "oke", "dibikin lebih...", "muter-muter", "defensive", "asertif").
- Hindari bahasa yang terlalu formal, kaku, akademis, atau baku (seperti "Sebagai kecerdasan buatan...", "kognitif", "afektif", dll).
- Dilarang keras menggunakan emoji atau simbol emoji apa pun.
- Jangan menghakimi, buat feedback terasa mendukung, hangat, bersahabat, dan memotivasi.

PANDUAN KHUSUS BERDASARKAN GENDER:
${
  userGender === 'pria' 
    ? `- Gunakan bahasa analisis yang relevan dengan dinamika pria.
- Perhatikan apakah user cenderung terlalu kaku, terlalu diam, terlalu defensif, atau kurang peka saat merespons.
- Jelaskan bagaimana cara ngobrol yang lebih tegas tapi tetap kalem dan dewasa.
- Karena lawan bicara adalah wanita (${partnerName}), jelaskan apakah user sudah cukup peka terhadap sinyal emosi, ngambek, atau kode halus wanita.
- Berikan saran supaya user terlihat lebih stabil, dewasa, dan tidak gampang terpancing emosi.`
    : `- Gunakan bahasa analisis yang relevan dengan dinamika wanita.
- Perhatikan apakah user cenderung terlalu overthinking, terlalu meledak-ledak, terlalu pasif, atau kurang tegas saat merespons.
- Jelaskan bagaimana cara merespons yang tetap lembut tapi jelas dan terarah.
- Karena lawan bicara adalah pria (${partnerName}), jelaskan apakah user sudah cukup jelas, tidak berputar-putar, dan tidak terlalu menguji emosi pria.
- Berikan saran supaya user terlihat lebih tenang, kuat, dan tetap enak diajak ngobrol secara matang.`
}

TUGAS DETAIL UNTUK SETIAP FIELD:
1. "summary" (Ringkasan Hasil):
   - Ringkasan umum: Jelaskan secara singkat performa komunikasi user di simulasi tadi (tenang, tegas, nyambung, atau masih perlu perbaikan).
   - Analisis emosi percakapan: Jelaskan suasana chat tadi (apakah tegang, dingin, konflik, canggung, atau mulai membaik) dan bagaimana reaksi emosional lawan bicara (${partnerName}).
2. "scores" (Skor Simulasi):
   - Berikan nilai (0-100) untuk 6 aspek berikut:
     * "kejelasan": kejelasan jawaban
     * "ketenang": ketenangan dalam merespons
     * "pemahaman": kemampuan memahami lawan bicara
     * "emosi": ketepatan emosi
     * "arah": kemampuan menjaga arah percakapan
     * "keaslian": keaslian gaya bicara
3. "advantages" (Kelebihan Kamu):
   - Tulis bagian yang sudah bagus dan asertif/empatik/jelas dari cara user menjawab chat tadi.
4. "improvements" (Yang Perlu Dibenerin):
   - Tulis bagian yang masih kurang pas (misal terlalu defensif, dingin, muter-muter, kurang tegas, terlalu panjang).
5. "nextSteps" (Saran Next Step):
   - Saran perbaikan: Berikan saran konkret dengan contoh aplikasi langsung di percakapan nyata (misal: "Kasih validasi dulu sebelum jelasin posisi kamu").
   - Rekomendasi latihan berikutnya: Arahkan simulasi/tipe konflik berikutnya yang cocok (asertif, batasan, validasi emosi, atau conflict repair).
6. "betterResponse" (Contoh Balasan yang Lebih Oke):
   - Tuliskan 1-2 contoh balasan konkret yang seharusnya bisa digunakan user dalam percakapan tadi (sesuai konteks).
7. "finalConclusion" (Kesimpulan Akhir):
   - Pesan penutup singkat yang menyemangati user dengan bahasa Gen Z yang hangat dan bersahabat.

Kembalikan output selalu dalam format JSON sesuai schema yang diminta.`;

      const responseSchema = {
        type: 'OBJECT',
        properties: {
          summary: { type: 'STRING', description: 'Ringkasan hasil simulasi dan analisis emosi percakapan' },
          scores: {
            type: 'OBJECT',
            properties: {
              kejelasan: { type: 'INTEGER', description: 'Skor kejelasan (0-100)' },
              ketenang: { type: 'INTEGER', description: 'Skor ketenangan (0-100)' },
              pemahaman: { type: 'INTEGER', description: 'Skor pemahaman (0-100)' },
              emosi: { type: 'INTEGER', description: 'Skor emosi (0-100)' },
              arah: { type: 'INTEGER', description: 'Skor arah percakapan (0-100)' },
              keaslian: { type: 'INTEGER', description: 'Skor keaslian (0-100)' }
            },
            required: ['kejelasan', 'ketenang', 'pemahaman', 'emosi', 'arah', 'keaslian']
          },
          advantages: { type: 'STRING', description: 'Kelebihan user' },
          improvements: { type: 'STRING', description: 'Yang perlu dibenerin' },
          nextSteps: { type: 'STRING', description: 'Saran next step' },
          betterResponse: { type: 'STRING', description: 'Contoh balasan chat yang lebih oke' },
          finalConclusion: { type: 'STRING', description: 'Kesimpulan akhir' }
        },
        required: ['summary', 'scores', 'advantages', 'improvements', 'nextSteps', 'betterResponse', 'finalConclusion']
      };

      const modelsToTry = [
        'gemini-flash-lite-latest',
        'gemini-3.1-flash-lite',
        'gemini-2.5-flash',
        'gemini-2.0-flash',
        'gemini-flash-latest'
      ];

      for (const model of modelsToTry) {
        try {
          console.log(`[Roleplay Analysis] Calling model ${model} for session ${id}`);
          const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${geminiKey}`,
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                contents: [
                  {
                    role: 'user',
                    parts: [{ text: 'Silakan lakukan analisis terhadap transkrip percakapan yang diberikan.' }]
                  }
                ],
                systemInstruction: {
                  parts: [{ text: systemPrompt }]
                },
                generationConfig: {
                  responseMimeType: 'application/json',
                  responseSchema
                }
              })
            }
          );

          if (response.ok) {
            const data = await response.json();
            const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
            if (text) {
              analysisStr = text;
              break;
            }
          }
        } catch (err) {
          console.warn(`[Roleplay Analysis] Model ${model} failed:`, err);
        }
      }
    }

    // 2. Simpan ke database
    await dbQuery(
      `INSERT INTO roleplay_sessions
       (id, user_id, title, level, user_gender, lang_style, scenario_context, scenario_goal, ai_persona, partner_name, messages, analysis, turn_count, avg_score, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'completed')`,
      [
        id,
        user.id,
        title || 'Simulasi Percakapan',
        level,
        userGender,
        langStyle,
        scenarioContext || '',
        scenarioGoal || '',
        aiPersona || '',
        partnerName || '',
        JSON.stringify(messages || []),
        analysisStr || null,
        turnCount || 0,
        avgScore || 0
      ]
    );

    // Catat aktivitas
    await dbQuery(
      'INSERT INTO user_activities (user_id, activity_type, description) VALUES (?, ?, ?)',
      [user.id, 'roleplay_completed', `Selesai simulasi: ${title || 'Simulasi Percakapan'} (Level ${level})`]
    ).catch(() => {});

    // Kembalikan ID dan hasil analisis agar langsung bisa ditampilkan di frontend
    let parsedAnalysis = null;
    if (analysisStr) {
      try {
        parsedAnalysis = JSON.parse(analysisStr);
      } catch {
        parsedAnalysis = null;
      }
    }

    return NextResponse.json({ success: true, id, analysis: parsedAnalysis });
  } catch (err) {
    console.error('[Roleplay History POST]', err);
    return NextResponse.json({ success: false, error: 'Gagal simpan riwayat.' }, { status: 500 });
  }
}
