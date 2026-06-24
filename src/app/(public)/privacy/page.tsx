'use client'

import Link from 'next/link'
import { ShieldCheck, EyeOff, Lock, RefreshCw } from 'lucide-react'

export default function PrivacyPage() {
  return (
    <div style={{ background: 'transparent', minHeight: 'calc(100vh - 64px)', paddingTop: 48, paddingBottom: 80 }}>
      <div className="container" style={{ maxWidth: 800 }}>
        <div className="card" style={{ padding: 40 }}>
          {/* Header */}
          <div style={{ borderBottom: '1px solid var(--border-subtle)', paddingBottom: 24, marginBottom: 32 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, color: 'var(--brand-blue)', marginBottom: 8 }}>
              <ShieldCheck size={28} />
              <span style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Privasi Aman</span>
            </div>
            <h1 style={{ fontSize: 26, fontWeight: 800, color: 'var(--text-primary)', margin: '4px 0 8px' }}>
              Kebijakan Privasi Insight Hub
            </h1>
            <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: 0 }}>Terakhir diperbarui: 23 Juni 2026</p>
          </div>

          {/* Intro */}
          <div style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.7, marginBottom: 28 }}>
            <p>Di **Insight Hub**, privasi data kamu bukan sekadar hiasan hukum. Kita ngerti kalau kuis relasi, entri mood tracker, catatan jurnal, dan percakapan chat analyzer yang kamu simpan bersifat sangat personal dan sensitif. Berikut adalah penjelasan transparan mengenai apa yang kita kumpulkan dan gimana kita jagain datamu.</p>
          </div>

          {/* Core Values Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 20, marginBottom: 32 }}>
            <div style={{ background: 'var(--bg)', padding: 20, borderRadius: 8, border: '1px solid var(--border-subtle)' }}>
              <Lock size={20} color="var(--brand-blue)" style={{ marginBottom: 12 }} />
              <h4 style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 8px' }}>Enkripsi Penyimpanan</h4>
              <p style={{ fontSize: 12, color: 'var(--text-secondary)', margin: 0, lineHeight: 1.5 }}>
                Kata sandi di-hash menggunakan algoritma SHA-256 yang aman, dan data personal sensitif dilindungi dengan enkripsi tingkat lanjut di penyimpanan sistem.
              </p>
            </div>

            <div style={{ background: 'var(--bg)', padding: 20, borderRadius: 8, border: '1px solid var(--border-subtle)' }}>
              <EyeOff size={20} color="var(--teal)" style={{ marginBottom: 12 }} />
              <h4 style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 8px' }}>Gak Ada Pihak Ketiga</h4>
              <p style={{ fontSize: 12, color: 'var(--text-secondary)', margin: 0, lineHeight: 1.5 }}>
                Kita tidak pernah, dan tidak akan pernah menjual, menyewakan, atau menyebarkan data kuis, catatan jurnal, atau chat kamu ke pengiklan mana pun.
              </p>
            </div>

            <div style={{ background: 'var(--bg)', padding: 20, borderRadius: 8, border: '1px solid var(--border-subtle)' }}>
              <RefreshCw size={20} color="#F5A623" style={{ marginBottom: 12 }} />
              <h4 style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 8px' }}>Kendali Penuh di Kamu</h4>
              <p style={{ fontSize: 12, color: 'var(--text-secondary)', margin: 0, lineHeight: 1.5 }}>
                Kamu bisa unduh semua data personal kamu (GDPR JSON) atau hapus seluruh akun beserta datanya dari server secara permanen kapan saja.
              </p>
            </div>
          </div>

          {/* Data We Collect */}
          <div style={{ marginBottom: 28 }}>
            <h3 style={{ fontSize: 16, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 12 }}>1. Data yang Kita Kumpulkan</h3>
            <p style={{ fontSize: 13.5, color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: 12 }}>
              Kita hanya mengumpulkan informasi yang bener-bener dibutuhin untuk ngasih rekomendasi personal buat kamu:
            </p>
            <ul style={{ paddingLeft: 20, margin: 0, display: 'flex', flexDirection: 'column', gap: 8, fontSize: 13.5, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
              <li><strong>Profil & Onboarding</strong>: Nama panggilan, usia, status hubungan, preferensi komunikasi, dan topik yang pengin kamu pahami.</li>
              <li><strong>Jawaban Assessment</strong>: Jawaban dari 19 kuis kognitif kamu untuk menghitung dominant style dan confidence score.</li>
              <li><strong>Mood & Jurnal</strong>: Input harian mood tracker (stres, energi, pemicu) dan entri jurnal relasi yang kamu tulis secara sukarela.</li>
              <li><strong>Chat Analyzer</strong>: Teks chat yang kamu tempelkan (paste) untuk dianalisis sentiment dan defensiveness-nya.</li>
            </ul>
          </div>

          {/* Cookies */}
          <div style={{ marginBottom: 28 }}>
            <h3 style={{ fontSize: 16, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 12 }}>2. Penyimpanan Sesi & Cookie</h3>
            <p style={{ fontSize: 13.5, color: 'var(--text-secondary)', lineHeight: 1.6, margin: 0 }}>
              Kita menggunakan cookie HTTP-Only yang aman untuk mencocokkan token sesi browser kamu dengan tabel `sessions` di penyimpanan lokal sistem. Hal ini memastikan sesi kamu tetap aman dan tidak bisa diakses oleh script berbahaya (XSS Protection). Untuk detail lengkapnya, silakan baca <Link href="/cookies" style={{ color: 'var(--brand-blue)', textDecoration: 'none', fontWeight: 600 }}>Kebijakan Cookie</Link> kita.
            </p>
          </div>

          {/* Footer Link */}
          <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
            <span style={{ fontSize: 12.5, color: 'var(--text-muted)' }}>Butuh info atau mau minta penghapusan data?</span>
            <Link href="/kontak" style={{ fontSize: 13, color: 'var(--brand-blue)', fontWeight: 700, textDecoration: 'none' }}>
              Kirim Email Permintaan &rarr;
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
