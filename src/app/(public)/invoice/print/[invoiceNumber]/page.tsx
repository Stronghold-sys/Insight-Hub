'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { AlertCircle, Loader2 } from 'lucide-react'
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

export default function PrintInvoicePage() {
  const params = useParams()
  const invoiceNumber = params.invoiceNumber as string

  const [invoice, setInvoice] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

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

  // Automatically trigger window.print() once rendered successfully
  useEffect(() => {
    if (!loading && invoice && !error) {
      const timer = setTimeout(() => {
        window.print()
      }, 1000)
      return () => clearTimeout(timer)
    }
  }, [loading, invoice, error])

  const getStatusBadge = (status: string) => {
    const s = status.toUpperCase()
    switch (s) {
      case 'SUCCESS':
      case 'PAID':
        return <span style={{ fontSize: 11, fontWeight: 700, borderRadius: 6, padding: '4px 10px', background: 'rgba(23,184,151,0.1)', color: '#17B897', border: '1px solid rgba(23,184,151,0.2)' }}>PAID / LUNAS</span>
      case 'PENDING':
      case 'WAITING_PAYMENT':
        return <span style={{ fontSize: 11, fontWeight: 700, borderRadius: 6, padding: '4px 10px', background: 'rgba(245,166,35,0.1)', color: '#F5A623', border: '1px solid rgba(245,166,35,0.2)' }}>PENDING</span>
      case 'CANCELLED':
        return <span style={{ fontSize: 11, fontWeight: 700, borderRadius: 6, padding: '4px 10px', background: 'rgba(0,0,0,0.06)', color: '#6B7280', border: '1px solid rgba(0,0,0,0.1)' }}>BATAL</span>
      case 'REFUNDED':
        return <span style={{ fontSize: 11, fontWeight: 700, borderRadius: 6, padding: '4px 10px', background: 'rgba(211,47,47,0.15)', color: '#D32F2F', border: '1px solid rgba(211,47,47,0.25)' }}>REFUND</span>
      case 'FAILED':
      case 'EXPIRED':
      default:
        return <span style={{ fontSize: 11, fontWeight: 700, borderRadius: 6, padding: '4px 10px', background: 'rgba(211,47,47,0.1)', color: '#D32F2F', border: '1px solid rgba(211,47,47,0.2)' }}>{s}</span>
    }
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', gap: 12, background: 'white' }}>
        <Loader2 size={32} style={{ animation: 'spin 1s linear infinite', color: '#0286C3' }} />
        <p style={{ fontSize: 13, color: '#4B5563' }}>Menyiapkan invoice untuk dicetak...</p>
        <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
      </div>
    )
  }

  if (error || !invoice) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', gap: 16, padding: 24, textAlign: 'center', background: 'white' }}>
        <AlertCircle size={40} color="#D32F2F" />
        <h2 style={{ fontSize: 18, fontWeight: 800, color: '#111827' }}>Rincian Tidak Ditemukan</h2>
        <p style={{ fontSize: 13, color: '#4B5563' }}>{error}</p>
      </div>
    )
  }

  const invoiceNum = invoice.invoiceNumber || `INV-${invoice.id.substring(0, 8).toUpperCase()}`

  return (
    <div className="print-only-container">
      <div className="invoice-print-card">
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 24, alignItems: 'flex-start' }}>
          <div>
            <h2 style={{ fontSize: 24, fontWeight: 900, color: '#0286C3', margin: '0 0 4px', letterSpacing: '-0.02em' }}>Insight Hub</h2>
            <p style={{ fontSize: 12, color: '#4B5563', margin: 0 }}>Platform Growth Hubungan &amp; Komunikasi</p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <h3 style={{ fontSize: 13, fontWeight: 700, color: '#6B7280', margin: '0 0 4px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Invoice Resmi</h3>
            <p style={{ fontSize: 13, fontFamily: 'monospace', color: '#111827', fontWeight: 700, margin: 0 }}>{invoiceNum}</p>
          </div>
        </div>

        <hr style={{ border: 'none', borderTop: '1px solid #E5E7EB', marginBottom: 20 }} />

        {/* Customer & Transaction Info */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, fontSize: 12.5, color: '#4B5563', marginBottom: 24 }}>
          <div>
            <p style={{ fontWeight: 700, color: '#6B7280', textTransform: 'uppercase', fontSize: 11, margin: '0 0 6px' }}>Pelanggan:</p>
            <p style={{ fontWeight: 700, color: '#111827', margin: '0 0 2px' }}>{invoice.userFullName || 'Pelanggan Insight Hub'}</p>
            <p style={{ margin: '0 0 2px' }}>Email: {invoice.email || '-'}</p>
            <p style={{ margin: 0 }}>Status: Premium Subscriber</p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <p style={{ fontWeight: 700, color: '#6B7280', textTransform: 'uppercase', fontSize: 11, margin: '0 0 6px' }}>Detail Transaksi:</p>
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
        <div style={{ background: '#F9FAFB', border: '1px solid #E5E7EB', borderRadius: 8, padding: 12, fontSize: 11.5, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 24 }}>
          <div>
            <span style={{ display: 'block', color: '#6B7280', fontWeight: 700, textTransform: 'uppercase', fontSize: 9.5 }}>ID Transaksi</span>
            <span style={{ fontFamily: 'monospace', color: '#111827' }}>{invoice.id}</span>
          </div>
          <div style={{ textAlign: 'right' }}>
            <span style={{ display: 'block', color: '#6B7280', fontWeight: 700, textTransform: 'uppercase', fontSize: 9.5 }}>Referensi</span>
            <span style={{ fontFamily: 'monospace', color: '#111827' }}>{invoice.reference || '-'}</span>
          </div>
        </div>

        {/* Services & Fees Table */}
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, marginBottom: 24 }}>
          <thead>
            <tr style={{ borderBottom: '2px solid #111827', textAlign: 'left', fontWeight: 700 }}>
              <th style={{ padding: '8px 0', color: '#111827' }}>Deskripsi Layanan</th>
              <th style={{ padding: '8px 0', textAlign: 'right', color: '#111827', width: 120 }}>Total</th>
            </tr>
          </thead>
          <tbody>
            <tr style={{ borderBottom: '1px solid #E5E7EB' }}>
              <td style={{ padding: '12px 0', color: '#4B5563' }}>
                <strong style={{ color: '#111827' }}>Paket Langganan {invoice.plan.toUpperCase()} (30 Hari)</strong>
                <span style={{ display: 'block', fontSize: 11.5, color: '#6B7280', marginTop: 4, lineHeight: 1.5 }}>
                  {SUBSCRIPTION_PLANS.find(p => p.id === invoice.plan.toLowerCase())?.desc || 'Akses penuh fitur premium relasi.'}
                </span>
                
                {/* Features List */}
                <div style={{ marginTop: 8, borderTop: '1px dashed #E5E7EB', paddingTop: 8 }}>
                  <span style={{ fontSize: 10.5, fontWeight: 700, color: '#6B7280', textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>Fitur Utama Paket:</span>
                  <ul style={{ padding: 0, margin: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 4 }}>
                    {SUBSCRIPTION_PLANS.find(p => p.id === invoice.plan.toLowerCase())?.benefits.map((b: string, idx: number) => (
                      <li key={idx} style={{ display: 'flex', gap: 6, alignItems: 'center', fontSize: 11, color: '#4B5563' }}>
                        <span style={{ color: '#10B981', fontWeight: 'bold' }}>✓</span>
                        <span>{b}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </td>
              <td style={{ padding: '12px 0', textAlign: 'right', fontWeight: 700, color: '#111827', verticalAlign: 'top' }}>
                Rp {parseInt(String(invoice.basePrice || invoice.amount)).toLocaleString('id-ID')}
              </td>
            </tr>
            <tr>
              <td style={{ padding: '10px 0 4px', color: '#4B5563' }}>Harga Paket</td>
              <td style={{ padding: '10px 0 4px', textAlign: 'right', fontWeight: 600, color: '#111827' }}>
                Rp {parseInt(String(invoice.basePrice || invoice.amount)).toLocaleString('id-ID')}
              </td>
            </tr>
            {invoice.discount && parseInt(String(invoice.discount)) > 0 && (
              <tr>
                <td style={{ padding: '4px 0', color: '#EF4444' }}>Diskon Voucher {invoice.couponCode ? `(${invoice.couponCode})` : ''}</td>
                <td style={{ padding: '4px 0', textAlign: 'right', fontWeight: 600, color: '#EF4444' }}>
                  -Rp {parseInt(String(invoice.discount)).toLocaleString('id-ID')}
                </td>
              </tr>
            )}
            {invoice.adminFee && parseInt(String(invoice.adminFee)) > 0 && (
              <tr>
                <td style={{ padding: '4px 0', color: '#4B5563' }}>Biaya Admin</td>
                <td style={{ padding: '4px 0', textAlign: 'right', fontWeight: 600, color: '#111827' }}>
                  Rp {parseInt(String(invoice.adminFee)).toLocaleString('id-ID')}
                </td>
              </tr>
            )}
            <tr style={{ borderTop: '1.5px solid #111827' }}>
              <td style={{ padding: '16px 0 0', fontWeight: 800, color: '#111827', fontSize: 14 }}>Total yang Harus Dibayar</td>
              <td style={{ padding: '16px 0 0', textAlign: 'right', fontWeight: 900, color: '#0286C3', fontSize: 15 }}>
                Rp {parseInt(String(invoice.amount)).toLocaleString('id-ID')}
              </td>
            </tr>
          </tbody>
        </table>

        {/* Footer Note */}
        <div style={{ background: '#F0F9FF', border: '1px solid #E0F2FE', padding: 14, borderRadius: 10, textAlign: 'center', fontSize: 11.5, color: '#0369A1' }}>
          Terima kasih telah mempercayai <strong>Insight Hub</strong> untuk menemani journey relasi kamu!
        </div>
      </div>

      <style jsx global>{`
        @page {
          size: A4 portrait;
          margin: 20mm;
        }
        body {
          background: white !important;
          color: black !important;
          margin: 0;
          padding: 0;
          font-family: system-ui, -apple-system, sans-serif;
        }
        .print-only-container {
          width: 100%;
          display: flex;
          justify-content: center;
          background: white;
          padding: 0;
        }
        .invoice-print-card {
          width: 100%;
          max-width: 800px;
          background: white;
          padding: 0;
          box-shadow: none;
          border: none;
        }
        @media print {
          /* Hide standard screen decorators */
          nav, footer, aside, button, .no-print {
            display: none !important;
          }
        }
      `}</style>
    </div>
  )
}
