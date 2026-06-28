'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Printer, Share2, ArrowLeft, CheckCircle2, Copy, AlertCircle, ShieldCheck } from 'lucide-react'
import { formatPaymentMethod } from '@/lib/utils'

const SUBSCRIPTION_PLANS = [
  { 
    id: 'free', 
    name: 'Gratis', 
    price: 0, 
    desc: 'Buat kamu yang baru mau mulai kenalan sama diri sendiri.',
    benefits: [
      'Akses kuis relasi dasar',
      'Mood tracker harian',
      'Insight dasar'
    ]
  },
  { 
    id: 'basic', 
    name: 'Basic', 
    price: 79000, 
    desc: 'Kalau kamu serius mau ngerti pola diri sendiri lebih dalam.',
    benefits: [
      'Akses hingga 10 kuis lengkap',
      '10x Chat analyzer relasi',
      'Mood tracker harian',
      'Rujukan saran dasar'
    ]
  },
  { 
    id: 'premium', 
    name: 'Premium', 
    price: 149000, 
    desc: 'Pengalaman penuh untuk growth yang beneran nendang.',
    benefits: [
      'Akses penuh 19 kuis',
      'Chat analyzer unlimited',
      'Simulasi percakapan (Teman Curhat & Partner Virtual)',
      'Insight kepribadian mendalam',
      'Export PDF report lengkap',
      'Priority support 24/7'
    ]
  },
  { 
    id: 'couple', 
    name: 'Couple Plan', 
    price: 229000, 
    desc: 'Buat kamu dan pasangan yang mau tumbuh bareng.',
    benefits: [
      'Akses penuh Premium untuk 2 akun',
      'Kuis pasangan khusus (Conflict Response)',
      'Hubungkan akun dengan pasangan',
      'Mood tracker & journal bersama',
      'Chat analyzer unlimited',
      'Priority support 24/7'
    ]
  }
]

export default function PublicInvoicePage() {
  const params = useParams()
  const router = useRouter()
  const invoiceNumber = params.invoiceNumber as string

  const [invoice, setInvoice] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [copyState, setCopyState] = useState<Record<string, boolean>>({})
  const [toastMsg, setToastMsg] = useState('')

  const showToast = (msg: string, ms = 3000) => {
    setToastMsg(msg)
    setTimeout(() => setToastMsg(''), ms)
  }

  useEffect(() => {
    if (!invoiceNumber) return
    const fetchInvoice = async () => {
      try {
        const res = await fetch(`/api/public/invoice/${invoiceNumber}`)
        const data = await res.json()
        if (data.success) {
          setInvoice(data.invoice)
        } else {
          setError(data.error || 'Invoice tidak ditemukan.')
        }
      } catch (err) {
        setError('Gagal memuat rincian invoice.')
      } finally {
        setLoading(false)
      }
    }
    fetchInvoice()
  }, [invoiceNumber])

  const handleCopyField = (key: string, text: string) => {
    navigator.clipboard.writeText(text)
    setCopyState(prev => ({ ...prev, [key]: true }))
    setTimeout(() => {
      setCopyState(prev => ({ ...prev, [key]: false }))
    }, 2000)
  }

  const handlePrint = () => {
    if (typeof window !== 'undefined') {
      window.print()
    }
  }

  const handleShare = () => {
    if (typeof window !== 'undefined' && navigator.share) {
      navigator.share({
        title: 'Invoice Insight Hub',
        text: `Invoice Resmi ${invoiceNumber} - Paket ${invoice?.plan.toUpperCase()}`,
        url: window.location.href,
      }).catch(console.error)
    } else {
      navigator.clipboard.writeText(window.location.href)
      showToast('Link invoice berhasil disalin ke clipboard!')
    }
  }

  const getStatusBadge = (status: string) => {
    const s = status.toUpperCase()
    switch (s) {
      case 'SUCCESS':
      case 'PAID':
        return (
          <span style={{
            fontSize: 11, fontWeight: 700, borderRadius: 6, padding: '4px 10px',
            background: 'rgba(23,184,151,0.1)', color: 'var(--teal)', border: '1px solid rgba(23,184,151,0.2)'
          }}>
            PAID / LUNAS
          </span>
        )
      case 'PENDING':
      case 'WAITING_PAYMENT':
        return (
          <span style={{
            fontSize: 11, fontWeight: 700, borderRadius: 6, padding: '4px 10px',
            background: 'rgba(245,166,35,0.1)', color: 'var(--warning)', border: '1px solid rgba(245,166,35,0.2)'
          }}>
            PENDING
          </span>
        )
      case 'CANCELLED':
        return (
          <span style={{
            fontSize: 11, fontWeight: 700, borderRadius: 6, padding: '4px 10px',
            background: 'rgba(255,255,255,0.06)', color: 'var(--text-muted)', border: '1px solid var(--border)'
          }}>
            BATAL
          </span>
        )
      case 'REFUNDED':
        return (
          <span style={{
            fontSize: 11, fontWeight: 700, borderRadius: 6, padding: '4px 10px',
            background: 'rgba(211,47,47,0.15)', color: 'var(--error)', border: '1px solid rgba(211,47,47,0.25)'
          }}>
            REFUND
          </span>
        )
      case 'FAILED':
      case 'EXPIRED':
      default:
        return (
          <span style={{
            fontSize: 11, fontWeight: 700, borderRadius: 6, padding: '4px 10px',
            background: 'rgba(211,47,47,0.1)', color: 'var(--error)', border: '1px solid rgba(211,47,47,0.2)'
          }}>
            {s}
          </span>
        )
    }
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', gap: 12, background: 'var(--bg)' }}>
        <div className="spinner" style={{ borderColor: 'rgba(2,134,195,0.2)', borderTopColor: 'var(--brand-blue)', width: 32, height: 32 }} />
        <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Memuat rincian invoice...</p>
      </div>
    )
  }

  if (error || !invoice) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', gap: 16, padding: 24, textAlign: 'center', background: 'var(--bg)' }}>
        <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'rgba(211,47,47,0.1)', color: 'var(--error)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <AlertCircle size={32} />
        </div>
        <div>
          <h2 style={{ fontSize: 20, fontWeight: 800, color: 'var(--text-primary)' }}>Rincian Tidak Ditemukan</h2>
          <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginTop: 8, maxWidth: 360 }}>{error || 'Nomor invoice yang dimasukkan salah atau sudah dihapus.'}</p>
        </div>
        <button onClick={() => router.push('/')} className="btn btn-secondary btn-sm" style={{ display: 'inline-flex', gap: 8, alignItems: 'center' }}>
          <ArrowLeft size={14} /> Kembali ke Beranda
        </button>
      </div>
    )
  }

  const invoiceNum = invoice.invoiceNumber || `INV-${invoice.id.substring(0, 8).toUpperCase()}`

  return (
    <div style={{ minHeight: '100vh', padding: '40px 16px', background: 'var(--bg)', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <div className="no-print" style={{ width: '100%', maxWidth: 640, display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
        <button onClick={() => router.push('/')} className="btn btn-secondary btn-sm" style={{ display: 'inline-flex', gap: 8, alignItems: 'center' }}>
          <ArrowLeft size={14} /> Beranda
        </button>
      </div>

      {/* INVOICE CARD */}
      <div className="card" id="printable-invoice" style={{ width: '100%', maxWidth: 640, padding: '32px', background: 'var(--surface)', border: '1px solid var(--border-subtle)', boxShadow: 'var(--shadow-card)' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 24, alignItems: 'flex-start' }}>
          <div>
            <h2 style={{ fontSize: 22, fontWeight: 900, color: 'var(--brand-blue)', margin: '0 0 4px', letterSpacing: '-0.02em' }}>Insight Hub</h2>
            <p style={{ fontSize: 12, color: 'var(--text-secondary)', margin: 0 }}>Platform Growth Hubungan &amp; Komunikasi</p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <h3 style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-muted)', margin: '0 0 4px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Invoice Resmi</h3>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, justifyContent: 'flex-end' }}>
              <p style={{ fontSize: 13, fontFamily: 'monospace', color: 'var(--text-primary)', fontWeight: 700, margin: 0 }}>
                {invoiceNum}
              </p>
              <button 
                onClick={() => handleCopyField('invNo', invoiceNum)}
                className="no-print"
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 2 }}
                title="Salin Nomor Invoice"
              >
                {copyState.invNo ? <CheckCircle2 size={13} color="var(--teal)" /> : <Copy size={13} />}
              </button>
            </div>
          </div>
        </div>
        
        <hr style={{ border: 'none', borderTop: '1px solid var(--border-subtle)', marginBottom: 20 }} />
        
        {/* Customer & Transaction Info */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, fontSize: 12.5, color: 'var(--text-secondary)', marginBottom: 24 }}>
          <div>
            <p style={{ fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', fontSize: 11, margin: '0 0 6px' }}>Pelanggan:</p>
            <p style={{ fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 2px' }}>{invoice.userFullName || 'Pelanggan Insight Hub'}</p>
            <p style={{ margin: '0 0 2px' }}>Email: {invoice.email || '-'}</p>
            <p style={{ margin: 0 }}>Status: Premium Subscriber</p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <p style={{ fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', fontSize: 11, margin: '0 0 6px' }}>Detail Transaksi:</p>
            <p style={{ margin: '0 0 2px' }}>Tanggal Dibuat: <strong>{invoice.date}</strong></p>
            {invoice.paidAt && <p style={{ margin: '0 0 2px' }}>Tanggal Dibayar: <strong>{invoice.paidAt}</strong></p>}
            {invoice.expiresAt && <p style={{ margin: '0 0 2px' }}>Tanggal Expired: <strong>{invoice.expiresAt}</strong></p>}
            <p style={{ margin: '0 0 2px' }}>Metode: <strong>{formatPaymentMethod(invoice.method, invoice.channel)}</strong></p>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, justifyContent: 'flex-end', marginTop: 4 }}>
              <span style={{ fontSize: 12 }}>Status:</span>
              {getStatusBadge(invoice.status)}
            </div>
          </div>
        </div>

        {/* References Box */}
        <div style={{ background: 'var(--bg)', border: '1px solid var(--border-subtle)', borderRadius: 8, padding: 12, fontSize: 11.5, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 24 }}>
          <div>
            <span style={{ display: 'block', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', fontSize: 9.5 }}>ID Transaksi</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontFamily: 'monospace', color: 'var(--text-primary)' }}>
              <span>{invoice.id}</span>
              <button 
                onClick={() => handleCopyField('txId', invoice.id)}
                className="no-print"
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 1 }}
              >
                {copyState.txId ? <CheckCircle2 size={11} color="var(--teal)" /> : <Copy size={11} />}
              </button>
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <span style={{ display: 'block', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', fontSize: 9.5 }}>Referensi</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontFamily: 'monospace', color: 'var(--text-primary)', justifyContent: 'flex-end' }}>
              <span>{invoice.reference || '-'}</span>
              {invoice.reference && (
                <button 
                  onClick={() => handleCopyField('refNo', invoice.reference || '')}
                  className="no-print"
                  style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 1 }}
                >
                  {copyState.refNo ? <CheckCircle2 size={11} color="var(--teal)" /> : <Copy size={11} />}
                </button>
              )}
            </div>
          </div>
        </div>
        
        {/* Services & Fees Table */}
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, marginBottom: 24 }}>
          <thead>
            <tr style={{ borderBottom: '2px solid var(--text-primary)', textAlign: 'left', fontWeight: 700 }}>
              <th style={{ padding: '8px 0', color: 'var(--text-primary)' }}>Deskripsi Layanan</th>
              <th style={{ padding: '8px 0', textAlign: 'right', color: 'var(--text-primary)', width: 120 }}>Total</th>
            </tr>
          </thead>
          <tbody>
            <tr style={{ borderBottom: '1px solid var(--border-subtle)' }}>
              <td style={{ padding: '12px 0', color: 'var(--text-secondary)' }}>
                <strong style={{ color: 'var(--text-primary)' }}>Paket Langganan {invoice.plan.toUpperCase()} (30 Hari)</strong>
                <span style={{ display: 'block', fontSize: 11.5, color: 'var(--text-muted)', marginTop: 4, lineHeight: 1.5 }}>
                  {SUBSCRIPTION_PLANS.find(p => p.id === invoice.plan.toLowerCase())?.desc || 'Akses penuh fitur premium relasi.'}
                </span>
                
                {/* Features list inside the invoice */}
                <div style={{ marginTop: 8, borderTop: '1px dashed var(--border-subtle)', paddingTop: 8 }}>
                  <span style={{ fontSize: 10.5, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>Fitur Utama Paket:</span>
                  <ul style={{ padding: 0, margin: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 4 }}>
                    {SUBSCRIPTION_PLANS.find(p => p.id === invoice.plan.toLowerCase())?.benefits.map((b: string, idx: number) => (
                      <li key={idx} style={{ display: 'flex', gap: 6, alignItems: 'center', fontSize: 11, color: 'var(--text-secondary)' }}>
                        <span style={{ color: 'var(--teal)', fontWeight: 'bold' }}>✓</span>
                        <span>{b}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </td>
              <td style={{ padding: '12px 0', textAlign: 'right', fontWeight: 700, color: 'var(--text-primary)', verticalAlign: 'top' }}>
                Rp {parseInt(String(invoice.basePrice || invoice.amount)).toLocaleString('id-ID')}
              </td>
            </tr>
            <tr>
              <td style={{ padding: '10px 0 4px', color: 'var(--text-secondary)' }}>Harga Paket</td>
              <td style={{ padding: '10px 0 4px', textAlign: 'right', fontWeight: 600, color: 'var(--text-primary)' }}>
                Rp {parseInt(String(invoice.basePrice || invoice.amount)).toLocaleString('id-ID')}
              </td>
            </tr>
            {invoice.discount && parseInt(String(invoice.discount)) > 0 && (
              <tr>
                <td style={{ padding: '4px 0', color: 'var(--error)' }}>Diskon Voucher {invoice.couponCode ? `(${invoice.couponCode})` : ''}</td>
                <td style={{ padding: '4px 0', textAlign: 'right', fontWeight: 600, color: 'var(--error)' }}>
                  -Rp {parseInt(String(invoice.discount)).toLocaleString('id-ID')}
                </td>
              </tr>
            )}
            {invoice.adminFee && parseInt(String(invoice.adminFee)) > 0 && (
              <tr>
                <td style={{ padding: '4px 0', color: 'var(--text-secondary)' }}>Biaya Admin</td>
                <td style={{ padding: '4px 0', textAlign: 'right', fontWeight: 600, color: 'var(--text-primary)' }}>
                  Rp {parseInt(String(invoice.adminFee)).toLocaleString('id-ID')}
                </td>
              </tr>
            )}
            <tr style={{ borderTop: '1.5px solid var(--text-primary)' }}>
              <td style={{ padding: '16px 0 0', fontWeight: 800, color: 'var(--text-primary)', fontSize: 14 }}>Total yang Harus Dibayar</td>
              <td style={{ padding: '16px 0 0', textAlign: 'right', fontWeight: 900, color: 'var(--brand-blue)', fontSize: 15 }}>
                Rp {parseInt(String(invoice.amount)).toLocaleString('id-ID')}
              </td>
            </tr>
          </tbody>
        </table>

        {/* Footer Note */}
        <div style={{ background: 'rgba(2,134,195,0.03)', border: '1px solid rgba(2,134,195,0.06)', padding: 14, borderRadius: 10, textAlign: 'center', fontSize: 11.5, color: 'var(--text-secondary)' }}>
          Terima kasih telah mempercayai <strong>Insight Hub</strong> untuk menemani journey relasi kamu!
        </div>

        {/* Action Buttons inside Card for Print layout control */}
        <div className="no-print" style={{ display: 'flex', gap: 12, marginTop: 24, justifyContent: 'flex-end' }}>
          <button
            onClick={handlePrint}
            className="btn btn-primary"
            style={{ display: 'inline-flex', gap: 8, alignItems: 'center', padding: '10px 18px', fontSize: 13, fontWeight: 700 }}
          >
            <Printer size={16} /> Cetak Invoice
          </button>
          <button
            onClick={handleShare}
            className="btn btn-secondary"
            style={{ display: 'inline-flex', gap: 8, alignItems: 'center', padding: '10px 18px', fontSize: 13, fontWeight: 600 }}
          >
            <Share2 size={16} /> Bagikan
          </button>
        </div>
      </div>

      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden !important;
          }
          #printable-invoice, #printable-invoice * {
            visibility: visible !important;
          }
          #printable-invoice {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            background: white !important;
            color: black !important;
            border: none !important;
            box-shadow: none !important;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>

      {toastMsg && (
        <div
          className="animate-fadein"
          style={{
            position: 'fixed',
            bottom: 24,
            right: 24,
            zIndex: 9998,
            background: 'rgba(23,184,151,0.12)',
            border: '1px solid rgba(23,184,151,0.3)',
            color: 'var(--teal)',
            padding: '12px 18px',
            borderRadius: 10,
            fontWeight: 600,
            fontSize: 13,
            boxShadow: 'var(--shadow-modal)',
          }}
        >
          {toastMsg}
        </div>
      )}
    </div>
  )
}
