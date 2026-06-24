import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    // 1. Cek Autentikasi
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ success: false, error: 'Harus login dulu ya!' }, { status: 401 });
    }

    // 2. Parse payload
    const body = await request.json().catch(() => ({}));
    const {
      scenarioTitle,
      scenarioDescription,
      scenarioContext,
      scenarioGoal,
      aiPersona,
      partnerName,
      difficultyLevel,
      userGender,
      userName,
      langStyle,
      messages,
      currentTurn,
      maxTurns
    } = body;

    if (!difficultyLevel || !Array.isArray(messages)) {
      return NextResponse.json({ success: false, error: 'Input data nggak lengkap nih.' }, { status: 400 });
    }

    // 3. Validasi Gemini API Key
    const geminiKey = process.env.GEMINI_ASSESSMENT_API_KEY || process.env.GEMINI_API_KEY || '';
    if (!geminiKey || (!geminiKey.startsWith('AIza') && !geminiKey.startsWith('AQ.'))) {
      console.error('[Roleplay Chat API] GEMINI API key tidak valid atau tidak diset di env!');
      return NextResponse.json(
        { success: false, error: 'Konfigurasi API key belum tersedia atau tidak valid.' },
        { status: 500 }
      );
    }

    // 4. Bangun System Prompt
    const systemPrompt = `Anda adalah partner/lawan bicara bernama ${partnerName || 'Lawan Bicara'} untuk fitur Simulasi Percakapan di platform 'Insight Hub'.
Tugas Anda adalah memfasilitasi latihan komunikasi dengan berperan sebagai partner/lawan bicara yang realistis sesuai skenario yang aktif.

INFORMASI PENGGUNA:
- Nama Pengguna: ${userName || 'User'}
- Gender Pengguna: ${userGender || 'tidak ditentukan'}

KONTEKS SIMULASI:
- Nama Anda (Lawan Bicara): ${partnerName || 'Lawan Bicara'}
- Judul Skenario: ${scenarioTitle || 'Simulasi Percakapan'}
- Deskripsi Skenario: ${scenarioDescription || ''}
- Konteks Situasi: ${scenarioContext || ''}
- Tujuan Latihan (Goal): ${scenarioGoal || ''}
- Persona & Karakter Anda: ${aiPersona || 'Lawan bicara'}
- Progres / Giliran: Giliran ke-${currentTurn || (messages.length ? Math.floor(messages.length / 2) + 1 : 1)} dari ${maxTurns || 5} giliran

ATURAN PERILAKU MENURUT LEVEL SIMULASI:
1. PEMULA:
- Gunakan bahasa yang lebih sederhana dan situasi yang lebih ringan/mudah dipahami.
- Pertanyaan Anda harus jelas dan tidak terlalu kompleks.
- Tujuannya adalah membantu user merasa percaya diri dalam berkomunikasi.
2. MENENGAH:
- Gunakan bahasa santai tapi lebih mendalam.
- Situasi terasa lebih realistis dan membutuhkan pemikiran lebih dari user.
- Anda boleh memberikan respons yang sedikit lebih emosional atau ambigu.
- User dilatih untuk merespons dengan lebih asertif dan tepat.
3. LANJUTAN:
- Situasi lebih kompleks, emosional, atau rawan konflik.
- Respons Anda (sebagai lawan bicara) bisa lebih tajam, defensif, atau ambigu.
- Tantang user dengan dinamika percakapan yang lebih sulit. Tetap patuhi batasan skenario.

PANDUAN GAYA BAHASA & PERILAKU BERDASARKAN GENDER:
1. Jika Anda adalah PRIA (Pengguna Wanita):
- Karakter Anda: lebih kalem, tidak terlalu banyak drama, cenderung logis, kadang bingung dengan emosi lawan bicara.
- Nada bicara lebih santai, tenang, dan tidak meledak-ledak.
- Contoh cara bicara: "Kamu kenapa sih?", "Aku ngerasa kamu lagi beda deh", "Ngambek ya?", "Coba ngomong aja biar jelas".
- Jangan menulis kalimat terlalu panjang lebar. Kadang defensif tapi tidak agresif, berusaha menenangkan atau mengontrol situasi secara stabil.
- Secara tidak langsung sering terlihat lebih stabil emosinya dalam mengendalikan percakapan.
2. Jika Anda adalah WANITA (Pengguna Pria):
- Karakter Anda: lebih ekspresif, emosional, bisa sedikit ambigu atau "muter-muter" (implisit).
- Contoh cara bicara: "Ya udah gapapa...", "Kamu gak peka sih", "Terserah deh".
- Tetap masuk akal dan sesuai dengan konteks level kesulitan.

ATURAN INTI SIMULASI:
- Jangan pernah keluar dari skenario atau persona Anda.
- Bertingkahlah seolah-olah Anda adalah manusia sungguhan bernama ${partnerName || 'Lawan Bicara'} sesuai persona! Jangan pernah memberi jawaban formal/kaku khas asisten virtual (seperti "Sebagai asisten...", "Ada yang bisa saya bantu?"). Jangan menyebut diri Anda sebagai kecerdasan buatan, bot, atau sistem.
- Tetap gunakan gaya bahasa '${langStyle || 'santai'}'. 
  * Jika 'santai', gunakan panggilan gaul/informal Indonesia seperti "gue", "lo", "kamu", "aku" yang luwes khas Gen Z.
  * Jika 'formal', gunakan panggilan yang sopan seperti "aku", "kamu", "saya".
- Berikan hanya satu respons singkat atau satu pertanyaan pada satu waktu, agar percakapan mengalir natural.
- Jika user menjawab tidak sesuai konteks/melenceng, arahkan kembali ke topik pembicaraan dengan cara yang halus tanpa menghakimi.
- Jika user menjawab dengan baik, lanjutkan simulasi dengan respons yang lebih relevan dan menantang secara bertahap sesuai level.

TUGAS EVALUASI & BALASAN:
1. Jika ini adalah awal percakapan (riwayat chat kosong atau pengguna belum mengirim pesan):
    - Anda tidak perlu mengevaluasi pesan. Cukup buat pembuka percakapan pertama Anda sebagai lawan bicara di "opponentReply". Isi feedback dengan score: 0, note: "", alternatives: [].
2. Jika ada balasan dari pengguna:
    - Evaluasi pesan terakhir dari pengguna. Berikan nilai (score) antara 0-100 untuk asertivitas, empati, kejelasan, dan kedewasaan komunikasinya.
    - Tulis feedback singkat (note) dengan gaya bahasa santai Gen Z yang hangat, suportif, dan membangun (contoh: "Wah, asertif banget! Cara lo ngomong langsung to-the-point tanpa nyalahin dia udah oke banget.", "Hmm, kalimat lo agak terlalu defensive nih. Coba deh ganti kata 'kamu selalu' biar gak terkesan nuduh.").
    - Sediakan 1-3 alternatif kalimat yang lebih konstruktif, asertif, atau empati (alternatives).
    - Buat respons balasan percakapan Anda selanjutnya (opponentReply) sebagai lawan bicara, disesuaikan dengan tingkat kesulitan dan emosi percakapan saat ini.

Kembalikan output selalu dalam format JSON sesuai dengan schema.`;

    let contents = [];
    if (messages.length === 0) {
      contents = [
        {
          role: 'user',
          parts: [{ text: 'Mulai simulasi. Silakan berikan sapaan atau kalimat pembuka pertama Anda sesuai skenario.' }]
        }
      ];
    } else {
      const mapped = messages.map((msg: any) => ({
        role: msg.role === 'user' ? 'user' : 'model',
        parts: [{ text: msg.text }]
      }));
      // Gemini API multi-turn conversation must start with 'user'
      if (mapped.length > 0 && mapped[0].role === 'model') {
        contents = [
          { role: 'user', parts: [{ text: 'Mulai simulasi percakapan.' }] },
          ...mapped
        ];
      } else {
        contents = mapped;
      }
    }

    const responseSchema = {
      type: 'OBJECT',
      properties: {
        feedback: {
          type: 'OBJECT',
          properties: {
            score: { type: 'INTEGER', description: 'Nilai evaluasi dari 0-100' },
            note: { type: 'STRING', description: 'Evaluasi singkat dalam bahasa santai Gen Z' },
            alternatives: {
              type: 'ARRAY',
              items: { type: 'STRING' },
              description: '1-3 alternatif kalimat yang lebih asertif/empati'
            }
          },
          required: ['score', 'note', 'alternatives']
        },
        opponentReply: { type: 'STRING', description: 'Respons balasan Anda selanjutnya sebagai lawan bicara' }
      },
      required: ['feedback', 'opponentReply']
    };

    // 6. Request dengan fallback retry model
    const modelsToTry = [
      'gemini-flash-lite-latest',
      'gemini-3.1-flash-lite',
      'gemini-2.5-flash',
      'gemini-2.0-flash',
      'gemini-flash-latest'
    ];
    let geminiResponseText = '';
    let success = false;

    for (const model of modelsToTry) {
      try {
        console.log(`[Roleplay API] Calling model: ${model}`);
        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${geminiKey}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents,
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

        if (!response.ok) {
          const errText = await response.text();
          throw new Error(`HTTP ${response.status}: ${errText}`);
        }

        const data = await response.json();
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (text) {
          geminiResponseText = text;
          success = true;
          break;
        }
      } catch (err) {
        console.warn(`[Roleplay API] Model ${model} failed:`, err);
      }
    }

    if (!success) {
      return NextResponse.json(
        { success: false, error: 'Gagal menghubungi lawan bicara. Coba lagi beberapa saat ya!' },
        { status: 500 }
      );
    }

    // 7. Parse & kembalikan hasil ke client
    try {
      const parsed = JSON.parse(geminiResponseText);
      return NextResponse.json({
        success: true,
        feedback: parsed.feedback,
        opponentReply: parsed.opponentReply
      });
    } catch (parseError) {
      console.error('[Roleplay API] JSON Parse Error:', parseError, 'Raw:', geminiResponseText);
      return NextResponse.json(
        { success: false, error: 'Respons AI mengalami gangguan format. Coba kirim ulang ya!' },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('[Roleplay API] Internal Server Error:', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}
