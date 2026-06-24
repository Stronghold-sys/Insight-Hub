'use client'

import { Users, Shield, ShieldCheck, Heart, MessageSquare } from 'lucide-react'
import Link from 'next/link'

export default function KomunitasPage() {
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
            Support Group & Komunitas
          </span>
          <h1 style={{ fontSize: 36, fontWeight: 800, color: 'var(--text-primary)', marginTop: 16, marginBottom: 12, letterSpacing: '-0.02em' }}>
            Tumbuh Bareng di Komunitas
          </h1>
          <p style={{ fontSize: 16, color: 'var(--text-secondary)', lineHeight: 1.6, maxWidth: 550, margin: '0 auto' }}>
            Tempat aman buat cerita, sharing insight relasi, dan belajar komunikasi asertif tanpa takut di-judge.
          </p>
        </div>

        {/* Community Rules Card */}
        <div className="card" style={{ padding: 32, marginBottom: 32 }}>
          <h3 style={{ fontSize: 18, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
            <ShieldCheck size={20} color="var(--brand-blue)" />
            Aturan Main Komunitas Waras
          </h3>
          <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: 20 }}>
            Biar komunitas kita tetap jadi safe space buat semua orang, kita punya rules keras yang wajib dipatuhi:
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 16 }}>
            <div style={{ display: 'flex', gap: 12 }}>
              <span style={{ fontSize: 14, fontWeight: 800, color: 'var(--brand-blue)', background: 'rgba(2,134,195,0.08)', width: 28, height: 28, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>1</span>
              <div>
                <h4 style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 4px' }}>No Gender Stereotyping & Generalization</h4>
                <p style={{ fontSize: 12.5, color: 'var(--text-secondary)', margin: 0, lineHeight: 1.5 }}>
                  Gak boleh nge-generalisir sifat gender tertentu (misal: &ldquo;semua cowok kayak gini&rdquo; atau &ldquo;cewek emang gitu&rdquo;). Kita fokus ke pola perilaku individu.
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 12 }}>
              <span style={{ fontSize: 14, fontWeight: 800, color: 'var(--brand-blue)', background: 'rgba(2,134,195,0.08)', width: 28, height: 28, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>2</span>
              <div>
                <h4 style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 4px' }}>Zero Judgment & High Empathy</h4>
                <p style={{ fontSize: 12.5, color: 'var(--text-secondary)', margin: 0, lineHeight: 1.5 }}>
                  Hargai sudut pandang orang lain. Setiap orang punya latar belakang attachment style dan trauma yang berbeda. Kita dengerin buat memahami, bukan menghakimi.
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 12 }}>
              <span style={{ fontSize: 14, fontWeight: 800, color: 'var(--brand-blue)', background: 'rgba(2,134,195,0.08)', width: 28, height: 28, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>3</span>
              <div>
                <h4 style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 4px' }}>Kerahasiaan Data (Confidentiality)</h4>
                <p style={{ fontSize: 12.5, color: 'var(--text-secondary)', margin: 0, lineHeight: 1.5 }}>
                  Apa pun cerita atau potongan chat analyzer yang dibagikan di komunitas bersifat rahasia. Dilarang keras melakukan tangkapan layar (screenshot) dan menyebarkannya keluar.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Join CTA */}
        <div style={{
          background: 'linear-gradient(135deg, #1B1E28, #2E3347)', color: 'white',
          borderRadius: 12, padding: 40, textAlign: 'center'
        }}>
          <Users size={32} color="var(--brand-blue)" style={{ margin: '0 auto 16px' }} />
          <h2 style={{ fontSize: 20, fontWeight: 800, color: 'white', marginBottom: 12 }}>Gabung Grup Telegram & Discord Insight Hub</h2>
          <p style={{ fontSize: 13.5, color: 'rgba(255,255,255,0.7)', lineHeight: 1.6, maxWidth: 500, margin: '0 auto 24px' }}>
            Dapatkan sesi Q&A mingguan gratis bareng tim psikologi kita dan diskusi santai bareng ratusan member premium lainnya.
          </p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 12, flexWrap: 'wrap' }}>
            <Link href="/daftar" className="btn btn-primary">
              Daftar Akun Premium Untuk Gabung
            </Link>
            <Link href="/kontak" className="btn btn-secondary" style={{ color: 'white', border: '1px solid rgba(255,255,255,0.2)', background: 'transparent' }}>
              Tanya Staff Komunitas
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
