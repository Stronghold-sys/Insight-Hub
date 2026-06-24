'use client'

import { useState, useEffect } from 'react'
import { ArrowRight, Compass, ShieldCheck, User, Users, Smile, MessageSquare, Target } from 'lucide-react'
import { OnboardingMotion } from '@/components/ui/FeedbackStates'

export default function OnboardingPage() {
  const [step, setStep] = useState(1)
  const [formData, setFormData] = useState({
    fullName: '',
    nickname: '',
    age: '',
    relationshipStatus: 'Single',
    relationshipGoal: 'Mau ngerti pola diri sendiri dulu',
    communicationPreference: 'Langsung to-the-point',
    mode: 'solo'
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    // Check if user is logged in
    fetch('/api/auth/me')
      .then(res => res.json())
      .then(data => {
        if (!data.authenticated) {
          window.location.href = '/masuk'
        } else if (data.user?.nickname && data.user?.nickname !== 'Kamu') {
          // If already onboarded, send to dashboard (optional, let them run onboarding again if they want)
        }
      })
  }, [])

  const handleNext = () => {
    if (step === 1 && (!formData.nickname || !formData.age)) {
      setError('Tolong isi nama panggilan dan usia kamu ya!')
      return
    }
    setError('')
    setStep(step + 1)
  }

  const handleSubmit = async () => {
    setLoading(true)
    setError('')

    try {
      const res = await fetch('/api/auth/me', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: formData.fullName || formData.nickname,
          nickname: formData.nickname,
          age: formData.age,
          relationshipStatus: formData.relationshipStatus,
          relationshipGoal: formData.relationshipGoal,
          communicationPreference: formData.communicationPreference,
          mode: formData.mode,
          languageTone: 'genz',
          privacyLevel: 'standard'
        })
      })

      const data = await res.json()
      if (data.success) {
        window.location.href = '/dashboard'
      } else {
        setError(data.error || 'Gagal menyimpan data onboarding.')
      }
    } catch (err) {
      setError('Koneksi ke server terputus. Silakan coba lagi.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ background: 'transparent', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div className="card" style={{ maxWidth: 500, width: '100%', padding: 32 }}>
        
        {/* Progress header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28, borderBottom: '1px solid var(--border-subtle)', paddingBottom: 16 }}>
          <span style={{ fontSize: 12, fontWeight: 800, color: 'var(--brand-blue)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Onboarding {step}/4</span>
          <div style={{ display: 'flex', gap: 6 }}>
            {[1, 2, 3, 4].map(s => (
              <div key={s} style={{ width: 16, height: 6, borderRadius: 2, background: s <= step ? 'var(--brand-blue)' : 'var(--border-subtle)' }} />
            ))}
          </div>
        </div>

        {error && (
          <div style={{ background: 'rgba(211,47,47,0.08)', border: '1px solid rgba(211,47,47,0.2)', color: 'var(--error)', padding: '10px 14px', borderRadius: 6, fontSize: 13, marginBottom: 20 }}>
            {error}
          </div>
        )}

        <OnboardingMotion stepKey={step}>
          {/* Step 1: Identity */}
          {step === 1 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ textAlign: 'center', marginBottom: 8 }}>
                <Smile size={32} color="var(--brand-blue)" style={{ margin: '0 auto 12px' }} />
                <h2 style={{ fontSize: 20, fontWeight: 800, color: 'var(--text-primary)', margin: '0 0 4px' }}>Kenalan Dulu Yuk!</h2>
                <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: 0 }}>Biar sapaan di dashboard kamu lebih personal dan asik.</p>
              </div>

              <div>
                <label htmlFor="nickname" style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 6 }}>Nama Panggilan Kamu</label>
                <input
                  type="text"
                  id="nickname"
                  placeholder="Panggil aku..."
                  value={formData.nickname}
                  onChange={e => setFormData({ ...formData, nickname: e.target.value })}
                  style={{ width: '100%', padding: '10px 14px', borderRadius: 6, border: '1px solid var(--border)', background: 'var(--bg)', fontSize: 13.5 }}
                />
              </div>

              <div>
                <label htmlFor="age" style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 6 }}>Berapa Usia Kamu?</label>
                <input
                  type="number"
                  id="age"
                  placeholder="Contoh: 23"
                  value={formData.age}
                  onChange={e => setFormData({ ...formData, age: e.target.value })}
                  style={{ width: '100%', padding: '10px 14px', borderRadius: 6, border: '1px solid var(--border)', background: 'var(--bg)', fontSize: 13.5 }}
                />
              </div>

              <button onClick={handleNext} className="btn btn-primary" style={{ justifyContent: 'center', gap: 6, marginTop: 12 }}>
                Lanjut
                <ArrowRight size={14} />
              </button>
            </div>
          )}

          {/* Step 2: Relationship Status & Goals */}
          {step === 2 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ textAlign: 'center', marginBottom: 8 }}>
                <Target size={32} color="var(--teal)" style={{ margin: '0 auto 12px' }} />
                <h2 style={{ fontSize: 20, fontWeight: 800, color: 'var(--text-primary)', margin: '0 0 4px' }}>Status & Goal Hubungan</h2>
                <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: 0 }}>Kita bakal menyesuaikan tipe rekomendasi artikel relasi kamu.</p>
              </div>

              <div>
                <label htmlFor="status" style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 6 }}>Status Hubungan Saat Ini</label>
                <select
                  id="status"
                  value={formData.relationshipStatus}
                  onChange={e => setFormData({ ...formData, relationshipStatus: e.target.value })}
                  style={{ width: '100%', padding: '10px 14px', borderRadius: 6, border: '1px solid var(--border)', background: 'var(--bg)', fontSize: 13.5 }}
                >
                  <option value="Single">Jomblo / Single</option>
                  <option value="Pacaran">Pacaran</option>
                  <option value="Menikah">Menikah</option>
                  <option value="Rumit">Hubungan Tanpa Status (HTS) / Rumit</option>
                </select>
              </div>

              <div>
                <label htmlFor="goal" style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 6 }}>Tujuan Pakai Insight Hub</label>
                <select
                  id="goal"
                  value={formData.relationshipGoal}
                  onChange={e => setFormData({ ...formData, relationshipGoal: e.target.value })}
                  style={{ width: '100%', padding: '10px 14px', borderRadius: 6, border: '1px solid var(--border)', background: 'var(--bg)', fontSize: 13.5 }}
                >
                  <option value="Mau ngerti pola diri sendiri dulu">Mau ngerti pola diri sendiri dulu</option>
                  <option value="Pengin kurangi overthinking pas pacaran">Pengin kurangi overthinking pas pacaran</option>
                  <option value="Belajar kelola konflik biar gak gampang putus">Belajar kelola konflik biar gak gampang putus</option>
                  <option value="Mau melatih boundaries asertif">Mau melatih boundaries asertif</option>
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 12 }}>
                <button onClick={() => setStep(1)} className="btn btn-secondary" style={{ justifyContent: 'center', border: '1px solid var(--border)' }}>Kembali</button>
                <button onClick={handleNext} className="btn btn-primary" style={{ justifyContent: 'center', gap: 6 }}>
                  Lanjut
                  <ArrowRight size={14} />
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Communication Preference */}
          {step === 3 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ textAlign: 'center', marginBottom: 8 }}>
                <MessageSquare size={32} color="#F5A623" style={{ margin: '0 auto 12px' }} />
                <h2 style={{ fontSize: 20, fontWeight: 800, color: 'var(--text-primary)', margin: '0 0 4px' }}>Gaya Komunikasi Pilihan</h2>
                <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: 0 }}>Gimana cara kamu biasanya ngomongin unek-unek?</p>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {[
                  'Langsung to-the-point',
                  'Basa-basi dulu biar gak tersinggung',
                  'Mending nunggu momen pas baru ngomong',
                  'Sering dipendam sendiri aja'
                ].map(pref => (
                  <button
                    key={pref}
                    onClick={() => setFormData({ ...formData, communicationPreference: pref })}
                    style={{
                      padding: '14px 16px', borderRadius: 6, textAlign: 'left',
                      background: formData.communicationPreference === pref ? 'rgba(2,134,195,0.05)' : 'var(--surface)',
                      border: formData.communicationPreference === pref ? '2px solid var(--brand-blue)' : '1px solid var(--border)',
                      fontSize: 13, color: 'var(--text-primary)', cursor: 'pointer', transition: 'all 100ms ease'
                    }}
                  >
                    {pref}
                  </button>
                ))}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 12 }}>
                <button onClick={() => setStep(2)} className="btn btn-secondary" style={{ justifyContent: 'center', border: '1px solid var(--border)' }}>Kembali</button>
                <button onClick={handleNext} className="btn btn-primary" style={{ justifyContent: 'center', gap: 6 }}>
                  Lanjut
                  <ArrowRight size={14} />
                </button>
              </div>
            </div>
          )}

          {/* Step 4: Mode Selection & Confirm */}
          {step === 4 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ textAlign: 'center', marginBottom: 8 }}>
                <Compass size={32} color="var(--brand-blue)" style={{ margin: '0 auto 12px' }} />
                <h2 style={{ fontSize: 20, fontWeight: 800, color: 'var(--text-primary)', margin: '0 0 4px' }}>Pilih Mode Penggunaan</h2>
                <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: 0 }}>Gimana rencana kamu memakai platform ini?</p>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 12 }}>
                <button
                  onClick={() => setFormData({ ...formData, mode: 'solo' })}
                  style={{
                    padding: 20, borderRadius: 8, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
                    background: formData.mode === 'solo' ? 'rgba(2,134,195,0.05)' : 'var(--surface)',
                    border: formData.mode === 'solo' ? '2px solid var(--brand-blue)' : '1px solid var(--border)',
                    cursor: 'pointer', transition: 'all 100ms ease'
                  }}
                >
                  <User size={20} color="var(--brand-blue)" />
                  <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>Solo Mode</span>
                  <span style={{ fontSize: 11, color: 'var(--text-secondary)', textAlign: 'center' }}>Refleksi mandiri kenal diri sendiri</span>
                </button>

                <button
                  onClick={() => setFormData({ ...formData, mode: 'couple' })}
                  style={{
                    padding: 20, borderRadius: 8, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
                    background: formData.mode === 'couple' ? 'rgba(233,30,99,0.05)' : 'var(--surface)',
                    border: formData.mode === 'couple' ? '2px solid #E91E63' : '1px solid var(--border)',
                    cursor: 'pointer', transition: 'all 100ms ease'
                  }}
                >
                  <Users size={20} color="#E91E63" />
                  <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>Couple Mode</span>
                  <span style={{ fontSize: 11, color: 'var(--text-secondary)', textAlign: 'center' }}>Hubungkan akun dengan pasangan</span>
                </button>
              </div>

              <div style={{ background: 'var(--bg)', padding: 14, borderRadius: 6, border: '1px solid var(--border-subtle)', fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                Data kamu dienkripsi secara penuh. Kamu bisa ganti pilihan mode atau edit data ini kapan aja lewat halaman pengaturan akun.
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 12 }}>
                <button onClick={() => setStep(3)} className="btn btn-secondary" style={{ justifyContent: 'center', border: '1px solid var(--border)' }}>Kembali</button>
                <button onClick={handleSubmit} disabled={loading} className="btn btn-primary" style={{ justifyContent: 'center', gap: 6 }}>
                  {loading ? 'Menyimpan...' : 'Selesai & Masuk'}
                </button>
              </div>
            </div>
          )}
        </OnboardingMotion>
      </div>
    </div>
  )
}
