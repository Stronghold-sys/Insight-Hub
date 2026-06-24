'use client'

import Link from 'next/link'
import { FileText, ShieldAlert, Check } from 'lucide-react'

export default function TermsPage() {
  return (
    <div style={{ background: 'transparent', minHeight: 'calc(100vh - 64px)', paddingTop: 48, paddingBottom: 80 }}>
      <div className="container" style={{ maxWidth: 800 }}>
        <div className="card" style={{ padding: 40 }}>
          {/* Header */}
          <div style={{ borderBottom: '1px solid var(--border-subtle)', paddingBottom: 24, marginBottom: 32 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, color: 'var(--brand-blue)', marginBottom: 8 }}>
              <FileText size={28} />
              <span style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Syarat & Ketentuan</span>
            </div>
            <h1 style={{ fontSize: 26, fontWeight: 800, color: 'var(--text-primary)', margin: '4px 0 8px' }}>
              Syarat & Ketentuan Layanan Insight Hub
            </h1>
            <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: 0 }}>Terakhir diperbarui: 23 Juni 2026</p>
          </div>

          {/* Intro */}
          <div style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.7, marginBottom: 28 }}>
            <p>Selamat datang di platform **Insight Hub**! Sebelum kamu menggunakan semua kuis, tracker, dan toolset kita, harap baca aturan main di bawah ini ya. Dengan mendaftar atau memakai situs ini, berarti kamu setuju secara sadar dengan semua syarat ini. Santai, kita tulis dengan bahasa yang gampang dipahami kok!</p>
          </div>

          {/* Disclaimer Alert */}
          <div style={{
            background: 'rgba(211,47,47,0.06)', border: '1px solid rgba(211,47,47,0.15)',
            borderRadius: 8, padding: 20, marginBottom: 28, display: 'flex', gap: 12
          }}>
            <ShieldAlert size={20} color="var(--error)" style={{ flexShrink: 0, marginTop: 2 }} />
            <div>
              <h4 style={{ fontSize: 14, fontWeight: 700, color: 'var(--error)', margin: '0 0 4px' }}>BATASAN LAYANAN & DISCLAIMER KESEHATAN MENTAL</h4>
              <p style={{ fontSize: 12.5, color: 'var(--text-secondary)', lineHeight: 1.5, margin: 0 }}>
                Insight Hub adalah tools edukasi dan sarana refleksi pribadi (self-awareness) untuk hubungan. **Kita sama sekali tidak menyediakan terapi medis, konseling klinis, diagnosa kejiwaan, atau perawatan kesehatan mental.** Layanan ini bukan pengganti psikolog, psikiater, atau terapis profesional. Jika kamu mengalami trauma berat atau kekerasan dalam hubungan, mohon segera mencari bantuan profesional eksternal.
              </p>
            </div>
          </div>

          {/* Section 1 */}
          <div style={{ marginBottom: 24 }}>
            <h3 style={{ fontSize: 16, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 12 }}>1. Akun & Keamanan Data Pengguna</h3>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 10, fontSize: 13.5, color: 'var(--text-secondary)' }}>
              <li style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                <Check size={14} color="var(--teal)" style={{ flexShrink: 0, marginTop: 4 }} />
                <span>Kamu wajib berumur minimal 17 tahun atau memiliki izin orang tua untuk menggunakan platform ini.</span>
              </li>
              <li style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                <Check size={14} color="var(--teal)" style={{ flexShrink: 0, marginTop: 4 }} />
                <span>Kamu bertanggung jawab penuh atas keamanan sandi akun kamu sendiri. Jangan pernah bagikan kredensial kamu ke orang lain.</span>
              </li>
              <li style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                <Check size={14} color="var(--teal)" style={{ flexShrink: 0, marginTop: 4 }} />
                <span>Kita berhak mematikan atau membekukan akun yang terbukti melanggar aturan keamanan atau memanipulasi API server-side kita.</span>
              </li>
            </ul>
          </div>

          {/* Section 2 */}
          <div style={{ marginBottom: 24 }}>
            <h3 style={{ fontSize: 16, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 12 }}>2. Penggunaan Chat Analyzer & Fitur</h3>
            <p style={{ fontSize: 13.5, color: 'var(--text-secondary)', lineHeight: 1.6, margin: '0 0 12px' }}>
              Saat kamu menggunakan fitur Chat Analyzer, kamu setuju untuk hanya mengunggah obrolan/chat yang telah disetujui untuk dianalisis bersama (atau potongan chat pribadi kamu sendiri). Kamu dilarang mengunggah chat milik orang lain tanpa izin eksplisit dari mereka. Kita tidak menyimpan chat asli kamu di luar keperluan analisis sesi, dan enkripsi obrolan dilakukan secara ketat.
            </p>
          </div>

          {/* Section 3 */}
          <div style={{ marginBottom: 24 }}>
            <h3 style={{ fontSize: 16, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 12 }}>3. Sistem Billing & Langganan (Subscription)</h3>
            <p style={{ fontSize: 13.5, color: 'var(--text-secondary)', lineHeight: 1.6, margin: '0 0 12px' }}>
              Paket Premium didefinisikan sebagai paket berlangganan bulanan. Pembayaran diproses secara instan dan kamu berhak melakukan pembatalan kapan saja lewat menu Pengaturan Akun. Pengembalian dana (refund) hanya berlaku jika ada kegagalan sistem pengaktifan paket secara sepihak dari server kita.
            </p>
          </div>

          {/* Footer Link */}
          <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
            <span style={{ fontSize: 12.5, color: 'var(--text-muted)' }}>Punya pertanyaan soal aturan ini?</span>
            <Link href="/kontak" style={{ fontSize: 13, color: 'var(--brand-blue)', fontWeight: 700, textDecoration: 'none' }}>
              Tanya Customer Support &rarr;
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
