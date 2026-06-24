'use client'

import Link from 'next/link'
import { AlertTriangle, Home } from 'lucide-react'

export default function NotFound() {
  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'var(--bg, #F7F9FA)',
      fontFamily: 'var(--font-sans, "Avenir Next", system-ui, sans-serif)',
      padding: 16
    }}>
      <div className="card" style={{
        maxWidth: 480,
        padding: 40,
        textAlign: 'center',
        background: 'var(--surface, #FFFFFF)',
        border: '1px solid var(--border, #CFD9E0)',
        borderRadius: 12,
        boxShadow: '0 4px 20px rgba(0,0,0,0.05)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center'
      }}>
        <div style={{
          width: 64,
          height: 64,
          borderRadius: '50%',
          background: 'rgba(211, 47, 47, 0.08)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--error, #D32F2F)',
          marginBottom: 24
        }}>
          <AlertTriangle size={32} />
        </div>

        <h1 style={{
          fontSize: 24,
          fontWeight: 800,
          color: 'var(--text-primary, #1B1E28)',
          marginBottom: 12,
          letterSpacing: '-0.02em'
        }}>
          Waduh, Nyasar Ya?
        </h1>

        <p style={{
          fontSize: 14,
          color: 'var(--text-secondary, #536171)',
          lineHeight: 1.6,
          marginBottom: 32,
          maxWidth: 360
        }}>
          Halaman yang kamu cari nggak ada di radar kita. Mungkin tautannya salah ketik, atau halaman ini udah di-ghosting duluan sama sistem.
        </p>

        <div style={{ display: 'flex', gap: 12, width: '100%', justifyContent: 'center' }}>
          <Link href="/" className="btn btn-primary" style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            justifyContent: 'center',
            padding: '12px 24px',
            fontSize: 14,
            fontWeight: 700,
            textDecoration: 'none'
          }}>
            <Home size={16} />
            Kembali ke Beranda
          </Link>
        </div>
      </div>
    </div>
  )
}
