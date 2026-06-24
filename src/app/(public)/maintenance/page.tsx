'use client'

import Link from 'next/link'
import { Hammer, ArrowLeft, RefreshCw } from 'lucide-react'

export default function MaintenancePage() {
  return (
    <div style={{ background: 'transparent', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div className="card" style={{ maxWidth: 480, padding: 40, textAlign: 'center' }}>
        {/* Animated Icon */}
        <div style={{
          width: 56, height: 56, borderRadius: 14, background: 'rgba(245,166,35,0.08)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#F5A623', margin: '0 auto 24px'
        }}>
          <Hammer size={26} className="animate-bounce" />
        </div>

        <span style={{
          fontSize: 10, fontWeight: 800, color: '#F5A623',
          background: 'rgba(245,166,35,0.08)', padding: '4px 10px', borderRadius: 4,
          textTransform: 'uppercase', letterSpacing: '0.05em'
        }}>
          Lagi Update Sistem
        </span>

        <h1 style={{ fontSize: 26, fontWeight: 800, color: 'var(--text-primary)', marginTop: 16, marginBottom: 12, letterSpacing: '-0.02em' }}>
          Server Lagi Istirahat Bentar
        </h1>
        
        <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: 32 }}>
          Santai, kita gak lagi ghosting kamu kok! Kita cuma lagi ngerapihin beberapa bugs dan optimasi server utama biar kuis kamu jalannya lebih sat-set dan asik.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <button onClick={() => window.location.reload()} className="btn btn-primary" style={{ justifyContent: 'center', gap: 8 }}>
            <RefreshCw size={14} />
            Coba Refresh Halaman
          </button>
          <Link href="/" className="btn btn-secondary" style={{ justifyContent: 'center', gap: 8, border: '1px solid var(--border)' }}>
            <ArrowLeft size={14} />
            Balik ke Landing Page
          </Link>
        </div>

        <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 24, marginBlockEnd: 0 }}>
          Estimasi selesai: Hari ini, sekitar 10 menit lagi. Makasih pengertiannya ya!
        </p>
      </div>
    </div>
  )
}
