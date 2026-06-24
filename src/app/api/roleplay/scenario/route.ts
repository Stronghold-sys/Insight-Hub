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
    const { level, userGender, langStyle } = body;

    if (!level || !userGender) {
      return NextResponse.json({ success: false, error: 'Level simulasi dan gender harus dipilih.' }, { status: 400 });
    }

    // 3. Validasi Gemini API Key
    const geminiKey = process.env.GEMINI_ASSESSMENT_API_KEY || process.env.GEMINI_API_KEY || '';
    if (!geminiKey || (!geminiKey.startsWith('AIza') && !geminiKey.startsWith('AQ.'))) {
      console.error('[Roleplay Scenario API] GEMINI API key tidak diset atau tidak valid!');
      return NextResponse.json(
        { success: false, error: 'Konfigurasi API key Gemini belum tersedia atau tidak valid.' },
        { status: 500 }
      );
    }

    // 4. Tentukan Gender Lawan Bicara (AI)
    const opponentGender = userGender === 'pria' ? 'wanita' : 'pria';

    // 5. Bangun Prompt Scenario
    const systemPrompt = `Anda adalah generator skenario dan pembuka percakapan untuk fitur 'Simulasi Percakapan' di platform 'Insight Hub'.
Tugas Anda adalah menghasilkan skenario simulasi percakapan interpersonal beserta pesan pembuka pertama dari lawan bicara yang realistis, relevan dengan kehidupan anak muda/Gen Z di Indonesia, dan sesuai dengan tingkat kesulitan yang dipilih.

PARAMETER PERMINTAAN:
- Tingkat Kesulitan: ${level}
- Gender Pengguna: ${userGender}
- Peran Lawan Bicara: Harus memiliki gender berlawanan (${opponentGender}).
  * Jika Pengguna PRIA: Lawan Bicara berperan sebagai WANITA (misal: pacar, istri, teman dekat perempuan). Skenario harus mengarah ke dinamika hubungan dari sudut pandang wanita (misal: wanita ngambek, wanita butuh kejelasan, wanita merasa diabaikan).
  * Jika Pengguna WANITA: Lawan Bicara berperan sebagai PRIA (misal: pacar, suami, rekan kerja pria). Skenario harus mengarah ke dinamika hubungan dari sudut pandang pria.

PANDUAN NAMA SAMARAN LAWAN BICARA (partnerName):
- Tentukan nama samaran (partnerName) yang natural, modern, dan umum digunakan sehari-hari di Indonesia sesuai dengan gender lawan bicara (${opponentGender}):
  * Jika lawan bicara WANITA: Pilih secara acak dari nama seperti Sarah, Alya, Nabila, Rani, Siska, Dinda, Aulia, Rena, Mila, Putri, atau nama sejenis yang umum.
  * Jika lawan bicara PRIA: Pilih secara acak dari nama seperti Raka, Dimas, Rizky, Bayu, Fajar, Andi, Wahyu, Bima, Hendra, Ivan, atau nama sejenis yang umum.
- Nama samaran ini wajib dimasukkan ke properti "partnerName" pada output JSON.
- Wajib menggunakan nama samaran tersebut secara konsisten di dalam seluruh teks skenario ('title', 'description', 'context', 'goal', 'aiPersona', dan 'openingMessage'). Jangan pernah menggunakan istilah generik seperti "partner", "dia", "lawan bicara", "pacar", "suami/istri", atau nama placeholder lainnya. Ganti sepenuhnya dengan nama samaran yang telah Anda pilih.

PANDUAN KONTEN & LARANGAN:
- Dilarang menggunakan emoji atau ikon emoji apa pun di seluruh copywriting.
- Dilarang menggunakan kata "AI", "sistem", atau "bot" di dalam teks yang akan dibaca pengguna (seperti 'title', 'description', 'context', 'goal', 'aiPersona', 'openingMessage'). Gunakan sebutan nama samaran itu sendiri, atau hubungan perannya (seperti 'pacar kamu', 'rekan kerjamu', 'atasanmu').

PANDUAN KESULITAN & PERILAKU:
1. PEMULA:
- Situasi sehari-hari yang ringan, familiar, dan kooperatif.
- Lawan bicara ramah, kooperatif, dan tidak terlalu emosional.
- Contoh: Merencanakan akhir pekan, meminta tolong membelikan titipan.
2. MENENGAH:
- Ada sedikit konflik, ketidaksepakatan ringan, atau emosi terpendam.
- Lawan bicara bisa bersikap agak cuek, sensitif, atau ambigu. Butuh respons yang lebih hati-hati.
3. LANJUTAN:
- Konflik intens, emosi tinggi, butuh ketenangan dan asertivitas matang.
- Lawan bicara bisa bersikap defensif, kecewa berat, marah, menuntut, atau memancing emosi secara halus tapi tajam (tricky).

PANDUAN GAYA BAHASA LAWAN BICARA BERDASARKAN GENDER:
1. Jika Lawan Bicara adalah PRIA (Pengguna Wanita):
- Karakter pria: lebih kalem, tidak terlalu banyak drama, cenderung logis, kadang bingung dengan emosi lawan bicara.
- Nada bicara lebih santai, tenang, dan tidak meledak-ledak.
- Cara bicara: "Kamu kenapa sih?", "Aku ngerasa kamu lagi beda deh", "Ngambek ya?", "Coba ngomong aja biar jelas".
- Kalimat tidak terlalu panjang lebar, kadang defensif tapi tidak agresif, berusaha menenangkan atau mengontrol situasi secara stabil.
- Secara tidak langsung sering terlihat lebih stabil emosinya dalam mengendalikan percakapan.
2. Jika Lawan Bicara adalah WANITA (Pengguna Pria):
- Karakter wanita: lebih ekspresif, emosional, bisa sedikit ambigu atau "muter-muter" (implisit).
- Cara bicara: "Ya udah gapapa...", "Kamu gak peka sih", "Terserah deh".
- Tetap masuk akal dan sesuai dengan konteks level kesulitan.

PANDUAN GAYA BAHASA (langStyle):
- Gaya bahasa terpilih: '${langStyle || 'santai'}'.
  * Jika 'santai': Gunakan bahasa sehari-hari Gen Z Indonesia yang natural, santai, dan kasual (seperti "gue", "lo", "kamu", "aku" yang luwes).
  * Jika 'formal': Gunakan panggilan yang sopan (seperti "aku", "kamu", "saya").

Kembalikan output selalu dalam format JSON sesuai dengan schema.`;

    const responseSchema = {
      type: 'OBJECT',
      properties: {
        title: { 
          type: 'STRING', 
          description: 'Judul skenario singkat, padat, dan menarik (maksimal 6 kata)' 
        },
        description: { 
          type: 'STRING', 
          description: 'Penjelasan singkat mengenai situasi/masalah yang dihadapi pengguna' 
        },
        context: { 
          type: 'STRING', 
          description: 'Detail latar belakang situasi (tempat kejadian, apa yang baru saja terjadi, suasana)' 
        },
        goal: { 
          type: 'STRING', 
          description: 'Tujuan komunikasi yang ingin dicapai pengguna dalam sesi ini (maksimal 10 kata)' 
        },
        aiPersona: { 
          type: 'STRING', 
          description: 'Nama tokoh lawan bicara, karakter, dan bagaimana dia harus bersikap selama percakapan (misalnya: "Sarah, pacarmu yang sedang merasa dicuekin dan butuh perhatian lebih")' 
        },
        openingMessage: {
          type: 'STRING',
          description: 'Kalimat sapaan pembuka pertama dari lawan bicara sesuai dengan konteks dan gaya bahasa.'
        },
        partnerName: {
          type: 'STRING',
          description: 'Nama panggilan samaran terpilih untuk lawan bicara (misalnya: "Sarah" atau "Raka").'
        }
      },
      required: ['title', 'description', 'context', 'goal', 'aiPersona', 'openingMessage', 'partnerName']
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
        console.log(`[Roleplay Scenario API] Calling model: ${model}`);
        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${geminiKey}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [
                {
                  role: 'user',
                  parts: [{ text: `Hasilkan satu skenario simulasi percakapan tingkat ${level} untuk pengguna bergender ${userGender}.` }]
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
        console.warn(`[Roleplay Scenario API] Model ${model} failed:`, err);
      }
    }

    if (!success) {
      return NextResponse.json(
        { success: false, error: 'Gagal menghubungi asisten AI untuk menyiapkan skenario. Coba lagi ya!' },
        { status: 500 }
      );
    }

    // 7. Parse & kembalikan hasil ke client
    try {
      const parsed = JSON.parse(geminiResponseText);
      return NextResponse.json({
        success: true,
        scenario: parsed
      });
    } catch (parseError) {
      console.error('[Roleplay Scenario API] JSON Parse Error:', parseError, 'Raw:', geminiResponseText);
      return NextResponse.json(
        { success: false, error: 'Format skenario AI terganggu. Coba sekali lagi ya!' },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('[Roleplay Scenario API] Internal Server Error:', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}
