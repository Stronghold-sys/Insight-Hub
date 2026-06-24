'use client'

import Link from 'next/link'
import { Info, Check } from 'lucide-react'

export default function CookiesPage() {
  return (
    <div style={{ background: 'transparent', minHeight: 'calc(100vh - 64px)', paddingTop: 48, paddingBottom: 80 }}>
      <div className="container" style={{ maxWidth: 800 }}>
        <div className="card" style={{ padding: 40 }}>
          {/* Header */}
          <div style={{ borderBottom: '1px solid var(--border-subtle)', paddingBottom: 24, marginBottom: 32 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, color: 'var(--brand-blue)', marginBottom: 8 }}>
              <Info size={28} />
              <span style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Penggunaan Cookie</span>
            </div>
            <h1 style={{ fontSize: 26, fontWeight: 800, color: 'var(--text-primary)', margin: '4px 0 8px' }}>
              Kebijakan Cookie Insight Hub
            </h1>
            <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: 0 }}>Terakhir diperbarui: 23 Juni 2026</p>
          </div>

          {/* Intro */}
          <div style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.7, marginBottom: 28 }}>
            <p>Di **Insight Hub**, kita pakai cookie dan teknologi pelacakan sejenis buat memastikan website kita berjalan lancar, aman, dan bisa nyimpen sesi login kamu tanpa bikin kamu masuk berulang kali. Di bawah ini penjelasan super singkat dan padatnya!</p>
          </div>

          {/* Cookie Types */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20, marginBottom: 32 }}>
            <div style={{ background: 'var(--bg)', padding: 20, borderRadius: 8, border: '1px solid var(--border-subtle)' }}>
              <h4 style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 8px', display: 'flex', alignItems: 'center', gap: 8 }}>
                <Check size={16} color="var(--brand-blue)" />
                Cookie Wajib (Essential Session Cookies)
              </h4>
              <p style={{ fontSize: 12.5, color: 'var(--text-secondary)', margin: 0, lineHeight: 1.5 }}>
                Ini cookie penting buat nyimpen session ID login kamu. Cookie ini tergolong **HTTP-Only** dan **Secure**, artinya tidak bisa dibaca oleh kode JavaScript jahat, sehingga akun kamu aman dari pencurian sesi.
              </p>
            </div>

            <div style={{ background: 'var(--bg)', padding: 20, borderRadius: 8, border: '1px solid var(--border-subtle)' }}>
              <h4 style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 8px', display: 'flex', alignItems: 'center', gap: 8 }}>
                <Check size={16} color="var(--teal)" />
                Cookie Preferensi (Preference Cookies)
              </h4>
              <p style={{ fontSize: 12.5, color: 'var(--text-secondary)', margin: 0, lineHeight: 1.5 }}>
                Digunakan untuk mengingat preferensi tampilan kamu, seperti pilihan tema (Light Mode atau Dark Mode) dan preferensi bahasa pengantar kuis agar kamu gak perlu nyetel ulang setiap kali ganti halaman.
              </p>
            </div>

            <div style={{ background: 'var(--bg)', padding: 20, borderRadius: 8, border: '1px solid var(--border-subtle)' }}>
              <h4 style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 8px', display: 'flex', alignItems: 'center', gap: 8 }}>
                <Check size={16} color="#F5A623" />
                Cookie Analitik (Analytics Cookies)
              </h4>
              <p style={{ fontSize: 12.5, color: 'var(--text-secondary)', margin: 0, lineHeight: 1.5 }}>
                Kita pakai pelacakan internal yang anonim (tanpa melacak identitas riil kamu) untuk mengukur performa halaman, mendeteksi kuis mana yang paling sering selesai, dan mencari tahu kalau ada halaman yang loading-nya lambat.
              </p>
            </div>
          </div>

          {/* How to disable */}
          <div style={{ marginBottom: 28 }}>
            <h3 style={{ fontSize: 16, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 12 }}>Bagaimana Cara Mengaturnya?</h3>
            <p style={{ fontSize: 13.5, color: 'var(--text-secondary)', lineHeight: 1.6, margin: 0 }}>
              Kamu bebas mematikan cookie lewat pengaturan browser kamu (Chrome, Safari, Firefox, dll). Tapi ingat ya, kalau kamu mematikan Cookie Wajib, fitur login dan pengisian kuis di dashboard Insight Hub tidak akan berfungsi dengan benar. Kamu bisa mengatur persetujuan data kamu kapan saja di halaman <Link href="/consent" style={{ color: 'var(--brand-blue)', textDecoration: 'none', fontWeight: 600 }}>Consent Management</Link> kita.
            </p>
          </div>

          {/* Footer Link */}
          <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
            <span style={{ fontSize: 12.5, color: 'var(--text-muted)' }}>Butuh informasi privasi lebih lanjut?</span>
            <Link href="/privacy" style={{ fontSize: 13, color: 'var(--brand-blue)', fontWeight: 700, textDecoration: 'none' }}>
              Baca Kebijakan Privasi &rarr;
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
