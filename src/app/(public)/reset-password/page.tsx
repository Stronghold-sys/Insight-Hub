'use client'

import { useState, Suspense } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { Eye, EyeOff, ArrowRight, CheckCircle, AlertCircle, ShieldAlert } from 'lucide-react'
import { validatePassword } from '@/lib/utils'

function ResetPasswordContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get('token') || ''
  const email = searchParams.get('email') || ''

  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [showConfirmPass, setShowConfirmPass] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  if (!token) {
    return (
      <div style={{ background: 'transparent', minHeight: 'calc(100vh - 64px)', display: 'flex', alignItems: 'center', padding: '40px 0' }}>
        <div className="container" style={{ maxWidth: 440 }}>
          <div className="card" style={{ padding: 32, textAlign: 'center' }}>
            <div style={{
              width: 56, height: 56, borderRadius: 14,
              background: 'rgba(211,47,47,0.08)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 20px',
            }}>
              <ShieldAlert size={26} color="var(--error)" />
            </div>
            <h1 style={{ fontSize: 21, fontWeight: 800, marginBottom: 12 }}>Token Nggak Valid</h1>
            <p style={{ color: 'var(--text-secondary)', marginBottom: 28, fontSize: 13, lineHeight: 1.6 }}>
              Akses halaman ini diblokir karena token keamanan kamu nggak ada atau udah kadaluarsa. Silakan ajukan lupa password lagi ya!
            </p>
            <Link href="/lupa-password" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', fontWeight: 700 }}>
              Minta Link Reset Baru
            </Link>
          </div>
        </div>
      </div>
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    const passValidation = validatePassword(password)
    if (!passValidation.valid) {
      setError(passValidation.errors[0] || 'Password kurang kuat nih!')
      return
    }

    if (password !== confirmPassword) {
      setError('Password baru dan konfirmasi password-nya nggak cocok!')
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password, confirmPassword }),
      })
      const data = await res.json()
      if (res.ok && data.success) {
        setSuccess('Password baru berhasil dibuat! Sedang mengarahkan ke halaman masuk...')
        setTimeout(() => {
          router.push('/masuk?verified=1')
        }, 2000)
      } else {
        setError(data.message || 'Gagal mengubah password. Silakan coba lagi!')
      }
    } catch {
      setError('Gagal konek ke server. Coba beberapa saat lagi ya!')
    } finally {
      setLoading(false)
    }
  }

  const passStrength = (() => {
    const p = password
    if (p.length === 0) return null
    let score = 0
    if (p.length >= 8) score++
    if (/[A-Z]/.test(p)) score++
    if (/[0-9]/.test(p)) score++
    if (/[^A-Za-z0-9]/.test(p)) score++
    if (score <= 1) return { label: 'Lemah', color: 'var(--error)', width: 25 }
    if (score === 2) return { label: 'Cukup', color: 'var(--warning)', width: 50 }
    if (score === 3) return { label: 'Bagus', color: 'var(--brand-blue)', width: 75 }
    return { label: 'Kuat banget!', color: 'var(--teal)', width: 100 }
  })()

  return (
    <div style={{ background: 'transparent', minHeight: 'calc(100vh - 64px)', display: 'flex', alignItems: 'center', padding: '40px 0' }}>
      <div className="container" style={{ maxWidth: 440 }}>
        <div className="card" style={{ padding: 32 }}>

          <div style={{ textAlign: 'center', marginBottom: 28 }}>
            <h1 style={{ fontSize: 22, fontWeight: 800, color: 'var(--text-primary)', margin: '0 0 8px' }}>Buat Password Baru</h1>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6, margin: 0 }}>
              Masukin password baru kamu buat mengamankan akun. Jangan sampai lupa lagi ya!
            </p>
          </div>

          {error && (
            <div style={{
              background: 'rgba(211,47,47,0.08)', border: '1px solid var(--error)',
              borderRadius: 8, padding: '10px 14px', marginBottom: 18,
              display: 'flex', gap: 8, alignItems: 'flex-start',
              color: 'var(--error)', fontSize: 13,
            }}>
              <AlertCircle size={15} style={{ flexShrink: 0, marginTop: 1 }} />
              {error}
            </div>
          )}
          {success && (
            <div style={{
              background: 'rgba(23,184,151,0.08)', border: '1px solid var(--teal)',
              borderRadius: 8, padding: '10px 14px', marginBottom: 18,
              display: 'flex', gap: 8, alignItems: 'center',
              color: 'var(--teal)', fontSize: 13,
            }}>
              <CheckCircle size={15} style={{ flexShrink: 0 }} />
              {success}
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Password */}
            <div>
              <label className="label" htmlFor="password">Password Baru</label>
              <div style={{ position: 'relative' }}>
                <input
                  id="password"
                  type={showPass ? 'text' : 'password'}
                  className="input"
                  placeholder="Min. 8 karakter, ada angka & huruf kapital"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  disabled={loading}
                  style={{ paddingRight: 44 }}
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  style={{
                    position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                    background: 'none', border: 'none', cursor: 'pointer',
                    color: 'var(--text-muted)', padding: 4,
                  }}
                >
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {passStrength && (
                <div style={{ marginTop: 8 }}>
                  <div className="progress-bar">
                    <div className="progress-fill" style={{ width: `${passStrength.width}%`, background: passStrength.color, transition: 'width 300ms ease, background 300ms ease' }} />
                  </div>
                  <p style={{ fontSize: 11, color: passStrength.color, fontWeight: 600, marginTop: 4 }}>Password {passStrength.label}</p>
                </div>
              )}
            </div>

            {/* Confirm Password */}
            <div>
              <label className="label" htmlFor="confirmPassword">Konfirmasi Password</label>
              <div style={{ position: 'relative' }}>
                <input
                  id="confirmPassword"
                  type={showConfirmPass ? 'text' : 'password'}
                  className="input"
                  placeholder="Ketik ulang password baru kamu"
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  disabled={loading}
                  style={{ paddingRight: 44 }}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPass(!showConfirmPass)}
                  style={{
                    position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                    background: 'none', border: 'none', cursor: 'pointer',
                    color: 'var(--text-muted)', padding: 4,
                  }}
                >
                  {showConfirmPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || !password || !confirmPassword}
              className="btn btn-primary"
              style={{ width: '100%', justifyContent: 'center', gap: 8, fontWeight: 700, marginTop: 8 }}
            >
              {loading ? (
                <>
                  <div className="spinner spinner-sm" style={{ borderColor: 'rgba(255,255,255,0.3)', borderTopColor: 'white' }} />
                  Lagi diproses...
                </>
              ) : (
                <>Simpan Password Baru <ArrowRight size={14} /></>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <div style={{ minHeight: 'calc(100vh - 64px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="spinner" style={{ borderColor: 'rgba(2,134,195,0.2)', borderTopColor: 'var(--brand-blue)', width: 32, height: 32 }} />
      </div>
    }>
      <ResetPasswordContent />
    </Suspense>
  )
}
