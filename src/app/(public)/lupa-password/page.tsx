'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Mail, ArrowRight, AlertCircle, ArrowLeft } from 'lucide-react'
import { validateEmail } from '@/lib/utils'

export default function LupaPasswordPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [sent, setSent] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!validateEmail(email)) {
      setError('Format email-nya kurang bener nih, cek lagi ya!')
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      const data = await res.json()

      if (res.status === 429) {
        setError(data.message || 'Terlalu banyak permintaan. Tunggu sebentar ya!')
      } else if (res.status === 500) {
        setError(data.message || 'Gagal kirim email. Coba lagi ya!')
      } else {
        setSent(true)
      }
    } catch {
      setError('Gagal konek ke server. Pastikan koneksi internet kamu aktif ya!')
    } finally {
      setLoading(false)
    }
  }

  if (sent) {
    return (
      <div style={{ background: 'transparent', minHeight: 'calc(100vh - 64px)', display: 'flex', alignItems: 'center', padding: '40px 0' }}>
        <div className="container" style={{ maxWidth: 440 }}>
          <div className="card" style={{ padding: 32, textAlign: 'center' }}>
            <div style={{
              width: 64, height: 64, borderRadius: '50%',
              background: 'rgba(23,184,151,0.1)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 20px',
            }}>
              <Mail size={28} color="var(--teal)" />
            </div>
            <h2 style={{ marginBottom: 12 }}>Cek email kamu!</h2>
            <p style={{ color: 'var(--text-secondary)', marginBottom: 8, lineHeight: 1.7, fontSize: 14 }}>
              Kalau email <strong style={{ color: 'var(--text-primary)' }}>{email}</strong> terdaftar,
              kode verifikasi udah kami kirim ke sana.
            </p>
            <p style={{ color: 'var(--text-muted)', marginBottom: 28, fontSize: 13 }}>
              Nggak nemu? Cek folder <strong>Spam</strong> atau <strong>Promosi</strong> ya!
            </p>
            <button
              onClick={() => router.push(`/verifikasi-otp?email=${encodeURIComponent(email)}&purpose=forgot_password`)}
              className="btn btn-primary"
              style={{ width: '100%', justifyContent: 'center', marginBottom: 12, fontWeight: 700 }}
            >
              Masukin Kode Verifikasi
              <ArrowRight size={16} />
            </button>
            <button
              onClick={() => setSent(false)}
              style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: 13, cursor: 'pointer', padding: '8px 0' }}
            >
              Ganti email
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div style={{ background: 'transparent', minHeight: 'calc(100vh - 64px)', display: 'flex', alignItems: 'center', padding: '40px 0' }}>
      <div className="container" style={{ maxWidth: 440 }}>
        <div className="card" style={{ padding: 32 }}>
          <Link href="/masuk" style={{
            display: 'flex', alignItems: 'center', gap: 6, fontSize: 13,
            color: 'var(--text-muted)', textDecoration: 'none', marginBottom: 24,
          }}>
            <ArrowLeft size={14} /> Balik ke halaman masuk
          </Link>

          <div style={{ textAlign: 'center', marginBottom: 28 }}>
            <div style={{
              width: 48, height: 48, borderRadius: 12, background: 'rgba(2,134,195,0.08)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'var(--brand-blue)', margin: '0 auto 16px'
            }}>
              <Mail size={22} />
            </div>
            <h1 style={{ fontSize: 22, fontWeight: 800, color: 'var(--text-primary)', margin: '0 0 8px' }}>Lupa Password?</h1>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6, margin: 0 }}>
              Santai, kami bantu! Masukin email yang kamu pakai waktu daftar,
              kami kirimkan kode verifikasi ke sana.
            </p>
          </div>

          {error && (
            <div style={{
              background: 'rgba(211,47,47,0.08)', border: '1px solid var(--error)',
              borderRadius: 8, padding: '12px 16px', marginBottom: 20,
              display: 'flex', gap: 8, alignItems: 'center',
              color: 'var(--error)', fontSize: 13,
            }}>
              <AlertCircle size={15} style={{ flexShrink: 0 }} />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <label htmlFor="email" className="label">Email kamu</label>
              <input
                type="email"
                id="email"
                className="input"
                placeholder="kamu@email.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                disabled={loading}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary"
              style={{ width: '100%', justifyContent: 'center', gap: 8, fontWeight: 700 }}
            >
              {loading ? (
                <>
                  <div className="spinner spinner-sm" style={{ borderColor: 'rgba(255,255,255,0.3)', borderTopColor: 'white' }} />
                  Lagi dikirim...
                </>
              ) : (
                <>Kirim Kode Verifikasi <ArrowRight size={14} /></>
              )}
            </button>

            <div style={{ textAlign: 'center', marginTop: 4 }}>
              <Link href="/masuk" style={{ fontSize: 13, color: 'var(--text-secondary)', textDecoration: 'none', fontWeight: 600 }}>
                Inget password-nya? <span style={{ color: 'var(--brand-blue)' }}>Masuk di sini</span>
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
