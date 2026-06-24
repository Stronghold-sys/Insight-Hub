'use client'

import { useState } from 'react'
import { Send, CheckCircle, Mail, MapPin, Phone } from 'lucide-react'

export default function KontakPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    category: 'umum',
    message: ''
  })
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.name || !formData.email || !formData.message) {
      setError('Harap isi semua kolom ya!')
      return
    }
    setError('')
    setLoading(true)

    try {
      // Post feedback to database
      const res = await fetch('/api/admin/cms?module=feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          rating: 5, // Default rating for support form submission
          comment: `[Category: ${formData.category}] ${formData.message}`
        })
      })

      const data = await res.json()
      if (data.success) {
        setSuccess(true)
      } else {
        setError(data.error || 'Terjadi kesalahan saat mengirim pesan.')
      }
    } catch (err) {
      setError('Gagal tersambung ke server. Coba lagi nanti.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ background: 'transparent', minHeight: 'calc(100vh - 64px)', paddingTop: 48, paddingBottom: 80 }}>
      <div className="container" style={{ maxWidth: 900 }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 48 }}>
          <span style={{
            fontSize: 12, fontWeight: 700, color: 'var(--brand-blue)',
            textTransform: 'uppercase', letterSpacing: '0.1em',
            background: 'rgba(2,134,195,0.08)', padding: '6px 12px', borderRadius: 999
          }}>
            Hubungi Tim Kami
          </span>
          <h1 style={{ fontSize: 36, fontWeight: 800, color: 'var(--text-primary)', marginTop: 16, marginBottom: 12, letterSpacing: '-0.02em' }}>
            Ada Kendala atau Masukan?
          </h1>
          <p style={{ fontSize: 16, color: 'var(--text-secondary)', lineHeight: 1.6, maxWidth: 500, margin: '0 auto' }}>
            Kritik, saran, laporan bug, atau kerja sama bisnis — tim Insight Hub siap dengerin cerita kamu.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 32 }} className="grid-md-2">
          {/* Contact Form Card */}
          <div className="card" style={{ padding: 32 }}>
            {success ? (
              <div style={{ textAlign: 'center', padding: '24px 0' }}>
                <div style={{ color: 'var(--teal)', display: 'inline-block', marginBottom: 16 }}>
                  <CheckCircle size={56} />
                </div>
                <h3 style={{ fontSize: 18, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 8 }}>Pesan Terkirim!</h3>
                <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.6, margin: 0 }}>
                  Makasih ya udah ngabarin kita. Tim customer support akan segera merespons lewat email dalam waktu maksimal 24 jam.
                </p>
                <button
                  onClick={() => {
                    setSuccess(false)
                    setFormData({ name: '', email: '', category: 'umum', message: '' })
                  }}
                  className="btn btn-secondary btn-sm"
                  style={{ marginTop: 20, border: '1px solid var(--border)' }}
                >
                  Kirim Pesan Lain
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <h3 style={{ fontSize: 16, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 4 }}>Kirim Pesan</h3>
                
                {error && (
                  <div style={{ background: 'rgba(211,47,47,0.08)', border: '1px solid rgba(211,47,47,0.2)', color: 'var(--error)', padding: '10px 14px', borderRadius: 6, fontSize: 13 }}>
                    {error}
                  </div>
                )}

                <div>
                  <label htmlFor="name" style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 6 }}>Nama Panggilan</label>
                  <input
                    type="text"
                    id="name"
                    placeholder="Nama kamu siapa?"
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                    style={{ width: '100%', padding: '10px 14px', borderRadius: 6, border: '1px solid var(--border)', background: 'var(--bg)', fontSize: 13.5 }}
                  />
                </div>

                <div>
                  <label htmlFor="email" style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 6 }}>Alamat Email</label>
                  <input
                    type="email"
                    id="email"
                    placeholder="email@kamu.com"
                    value={formData.email}
                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                    style={{ width: '100%', padding: '10px 14px', borderRadius: 6, border: '1px solid var(--border)', background: 'var(--bg)', fontSize: 13.5 }}
                  />
                </div>

                <div>
                  <label htmlFor="category" style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 6 }}>Kategori Masalah</label>
                  <select
                    id="category"
                    value={formData.category}
                    onChange={e => setFormData({ ...formData, category: e.target.value })}
                    style={{ width: '100%', padding: '10px 14px', borderRadius: 6, border: '1px solid var(--border)', background: 'var(--bg)', fontSize: 13.5, cursor: 'pointer' }}
                  >
                    <option value="umum">Pertanyaan Umum</option>
                    <option value="bug">Laporan Masalah / Bug</option>
                    <option value="billing">Masalah Paket / Billing</option>
                    <option value="saran">Masukan / Feedback Fitur</option>
                    <option value="bisnis">Kerja Sama Bisnis</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="message" style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 6 }}>Detail Pesan</label>
                  <textarea
                    id="message"
                    rows={4}
                    placeholder="Ceritain sedetail mungkin kendala atau masukan kamu..."
                    value={formData.message}
                    onChange={e => setFormData({ ...formData, message: e.target.value })}
                    style={{ width: '100%', padding: '10px 14px', borderRadius: 6, border: '1px solid var(--border)', background: 'var(--bg)', fontSize: 13.5, resize: 'vertical' }}
                  />
                </div>

                <button type="submit" disabled={loading} className="btn btn-primary" style={{ marginTop: 8, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                  {loading ? 'Mengirim...' : 'Kirim Pesan'}
                  <Send size={14} />
                </button>
              </form>
            )}
          </div>

          {/* Contact Details Card */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24, justifyContent: 'center' }}>
            <div style={{ display: 'flex', gap: 16 }}>
              <div style={{
                width: 40, height: 40, borderRadius: 8, background: 'rgba(2,134,195,0.08)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--brand-blue)', flexShrink: 0
              }}>
                <Mail size={18} />
              </div>
              <div>
                <h4 style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 4px' }}>Kirim Email Langsung</h4>
                <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: 0 }}>
                  <a href="mailto:halo@insighthub.id" style={{ color: 'var(--brand-blue)', textDecoration: 'none' }}>halo@insighthub.id</a>
                </p>
                <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: '4px 0 0' }}>Kita balas cepat di hari kerja (Senin - Jumat, 09.00 - 17.00 WIB)</p>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 16 }}>
              <div style={{
                width: 40, height: 40, borderRadius: 8, background: 'rgba(23,184,151,0.08)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--teal)', flexShrink: 0
              }}>
                <Phone size={18} />
              </div>
              <div>
                <h4 style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 4px' }}>Layanan Cepat WhatsApp</h4>
                <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: 0 }}>
                  <a href="#" style={{ color: 'var(--teal)', textDecoration: 'none' }}>+62 812-3456-7890</a>
                </p>
                <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: '4px 0 0' }}>Khusus pertanyaan seputar akun Premium dan billing</p>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 16 }}>
              <div style={{
                width: 40, height: 40, borderRadius: 8, background: 'rgba(245,166,35,0.08)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#F5A623', flexShrink: 0
              }}>
                <MapPin size={18} />
              </div>
              <div>
                <h4 style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 4px' }}>Kantor Pusat Kita</h4>
                <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: 0, lineHeight: 1.5 }}>
                  Gedung Hub Digital Lt. 4<br />
                  Kuningan, Jakarta Selatan, 12940
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        @media (min-width: 768px) {
          .grid-md-2 {
            grid-template-columns: 1.2fr 0.8fr !important;
          }
        }
      `}</style>
    </div>
  )
}
