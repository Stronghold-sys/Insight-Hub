'use client'

import { useState, Suspense } from 'react'
import Link from 'next/link'
import { useSearchParams, useRouter } from 'next/navigation'
import { Eye, EyeOff, ArrowRight, AlertCircle, CheckCircle } from 'lucide-react'
import { validateEmail } from '@/lib/utils'
import { supabase } from '@/lib/supabaseClient'

function LoginContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [form, setForm] = useState({ email: '', password: '' })
  const [showPass, setShowPass] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)
  const [authError, setAuthError] = useState('')
  const [showSuccessModal, setShowSuccessModal] = useState(false)
  const [successName, setSuccessName] = useState('')
  const justVerified = searchParams.get('verified') === '1'

  const validate = () => {
    const errs: Record<string, string> = {}
    if (!validateEmail(form.email)) errs.email = 'Format email-nya kurang bener nih'
    if (!form.password) errs.password = 'Password-nya jangan dikosongkan'
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setAuthError('')
    if (!validate()) return
    setLoading(true)
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });
      const data = await res.json();
      setLoading(false);
      if (res.ok && data.success) {
        // Sync Supabase Auth session on the client-side
        if (data.session) {
          await supabase.auth.setSession({
            access_token: data.session.access_token,
            refresh_token: data.session.refresh_token
          });
        }

        // Show success modal
        setSuccessName(data.user?.nickname || 'Kamu')
        setShowSuccessModal(true)

        // Cookie sudah di-set di response header oleh server.
        // Langsung redirect setelah 1.5 detik.
        const redirectUrl = searchParams.get('redirect');
        const destination = data.user.role === 'admin'
          ? '/admin'
          : redirectUrl || '/dashboard';

        setTimeout(() => {
          window.location.href = destination;
        }, 1500);

      } else if (res.status === 403 && data.requiresVerification) {
        // Akun belum diverifikasi — arahkan ke OTP
        const redirectParam = searchParams.get('redirect')
        router.push(`/verifikasi-otp?email=${encodeURIComponent(data.email || form.email)}&purpose=register${redirectParam ? `&redirect=${encodeURIComponent(redirectParam)}` : ''}`)
      } else {
        setAuthError(data.message || 'Waduh, gagal masuk nih.');
      }
    } catch (err) {
      setLoading(false);
      console.error('Login fetch error:', err);
      setAuthError('Gagal menyambung ke server. Coba beberapa saat lagi ya!');
    }
  }

  return (
    <>
      {/* Success Modal */}
      {showSuccessModal && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 9999,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: 'rgba(0,0,0,0.45)',
          backdropFilter: 'blur(6px)',
          animation: 'fadeIn 0.2s ease',
        }}>
          <div style={{
            background: 'var(--surface, #fff)',
            borderRadius: 20,
            padding: '48px 40px',
            maxWidth: 380,
            width: '90%',
            textAlign: 'center',
            boxShadow: '0 24px 80px rgba(0,0,0,0.2)',
            animation: 'slideUp 0.3s ease',
          }}>
            {/* Animated checkmark circle */}
            <div style={{
              width: 72, height: 72,
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #0286C3, #17B897)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 24px',
              boxShadow: '0 8px 24px rgba(2,134,195,0.35)',
            }}>
              <CheckCircle size={36} color="white" strokeWidth={2.5} />
            </div>
            <h2 style={{ fontSize: 22, fontWeight: 800, marginBottom: 8, color: 'var(--text-primary, #111)' }}>
              Selamat datang kembali!
            </h2>
            <p style={{ color: 'var(--text-secondary, #666)', fontSize: 15, marginBottom: 24 }}>
              Halo <strong>{successName}</strong>! Kamu berhasil masuk. Mengarahkan ke dasbor...
            </p>
            {/* Progress bar */}
            <div style={{
              height: 4, borderRadius: 4,
              background: 'var(--border, #eee)',
              overflow: 'hidden',
            }}>
              <div style={{
                height: '100%',
                background: 'linear-gradient(90deg, #0286C3, #17B897)',
                animation: 'progressBar 1.5s linear forwards',
              }} />
            </div>
          </div>
          <style>{`
            @keyframes fadeIn { from { opacity: 0 } to { opacity: 1 } }
            @keyframes slideUp { from { transform: translateY(20px); opacity: 0 } to { transform: translateY(0); opacity: 1 } }
            @keyframes progressBar { from { width: 0% } to { width: 100% } }
          `}</style>
        </div>
      )}

      <div style={{ minHeight: '100vh', background: 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        <div style={{ maxWidth: 440, width: '100%' }} className="animate-fadein">
          {/* Logo */}
          <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none', marginBottom: 40, justifyContent: 'center' }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: 'linear-gradient(135deg, #0286C3, #17B897)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
              </svg>
            </div>
            <span style={{ fontWeight: 800, fontSize: 18, color: 'var(--text-primary)' }}>Insight Hub</span>
          </Link>

          <div className="card" style={{ padding: 40 }}>
            <h1 style={{ fontSize: 22, textAlign: 'center', marginBottom: 8 }}>Selamat balik!</h1>
            <p style={{ textAlign: 'center', marginBottom: 32, color: 'var(--text-secondary)' }}>
              Belum punya akun?{' '}
              <Link href={`/daftar${searchParams.get('redirect') ? `?redirect=${encodeURIComponent(searchParams.get('redirect')!)}` : ''}`} style={{ color: 'var(--brand-blue)', fontWeight: 600, textDecoration: 'none' }}>Daftar gratis</Link>
            </p>

            {justVerified && (
              <div style={{
                background: 'rgba(23,184,151,0.08)', border: '1px solid var(--teal)',
                borderRadius: 6, padding: '12px 16px', marginBottom: 20,
                display: 'flex', gap: 8, alignItems: 'center',
                color: 'var(--teal)', fontSize: 14,
              }}>
                <CheckCircle size={16} />
                Akun kamu udah aktif! Langsung masuk ya.
              </div>
            )}

            {authError && (
              <div style={{
                background: 'rgba(211,47,47,0.08)', border: '1px solid var(--error)',
                borderRadius: 6, padding: '12px 16px', marginBottom: 20,
                display: 'flex', gap: 8, alignItems: 'center',
                color: 'var(--error)', fontSize: 14,
              }}>
                <AlertCircle size={16} />
                {authError}
              </div>
            )}

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <div>
                <label className="label" htmlFor="email">Email</label>
                <input
                  id="email"
                  type="email"
                  className={`input ${errors.email ? 'input-error' : ''}`}
                  placeholder="kamu@email.com"
                  value={form.email}
                  onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                  disabled={loading}
                />
                {errors.email && (
                  <p style={{ color: 'var(--error)', fontSize: 12, marginTop: 4 }}>{errors.email}</p>
                )}
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                  <label className="label" htmlFor="password" style={{ margin: 0 }}>Password</label>
                  <Link href="/lupa-password" style={{ fontSize: 12, color: 'var(--brand-blue)', textDecoration: 'none', fontWeight: 500 }}>
                    Lupa password?
                  </Link>
                </div>
                <div style={{ position: 'relative' }}>
                  <input
                    id="password"
                    type={showPass ? 'text' : 'password'}
                    className={`input ${errors.password ? 'input-error' : ''}`}
                    placeholder="Password kamu"
                    value={form.password}
                    onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                    disabled={loading}
                    style={{ paddingRight: 44 }}
                  />
                  <button
                    type="button"
                    aria-label={showPass ? 'Sembunyikan password' : 'Tampilkan password'}
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
                {errors.password && (
                  <p style={{ color: 'var(--error)', fontSize: 12, marginTop: 4 }}>{errors.password}</p>
                )}
              </div>

              <button
                type="submit"
                className="btn btn-primary"
                disabled={loading}
                style={{ width: '100%', justifyContent: 'center', padding: '12px 24px', fontSize: 15, fontWeight: 700, marginTop: 4 }}
              >
                {loading ? (
                  <>
                    <div className="spinner spinner-sm" style={{ borderColor: 'rgba(255,255,255,0.3)', borderTopColor: 'white' }} />
                    Lagi dicek...
                  </>
                ) : (
                  <>
                    Masuk
                    <ArrowRight size={16} />
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Demo access */}
          <div style={{ textAlign: 'center', marginTop: 20 }}>
            <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>
              Mau lihat dulu?{' '}
              <Link href="/demo" style={{ color: 'var(--brand-blue)', fontWeight: 600, textDecoration: 'none' }}>
                Coba demo gratis tanpa daftar
              </Link>
            </p>
          </div>
        </div>
      </div>
    </>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)' }}>
        <div className="spinner" style={{ borderColor: 'rgba(2,134,195,0.2)', borderTopColor: 'var(--brand-blue)', width: 32, height: 32 }} />
      </div>
    }>
      <LoginContent />
    </Suspense>
  )
}
