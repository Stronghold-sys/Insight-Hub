'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowRight, Check, Award, AlertCircle, HelpCircle, BarChart2, ShieldAlert } from 'lucide-react'

const DEMO_QUESTIONS = [
  {
    id: 1,
    text: 'Ketika pasangan kamu tiba-tiba diam seharian tanpa kabar, reaksi pertama di kepalamu adalah...',
    options: [
      { text: 'Dia pasti lagi sibuk atau pengin me-time aja. Nanti juga ngabarin.', type: 'secure' },
      { text: 'Duh, apa gue ada salah ya? Mulai cemas dan overthinking.', type: 'anxious' },
      { text: 'Bodo amat lah, gue juga punya kesibukan sendiri kok.', type: 'avoidant' }
    ]
  },
  {
    id: 2,
    text: 'Saat berantem atau beda pendapat soal hal penting, gaya kamu biasanya...',
    options: [
      { text: 'Ngomong langsung, jelasin perasaan tanpa perlu nyalahin dia.', type: 'secure' },
      { text: 'Mending diam dulu, pasang muka bete, nunggu dia peka.', type: 'anxious' },
      { text: 'Malas bahas, mending menghindar atau pura-pura gak ada masalah.', type: 'avoidant' }
    ]
  },
  {
    id: 3,
    text: 'Kamu ngerasa paling dicintai dan disayang oleh orang terdekat kalau dia...',
    options: [
      { text: 'Ngemil atau jalan bareng sambil ngobrol tanpa main HP.', type: 'secure' },
      { text: 'Ngasih pelukan hangat atau megang tangan kamu pas lagi jalan.', type: 'secure' },
      { text: 'Bantu ngerjain tugas, bantuin beberes, atau beliin barang kecil.', type: 'secure' }
    ]
  }
]

export default function DemoPage() {
  const [step, setStep] = useState(0) // 0: Teaser landing, 1-3: Questions, 4: Result Preview
  const [answers, setAnswers] = useState<string[]>([])
  const [selectedOption, setSelectedOption] = useState<number | null>(null)

  const handleNext = () => {
    if (selectedOption === null) return
    const newAnswers = [...answers, DEMO_QUESTIONS[step - 1].options[selectedOption].type]
    setAnswers(newAnswers)
    setSelectedOption(null)
    setStep(step + 1)
  }

  // Calculate dominant style for demo
  const getDominantStyle = () => {
    const counts = answers.reduce((acc, curr) => {
      acc[curr] = (acc[curr] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    if ((counts['anxious'] || 0) > (counts['secure'] || 0) && (counts['anxious'] || 0) >= (counts['avoidant'] || 0)) {
      return {
        title: 'Anxious Attachment (Cemas/Khawatir)',
        desc: 'Kamu cenderung butuh validasi konstan dan gampang cemas kalau merasa ada jarak emosional dengan pasangan.',
        tips: 'Cobalah latihan menyadari overthinking kamu secara objektif dan komunikasiin ketakutanmu secara asertif, bukan dengan memberi silent treatment.'
      }
    } else if ((counts['avoidant'] || 0) > (counts['secure'] || 0)) {
      return {
        title: 'Avoidant Attachment (Menghindar)',
        desc: 'Kamu cenderung menuntut kemandirian penuh dan merasa canggung atau kewalahan kalau orang lain mencoba terlalu dekat.',
        tips: 'Ingat bahwa butuh ruang itu wajar, tapi menutup diri sepenuhnya dari obrolan penting malah akan melukai relasi kamu.'
      }
    } else {
      return {
        title: 'Secure Attachment (Aman & Waras)',
        desc: 'Kamu merasa nyaman dengan kedekatan emosional sekaligus bisa menjaga kemandirian diri sendiri tanpa cemas berlebihan.',
        tips: 'Pertahankan komunikasi asertif ini dan terus latih boundaries sehat kamu agar relasi selalu seimbang.'
      }
    }
  }

  const result = step === 4 ? getDominantStyle() : null

  return (
    <div style={{ background: 'transparent', minHeight: 'calc(100vh - 64px)', display: 'flex', alignItems: 'center', padding: '40px 0' }}>
      <div className="container" style={{ maxWidth: 640 }}>
        
        {/* Step 0: Teaser Landing */}
        {step === 0 && (
          <div className="card" style={{ padding: 40, textAlign: 'center' }}>
            <span style={{
              fontSize: 11, fontWeight: 700, color: 'var(--teal)',
              textTransform: 'uppercase', letterSpacing: '0.1em',
              background: 'rgba(23,184,151,0.08)', padding: '4px 12px', borderRadius: 999
            }}>
              Kuis Demo Tanpa Login
            </span>
            <h1 style={{ fontSize: 26, fontWeight: 800, color: 'var(--text-primary)', marginTop: 16, marginBottom: 12 }}>
              Coba Tes Vibe Relasi Kamu
            </h1>
            <p style={{ fontSize: 14.5, color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: 32 }}>
              Cuma butuh 3 pertanyaan singkat buat ngintip pola komunikasi dan kecenderungan gaya attachment kamu. Instan, gratis, dan gak pake ribet!
            </p>
            <button onClick={() => setStep(1)} className="btn btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
              Mulai Tes Demo (1 Menit)
              <ArrowRight size={16} />
            </button>
          </div>
        )}

        {/* Step 1-3: Quiz Questions */}
        {step >= 1 && step <= 3 && (
          <div className="card" style={{ padding: 32 }}>
            {/* Progress Bar */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)' }}>Pertanyaan {step} dari 3</span>
              <div style={{ width: 100, height: 6, background: 'var(--border-subtle)', borderRadius: 999, overflow: 'hidden' }}>
                <div style={{ width: `${(step / 3) * 100}%`, height: '100%', background: 'var(--brand-blue)', transition: 'width 0.2s ease' }} />
              </div>
            </div>

            <h2 style={{ fontSize: 18, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 24, lineHeight: 1.5 }}>
              {DEMO_QUESTIONS[step - 1].text}
            </h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 28 }}>
              {DEMO_QUESTIONS[step - 1].options.map((opt, idx) => (
                <button
                  key={idx}
                  onClick={() => setSelectedOption(idx)}
                  style={{
                    padding: '16px 20px', borderRadius: 8, textAlign: 'left',
                    background: selectedOption === idx ? 'rgba(2,134,195,0.05)' : 'var(--surface)',
                    border: selectedOption === idx ? '2px solid var(--brand-blue)' : '1px solid var(--border)',
                    fontSize: 13.5, color: 'var(--text-primary)', cursor: 'pointer',
                    transition: 'all 150ms ease', lineHeight: 1.5
                  }}
                >
                  {opt.text}
                </button>
              ))}
            </div>

            <button
              onClick={handleNext}
              disabled={selectedOption === null}
              className="btn btn-primary"
              style={{ width: '100%', justifyContent: 'center' }}
            >
              {step === 3 ? 'Lihat Hasil Teaser' : 'Lanjut'}
            </button>
          </div>
        )}

        {/* Step 4: Preview Result */}
        {step === 4 && result && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            <div className="card" style={{ padding: 32 }}>
              <div style={{ textAlign: 'center', marginBottom: 24 }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--brand-blue)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Preview Hasil Teaser</span>
                <h2 style={{ fontSize: 20, fontWeight: 800, color: 'var(--text-primary)', marginTop: 8, marginBottom: 8 }}>
                  Kecenderungan Gaya Kamu:
                </h2>
                <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--brand-blue)', background: 'rgba(2,134,195,0.06)', display: 'inline-block', padding: '8px 16px', borderRadius: 8, marginTop: 4 }}>
                  {result.title}
                </div>
              </div>

              <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: 20 }}>
                {result.desc}
              </p>

              <div style={{ background: 'var(--bg)', padding: 16, borderRadius: 8, border: '1px solid var(--border-subtle)', marginBottom: 12 }}>
                <h4 style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 6px', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Award size={14} color="var(--teal)" />
                  Tips Singkat Hubungan:
                </h4>
                <p style={{ fontSize: 12.5, color: 'var(--text-secondary)', lineHeight: 1.5, margin: 0 }}>
                  {result.tips}
                </p>
              </div>

              {/* Data Quality blur simulation */}
              <div style={{ opacity: 0.8, background: 'rgba(0,0,0,0.02)', padding: 16, borderRadius: 8, border: '1px dotted var(--border)', position: 'relative' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 8 }}>
                  <span>Confidence Score: 40% (Teaser)</span>
                  <span>Data Quality: Gak Cukup (3 Pertanyaan)</span>
                </div>
                <div style={{ filter: 'blur(3px)', fontSize: 11, color: 'var(--text-muted)' }}>
                  Analisis mendalam tentang 12 dimensi relasi, love language breakdown, dan saran interaksi terperinci disembunyikan. Hubungkan dengan dashboard riil untuk mendapatkan validitas tinggi.
                </div>
                <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span style={{ fontSize: 11, fontWeight: 700, background: 'var(--text-primary)', color: 'white', padding: '4px 10px', borderRadius: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
                    <ShieldAlert size={12} />
                    Daftar Akun untuk Analisis Penuh
                  </span>
                </div>
              </div>
            </div>

            {/* Teaser CTA */}
            <div className="card" style={{ padding: 24, textAlign: 'center', background: 'linear-gradient(135deg, #0286C3, #17B897)', color: 'white' }}>
              <h3 style={{ fontSize: 16, fontWeight: 800, color: 'white', margin: '0 0 8px' }}>Pengin Laporan Analisis yang Akurat & Sains-based?</h3>
              <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.85)', lineHeight: 1.6, marginBottom: 20 }}>
                Daftar sekarang untuk ngisi 19 Assessment lengkap (Love Language, Attachment Style, Conflict Response, dll) dan akses Chat Analyzer instan!
              </p>
              <div style={{ display: 'flex', justifyContent: 'center', gap: 12 }}>
                <Link href="/daftar" className="btn btn-primary" style={{ background: 'white', color: 'var(--brand-blue)' }}>
                  Daftar Akun (Gratis)
                </Link>
                <button onClick={() => setStep(0)} className="btn btn-secondary" style={{ color: 'white', border: '1px solid rgba(255,255,255,0.2)', background: 'transparent' }}>
                  Ulang Tes Demo
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
