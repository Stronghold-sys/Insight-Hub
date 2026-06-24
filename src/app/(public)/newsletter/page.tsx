'use client'

import { useState } from 'react'
import { Mail, CheckCircle, ArrowRight } from 'lucide-react'
import Link from 'next/link'

export default function NewsletterPage() {
  const [email, setEmail] = useState('')
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) {
      setError('Tolong masukkan email kamu dulu ya!')
      return
    }
    setError('')
    setLoading(true)

    try {
      // Post email subscription to email_logs
      const res = await fetch('/api/admin/cms?module=newsletter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      })

      const data = await res.json()
      if (data.success) {
        setSuccess(true)
      } else {
        setError(data.error || 'Terjadi kesalahan. Coba lagi.')
      }
    } catch (err) {
      setError('Gagal tersambung ke server. Coba beberapa saat lagi.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ background: 'transparent', minHeight: 'calc(100vh - 64px)', display: 'flex', alignItems: 'center', padding: '40px 0' }}>
      <div className="container" style={{ maxWidth: 500 }}>
        <div className="card" style={{ padding: 40, textAlign: 'center' }}>
          {/* Icon */}
          <div style={{
            width: 52, height: 52, borderRadius: 999, background: 'rgba(2,134,195,0.08)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--brand-blue)', margin: '0 auto 20px'
          }}>
            <Mail size={24} />
          </div>

          <span style={{
            fontSize: 10, fontWeight: 800, color: 'var(--brand-blue)',
            background: 'rgba(2,134,195,0.08)', padding: '4px 10px', borderRadius: 4,
            textTransform: 'uppercase', letterSpacing: '0.05em'
          }}>
            Weekly Relationship Insight
          </span>

          <h1 style={{ fontSize: 24, fontWeight: 800, color: 'var(--text-primary)', marginTop: 16, marginBottom: 12, letterSpacing: '-0.02em' }}>
            Langganan Buletin Hubungan
          </h1>

          <p style={{ fontSize: 13.5, color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: 28 }}>
            Dapatkan kiriman email mingguan yang bedah pola komunikasi, tips mengatasi silent treatment, dan guide boundaries yang gampang dipraktikkan. Tanpa spam, janji!
          </p>

          {success ? (
            <div style={{ background: 'rgba(23,184,151,0.06)', border: '1px solid rgba(23,184,151,0.15)', borderRadius: 8, padding: 24 }}>
              <div style={{ color: 'var(--teal)', display: 'inline-block', marginBottom: 12 }}>
                <CheckCircle size={36} />
              </div>
              <h4 style={{ fontSize: 15, fontWeight: 800, color: 'var(--text-primary)', margin: '0 0 4px' }}>Berhasil Langganan!</h4>
              <p style={{ fontSize: 12.5, color: 'var(--text-secondary)', lineHeight: 1.5, margin: 0 }}>
                Selamat! Kamu bakal dikirimin artikel edisi perdana besok pagi di <strong>{email}</strong>.
              </p>
              <Link href="/blog" className="btn btn-secondary btn-sm" style={{ marginTop: 16, border: '1px solid var(--border)', textDecoration: 'none' }}>
                Baca Blog Dulu
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubscribe} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {error && (
                <div style={{ background: 'rgba(211,47,47,0.08)', border: '1px solid rgba(211,47,47,0.2)', color: 'var(--error)', padding: '10px 14px', borderRadius: 6, fontSize: 12.5, textAlign: 'left' }}>
                  {error}
                </div>
              )}

              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}>
                  <Mail size={16} />
                </span>
                <input
                  type="email"
                  placeholder="email@kamu.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  style={{
                    width: '100%', padding: '12px 14px 12px 38px', borderRadius: 6,
                    border: '1px solid var(--border)', background: 'var(--bg)',
                    fontSize: 13.5, outline: 'none'
                  }}
                />
              </div>

              <button type="submit" disabled={loading} className="btn btn-primary" style={{ justifyContent: 'center', gap: 6 }}>
                {loading ? 'Menghubungkan...' : 'Langganan Sekarang'}
                <ArrowRight size={14} />
              </button>

              <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: '12px 0 0' }}>
                Dengan menekan tombol, kamu setuju dengan kebijakan data kami. Kamu bisa unsubscribe kapan saja lewat link di kaki email.
              </p>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
