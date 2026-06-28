import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ success: false, error: 'Harus login dulu ya!' }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const { nickname, age, relationshipStatus, relationshipGoal, communicationPreference } = body;

    if (!nickname || !age || !relationshipStatus) {
      return NextResponse.json({ success: false, error: 'Data onboarding belum lengkap' }, { status: 400 });
    }

    const geminiKey = process.env.GEMINI_ASSESSMENT_API_KEY || process.env.GEMINI_API_KEY || '';
    if (!geminiKey || (!geminiKey.startsWith('AIza') && !geminiKey.startsWith('AQ.'))) {
      console.error('[Onboarding Analysis API] GEMINI API key tidak valid atau tidak diset di env!');
      return NextResponse.json(
        { success: false, error: 'Konfigurasi API key belum tersedia atau tidak valid.' },
        { status: 500 }
      );
    }

    const systemPrompt = `Kamu adalah konselor digital yang ramah dan suportif untuk aplikasi Insight Hub, platform kesehatan mental dan hubungan.

Tugas kamu adalah menyambut pengguna baru dengan analisis profil yang hangat, positif, dan memotivasi. Gaya bahasa santai dan bersahabat, seperti teman yang peduli, bukan menegur atau mengejek.

Data profil pengguna:
Nama Panggilan: ${nickname}
Usia: ${age} tahun
Status Hubungan: ${relationshipStatus}
Tujuan menggunakan Insight Hub: ${relationshipGoal}
Gaya komunikasi: ${communicationPreference}

Tulis sambutan dalam 3 paragraf pendek yang masing-masing membahas:
1. Apresiasi bahwa mereka mau meluangkan waktu untuk mengenal diri sendiri di usia ${age} tahun dengan kondisi ${relationshipStatus}
2. Gambaran singkat tentang apa yang bisa mereka temukan di Insight Hub berdasarkan tujuan mereka
3. Kalimat penutup penyemangat yang tulus dan personal

PENTING SEKALI: Jangan gunakan markdown, heading, tanda bintang, tanda pagar, atau emoji apapun. Tulis dalam paragraf biasa saja, hangat, dan tidak lebih dari 150 kata total. Pisahkan setiap paragraf dengan satu baris kosong saja.`;

    const modelsToTry = ['gemini-2.5-flash', 'gemini-1.5-flash', 'gemini-flash-lite-latest'];
    let analysisText = '';
    let isSuccess = false;
    let lastError = '';

    for (const model of modelsToTry) {
      try {
        console.log(`[Onboarding Analysis] Attempting generation using model: ${model}`);
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${geminiKey}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            contents: [
              {
                role: 'user',
                parts: [{ text: `Nama: ${nickname}, Usia: ${age}, Hubungan: ${relationshipStatus}, Tujuan: ${relationshipGoal}` }]
              }
            ],
            systemInstruction: {
              parts: [{ text: systemPrompt }]
            }
          })
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (text) {
          // Strip all markdown, emojis, and special characters to ensure clean output
          analysisText = text
            .replace(/^#{1,6}\s*/gm, '')                // remove headings (#, ##, ###)
            .replace(/\*{1,3}([^*\n]+)\*{1,3}/g, '$1') // remove bold/italic markers
            .replace(/_{1,3}([^_\n]+)_{1,3}/g, '$1')   // remove underscore markers
            .replace(/`{1,3}[^`]*`{1,3}/g, '')          // remove inline code
            .replace(/[\u{1F300}-\u{1FFFF}]/gu, '')      // remove emoji block 1
            .replace(/[\u{2600}-\u{27BF}]/gu, '')        // remove emoji block 2
            .replace(/[\u{1F000}-\u{1F9FF}]/gu, '')      // remove emoji block 3
            .replace(/[\u2764\u2665\u2666\u2663\u2660\u2726\u2605\u2606\u2734\u2733\u2728\u2716\u2714\u2712\u270E]/g, '') // common symbols
            .replace(/\n{3,}/g, '\n\n')                  // normalize extra blank lines
            .trim();
          isSuccess = true;
          break;
        }
      } catch (err: any) {
        console.warn(`[Onboarding Analysis] Model ${model} failed:`, err.message);
        lastError = err.message;
      }
    }

    if (!isSuccess) {
      return NextResponse.json({ success: false, error: `Gagal generate analisis: ${lastError}` }, { status: 500 });
    }

    return NextResponse.json({ success: true, roast: analysisText });
  } catch (error: any) {
    console.error('Error during onboarding analysis API:', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}
