import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import { dbQuery } from '@/lib/db';
import crypto from 'crypto';
import { getUserActivePlan, checkFeatureAccess } from '@/lib/accessControl';

export async function GET() {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ message: 'Harus login dulu ya' }, { status: 401 });
    }

    // Ambil riwayat analisis chat user
    const sql = `
      SELECT s.id, s.title, DATE_FORMAT(s.created_at, '%Y-%m-%d %H:%i') as date,
             a.sentiment, a.tone, a.urgency_conflict as urgency, a.confidence_score as confidence
      FROM chat_sessions s
      JOIN chat_analysis a ON s.id = a.session_id
      WHERE s.user_id = ?::text
      ORDER BY s.created_at DESC
      LIMIT 10
    `;
    const history = await dbQuery(sql, [user.id]);
    return NextResponse.json({ success: true, history });
  } catch (error) {
    console.error('Error fetching chat history:', error);
    return NextResponse.json({ message: 'Gagal mengambil riwayat analisis' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ message: 'Harus login dulu ya' }, { status: 401 });
    }

    // Access Control: Check active subscription plan
    const plan = await getUserActivePlan(user.id);
    if (!checkFeatureAccess(plan, 'chat-analyzer')) {
      return NextResponse.json({ 
        success: false, 
        message: 'Akses ditolak! Fitur Chat Analyzer butuh minimal paket Basic nih. Upgrade dulu yuk!' 
      }, { status: 403 });
    }

    // Basic plan limit check (max 10 analysis)
    if (plan === 'basic') {
      const chatCountRes = await dbQuery<any>('SELECT COUNT(*) as count FROM chat_sessions WHERE user_id = ?::text', [user.id]);
      const totalChats = chatCountRes[0]?.count || 0;
      if (totalChats >= 10) {
        return NextResponse.json({
          success: false,
          message: 'Akses ditolak! Batas kuota analisis chat (10x) untuk paket Basic kamu sudah habis nih. Upgrade ke Premium biar bisa tanpa batas!'
        }, { status: 403 });
      }
    }

    const { chatText } = await request.json();

    // 1. Validasi Input
    if (!chatText || chatText.trim().length === 0) {
      return NextResponse.json(
        { message: 'Teks percakapan tidak boleh kosong ya!' },
        { status: 400 }
      );
    }

    const trimmedText = chatText.trim();
    if (trimmedText.length < 5) {
      return NextResponse.json(
        { message: 'Teks percakapan terlalu pendek, minimal 5 karakter ya!' },
        { status: 400 }
      );
    }

    if (trimmedText.length > 10000) {
      return NextResponse.json(
        { message: 'Teks percakapan terlalu panjang! Maksimal 10.000 karakter.' },
        { status: 400 }
      );
    }

    // 2. Validasi API Key Gemini
    const geminiKey = process.env.GEMINI_ASSESSMENT_API_KEY || process.env.GEMINI_API_KEY || '';
    if (!geminiKey || (!geminiKey.startsWith('AIza') && !geminiKey.startsWith('AQ.'))) {
      console.error('[Chat Analyzer] GEMINI API key tidak valid atau tidak diset di env!');
      return NextResponse.json(
        { message: 'Konfigurasi API key belum tersedia atau tidak valid. Harap setel GEMINI_API_KEY di file .env terlebih dahulu.' },
        { status: 500 }
      );
    }

    // 3. System Prompt & API Call
    const systemPrompt = `Anda adalah mesin analisis percakapan/konselor empatik bernama 'Insight Hub'. Tugas Anda adalah menganalisis teks percakapan yang dimasukkan pengguna secara objektif, hangat, tanpa halusinasi, dan mengembalikan output terstruktur dalam format JSON yang telah ditentukan.

ATURAN KERAS:
1. Hanya analisis teks percakapan yang diberikan secara literal. JANGAN menambah asumsi liar atau fakta yang tidak ada dalam teks.
2. JANGAN gunakan emoji sama sekali baik dalam summary, next_step, best_reply, maupun di seluruh variasi rewrite!
3. JANGAN gunakan istilah "AI", "database", atau "XAMPP" dalam respons yang dikembalikan. Gunakan istilah netral seperti "sistem", "mesin analisis", "penyimpanan lokal", atau "server lokal" jika harus merujuk pada hal teknis.
4. Jika teks percakapan terlalu minim, tidak jelas, atau berupa spam (kurang dari beberapa kata bermakna), Anda harus mendeteksinya dan mengisi confidence_score sangat rendah (di bawah 30), risk_level sebagai "low", serta mengisi kolom next_step / best_reply dengan permintaan ramah agar pengguna memasukkan teks percakapan yang lebih lengkap (misal: "Maaf, data obrolan terlalu minim untuk dianalisis secara akurat. Silakan masukkan percakapan utuh ya.").
5. Jika percakapan menunjukkan konflik, fokuskan saran (next_step) dan balasan (best_reply/rewrite_variants) pada de-eskalasi konflik dan validasi emosi.
6. Berikan balasan rewrite yang praktis, relevan, dan aman.
7. Untuk seluruh nilai di dalam objek 'indicators' (ketegangan, pasif_agresif, defensif, menghindar, butuh_validasi), Anda harus memberikan angka bulat dari 0 sampai 100 (persentase) secara realistis berdasarkan analisis Anda, bukan angka 0-10.
`;

    const modelsToTry = ['gemini-flash-lite-latest', 'gemini-3.1-flash-lite', 'gemini-2.5-flash'];
    let geminiData: any = null;
    let isSuccess = false;
    let lastError = '';

    for (const model of modelsToTry) {
      try {
        console.log(`[Chat Analyzer] Attempting analysis using model: ${model}`);
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${geminiKey}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            contents: [
              {
                role: 'user',
                parts: [{ text: `Teks Percakapan:\n"${trimmedText}"` }]
              }
            ],
            systemInstruction: {
              parts: [{ text: systemPrompt }]
            },
            generationConfig: {
              responseMimeType: 'application/json',
              responseSchema: {
                type: 'OBJECT',
                properties: {
                  risk_level: { type: 'STRING', enum: ['low', 'medium', 'high'] },
                  tone: { type: 'STRING' },
                  confidence_score: { type: 'INTEGER' },
                  summary: { type: 'STRING' },
                  indicators: {
                    type: 'OBJECT',
                    properties: {
                      ketegangan: { type: 'INTEGER' },
                      pasif_agresif: { type: 'INTEGER' },
                      defensif: { type: 'INTEGER' },
                      menghindar: { type: 'INTEGER' },
                      butuh_validasi: { type: 'INTEGER' }
                    },
                    required: ['ketegangan', 'pasif_agresif', 'defensif', 'menghindar', 'butuh_validasi']
                  },
                  next_step: { type: 'STRING' },
                  best_reply: { type: 'STRING' },
                  rewrite_variants: {
                    type: 'OBJECT',
                    properties: {
                      lebih_lembut: { type: 'STRING' },
                      lebih_tegas: { type: 'STRING' },
                      lebih_singkat: { type: 'STRING' },
                      lebih_hangat: { type: 'STRING' },
                      lebih_dewasa: { type: 'STRING' },
                      lebih_netral: { type: 'STRING' },
                      lebih_percaya_diri: { type: 'STRING' }
                    },
                    required: ['lebih_lembut', 'lebih_tegas', 'lebih_singkat', 'lebih_hangat', 'lebih_dewasa', 'lebih_netral', 'lebih_percaya_diri']
                  }
                },
                required: ['risk_level', 'tone', 'confidence_score', 'summary', 'indicators', 'next_step', 'best_reply', 'rewrite_variants']
              },
              maxOutputTokens: 4096,
              temperature: 0.2
            }
          })
        });

        if (response.ok) {
          const json = await response.json();
          const textResult = json.candidates?.[0]?.content?.parts?.[0]?.text;
          if (textResult) {
            geminiData = JSON.parse(textResult);
            isSuccess = true;
            console.log(`[Chat Analyzer] Successfully analyzed using model: ${model}`);
            break;
          }
        } else {
          const errText = await response.text();
          lastError = errText;
          console.warn(`[Gemini API] Failed call for ${model}:`, errText);
        }
      } catch (e: any) {
        lastError = e.message;
        console.error(`[Gemini API] Error calling model ${model}:`, e);
      }
    }

    // 4. Fallback Rule-Based NLP jika Gemini gagal
    if (!isSuccess || !geminiData) {
      console.warn('[Chat Analyzer] Using local fallback NLP engine.');
      const textLower = trimmedText.toLowerCase();
      let sentiment = 'neutral';
      let tone = 'Santai';
      let defensiveness = 0;
      let passiveAggression = 0;
      let avoidance = 0;
      let needValidation = 0;
      let urgency = 'low';
      let score = 85;

      const passiveAggressiveKeywords = ['terserah', 'ywdh', 'yaudah', 'oke aja', 'gpp', 'gapapa kok', 'terserah kamu', 'terserah lah'];
      const defensiveKeywords = ['bukan salah', 'kan kamu', 'kok salahin', 'selalu aja', 'nuntut', 'padahal kan', 'siapa bilang'];
      const avoidanceKeywords = ['malas bahas', 'nanti aja', 'skip', 'capek ngomong', 'ga usah dibahas', 'up dulu', 'bodo amat'];
      const validationKeywords = ['kamu sayang', 'masih cinta', 'marah ya', 'peduli ga sih', 'beneran', 'janji ya', 'yakin'];

      passiveAggressiveKeywords.forEach(k => { if (textLower.includes(k)) passiveAggression += 25; });
      defensiveKeywords.forEach(k => { if (textLower.includes(k)) defensiveness += 25; });
      avoidanceKeywords.forEach(k => { if (textLower.includes(k)) avoidance += 25; });
      validationKeywords.forEach(k => { if (textLower.includes(k)) needValidation += 25; });

      if (passiveAggression > 0 && defensiveness > 0) {
        sentiment = 'negative';
        tone = 'Tegang & Defensif';
        urgency = 'high';
      } else if (passiveAggression > 0) {
        sentiment = 'negative';
        tone = 'Pasif-Agresif';
        urgency = 'medium';
      } else if (defensiveness > 0) {
        sentiment = 'negative';
        tone = 'Defensif / Menyerang';
        urgency = 'high';
      } else if (avoidance > 0) {
        sentiment = 'neutral';
        tone = 'Menghindar';
        urgency = 'medium';
      } else if (needValidation > 0) {
        sentiment = 'positive';
        tone = 'Butuh Validasi';
        urgency = 'medium';
      }

      geminiData = {
        risk_level: urgency,
        tone: tone,
        confidence_score: score,
        summary: trimmedText.length > 50 ? trimmedText.substring(0, 47) + '...' : trimmedText,
        indicators: {
          ketegangan: Math.min(100, passiveAggression + defensiveness + 15),
          pasif_agresif: Math.min(100, passiveAggression),
          defensif: Math.min(100, defensiveness),
          menghindar: Math.min(100, avoidance),
          butuh_validasi: Math.min(100, needValidation)
        },
        next_step: 'Biar obrolan nggak makin dingin, coba tanggapi dengan asertif tanpa menyudutkan dia.',
        best_reply: 'Gue paham maksud kamu, dan gue juga pengen kita cari jalan tengah bareng-bareng.',
        rewrite_variants: {
          lebih_lembut: 'Ada hal yang bikin kamu kurang nyaman ya? Sini omongin aja, gue dengerin kok.',
          lebih_tegas: 'Gue tahu kamu lagi kesel. Tolong bilang langsung aja apa masalahnya biar bisa kita selesaikan.',
          lebih_singkat: 'Oke, mari kita cari jalan tengahnya.',
          lebih_hangat: 'Hei, jangan dipendam sendiri ya. Aku di sini buat kamu kalau mau cerita.',
          lebih_dewasa: 'Penting buat kita berdua untuk saling memahami sudut pandang masing-masing.',
          lebih_netral: 'Mari kita tinjau kembali poin-poin yang sudah kita bicarakan.',
          lebih_percaya_diri: 'Gue yakin kita bisa beresin ini dengan cara yang paling sehat untuk kita berdua.'
        }
      };
    }

    // 5. Map Gemini data to database fields and camelCase responses
    const risk = geminiData.risk_level === 'high' ? 'high' : geminiData.risk_level === 'medium' ? 'medium' : 'low';
    const sentiment = risk === 'high' ? 'negative' : risk === 'medium' ? 'neutral' : 'positive';
    const intensity = Math.max(1, Math.min(10, Math.round((geminiData.indicators.ketegangan || 15) / 10)));

    const camelRewrites = {
      lebihLembut: geminiData.rewrite_variants.lebih_lembut,
      lebihTegas: geminiData.rewrite_variants.lebih_tegas,
      lebihSingkat: geminiData.rewrite_variants.lebih_singkat,
      lebihHangat: geminiData.rewrite_variants.lebih_hangat,
      lebihDewasa: geminiData.rewrite_variants.lebih_dewasa,
      lebihNetral: geminiData.rewrite_variants.lebih_netral,
      lebihPercayaDiri: geminiData.rewrite_variants.lebih_percaya_diri
    };

    const rewrittenReply = JSON.stringify(camelRewrites);

    // --- Simpan ke Database ---
    const sessionId = crypto.randomUUID();
    const title = trimmedText.length > 30 ? trimmedText.substring(0, 27) + '...' : trimmedText;

    // 1. Insert chat session
    await dbQuery('INSERT INTO chat_sessions (id, user_id, title) VALUES (?, ?, ?)', [sessionId, user.id, title]);

    // 2. Insert chat message
    const msgId = crypto.randomUUID();
    await dbQuery('INSERT INTO chat_messages (id, session_id, sender, message_text) VALUES (?, ?, ?, ?)', [
      msgId,
      sessionId,
      'Partner / Chat Paste',
      trimmedText
    ]);

    // 3. Insert chat analysis
    const analysisId = crypto.randomUUID();
    await dbQuery(
      `INSERT INTO chat_analysis (
        id, session_id, sentiment, tone, intensity, 
        passive_aggression, defensiveness, avoidance, need_validation, 
        urgency_conflict, suggested_reply, rewritten_reply, confidence_score
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        analysisId,
        sessionId,
        sentiment,
        geminiData.tone,
        intensity,
        geminiData.indicators.pasif_agresif > 40 ? 1 : 0,
        geminiData.indicators.defensif > 40 ? 1 : 0,
        geminiData.indicators.menghindar > 40 ? 1 : 0,
        geminiData.indicators.butuh_validasi > 40 ? 1 : 0,
        risk,
        geminiData.next_step,
        rewrittenReply,
        geminiData.confidence_score
      ]
    );

    // Catat aktivitas user
    await dbQuery(
      'INSERT INTO user_activities (user_id, activity_type, description) VALUES (?, ?, ?)',
      [user.id, 'chat_analyzed', `Menganalisis chat dengan tone: ${geminiData.tone}`]
    );

    // Kirim notifikasi hasil analisis chat
    await dbQuery(
      'INSERT INTO notifications (id, user_id, title, message, is_read, priority) VALUES (?, ?, ?, ?, false, ?)',
      [
        crypto.randomUUID(),
        user.id,
        'Analisis Chat Selesai',
        `Sistem telah selesai menganalisis percakapanmu. Hasil analisis mendeteksi tone: "${geminiData.tone}" dengan tingkat urgensi konflik: "${risk}".`,
        'low'
      ]
    );

    return NextResponse.json({
      success: true,
      analysis: {
        id: sessionId,
        sentiment,
        tone: geminiData.tone,
        intensity,
        tension: geminiData.indicators.ketegangan ?? 15,
        passiveAggression: geminiData.indicators.pasif_agresif ?? 10,
        defensiveness: geminiData.indicators.defensif ?? 15,
        avoidance: geminiData.indicators.menghindar ?? 20,
        needValidation: geminiData.indicators.butuh_validasi ?? 30,
        urgency: risk,
        suggestedReply: geminiData.next_step,
        bestReply: geminiData.best_reply,
        rewrittenReply,
        confidence: geminiData.confidence_score
      }
    });

  } catch (error) {
    console.error('Error during chat analysis API:', error);
    return NextResponse.json(
      { message: 'Gagal menganalisis obrolan' },
      { status: 500 }
    );
  }
}
