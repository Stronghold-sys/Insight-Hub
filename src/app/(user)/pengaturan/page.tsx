'use client'

import { useState } from 'react'
import { Settings, Lock, Eye, KeyRound, Download, Trash2, ShieldAlert, Check } from 'lucide-react'

export default function PengaturanPage() {
  const [oldPassword, setOldPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [pwSuccess, setPwSuccess] = useState(false)
  const [pwError, setPwError] = useState('')
  const [pwLoading, setPwLoading] = useState(false)

  const [deleteConfirmed, setDeleteConfirmed] = useState(false)
  const [delLoading, setDelLoading] = useState(false)
  const [delError, setDelError] = useState('')

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!oldPassword || !newPassword || !confirmPassword) {
      setPwError('Lengkapi semua kolom password!')
      return
    }
    if (newPassword !== confirmPassword) {
      setPwError('Password baru dan konfirmasi tidak cocok!')
      return
    }
    if (newPassword.length < 6) {
      setPwError('Password baru minimal 6 karakter!')
      return
    }

    setPwError('')
    setPwSuccess(false)
    setPwLoading(true)

    try {
      const res = await fetch('/api/user/password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ oldPassword, newPassword })
      })

      const data = await res.json()
      if (data.success) {
        setPwSuccess(true)
        setOldPassword('')
        setNewPassword('')
        setConfirmPassword('')
      } else {
        setPwError(data.error || 'Gagal mengubah password.')
      }
    } catch (err) {
      setPwError('Gagal menghubungi server penyimpanan.')
    } finally {
      setPwLoading(false)
    }
  }

  const handleDeleteAccount = async () => {
    if (!deleteConfirmed) {
      setDelError('Centang kotak konfirmasi dulu ya!')
      return
    }

    setDelError('')
    setDelLoading(true)

    try {
      const res = await fetch('/api/user/gdpr', {
        method: 'DELETE'
      })

      const data = await res.json()
      if (data.success) {
        // Redirection to public landing or login page
        window.location.href = '/'
      } else {
        setDelError(data.error || 'Gagal menghapus akun.')
      }
    } catch (err) {
      setDelError('Koneksi terputus. Silakan coba lagi.')
    } finally {
      setDelLoading(false)
    }
  }

  return (
    <>
      <div style={{ maxWidth: 800, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 24 }}>
        
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
          <div style={{
            width: 40, height: 40, borderRadius: 8, background: 'rgba(2,134,195,0.08)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--brand-blue)'
          }}>
            <Settings size={20} />
          </div>
          <div>
            <h1 style={{ fontSize: 20, fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>Pengaturan Akun</h1>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: 0 }}>Kelola password, unduh arsip data personal, atau hapus akun.</p>
          </div>
        </div>

        {/* Password Card */}
        <div className="card" style={{ padding: 24 }}>
          <h3 style={{ fontSize: 14.5, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
            <KeyRound size={16} color="var(--brand-blue)" />
            Ubah Kata Sandi
          </h3>

          {pwSuccess && (
            <div style={{ background: 'rgba(23,184,151,0.08)', border: '1px solid rgba(23,184,151,0.2)', color: 'var(--teal)', padding: '10px 14px', borderRadius: 6, fontSize: 12.5, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 6 }}>
              <Check size={16} />
              Password kamu berhasil diganti secara aman!
            </div>
          )}

          {pwError && (
            <div style={{ background: 'rgba(211,47,47,0.08)', border: '1px solid rgba(211,47,47,0.2)', color: 'var(--error)', padding: '10px 14px', borderRadius: 6, fontSize: 12.5, marginBottom: 16 }}>
              {pwError}
            </div>
          )}

          <form onSubmit={handlePasswordChange} style={{ display: 'flex', flexDirection: 'column', gap: 12, maxWidth: 400 }}>
            <div>
              <label htmlFor="old-pw" style={{ display: 'block', fontSize: 11.5, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 6 }}>Password Lama</label>
              <input
                type="password"
                id="old-pw"
                value={oldPassword}
                onChange={e => setOldPassword(e.target.value)}
                style={{ width: '100%', padding: '8px 12px', borderRadius: 6, border: '1px solid var(--border)', background: 'var(--bg)', fontSize: 13 }}
              />
            </div>
            <div>
              <label htmlFor="new-pw" style={{ display: 'block', fontSize: 11.5, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 6 }}>Password Baru</label>
              <input
                type="password"
                id="new-pw"
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                style={{ width: '100%', padding: '8px 12px', borderRadius: 6, border: '1px solid var(--border)', background: 'var(--bg)', fontSize: 13 }}
              />
            </div>
            <div>
              <label htmlFor="confirm-pw" style={{ display: 'block', fontSize: 11.5, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 6 }}>Konfirmasi Password Baru</label>
              <input
                type="password"
                id="confirm-pw"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                style={{ width: '100%', padding: '8px 12px', borderRadius: 6, border: '1px solid var(--border)', background: 'var(--bg)', fontSize: 13 }}
              />
            </div>

            <button type="submit" disabled={pwLoading} className="btn btn-primary" style={{ marginTop: 8, alignSelf: 'flex-start', fontSize: 13 }}>
              {pwLoading ? 'Mengubah...' : 'Ubah Password'}
            </button>
          </form>
        </div>

        {/* GDPR Export Card */}
        <div className="card" style={{ padding: 24 }}>
          <h3 style={{ fontSize: 14.5, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Download size={16} color="var(--teal)" />
            Unduh Data Pribadi (GDPR Compliance)
          </h3>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: 16 }}>
            Kamu punya kendali penuh atas data kamu. Ekspor seluruh data profil, log mood tracker, catatan jurnal relasi, serta hasil assessment kamu dalam format JSON standar.
          </p>
          <a
            href="/api/user/gdpr"
            className="btn btn-secondary"
            style={{ display: 'inline-flex', alignItems: 'center', gap: 8, border: '1px solid var(--border)', textDecoration: 'none', fontSize: 13 }}
            download
          >
            <Download size={14} />
            Ekspor Semua Data Saya (JSON)
          </a>
        </div>

        {/* Delete Account Card */}
        <div className="card" style={{ padding: 24, border: '1px solid rgba(211,47,47,0.2)' }}>
          <h3 style={{ fontSize: 14.5, fontWeight: 800, color: 'var(--error)', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Trash2 size={16} color="var(--error)" />
            Hapus Akun Permanen
          </h3>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: 16 }}>
            Tindakan ini bersifat ireversibel. Begitu dihapus, akun dan seluruh riwayat pengisian kuis, log obrolan chat analyzer, serta jurnal relasi kamu akan dihapus bersih dari server penyimpanan kami.
          </p>

          {delError && (
            <div style={{ background: 'rgba(211,47,47,0.08)', border: '1px solid rgba(211,47,47,0.2)', color: 'var(--error)', padding: '8px 12px', borderRadius: 6, fontSize: 12.5, marginBottom: 16 }}>
              {delError}
            </div>
          )}

          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
            <input
              type="checkbox"
              id="confirm-del"
              checked={deleteConfirmed}
              onChange={e => setDeleteConfirmed(e.target.checked)}
              style={{ cursor: 'pointer', width: 16, height: 16 }}
            />
            <label htmlFor="confirm-del" style={{ fontSize: 12.5, color: 'var(--text-secondary)', cursor: 'pointer' }}>
              Saya sadar dan setuju untuk menghapus akun beserta seluruh data secara permanen.
            </label>
          </div>

          <button
            onClick={handleDeleteAccount}
            disabled={delLoading}
            className="btn btn-danger"
            style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, background: 'var(--error)', color: 'white' }}
          >
            <Trash2 size={14} />
            {delLoading ? 'Menghapus...' : 'Hapus Akun & Data'}
          </button>
        </div>

      </div>
    </>
  )
}
