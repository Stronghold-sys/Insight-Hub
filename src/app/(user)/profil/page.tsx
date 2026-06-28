'use client'

import { useState, useEffect, useRef } from 'react'
import { User, Save, Check, Camera, Upload } from 'lucide-react'

export default function ProfilPage() {
  const [formData, setFormData] = useState({
    fullName: '',
    nickname: '',
    avatarUrl: '',
    bio: '',
    age: '',
    relationshipStatus: 'Single',
    relationshipGoal: '',
    communicationPreference: '',
    timezone: 'Asia/Jakarta',
    mode: 'solo'
  })
  const [loading, setLoading] = useState(true)
  const [saveLoading, setSaveLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [avatarPreview, setAvatarPreview] = useState<string>('')
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    fetch('/api/auth/me')
      .then(res => res.json())
      .then(data => {
        if (data.authenticated && data.user) {
          setFormData({
            fullName: data.user.fullName || '',
            nickname: data.user.nickname || '',
            avatarUrl: data.user.avatarUrl || '',
            bio: data.user.bio || '',
            age: data.user.age !== null ? String(data.user.age) : '',
            relationshipStatus: data.user.relationshipStatus || 'Single',
            relationshipGoal: data.user.relationshipGoal || '',
            communicationPreference: data.user.communicationPreference || '',
            timezone: data.user.timezone || 'Asia/Jakarta',
            mode: data.user.mode || 'solo'
          })
          if (data.user.avatarUrl) {
            setAvatarPreview(data.user.avatarUrl)
          }
        }
        setLoading(false)
      })
      .catch(() => {
        setError('Gagal memuat profil.')
        setLoading(false)
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
    setError('')
    const reader = new FileReader()
    reader.onloadend = () => setAvatarPreview(reader.result as string)
    reader.readAsDataURL(file)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaveLoading(true)
    setSuccess(false)
    setError('')

    try {
      let avatarUrl = formData.avatarUrl

      // Upload avatar if a new file was selected
      if (avatarFile) {
        setUploadingAvatar(true)
        const payload = new FormData()
        payload.append('avatar', avatarFile)
        const uploadRes = await fetch('/api/auth/upload-avatar', {
          method: 'POST',
          body: payload
        })
        const uploadData = await uploadRes.json()
        setUploadingAvatar(false)
        if (!uploadData.success) {
          throw new Error(uploadData.error || 'Gagal upload foto profil')
        }
        avatarUrl = uploadData.url
      }

      const res = await fetch('/api/auth/me', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, avatarUrl })
      })

      const data = await res.json()
      if (data.success) {
        setFormData(prev => ({ ...prev, avatarUrl }))
        setAvatarFile(null)
        setSuccess(true)
        setTimeout(() => setSuccess(false), 2500)
      } else {
        setError(data.error || 'Gagal menyimpan profil.')
      }
    } catch (err: any) {
      setError(err.message || 'Koneksi terputus. Silakan coba lagi.')
    } finally {
      setSaveLoading(false)
      setUploadingAvatar(false)
    }
  }

  return (
    <>
      <div style={{ maxWidth: 800, margin: '0 auto' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 28 }}>
          <div style={{
            width: 40, height: 40, borderRadius: 8, background: 'rgba(2,134,195,0.08)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--brand-blue)'
          }}>
            <User size={20} />
          </div>
          <div>
            <h1 style={{ fontSize: 20, fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>Profil Personal</h1>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: 0 }}>Perbarui nama tampil, avatar, status hubungan, dan preferensi komunikasi kamu.</p>
          </div>
        </div>

        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '64px 0', gap: 12 }}>
            <div className="spinner" style={{ width: 28, height: 28, borderColor: 'rgba(2,134,195,0.2)', borderTopColor: 'var(--brand-blue)' }} />
            <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Memuat data profil...</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="card" style={{ padding: 32, display: 'flex', flexDirection: 'column', gap: 20 }}>
            {success && (
              <div style={{ background: 'rgba(23,184,151,0.08)', border: '1px solid rgba(23,184,151,0.2)', color: 'var(--teal)', padding: '10px 14px', borderRadius: 6, fontSize: 13, display: 'flex', alignItems: 'center', gap: 8 }}>
                <Check size={18} />
                Profil kamu berhasil diperbarui!
              </div>
            )}

            {error && (
              <div style={{ background: 'rgba(211,47,47,0.08)', border: '1px solid rgba(211,47,47,0.2)', color: 'var(--error)', padding: '10px 14px', borderRadius: 6, fontSize: 13 }}>
                {error}
              </div>
            )}

            {/* Avatar Upload Section */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 20, padding: '16px', background: 'rgba(2,134,195,0.04)', borderRadius: 10, border: '1px solid rgba(2,134,195,0.12)' }}>
              {/* Avatar preview */}
              <div style={{ position: 'relative', flexShrink: 0 }}>
                <div style={{
                  width: 80, height: 80, borderRadius: '50%', overflow: 'hidden',
                  border: '3px solid var(--brand-blue)', background: 'rgba(2,134,195,0.1)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  {avatarPreview ? (
                    <img src={avatarPreview} alt="Foto Profil" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <User size={32} color="var(--brand-blue)" />
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  style={{
                    position: 'absolute', bottom: 0, right: 0,
                    width: 26, height: 26, borderRadius: '50%',
                    background: 'var(--brand-blue)', border: '2px solid var(--surface)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    cursor: 'pointer', color: 'white',
                  }}
                  title="Ganti foto profil"
                >
                  <Camera size={12} />
                </button>
              </div>

              {/* Upload controls */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 4px' }}>
                  {avatarFile ? avatarFile.name : 'Foto Profil'}
                </p>
                <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: '0 0 10px' }}>
                  Format JPG, PNG, WEBP. Maks 5MB.
                </p>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="btn btn-secondary"
                  style={{ fontSize: 12, gap: 6, padding: '7px 14px' }}
                >
                  <Upload size={13} />
                  {avatarFile ? 'Ganti Foto' : 'Upload Foto'}
                </button>
              </div>

              {/* Hidden file input */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                style={{ display: 'none' }}
                onChange={handleAvatarChange}
                aria-label="Upload foto profil"
              />
            </div>

            {/* Grid 2 Columns */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 20 }}>
              <div>
                <label htmlFor="fullName" style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 6 }}>Nama Lengkap</label>
                <input
                  type="text"
                  id="fullName"
                  value={formData.fullName}
                  onChange={e => setFormData({ ...formData, fullName: e.target.value })}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: 6, border: '1px solid var(--border)', background: 'var(--bg)', fontSize: 13.5 }}
                />
              </div>

              <div>
                <label htmlFor="nickname" style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 6 }}>Nama Panggilan (Nickname)</label>
                <input
                  type="text"
                  id="nickname"
                  value={formData.nickname}
                  onChange={e => setFormData({ ...formData, nickname: e.target.value })}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: 6, border: '1px solid var(--border)', background: 'var(--bg)', fontSize: 13.5 }}
                />
              </div>

              <div>
                <label htmlFor="age" style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 6 }}>Usia</label>
                <input
                  type="number"
                  id="age"
                  value={formData.age}
                  onChange={e => setFormData({ ...formData, age: e.target.value })}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: 6, border: '1px solid var(--border)', background: 'var(--bg)', fontSize: 13.5 }}
                />
              </div>

              <div>
                <label htmlFor="status" style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 6 }}>Status Hubungan</label>
                <select
                  id="status"
                  value={formData.relationshipStatus}
                  onChange={e => setFormData({ ...formData, relationshipStatus: e.target.value })}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: 6, border: '1px solid var(--border)', background: 'var(--bg)', fontSize: 13.5 }}
                >
                  <option value="Single">Jomblo / Single</option>
                  <option value="Pacaran">Pacaran</option>
                  <option value="Menikah">Menikah</option>
                  <option value="Rumit">HTS / Rumit</option>
                </select>
              </div>

              <div>
                <label htmlFor="timezone" style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 6 }}>Zona Waktu</label>
                <select
                  id="timezone"
                  value={formData.timezone}
                  onChange={e => setFormData({ ...formData, timezone: e.target.value })}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: 6, border: '1px solid var(--border)', background: 'var(--bg)', fontSize: 13.5 }}
                >
                  <option value="Asia/Jakarta">WIB (Asia/Jakarta)</option>
                  <option value="Asia/Makassar">WITA (Asia/Makassar)</option>
                  <option value="Asia/Jayapura">WIT (Asia/Jayapura)</option>
                </select>
              </div>
            </div>

            <div>
              <label htmlFor="bio" style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 6 }}>Bio Singkat</label>
              <textarea
                id="bio"
                rows={3}
                placeholder="Ceritain sedikit tentang diri kamu..."
                value={formData.bio}
                onChange={e => setFormData({ ...formData, bio: e.target.value })}
                style={{ width: '100%', padding: '10px 12px', borderRadius: 6, border: '1px solid var(--border)', background: 'var(--bg)', fontSize: 13.5, resize: 'vertical' }}
              />
            </div>

            <div>
              <label htmlFor="goal" style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 6 }}>Tujuan Hubungan</label>
              <input
                type="text"
                id="goal"
                placeholder="e.g. Belajar asertif biar gak gampang baper"
                value={formData.relationshipGoal}
                onChange={e => setFormData({ ...formData, relationshipGoal: e.target.value })}
                style={{ width: '100%', padding: '10px 12px', borderRadius: 6, border: '1px solid var(--border)', background: 'var(--bg)', fontSize: 13.5 }}
              />
            </div>

            <div>
              <label htmlFor="commPref" style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 6 }}>Preferensi Komunikasi</label>
              <input
                type="text"
                id="commPref"
                placeholder="e.g. Suka langsung ngomong kalau ada ganjalan"
                value={formData.communicationPreference}
                onChange={e => setFormData({ ...formData, communicationPreference: e.target.value })}
                style={{ width: '100%', padding: '10px 12px', borderRadius: 6, border: '1px solid var(--border)', background: 'var(--bg)', fontSize: 13.5 }}
              />
            </div>

            <button
              type="submit"
              disabled={saveLoading}
              className="btn btn-primary"
              style={{ alignSelf: 'flex-start', display: 'flex', alignItems: 'center', gap: 8, marginTop: 12 }}
            >
              <Save size={16} />
              {uploadingAvatar ? 'Mengupload foto...' : saveLoading ? 'Menyimpan...' : 'Simpan Perubahan'}
            </button>
          </form>
        )}
      </div>
    </>
  )
}
