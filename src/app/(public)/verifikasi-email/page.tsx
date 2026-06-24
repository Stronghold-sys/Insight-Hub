'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { CheckCircle, AlertTriangle, ArrowRight } from 'lucide-react'

export default function VerifikasiEmailPage() {
  const [status, setStatus] = useState<'verifying' | 'success' | 'error'>('verifying')

  useEffect(() => {
    // Simulate verification checking delay
    const timer = setTimeout(() => {
      setStatus('success')
    }, 2000)
    return () => clearTimeout(timer)
  }, [])

  return (
    <div style={{ background: 'transparent', minHeight: 'calc(100vh - 64px)', display: 'flex', alignItems: 'center', padding: '40px 0' }}>
      <div className="container" style={{ maxWidth: 440 }}>
        <div className="card" style={{ padding: 32, textAlign: 'center' }}>
          
          {status === 'verifying' && (
            <div style={{ padding: '24px 0' }}>
              <div className="spinner" style={{ borderColor: 'rgba(2,134,195,0.2)', borderTopColor: 'var(--brand-blue)', width: 44, height: 44, margin: '0 auto 20px' }} />
              <h2 style={{ fontSize: 18, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 8 }}>Memverifikasi Email Kamu...</h2>
              <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: 0 }}>Sabar ya, sistem kita lagi mencocokkan token keamanan akun kamu.</p>
            </div>
          )}

          {status === 'success' && (
            <div>
              <div style={{ color: 'var(--teal)', display: 'inline-block', marginBottom: 16 }}>
                <CheckCircle size={52} />
              </div>
              <h2 style={{ fontSize: 20, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 8 }}>Email Berhasil Diverifikasi!</h2>
              <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: 24 }}>
                Mantap! Akun kamu sekarang sudah aktif sepenuhnya. Yuk, masuk dan mulai kuis assessment kamu pertama kali.
              </p>
              <Link href="/masuk" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', gap: 6 }}>
                Masuk Sekarang
                <ArrowRight size={14} />
              </Link>
            </div>
          )}

          {status === 'error' && (
            <div>
              <div style={{ color: 'var(--error)', display: 'inline-block', marginBottom: 16 }}>
                <AlertTriangle size={52} />
              </div>
              <h2 style={{ fontSize: 20, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 8 }}>Verifikasi Gagal</h2>
              <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: 24 }}>
                Token keamanan kamu sepertinya udah kedaluwarsa atau gak valid. Coba minta kirim ulang email verifikasi baru di halaman login.
              </p>
              <Link href="/masuk" className="btn btn-secondary" style={{ width: '100%', justifyContent: 'center', border: '1px solid var(--border)' }}>
                Kembali ke Halaman Masuk
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
