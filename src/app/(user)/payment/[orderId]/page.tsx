'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { CheckCircle2, AlertTriangle, Copy, Check, Clock, RefreshCw, ArrowLeft, ExternalLink } from 'lucide-react'
import { supabase, createSafeChannel } from '@/lib/supabaseClient'

const CHANNEL_NAMES: Record<string, string> = {
  BC: 'BCA',
  M2: 'Mandiri',
  I1: 'BNI',
  BT: 'Permata Bank',
  SP: 'QRIS',
}

const CHANNEL_LOGOS: Record<string, string> = {
  BC: 'https://upload.wikimedia.org/wikipedia/commons/5/5c/Bank_Central_Asia.svg',
  M2: 'https://upload.wikimedia.org/wikipedia/commons/a/ad/Bank_Mandiri_logo_2016.svg',
  I1: 'https://upload.wikimedia.org/wikipedia/commons/f/f0/Bank_Negara_Indonesia_logo_%282004%29.svg',
  BT: 'https://upload.wikimedia.org/wikipedia/commons/f/ff/Permata_Bank_%282024%29.svg',
  SP: 'https://upload.wikimedia.org/wikipedia/commons/a/a2/Logo_QRIS.svg',
}

export default function PaymentInstructionsPage() {
  const router = useRouter()
  const params = useParams()
  const orderId = params.orderId as string

  const [order, setOrder] = useState<any>(null)
  const [copied, setCopied] = useState(false)
  const [timeLeft, setTimeLeft] = useState('')
  const [loading, setLoading] = useState(true)
  const [checking, setChecking] = useState(false)
  const [error, setError] = useState('')

  // 1. Fetch current status of this order
  const checkStatus = async (showLoading = false) => {
    if (showLoading) setChecking(true)
    try {
      const res = await fetch(`/api/billing/status/${orderId}`)
      const data = await res.json()
      if (res.ok && data.success) {
        setOrder(data.order)
        setError('')
        // Notify sidebar to refresh plan badge when payment is confirmed
        if (data.order?.orderStatus && ['success', 'paid'].includes(data.order.orderStatus.toLowerCase())) {
          window.dispatchEvent(new Event('plan-updated'))
        }
      } else {
        setError(data.error || 'Gagal memuat status pembayaran.')
      }
    } catch (err) {
      console.error(err)
      setError('Koneksi bermasalah saat memuat status.')
    } finally {
      setLoading(false)
      setChecking(false)
    }
  }

  // Supabase Realtime Subscription for instant updates
  useEffect(() => {
    if (!orderId) return

    console.log('[Realtime] Subscribing to order status updates for:', orderId)
    const channel = createSafeChannel(`order-status-${orderId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'orders',
          filter: `id=eq.${orderId}`
        },
        (payload) => {
          console.log('[Realtime] Order status update received:', payload.new)
          if (payload.new && payload.new.status) {
            checkStatus(false)
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [orderId])

  // Initial load + Polling loop (as a backup/fallback)
  useEffect(() => {
    checkStatus()

    const interval = setInterval(() => {
      // Only poll if order is still pending
      if (order && ['pending', 'waiting_payment'].includes(order.orderStatus?.toLowerCase())) {
        checkStatus()
      }
    }, 10000) // Increase polling interval to 10 seconds since we have realtime enabled

    return () => clearInterval(interval)
  }, [orderId, order?.orderStatus])

  // 2. Countdown Timer
  useEffect(() => {
    if (!order || !['pending', 'waiting_payment'].includes(order.orderStatus?.toLowerCase()) || !order.expiresAt) return

    const updateTimer = () => {
      const expiry = new Date(order.expiresAt.replace(' ', 'T')).getTime()
      const now = new Date().getTime()
      const diff = expiry - now

      if (diff <= 0) {
        setTimeLeft('Waktu Habis')
        setOrder((prev: any) => prev ? { ...prev, orderStatus: 'EXPIRED' } : null)
        return
      }

      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
      const seconds = Math.floor((diff % (1000 * 60)) / 1000)

      setTimeLeft(
        `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
      )
    }

    updateTimer()
    const timerId = setInterval(updateTimer, 1000)
    return () => clearInterval(timerId)
  }, [order, order?.expiresAt])

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  // 3. Render dynamic VA instructions
  const getInstructions = (channel: string) => {
    const list: Record<string, string[]> = {
      BC: [
        'Masukkan kartu ATM BCA dan PIN Anda.',
        'Pilih menu "Transaksi Lainnya" > "Transfer" > "ke Rekening BCA Virtual Account".',
        'Masukkan nomor Virtual Account yang tertera di atas.',
        'Validasi jumlah tagihan dan nama merchant (Insight Hub).',
        'Ikuti petunjuk di layar ATM untuk menyelesaikan pembayaran.'
      ],
      M2: [
        'Masukkan kartu ATM Mandiri dan PIN Anda.',
        'Pilih menu "Bayar/Beli" > "Multi Payment".',
        'Masukkan kode perusahaan / institusi jika diminta, lalu masukkan nomor Virtual Account.',
        'Masukkan jumlah pembayaran sesuai dengan tagihan.',
        'Konfirmasi transaksi dan simpan struk pembayaran Anda.'
      ],
      I1: [
        'Masukkan kartu ATM BNI dan PIN Anda.',
        'Pilih menu "Lainnya" > "Transfer" > "Virtual Account Billing".',
        'Masukkan nomor Virtual Account di atas.',
        'Periksa nama tagihan dan nominal, lalu pilih "Lanjutkan".',
        'Transaksi selesai, simpan struk Anda.'
      ],
      BT: [
        'Masukkan kartu ATM Permata/Prima/Alto Anda.',
        'Pilih menu "Transfer" > "Ke Rekening Permata".',
        'Masukkan nomor Virtual Account.',
        'Pastikan nominal sesuai, lalu pilih "Ya".',
        'Selesai.'
      ]
    }
    return list[channel] || [
      'Lakukan pembayaran sesuai instruksi merchant.',
      'Pastikan nominal transfer persis sama dengan jumlah tagihan.',
      'Setelah bayar, silakan klik tombol Cek Status Pembayaran.'
    ]
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '60vh', gap: 12 }}>
        <div className="animate-spin" style={{ width: 36, height: 36, border: '4px solid var(--border-subtle)', borderTopColor: 'var(--brand-blue)', borderRadius: '50%' }} />
        <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Memuat instruksi pembayaran...</p>
      </div>
    )
  }

  if (error || !order) {
    return (
      <div className="card" style={{ padding: 40, textAlign: 'center', maxWidth: 500, margin: '40px auto' }}>
        <AlertTriangle size={48} color="var(--error)" style={{ margin: '0 auto 16px' }} />
        <h2 style={{ fontSize: 18, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 8 }}>Order Tidak Ditemukan</h2>
        <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 20 }}>{error || 'Transaksi tidak terdaftar.'}</p>
        <Link href="/langganan" className="btn btn-primary" style={{ display: 'inline-flex' }}>Kembali</Link>
      </div>
    )
  }

  // --- Success State UI ---
  if (order.orderStatus && ['success', 'paid'].includes(order.orderStatus.toLowerCase())) {
    return (
      <div className="card animate-fadein" style={{ padding: 48, textAlign: 'center', maxWidth: 540, margin: '40px auto' }}>
        <div style={{ color: 'var(--teal)', display: 'inline-block', marginBottom: 20 }}>
          <CheckCircle2 size={64} fill="rgba(23,184,151,0.1)" />
        </div>
        <h2 style={{ fontSize: 22, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 8 }}>Pembayaran Sukses!</h2>
        <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: 32 }}>
          Terima kasih! Pembayaran untuk order <strong>{orderId}</strong> sebesar <strong>Rp {parseInt(order.amount).toLocaleString('id-ID')}</strong> telah kami terima. Paket <strong>{order.planId.toUpperCase()}</strong> Anda sekarang aktif.
        </p>

        <div style={{ display: 'flex', gap: 12 }}>
          <Link href="/dashboard" className="btn btn-primary" style={{ flex: 1, justifyContent: 'center' }}>
            Buka Dashboard
          </Link>
          <Link href="/langganan" className="btn btn-secondary" style={{ flex: 1, justifyContent: 'center' }}>
            Lihat Tagihan
          </Link>
        </div>
      </div>
    )
  }

  // --- Failed / Expired / Cancelled State UI ---
  if (order.orderStatus && ['expired', 'failed', 'cancelled'].includes(order.orderStatus.toLowerCase())) {
    const isCancelled = order.orderStatus.toLowerCase() === 'cancelled'
    return (
      <div className="card animate-fadein" style={{ padding: 48, textAlign: 'center', maxWidth: 540, margin: '40px auto' }}>
        <div style={{ color: 'var(--error)', display: 'inline-block', marginBottom: 20 }}>
          <AlertTriangle size={64} fill="rgba(211,47,47,0.1)" />
        </div>
        <h2 style={{ fontSize: 22, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 8 }}>
          {isCancelled ? 'Pembayaran Dibatalkan' : 'Pembayaran Kedaluwarsa'}
        </h2>
        <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: 32 }}>
          {isCancelled 
            ? `Pesanan untuk order ${orderId} telah dibatalkan.` 
            : `Batas waktu pembayaran untuk order ${orderId} telah habis. Silakan lakukan checkout ulang.`}
        </p>

        <div style={{ display: 'flex', gap: 12 }}>
          <Link href={`/checkout?planId=${order.planId}`} className="btn btn-primary" style={{ flex: 1, justifyContent: 'center' }}>
            Beli Ulang Paket
          </Link>
          <Link href="/langganan" className="btn btn-secondary" style={{ flex: 1, justifyContent: 'center' }}>
            Kembali
          </Link>
        </div>
      </div>
    )
  }

  // --- Pending State UI ---
  const isVA = !!order.vaNumber;

  return (
    <>
      <div style={{ maxWidth: 640, margin: '0 auto' }}>
        
        {/* Navigation */}
        <Link href="/langganan" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--text-secondary)', textDecoration: 'none', marginBottom: 20 }}>
          <ArrowLeft size={14} /> Kembali ke Billing
        </Link>

        <div className="card" style={{ padding: 24, marginBottom: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12, borderBottom: '1px solid var(--border-subtle)', paddingBottom: 16, marginBottom: 20 }}>
            <div>
              <span style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.05em' }}>Metode Pembayaran</span>
              <h2 style={{ fontSize: 16, fontWeight: 800, color: 'var(--text-primary)', margin: '2px 0 0' }}>
                {isVA ? 'Bank Transfer / Virtual Account' : 'E-Wallet / QRIS / Retail'}
              </h2>
            </div>
            <div style={{ background: 'rgba(245,166,35,0.08)', border: '1px solid rgba(245,166,35,0.15)', borderRadius: 6, padding: '6px 12px', display: 'flex', alignItems: 'center', gap: 8, color: 'var(--warning)' }}>
              <Clock size={15} />
              <span style={{ fontSize: 13, fontWeight: 700 }}>{timeLeft}</span>
            </div>
          </div>

          {/* Amount Box */}
          <div style={{ background: 'var(--bg)', border: '1px solid var(--border-subtle)', borderRadius: 10, padding: 18, textAlign: 'center', marginBottom: 20 }}>
            <span style={{ fontSize: 12, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>Total Jumlah Tagihan</span>
            <span style={{ fontSize: 24, fontWeight: 800, color: 'var(--brand-blue)' }}>
              Rp {parseInt(order.amount).toLocaleString('id-ID')}
            </span>
          </div>

          {/* VA Detail Box */}
          {isVA ? (
            <div style={{ border: '1px solid var(--border)', borderRadius: 10, padding: 18, display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, gap: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                {/* Bank Logo */}
                {CHANNEL_LOGOS[order.channel] && (
                  <div style={{ width: 64, height: 40, background: 'white', borderRadius: 6, padding: 4, border: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <img src={CHANNEL_LOGOS[order.channel]} alt={CHANNEL_NAMES[order.channel] || order.channel} style={{ maxHeight: '100%', maxWidth: '100%', objectFit: 'contain' }} />
                  </div>
                )}
                <div>
                  <span style={{ fontSize: 11.5, color: 'var(--text-secondary)', display: 'block', marginBottom: 2 }}>
                    Nomor Virtual Account {CHANNEL_NAMES[order.channel] || order.channel}
                  </span>
                  <span style={{ fontSize: 18, fontWeight: 800, color: 'var(--text-primary)', fontFamily: 'monospace', letterSpacing: '0.05em' }}>{order.vaNumber}</span>
                </div>
              </div>
              <button
                onClick={() => handleCopy(order.vaNumber)}
                className="btn btn-secondary btn-sm"
                style={{ gap: 6, flexShrink: 0 }}
              >
                {copied ? <Check size={14} color="var(--teal)" /> : <Copy size={14} />}
                {copied ? 'Tersalin' : 'Salin'}
              </button>
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '10px 0 20px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
              {/* Logo */}
              {CHANNEL_LOGOS[order.channel] && (
                <div style={{ width: 80, height: 48, background: 'white', borderRadius: 6, padding: 4, border: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <img src={CHANNEL_LOGOS[order.channel]} alt={CHANNEL_NAMES[order.channel] || order.channel} style={{ maxHeight: '100%', maxWidth: '100%', objectFit: 'contain' }} />
                </div>
              )}
              <p style={{ fontSize: 13.5, color: 'var(--text-secondary)', maxWidth: 440, margin: '0 auto' }}>
                Klik tombol di bawah ini untuk dialihkan ke halaman pembayaran {CHANNEL_NAMES[order.channel] || 'eksternal'} untuk menyelesaikan transaksi Anda.
              </p>
              {order.paymentUrl && (
                <a
                  href={order.paymentUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-primary"
                  style={{ display: 'inline-flex', gap: 8, padding: '12px 24px', textDecoration: 'none' }}
                >
                  Bayar Sekarang <ExternalLink size={15} />
                </a>
              )}
            </div>
          )}

          {/* Action Row */}
          <div style={{ display: 'flex', gap: 12, borderTop: '1px solid var(--border-subtle)', paddingTop: 16 }}>
            <button
              onClick={() => checkStatus(true)}
              disabled={checking}
              className="btn btn-primary"
              style={{ flex: 1, justifyContent: 'center', gap: 8 }}
            >
              <RefreshCw size={14} className={checking ? 'animate-spin' : ''} />
              {checking ? 'Memverifikasi...' : 'Cek Status Pembayaran'}
            </button>
          </div>
        </div>

        {/* Instructions Card */}
        {isVA && (
          <div className="card" style={{ padding: 24 }}>
            <h3 style={{ fontSize: 14.5, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 16 }}>Panduan Cara Pembayaran</h3>
            <ol style={{ paddingLeft: 18, margin: 0, display: 'flex', flexDirection: 'column', gap: 12, fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
              {getInstructions(order.channel).map((step, i) => (
                <li key={i}>{step}</li>
              ))}
            </ol>
          </div>
        )}

      </div>
    </>
  )
}
