'use client'

import { useState, useEffect, useRef, Suspense } from 'react'
import Link from 'next/link'
import { useSearchParams, useRouter } from 'next/navigation'
import { Mail, RefreshCw, ArrowLeft, CheckCircle, AlertCircle, Clock } from 'lucide-react'

function VerifikasiOtpContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const email = searchParams.get('email') || ''
  const purpose = (searchParams.get('purpose') || 'register') as 'register' | 'forgot_password'
  const redirect = searchParams.get('redirect') || ''

  const [digits, setDigits] = useState<string[]>(['', '', '', '', '', ''])
  const [loading, setLoading] = useState(false)
  const [resending, setResending] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [cooldown, setCooldown] = useState(0)

  const inputRefs = useRef<(HTMLInputElement | null)[]>([])
  const hasAutoSubmitted = useRef(false)

  // Countdown timer
  useEffect(() => {
    if (cooldown <= 0) return
    const timer = setTimeout(() => setCooldown(c => c - 1), 1000)
    return () => clearTimeout(timer)
  }, [cooldown])

  // Auto-focus first input on mount
  useEffect(() => {
    setTimeout(() => inputRefs.current[0]?.focus(), 100)
  }, [])

  const otp = digits.join('')

  const handleDigitChange = (index: number, value: string) => {
    // Handle paste of full OTP
    if (value.length > 1) {
      const pasted = value.replace(/\D/g, '').slice(0, 6)
      const newDigits = [...digits]
      for (let i = 0; i < pasted.length; i++) {
        if (index + i < 6) newDigits[index + i] = pasted[i]
      }
      setDigits(newDigits)
      const nextIdx = Math.min(index + pasted.length, 5)
      inputRefs.current[nextIdx]?.focus()
      return
    }

    const digit = value.replace(/\D/g, '').slice(-1)
    const newDigits = [...digits]
    newDigits[index] = digit
    setDigits(newDigits)
    if (digit && index < 5) {
      inputRefs.current[index + 1]?.focus()
    }
  }

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus()
    }
  }

  const handleVerify = async (otpCode?: string) => {
    const code = otpCode ?? otp
    if (code.length < 6) {
      setError('Kode OTP-nya belum lengkap. Isi semua 6 digit ya!')
      return
    }
    setError('')
    setLoading(true)
    try {
      const res = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code, purpose }),
      })
      const data = await res.json()
      if (res.ok && data.success) {
        if (purpose === 'register') {
          setSuccess('Yeay! Akun kamu udah aktif. Sedang diarahkan ke halaman masuk...')
          setTimeout(() => {
            router.push(redirect ? `/masuk?redirect=${encodeURIComponent(redirect)}` : '/masuk?verified=1')
          }, 1500)
        } else {
          router.push(`/reset-password?token=${data.resetToken}&email=${encodeURIComponent(email)}`)
        }
      } else {
        setError(data.message || 'Kode OTP salah. Coba lagi ya!')
        if (data.expired) {
          setDigits(['', '', '', '', '', ''])
          hasAutoSubmitted.current = false
          setTimeout(() => inputRefs.current[0]?.focus(), 50)
        }
      }
    } catch {
      setError('Gagal konek ke server. Pastikan koneksi internet kamu aktif ya!')
    } finally {
      setLoading(false)
    }
  }

  const handleResend = async () => {
    if (cooldown > 0) return
    setResending(true)
    setError('')
    try {
      const res = await fetch('/api/auth/resend-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, purpose }),
      })
      const data = await res.json()
      if (res.ok && data.success) {
        setSuccess('Kode baru udah dikirim! Cek inbox atau folder spam kamu.')
        setCooldown(60)
        setDigits(['', '', '', '', '', ''])
        hasAutoSubmitted.current = false
        setTimeout(() => {
          setSuccess('')
          inputRefs.current[0]?.focus()
        }, 5000)
      } else if (res.status === 429) {
        setError(data.message || 'Terlalu banyak permintaan. Tunggu sebentar ya!')
        if (data.cooldown) setCooldown(data.cooldown)
      } else {
        setError(data.message || 'Gagal kirim ulang kode. Coba lagi ya!')
      }
    } catch {
      setError('Gagal konek ke server. Coba lagi beberapa saat ya!')
    } finally {
      setResending(false)
    }
  }

  // Auto-submit when all 6 digits filled
  useEffect(() => {
    const filled = digits.join('')
    if (filled.length === 6 && !loading && !hasAutoSubmitted.current) {
      hasAutoSubmitted.current = true
      handleVerify(filled)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [digits])

  const isRegister = purpose === 'register'
  const maskedEmail = email
    ? email.replace(/(.{2})(.*)(@.*)/, (_, a, b, c) => a + '*'.repeat(Math.min(b.length, 5)) + c)
    : '...'

  return (
    <div style={{ background: 'transparent', minHeight: 'calc(100vh - 64px)', display: 'flex', alignItems: 'center', padding: '40px 0' }}>
      <div className="container" style={{ maxWidth: 440 }}>
        <div className="card" style={{ padding: 32 }}>

          {/* Icon */}
          <div style={{
            width: 56, height: 56, borderRadius: 14,
            background: 'rgba(2,134,195,0.08)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 20px',
          }}>
            <Mail size={26} color="var(--brand-blue)" />
          </div>

          <h1 style={{ fontSize: 21, textAlign: 'center', marginBottom: 8 }}>
            {isRegister ? 'Cek email kamu!' : 'Kode verifikasi dikirim'}
          </h1>
          <p style={{ textAlign: 'center', marginBottom: 6, color: 'var(--text-secondary)', fontSize: 13, lineHeight: 1.6 }}>
            {isRegister
              ? 'Kami udah kirim kode OTP 6 digit ke'
              : 'Kami kirim kode reset password ke'}
          </p>
          <p style={{ textAlign: 'center', marginBottom: 28, fontWeight: 700, color: 'var(--brand-blue)', fontSize: 14 }}>
            {maskedEmail}
          </p>

          {/* Error/Success Banner */}
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

          {/* OTP Input Boxes */}
          <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginBottom: 24 }}>
            {digits.map((digit, i) => (
              <input
                key={i}
                ref={el => { inputRefs.current[i] = el }}
                type="text"
                inputMode="numeric"
                maxLength={6}
                value={digit}
                onChange={e => handleDigitChange(i, e.target.value)}
                onKeyDown={e => handleKeyDown(i, e)}
                disabled={loading}
                style={{
                  width: 48,
                  height: 56,
                  textAlign: 'center',
                  fontSize: 22,
                  fontWeight: 800,
                  border: `2px solid ${digit ? 'var(--brand-blue)' : 'var(--border)'}`,
                  borderRadius: 10,
                  background: digit ? 'rgba(2,134,195,0.04)' : 'var(--surface)',
                  color: 'var(--text-primary)',
                  outline: 'none',
                  transition: 'all 150ms ease',
                  fontFamily: 'monospace',
                  cursor: loading ? 'not-allowed' : 'text',
                }}
                onFocus={e => { e.target.style.borderColor = 'var(--brand-blue)'; e.target.style.boxShadow = '0 0 0 3px rgba(2,134,195,0.12)' }}
                onBlur={e => { e.target.style.borderColor = digit ? 'var(--brand-blue)' : 'var(--border)'; e.target.style.boxShadow = 'none' }}
              />
            ))}
          </div>

          {/* Verify Button */}
          <button
            onClick={() => handleVerify()}
            className="btn btn-primary"
            disabled={loading || otp.length < 6}
            style={{ width: '100%', justifyContent: 'center', padding: '12px 24px', fontSize: 15, fontWeight: 700, marginBottom: 14 }}
          >
            {loading ? (
              <>
                <div className="spinner spinner-sm" style={{ borderColor: 'rgba(255,255,255,0.3)', borderTopColor: 'white' }} />
                Lagi dicek...
              </>
            ) : 'Verifikasi Kode'}
          </button>

          {/* Resend & Tips */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <button
              onClick={handleResend}
              disabled={cooldown > 0 || resending}
              style={{
                background: 'none', border: 'none',
                cursor: cooldown > 0 ? 'not-allowed' : 'pointer',
                color: cooldown > 0 ? 'var(--text-muted)' : 'var(--brand-blue)',
                fontSize: 13, fontWeight: 600,
                display: 'flex', alignItems: 'center', gap: 6, justifyContent: 'center',
                padding: '6px 0',
              }}
            >
              {resending ? (
                <><RefreshCw size={13} style={{ animation: 'spin 1s linear infinite' }} /> Lagi kirim ulang...</>
              ) : cooldown > 0 ? (
                <><Clock size={13} /> Kirim ulang dalam {cooldown}s</>
              ) : (
                <><RefreshCw size={13} /> Kirim ulang kode</>
              )}
            </button>

            <div style={{
              background: 'var(--bg)', borderRadius: 8, padding: '8px 12px',
              fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.6, textAlign: 'center',
            }}>
              Nggak nemu email-nya? Cek folder <strong>Spam</strong> atau <strong>Promosi</strong> dulu ya!
            </div>

            {isRegister ? (
              <Link href="/daftar" style={{ fontSize: 12, color: 'var(--text-muted)', textAlign: 'center', textDecoration: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
                <ArrowLeft size={12} /> Email salah? Ubah email
              </Link>
            ) : (
              <Link href="/lupa-password" style={{ fontSize: 12, color: 'var(--text-muted)', textAlign: 'center', textDecoration: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
                <ArrowLeft size={12} /> Ganti email
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default function VerifikasiOtpPage() {
  return (
    <Suspense fallback={
      <div style={{ minHeight: 'calc(100vh - 64px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="spinner" style={{ borderColor: 'rgba(2,134,195,0.2)', borderTopColor: 'var(--brand-blue)', width: 32, height: 32 }} />
      </div>
    }>
      <VerifikasiOtpContent />
    </Suspense>
  )
}
