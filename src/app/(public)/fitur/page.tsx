'use client'

import Link from 'next/link'
import {
  ClipboardList, MessageSquare, Activity, BookOpen,
  Users, TrendingUp, CheckCircle, ArrowRight
} from 'lucide-react'

const FEATURES = [
  {
    icon: ClipboardList,
    title: '19 Assessment Mendalam',
    description: 'Dari Love Language, Attachment Style, gaya merespons konflik, hingga batasan diri (boundaries). Hasil kuis dilengkapi Confidence Score dan indikator kualitas data biar kamu ngerti polamu secara objektif.',
    badge: 'Sains-Based',
    color: 'var(--brand-blue)',
    bg: 'rgba(2,134,195,0.06)'
  },
  {
    icon: MessageSquare,
    title: 'Chat Analyzer',
    description: 'Paste potongan chat yang bikin bingung atau memicu tensi emosional. Sistem kita bakal bedah tone, tingkat pasif-agresif/defensif, emosi dominan, serta nyediain alternatif balasan (lebih tegas, netral, atau lembut).',
    badge: 'Mesin Pintar',
    color: 'var(--teal)',
    bg: 'rgba(23,184,151,0.06)'
  },
  {
    icon: Activity,
    title: 'Mood Tracker & Energy Tracker',
    description: 'Catat mood harian, stres, dan level energimu secara rutin. Lacak pola berulang mingguan atau bulanan serta hubungkan dengan pemicu tertentu biar kamu sadar kapan harus istirahat.',
    badge: 'Daily Tracker',
    color: '#F5A623',
    bg: 'rgba(245,166,35,0.06)'
  },
  {
    icon: BookOpen,
    title: 'Jurnal Dinamika Relasi',
    description: 'Rekam kejadian penting, konflik, momen manis, red flag, dan green flag. Bukan jurnal biasa, sistem kita bantu hubungin catatanmu dengan mood tracker untuk nentuin trend emosimu.',
    badge: 'Relational Log',
    color: '#9B59B6',
    bg: 'rgba(155,89,182,0.06)'
  },
  {
    icon: Users,
    title: 'Simulasi Obrolan / Roleplay',
    description: 'Takut canggung pas mau bahas hal sensitif? Latihan di sini dulu! Pilih skenario konflik (telat kabar, boundary, dll), ketik responmu, dan dapatkan feedback skor komunikasi instan serta alternatif kalimat.',
    badge: 'Interactive',
    color: '#E91E63',
    bg: 'rgba(233,30,99,0.06)'
  },
  {
    icon: TrendingUp,
    title: 'Relationship Insight Engine',
    description: 'Penggabungan dashboard pintar dari seluruh aktivitasmu untuk ngasih insight mingguan/bulanan: kapan harus kasih ruang, cara meminimalkan miskomunikasi, dan saran praktis yang relevan.',
    badge: 'Personalized',
    color: '#00BCD4',
    bg: 'rgba(0,188,212,0.06)'
  }
]

export default function FiturPage() {
  return (
    <div style={{ background: 'transparent', minHeight: 'calc(100vh - 64px)', paddingTop: 48, paddingBottom: 80 }}>
      <div className="container" style={{ maxWidth: 1000 }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 56 }}>
          <span style={{
            fontSize: 12, fontWeight: 700, color: 'var(--brand-blue)',
            textTransform: 'uppercase', letterSpacing: '0.1em',
            background: 'rgba(2,134,195,0.08)', padding: '6px 12px', borderRadius: 999
          }}>
            Semua yang Kamu Butuhin
          </span>
          <h1 style={{ fontSize: 36, fontWeight: 800, color: 'var(--text-primary)', marginTop: 16, marginBottom: 16, letterSpacing: '-0.02em' }}>
            Bedah Fitur Insight Hub
          </h1>
          <p style={{ fontSize: 16, color: 'var(--text-secondary)', lineHeight: 1.6, maxWidth: 600, margin: '0 auto' }}>
            Kita gak cuma ngasih quiz iseng. Ini toolset lengkap buat ngelatih otot emosional dan komunikasi kamu setiap hari.
          </p>
        </div>

        {/* Feature Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 24, marginBottom: 56 }}>
          {FEATURES.map((feature, i) => {
            const Icon = feature.icon
            return (
              <div key={i} className="card" style={{ padding: 32, display: 'flex', flexDirection: 'column', height: '100%' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
                  <div style={{
                    width: 44, height: 44, borderRadius: 10, background: feature.bg,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', color: feature.color
                  }}>
                    <Icon size={22} />
                  </div>
                  <span style={{
                    fontSize: 10, fontWeight: 700, color: feature.color,
                    background: feature.bg, padding: '3px 8px', borderRadius: 999,
                    textTransform: 'uppercase', letterSpacing: '0.05em'
                  }}>
                    {feature.badge}
                  </span>
                </div>
                <h3 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 10 }}>
                  {feature.title}
                </h3>
                <p style={{ fontSize: 13.5, color: 'var(--text-secondary)', lineHeight: 1.6, margin: 0, flex: 1 }}>
                  {feature.description}
                </p>
              </div>
            )
          })}
        </div>

        {/* Call to Action */}
        <div style={{
          background: 'linear-gradient(135deg, #1B1E28, #2E3347)', color: 'white',
          borderRadius: 12, padding: '48px 32px', textAlign: 'center', boxShadow: 'var(--shadow-raised)'
        }}>
          <h2 style={{ fontSize: 24, fontWeight: 800, marginBottom: 12, color: 'white' }}>Semua Data Terhubung Dalam Satu Dashboard</h2>
          <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.7)', lineHeight: 1.6, maxWidth: 600, margin: '0 auto 24px' }}>
            Data kuis, mood harian, dan analisis obrolan kamu diintegrasikan oleh Recommendation Engine untuk ngasih saran spesifik buat relasimu. Privasi kamu 100% aman dan terenkripsi.
          </p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 16, flexWrap: 'wrap' }}>
            <Link href="/daftar" className="btn btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
              Coba Sekarang (Gratis)
              <ArrowRight size={16} />
            </Link>
            <Link href="/demo" className="btn btn-secondary" style={{ border: '1px solid rgba(255,255,255,0.2)', color: 'white', background: 'transparent' }}>
              Coba Demo Dulu
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
