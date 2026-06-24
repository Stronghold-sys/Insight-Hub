'use client'

import Link from 'next/link'
import { ArrowRight, ShieldCheck, Compass, HeartHandshake, Eye } from 'lucide-react'

export default function TentangPage() {
  return (
    <div style={{ background: 'transparent', minHeight: 'calc(100vh - 64px)', paddingTop: 48, paddingBottom: 80 }}>
      <div className="container" style={{ maxWidth: 800 }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 48 }}>
          <span style={{
            fontSize: 12, fontWeight: 700, color: 'var(--brand-blue)',
            textTransform: 'uppercase', letterSpacing: '0.1em',
            background: 'rgba(2,134,195,0.08)', padding: '6px 12px', borderRadius: 999
          }}>
            Vibe Check & Visi Kita
          </span>
          <h1 style={{ fontSize: 36, fontWeight: 800, color: 'var(--text-primary)', marginTop: 16, marginBottom: 16, letterSpacing: '-0.02em' }}>
            Kenapa Kita Bikin Insight Hub?
          </h1>
          <p style={{ fontSize: 16, color: 'var(--text-secondary)', lineHeight: 1.6, maxWidth: 600, margin: '0 auto' }}>
            Biar ngobrol nggak gampang baper, relasi berjalan waras, dan kamu bisa ngerti boundaries diri sendiri tanpa harus nunggu ribut dulu.
          </p>
        </div>

        {/* Visi Misi */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 24, marginBottom: 48 }}>
          <div className="card" style={{ padding: 32, display: 'flex', gap: 20 }}>
            <div style={{
              width: 48, height: 48, borderRadius: 12, background: 'rgba(2,134,195,0.08)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--brand-blue)', flexShrink: 0
            }}>
              <Compass size={24} />
            </div>
            <div>
              <h3 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 8 }}>Visi Utama Kita</h3>
              <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.7, margin: 0 }}>
                Menciptakan ekosistem hubungan yang sehat secara emosional dan mental. Kita pengin setiap orang punya self-awareness yang kuat biar bisa merespons konflik dengan dewasa, empatik, dan asertif. Nggak ada lagi tebak-tebakan kode yang bikin capek mental.
              </p>
            </div>
          </div>

          <div className="card" style={{ padding: 32, display: 'flex', gap: 20 }}>
            <div style={{
              width: 48, height: 48, borderRadius: 12, background: 'rgba(23,184,151,0.08)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--teal)', flexShrink: 0
            }}>
              <HeartHandshake size={24} />
            </div>
            <div>
              <h3 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 8 }}>Misi yang Kita Jalankan</h3>
              <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.7, margin: 0 }}>
                Menyediakan assessment psikologis yang tervalidasi sains dengan bahasa sehari-hari yang ringan. Kita juga bangun tools kayak Chat Analyzer dan simulasi obrolan biar kamu bisa langsung latihan komunikasi tanpa canggung.
              </p>
            </div>
          </div>
        </div>

        {/* Metodologi & Transparansi */}
        <div className="card" style={{ padding: 32, marginBottom: 48 }}>
          <h3 style={{ fontSize: 20, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 12 }}>Transparansi Metode Kita</h3>
          <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.7, marginBottom: 20 }}>
            Semua kuis, tracker, dan insight di platform ini dibuat berdasarkan teori psikologi relasi yang diakui secara global, seperti **Attachment Theory (John Bowlby)** dan konsep **Five Love Languages (Gary Chapman)**. 
          </p>
          <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.7, marginBottom: 0 }}>
            Setiap hasil kuis dilengkapi dengan **Confidence Score** dan **Data Quality Indicator** yang nunjukin seberapa konsisten jawaban kamu saat mengisi kuis, sehingga hasil analisis yang keluar beneran merepresentasikan dinamika kamu yang sesungguhnya.
          </p>
        </div>

        {/* Batasan Penggunaan / Disclaimer */}
        <div style={{
          background: 'rgba(245, 166, 35, 0.08)', border: '1px solid rgba(245, 166, 35, 0.2)',
          borderRadius: 8, padding: 24, marginBottom: 48
        }}>
          <h4 style={{ fontSize: 15, fontWeight: 700, color: '#D48806', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
            <ShieldCheck size={18} />
            Catatan Penting (Disclaimer Kesehatan Mental)
          </h4>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6, margin: 0 }}>
            Insight Hub adalah platform mandiri untuk edukasi, refleksi diri, dan peningkatan kesadaran hubungan (self-awareness). **Platform ini BUKAN pengganti terapi profesional, psikolog klinis, konselor, atau psikiater.** Kalau kamu atau orang terdekat sedang berada dalam kondisi stres berat, konflik hubungan yang mengarah ke kekerasan, atau masalah kesehatan mental yang serius, harap segera hubungi profesional medis terdekat.
          </p>
        </div>

        {/* CTA */}
        <div style={{ textAlign: 'center' }}>
          <h3 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 16 }}>Siap buat kenal diri kamu lebih dalam?</h3>
          <Link href="/daftar" className="btn btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
            Mulai Kuis Sekarang
            <ArrowRight size={16} />
          </Link>
        </div>
      </div>
    </div>
  )
}
