'use client'

import { useState, useEffect } from 'react'
import { User, Save, Check, RefreshCw } from 'lucide-react'

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

  useEffect(() => {
    // Fetch profile data from API
    fetch('/api/auth/me')
      .then(res => res.json())
      .then(data => {
        if (data.authenticated && data.user) {
          // Fill form with profile fields
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
        }
        setLoading(false)
      })
      .catch(() => {
        setError('Gagal memuat profil.')
        setLoading(false)
      })
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaveLoading(true)
    setSuccess(false)
    setError('')

    try {
      const res = await fetch('/api/auth/me', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      const data = await res.json()
      if (data.success) {
        setSuccess(true)
        setTimeout(() => setSuccess(false), 2500)
      } else {
        setError(data.error || 'Gagal menyimpan profil.')
      }
    } catch (err) {
      setError('Koneksi terputus. Silakan coba lagi.')
    } finally {
      setSaveLoading(false)
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
                Profil kamu berhasil diperbarui secara aman!
              </div>
            )}

            {error && (
              <div style={{ background: 'rgba(211,47,47,0.08)', border: '1px solid rgba(211,47,47,0.2)', color: 'var(--error)', padding: '10px 14px', borderRadius: 6, fontSize: 13 }}>
                {error}
              </div>
            )}

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
                <label htmlFor="avatarUrl" style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 6 }}>URL Avatar / Foto Profil</label>
                <input
                  type="text"
                  id="avatarUrl"
                  value={formData.avatarUrl}
                  onChange={e => setFormData({ ...formData, avatarUrl: e.target.value })}
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

            <button type="submit" disabled={saveLoading} className="btn btn-primary" style={{ alignSelf: 'flex-start', display: 'flex', alignItems: 'center', gap: 8, marginTop: 12 }}>
              <Save size={16} />
              {saveLoading ? 'Menyimpan...' : 'Simpan Perubahan'}
            </button>
          </form>
        )}
      </div>
    </>
  )
}
