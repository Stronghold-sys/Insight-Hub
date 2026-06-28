'use client'

import { useState, useEffect, useRef } from 'react'
import { ArrowRight, Camera, User, Users, Target, MessageSquare, Compass, Upload, CheckCircle2, Loader2, HeartHandshake, Zap } from 'lucide-react'
import { OnboardingMotion } from '@/components/ui/FeedbackStates'

// Plain text renderer — renders paragraphs only, no markdown
function PlainText({ text }: { text: string }) {
  if (!text) return null
  const paragraphs = text.split(/\n\n+/).filter(p => p.trim())
  return (
    <div style={{ fontSize: 14.5, lineHeight: 1.85, color: 'var(--text-secondary)' }}>
      {paragraphs.map((para, i) => (
        <p key={i} style={{ margin: i === 0 ? '0 0 14px' : '0 0 14px' }}>{para.trim()}</p>
      ))}
    </div>
  )
}

export default function OnboardingPage() {
  const [step, setStep] = useState(1) // 1-4 = form steps, 5 = AI analysis
  const [formData, setFormData] = useState({
    fullName: '',
    nickname: '',
    age: '',
    relationshipStatus: 'Single',
    relationshipGoal: 'Mau ngerti pola diri sendiri dulu',
    communicationPreference: 'Langsung to-the-point',
    mode: 'solo'
  })
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [avatarPreview, setAvatarPreview] = useState<string>('')
  const [loading, setLoading] = useState(false)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const [error, setError] = useState('')
  const [roastText, setRoastText] = useState('')
  const [roastLoading, setRoastLoading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    fetch('/api/auth/me')
      .then(res => res.json())
      .then(data => {
        if (!data.authenticated) {
          window.location.href = '/masuk'
        } else if (data.user?.onboardingCompleted) {
          window.location.href = '/dashboard'
        }
      })
  }, [])

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) {
      setError('File harus berupa gambar (JPG, PNG, WEBP).')
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      setError('Ukuran foto maksimal 5MB.')
      return
    }
    setAvatarFile(file)
    const reader = new FileReader()
    reader.onloadend = () => {
      setAvatarPreview(reader.result as string)
    }
    reader.readAsDataURL(file)
    setError('')
  }

  const handleNext = () => {
    if (step === 1) {
      if (!avatarFile) { setError('Upload foto profil dulu ya.'); return }
      if (!formData.nickname.trim()) { setError('Nama panggilan wajib diisi.'); return }
      if (!formData.age || parseInt(formData.age) < 13 || parseInt(formData.age) > 99) {
        setError('Usia harus valid (13-99 tahun).'); return
      }
    }
    setError('')
    setStep(step + 1)
  }

  const handleSubmit = async () => {
    if (!avatarFile) { setError('Upload foto profil dulu ya.'); return }
    setLoading(true)
    setError('')

    try {
      // 1. Upload avatar
      setUploadingAvatar(true)
      const formPayload = new FormData()
      formPayload.append('avatar', avatarFile)
      const uploadRes = await fetch('/api/auth/upload-avatar', {
        method: 'POST',
        body: formPayload
      })
      const uploadData = await uploadRes.json()
      setUploadingAvatar(false)

      if (!uploadData.success) {
        throw new Error(uploadData.error || 'Gagal upload foto profil')
      }

      const avatarUrl = uploadData.url

      // 2. Save profile data with onboarding completed flag
      const profileRes = await fetch('/api/auth/me', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: formData.fullName || formData.nickname,
          nickname: formData.nickname,
          avatarUrl,
          age: formData.age,
          relationshipStatus: formData.relationshipStatus,
          relationshipGoal: formData.relationshipGoal,
          communicationPreference: formData.communicationPreference,
          mode: formData.mode,
          languageTone: 'genz',
          privacyLevel: 'standard',
          onboardingCompleted: true
        })
      })
      const profileData = await profileRes.json()
      if (!profileData.success) {
        throw new Error(profileData.error || 'Gagal menyimpan data profil')
      }

      // 3. Get AI Analysis from Gemini
      setRoastLoading(true)
      setStep(5)
      const roastRes = await fetch('/api/onboarding/roast', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nickname: formData.nickname,
          age: formData.age,
          relationshipStatus: formData.relationshipStatus,
          relationshipGoal: formData.relationshipGoal,
          communicationPreference: formData.communicationPreference
        })
      })
      const roastData = await roastRes.json()
      if (roastData.success && roastData.roast) {
        setRoastText(roastData.roast)
      } else {
        setRoastText(`# Halo ${formData.nickname}!\n\nLo udah berhasil daftar! Selamat datang di Insight Hub, semoga perjalanan relasi lo makin asik dari sini.`)
      }
      setRoastLoading(false)

    } catch (err: any) {
      setError(err.message || 'Koneksi ke server terputus. Silakan coba lagi.')
      setStep(4)
    } finally {
      setLoading(false)
      setUploadingAvatar(false)
    }
  }

  const totalSteps = 4
  const progressPct = Math.min((step / totalSteps) * 100, 100)

  // STEP 5: AI Analysis Screen
  if (step === 5) {
    return (
      <div style={{ background: 'var(--bg)', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        <div className="card" style={{ maxWidth: 560, width: '100%', padding: 36 }}>
          {roastLoading ? (
            <div style={{ textAlign: 'center', padding: '32px 0' }}>
              <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'rgba(2,134,195,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                <Loader2 size={28} color="var(--brand-blue)" style={{ animation: 'spin 1s linear infinite' }} />
              </div>
              <h3 style={{ fontSize: 17, fontWeight: 800, color: 'var(--text-primary)', margin: '0 0 8px' }}>Sistem sedang menganalisis profil kamu...</h3>
              <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: 0 }}>Sabar sebentar, lagi disiapain analisis spesial buat {formData.nickname}</p>
            </div>
          ) : (
            <>
              {/* Avatar + greeting */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20, padding: '14px 16px', background: 'rgba(2,134,195,0.05)', borderRadius: 10, border: '1px solid rgba(2,134,195,0.12)' }}>
                {avatarPreview && (
                  <img src={avatarPreview} alt="Avatar" style={{ width: 56, height: 56, borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--brand-blue)' }} />
                )}
                <div>
                  <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: '0 0 2px', textTransform: 'uppercase', fontWeight: 700 }}>Hei hei hei,</p>
                  <h3 style={{ fontSize: 18, fontWeight: 900, color: 'var(--text-primary)', margin: 0 }}>{formData.nickname}</h3>
                  <p style={{ fontSize: 12, color: 'var(--text-secondary)', margin: 0 }}>Usia {formData.age} tahun · {formData.relationshipStatus}</p>
                </div>
              </div>

              <div style={{ borderBottom: '1px solid var(--border-subtle)', marginBottom: 20, paddingBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                <Zap size={13} color="var(--brand-blue)" />
                <span style={{ fontSize: 11, fontWeight: 800, color: 'var(--brand-blue)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Sambutan untuk kamu</span>
              </div>

              <div style={{ maxHeight: 380, overflowY: 'auto', paddingRight: 4 }}>
                <PlainText text={roastText} />
              </div>

              <div style={{ marginTop: 24, display: 'flex', gap: 12 }}>
                <button
                  onClick={() => window.location.href = '/dashboard'}
                  className="btn btn-primary"
                  style={{ flex: 1, justifyContent: 'center', gap: 8, fontSize: 14, fontWeight: 800 }}
                >
                  Masuk Dashboard
                </button>
              </div>
            </>
          )}
        </div>
        <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
      </div>
    )
  }

  return (
    <div style={{ background: 'var(--bg)', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div className="card" style={{ maxWidth: 500, width: '100%', padding: 32 }}>

        {/* Progress Header */}
        <div style={{ marginBottom: 24, borderBottom: '1px solid var(--border-subtle)', paddingBottom: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <span style={{ fontSize: 11, fontWeight: 800, color: 'var(--brand-blue)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Setup Profil {step}/{totalSteps}</span>
            <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{progressPct.toFixed(0)}%</span>
          </div>
          <div style={{ height: 4, background: 'var(--border-subtle)', borderRadius: 4, overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${progressPct}%`, background: 'linear-gradient(90deg, var(--brand-blue), var(--teal))', borderRadius: 4, transition: 'width 0.3s ease' }} />
          </div>
        </div>

        {/* Error Banner */}
        {error && (
          <div style={{ background: 'rgba(211,47,47,0.08)', border: '1px solid rgba(211,47,47,0.2)', color: 'var(--error)', padding: '10px 14px', borderRadius: 6, fontSize: 13, marginBottom: 20 }}>
            {error}
          </div>
        )}

        <OnboardingMotion stepKey={step}>

          {/* STEP 1: Identity + Photo */}
          {step === 1 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ textAlign: 'center', marginBottom: 4 }}>
                <Camera size={30} color="var(--brand-blue)" style={{ margin: '0 auto 10px' }} />
                <h2 style={{ fontSize: 19, fontWeight: 900, margin: '0 0 4px' }}>Upload Foto Profil Dulu</h2>
                <p style={{ fontSize: 12.5, color: 'var(--text-secondary)', margin: 0 }}>Wajib ya, biar dashboard kamu lebih personal dan gak polos.</p>
              </div>

              {/* Avatar Upload */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
                <div
                  onClick={() => fileInputRef.current?.click()}
                  style={{
                    width: 100, height: 100, borderRadius: '50%', cursor: 'pointer',
                    border: `2px dashed ${avatarPreview ? 'var(--brand-blue)' : 'var(--border)'}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: avatarPreview ? 'transparent' : 'var(--bg)',
                    overflow: 'hidden', position: 'relative',
                    transition: 'all 0.2s ease'
                  }}
                >
                  {avatarPreview ? (
                    <img src={avatarPreview} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <div style={{ textAlign: 'center' }}>
                      <Camera size={24} color="var(--text-muted)" />
                      <p style={{ fontSize: 9.5, color: 'var(--text-muted)', margin: '4px 0 0' }}>Klik untuk upload</p>
                    </div>
                  )}
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarChange}
                  style={{ display: 'none' }}
                  aria-label="Upload foto profil"
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="btn btn-secondary btn-sm"
                  style={{ display: 'inline-flex', gap: 6, alignItems: 'center', fontSize: 12 }}
                >
                  <Upload size={13} />
                  {avatarPreview ? 'Ganti Foto' : 'Pilih Foto dari Device'}
                </button>
                {avatarPreview && (
                  <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                    <CheckCircle2 size={13} color="var(--teal)" />
                    <span style={{ fontSize: 11.5, color: 'var(--teal)', fontWeight: 600 }}>Foto siap diupload</span>
                  </div>
                )}
              </div>

              {/* Name & Age */}
              <div>
                <label htmlFor="nickname" style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 6 }}>
                  Nama Panggilan <span style={{ color: 'var(--error)' }}>*</span>
                </label>
                <input
                  type="text" id="nickname" placeholder="Panggil aku..."
                  value={formData.nickname}
                  onChange={e => setFormData({ ...formData, nickname: e.target.value })}
                  style={{ width: '100%', padding: '10px 14px', borderRadius: 6, border: '1px solid var(--border)', background: 'var(--bg)', fontSize: 13.5, boxSizing: 'border-box' }}
                />
              </div>

              <div>
                <label htmlFor="fullName" style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 6 }}>
                  Nama Lengkap (opsional)
                </label>
                <input
                  type="text" id="fullName" placeholder="Nama asli kamu..."
                  value={formData.fullName}
                  onChange={e => setFormData({ ...formData, fullName: e.target.value })}
                  style={{ width: '100%', padding: '10px 14px', borderRadius: 6, border: '1px solid var(--border)', background: 'var(--bg)', fontSize: 13.5, boxSizing: 'border-box' }}
                />
              </div>

              <div>
                <label htmlFor="age" style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 6 }}>
                  Berapa Usia Kamu? <span style={{ color: 'var(--error)' }}>*</span>
                </label>
                <input
                  type="number" id="age" placeholder="Contoh: 23" min={13} max={99}
                  value={formData.age}
                  onChange={e => setFormData({ ...formData, age: e.target.value })}
                  style={{ width: '100%', padding: '10px 14px', borderRadius: 6, border: '1px solid var(--border)', background: 'var(--bg)', fontSize: 13.5, boxSizing: 'border-box' }}
                />
              </div>

              <button onClick={handleNext} className="btn btn-primary" style={{ justifyContent: 'center', gap: 6, marginTop: 8 }}>
                Lanjut <ArrowRight size={14} />
              </button>
            </div>
          )}

          {/* STEP 2: Relationship Status & Goal */}
          {step === 2 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ textAlign: 'center', marginBottom: 4 }}>
                <Target size={30} color="var(--teal)" style={{ margin: '0 auto 10px' }} />
                <h2 style={{ fontSize: 19, fontWeight: 900, margin: '0 0 4px' }}>Status & Goal Hubungan</h2>
                <p style={{ fontSize: 12.5, color: 'var(--text-secondary)', margin: 0 }}>Biar rekomendasi konten dan program kamu makin relevan.</p>
              </div>

              <div>
                <label htmlFor="status" style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 6 }}>
                  Status Hubungan Saat Ini
                </label>
                <select id="status" value={formData.relationshipStatus}
                  onChange={e => setFormData({ ...formData, relationshipStatus: e.target.value })}
                  style={{ width: '100%', padding: '10px 14px', borderRadius: 6, border: '1px solid var(--border)', background: 'var(--bg)', fontSize: 13.5 }}>
                  <option value="Single">Jomblo / Single</option>
                  <option value="Pacaran">Pacaran</option>
                  <option value="Menikah">Menikah</option>
                  <option value="Rumit">Hubungan Tanpa Status (HTS) / Rumit</option>
                </select>
              </div>

              <div>
                <label htmlFor="goal" style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 6 }}>
                  Tujuan Pakai Insight Hub
                </label>
                <select id="goal" value={formData.relationshipGoal}
                  onChange={e => setFormData({ ...formData, relationshipGoal: e.target.value })}
                  style={{ width: '100%', padding: '10px 14px', borderRadius: 6, border: '1px solid var(--border)', background: 'var(--bg)', fontSize: 13.5 }}>
                  <option value="Mau ngerti pola diri sendiri dulu">Mau ngerti pola diri sendiri dulu</option>
                  <option value="Pengin kurangi overthinking pas pacaran">Pengin kurangi overthinking pas pacaran</option>
                  <option value="Belajar kelola konflik biar gak gampang putus">Belajar kelola konflik biar gak gampang putus</option>
                  <option value="Mau melatih boundaries asertif">Mau melatih boundaries asertif</option>
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 8 }}>
                <button onClick={() => setStep(1)} className="btn btn-secondary" style={{ justifyContent: 'center', border: '1px solid var(--border)' }}>Kembali</button>
                <button onClick={handleNext} className="btn btn-primary" style={{ justifyContent: 'center', gap: 6 }}>
                  Lanjut <ArrowRight size={14} />
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: Communication Preference */}
          {step === 3 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ textAlign: 'center', marginBottom: 4 }}>
                <MessageSquare size={30} color="#F5A623" style={{ margin: '0 auto 10px' }} />
                <h2 style={{ fontSize: 19, fontWeight: 900, margin: '0 0 4px' }}>Gaya Komunikasi Pilihan</h2>
                <p style={{ fontSize: 12.5, color: 'var(--text-secondary)', margin: 0 }}>Gimana cara kamu biasanya ngomongin unek-unek?</p>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {[
                  'Langsung to-the-point',
                  'Basa-basi dulu biar gak tersinggung',
                  'Mending nunggu momen pas baru ngomong',
                  'Sering dipendam sendiri aja'
                ].map(pref => (
                  <button key={pref} onClick={() => setFormData({ ...formData, communicationPreference: pref })}
                    style={{
                      padding: '13px 16px', borderRadius: 8, textAlign: 'left',
                      background: formData.communicationPreference === pref ? 'rgba(245,166,35,0.06)' : 'var(--surface)',
                      border: formData.communicationPreference === pref ? '2px solid #F5A623' : '1px solid var(--border)',
                      fontSize: 13, color: 'var(--text-primary)', cursor: 'pointer', transition: 'all 100ms ease',
                      display: 'flex', alignItems: 'center', gap: 10
                    }}>
                    <span style={{ width: 18, height: 18, borderRadius: '50%', border: `2px solid ${formData.communicationPreference === pref ? '#F5A623' : 'var(--border)'}`, background: formData.communicationPreference === pref ? '#F5A623' : 'transparent', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {formData.communicationPreference === pref && <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'white' }} />}
                    </span>
                    {pref}
                  </button>
                ))}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 8 }}>
                <button onClick={() => setStep(2)} className="btn btn-secondary" style={{ justifyContent: 'center', border: '1px solid var(--border)' }}>Kembali</button>
                <button onClick={handleNext} className="btn btn-primary" style={{ justifyContent: 'center', gap: 6 }}>
                  Lanjut <ArrowRight size={14} />
                </button>
              </div>
            </div>
          )}

          {/* STEP 4: Mode Selection & Submit */}
          {step === 4 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ textAlign: 'center', marginBottom: 4 }}>
                <Compass size={30} color="var(--brand-blue)" style={{ margin: '0 auto 10px' }} />
                <h2 style={{ fontSize: 19, fontWeight: 900, margin: '0 0 4px' }}>Pilih Mode Penggunaan</h2>
                <p style={{ fontSize: 12.5, color: 'var(--text-secondary)', margin: 0 }}>Gimana rencana kamu memakai platform ini?</p>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <button onClick={() => setFormData({ ...formData, mode: 'solo' })}
                  style={{
                    padding: '18px 12px', borderRadius: 10, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
                    background: formData.mode === 'solo' ? 'rgba(2,134,195,0.06)' : 'var(--surface)',
                    border: formData.mode === 'solo' ? '2px solid var(--brand-blue)' : '1px solid var(--border)',
                    cursor: 'pointer', transition: 'all 100ms ease'
                  }}>
                  <User size={22} color="var(--brand-blue)" />
                  <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>Solo Mode</span>
                  <span style={{ fontSize: 11, color: 'var(--text-secondary)', textAlign: 'center', lineHeight: 1.4 }}>Refleksi mandiri kenal diri sendiri</span>
                </button>
                <button onClick={() => setFormData({ ...formData, mode: 'couple' })}
                  style={{
                    padding: '18px 12px', borderRadius: 10, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
                    background: formData.mode === 'couple' ? 'rgba(233,30,99,0.06)' : 'var(--surface)',
                    border: formData.mode === 'couple' ? '2px solid #E91E63' : '1px solid var(--border)',
                    cursor: 'pointer', transition: 'all 100ms ease'
                  }}>
                  <HeartHandshake size={22} color="#E91E63" />
                  <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>Couple Mode</span>
                  <span style={{ fontSize: 11, color: 'var(--text-secondary)', textAlign: 'center', lineHeight: 1.4 }}>Hubungkan akun dengan pasangan</span>
                </button>
              </div>

              {/* Profile Summary */}
              <div style={{ background: 'var(--bg)', padding: 14, borderRadius: 8, border: '1px solid var(--border-subtle)', fontSize: 12, color: 'var(--text-secondary)' }}>
                <p style={{ fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 8px', fontSize: 12.5 }}>Ringkasan Profil Kamu</p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, lineHeight: 1.7 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <User size={11} color="var(--text-muted)" />
                    <span>{formData.nickname || '-'}, {formData.age || '-'} th</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <HeartHandshake size={11} color="var(--text-muted)" />
                    <span>{formData.relationshipStatus}</span>
                  </div>
                  <div style={{ gridColumn: '1 / -1', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Target size={11} color="var(--text-muted)" style={{ flexShrink: 0 }} />
                    <span>{formData.relationshipGoal.substring(0, 40)}...</span>
                  </div>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 4 }}>
                <button onClick={() => setStep(3)} className="btn btn-secondary" style={{ justifyContent: 'center', border: '1px solid var(--border)' }}>Kembali</button>
                <button onClick={handleSubmit} disabled={loading} className="btn btn-primary" style={{ justifyContent: 'center', gap: 6 }}>
                  {loading ? (
                    <>
                      <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} />
                      {uploadingAvatar ? 'Upload foto...' : 'Menyimpan...'}
                    </>
                  ) : 'Selesai & Lanjut'}
                </button>
              </div>
            </div>
          )}

        </OnboardingMotion>
      </div>
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
