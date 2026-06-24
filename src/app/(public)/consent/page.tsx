'use client'

import { useState } from 'react'
import { ShieldCheck, Save, Check } from 'lucide-react'

export default function ConsentPage() {
  const [consents, setConsents] = useState({
    essential: true, // Cannot be disabled
    preference: true,
    analytics: false,
    personalization: false,
    dataSharing: false
  })
  const [success, setSuccess] = useState(false)

  const handleSave = () => {
    setSuccess(true)
    setTimeout(() => setSuccess(false), 2500)
    // Save to localStorage
    localStorage.setItem('user_consent', JSON.stringify(consents))
  }

  return (
    <div style={{ background: 'transparent', minHeight: 'calc(100vh - 64px)', paddingTop: 48, paddingBottom: 80 }}>
      <div className="container" style={{ maxWidth: 800 }}>
        <div className="card" style={{ padding: 40 }}>
          {/* Header */}
          <div style={{ borderBottom: '1px solid var(--border-subtle)', paddingBottom: 24, marginBottom: 32 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, color: 'var(--brand-blue)', marginBottom: 8 }}>
              <ShieldCheck size={28} />
              <span style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Persetujuan Data</span>
            </div>
            <h1 style={{ fontSize: 26, fontWeight: 800, color: 'var(--text-primary)', margin: '4px 0 8px' }}>
              Pusat Persetujuan & Privasi
            </h1>
            <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: 0 }}>Kelola data pribadi dan preferensi tracking kamu di sini secara bebas.</p>
          </div>

          {/* Success Message */}
          {success && (
            <div style={{
              background: 'rgba(23,184,151,0.08)', border: '1px solid rgba(23,184,151,0.2)',
              color: 'var(--teal)', padding: '12px 16px', borderRadius: 6, fontSize: 13.5,
              marginBottom: 24, display: 'flex', alignItems: 'center', gap: 8, animation: 'fadeIn 0.2s ease'
            }}>
              <Check size={18} />
              Preferensi persetujuan privasi kamu berhasil disimpan!
            </div>
          )}

          {/* Intro */}
          <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: 28 }}>
            Kita hargain banget hak kontrol privasi kamu. Di sini kamu bisa atur kategori pelacakan mana aja yang kamu izinin buat aktif pas lagi menjelajah Insight Hub.
          </p>

          {/* Toggles */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20, marginBottom: 32 }}>
            {/* Essential */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderRadius: 8, background: 'var(--bg)', border: '1px solid var(--border-subtle)' }}>
              <div style={{ flex: 1, paddingRight: 24 }}>
                <h4 style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 4px' }}>Cookie Wajib (Essential)</h4>
                <p style={{ fontSize: 12, color: 'var(--text-secondary)', margin: 0, lineHeight: 1.5 }}>Diperlukan buat keamanan sesi login dan kelancaran form quiz. Kategori ini tidak bisa dinonaktifkan.</p>
              </div>
              <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', background: 'var(--border-subtle)', padding: '4px 8px', borderRadius: 4 }}>Wajib Aktif</span>
            </div>

            {/* Preference */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderRadius: 8, background: 'var(--bg)', border: '1px solid var(--border-subtle)' }}>
              <div style={{ flex: 1, paddingRight: 24 }}>
                <h4 style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 4px' }}>Cookie Preferensi</h4>
                <p style={{ fontSize: 12, color: 'var(--text-secondary)', margin: 0, lineHeight: 1.5 }}>Menyimpan pilihan personal kamu, kayak Light/Dark Mode atau bahasa kuis pilihan kamu.</p>
              </div>
              <input
                type="checkbox"
                checked={consents.preference}
                onChange={e => setConsents({ ...consents, preference: e.target.checked })}
                style={{ width: 44, height: 22, cursor: 'pointer' }}
              />
            </div>

            {/* Analytics */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderRadius: 8, background: 'var(--bg)', border: '1px solid var(--border-subtle)' }}>
              <div style={{ flex: 1, paddingRight: 24 }}>
                <h4 style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 4px' }}>Cookie Analitik</h4>
                <p style={{ fontSize: 12, color: 'var(--text-secondary)', margin: 0, lineHeight: 1.5 }}>Ngebiarin kita ngukur jumlah pengunjung dan interaksi halaman biar performa web makin lancar.</p>
              </div>
              <input
                type="checkbox"
                checked={consents.analytics}
                onChange={e => setConsents({ ...consents, analytics: e.target.checked })}
                style={{ width: 44, height: 22, cursor: 'pointer' }}
              />
            </div>

            {/* Personalization */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderRadius: 8, background: 'var(--bg)', border: '1px solid var(--border-subtle)' }}>
              <div style={{ flex: 1, paddingRight: 24 }}>
                <h4 style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 4px' }}>Personalisasi Rekomendasi</h4>
                <p style={{ fontSize: 12, color: 'var(--text-secondary)', margin: 0, lineHeight: 1.5 }}>Menghubungkan catatan mood dan hasil kuis kamu untuk memfilter rekomendasi artikel yang paling pas.</p>
              </div>
              <input
                type="checkbox"
                checked={consents.personalization}
                onChange={e => setConsents({ ...consents, personalization: e.target.checked })}
                style={{ width: 44, height: 22, cursor: 'pointer' }}
              />
            </div>

            {/* Data sharing */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderRadius: 8, background: 'var(--bg)', border: '1px solid var(--border-subtle)' }}>
              <div style={{ flex: 1, paddingRight: 24 }}>
                <h4 style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 4px' }}>Data Sharing Consent</h4>
                <p style={{ fontSize: 12, color: 'var(--text-secondary)', margin: 0, lineHeight: 1.5 }}>Ngasih izin anonimisasi data pengisian kuis kamu untuk riset internal dalam pengembangan relasi relasional.</p>
              </div>
              <input
                type="checkbox"
                checked={consents.dataSharing}
                onChange={e => setConsents({ ...consents, dataSharing: e.target.checked })}
                style={{ width: 44, height: 22, cursor: 'pointer' }}
              />
            </div>
          </div>

          {/* Action button */}
          <button
            onClick={handleSave}
            className="btn btn-primary"
            style={{ display: 'flex', alignItems: 'center', gap: 8, margin: '0 auto' }}
          >
            <Save size={16} />
            Simpan Pengaturan Persetujuan
          </button>
        </div>
      </div>
    </div>
  )
}
