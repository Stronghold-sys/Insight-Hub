'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { CreditCard, Check, ArrowRight, ShieldCheck, Download, Printer, X, AlertCircle, Trash2, Clock } from 'lucide-react'
import Modal from '@/components/ui/Modal'

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

export default function LanggananPage() {
  const router = useRouter()
  const [activePlan, setActivePlan] = useState('free')
  const [activeSubDetails, setActiveSubDetails] = useState<any>(null)
  const [payments, setPayments] = useState<any[]>([])
  const [selectedPlan, setSelectedPlan] = useState('premium')
  const [loading, setLoading] = useState(true)
  const [cancelLoading, setCancelLoading] = useState(false)
  const [error, setError] = useState('')
  const [hasUsedTrial, setHasUsedTrial] = useState(false)
  const [trialModalPlan, setTrialModalPlan] = useState<any>(null)
  const [trialLoading, setTrialLoading] = useState(false)

  // Sync selectedPlan state when activePlan loads
  useEffect(() => {
    const availablePlans = SUBSCRIPTION_PLANS.filter(p => p.id !== 'free' && p.id !== activePlan)
    if (availablePlans.length > 0) {
      if (!availablePlans.some(p => p.id === selectedPlan)) {
        setSelectedPlan(availablePlans[0].id)
      }
    }
  }, [activePlan, selectedPlan])

  const formatEndsAt = (endsAtStr: string) => {
    if (!endsAtStr) return ''
    const parts = endsAtStr.split('-')
    if (parts.length === 3) {
      const year = parseInt(parts[0])
      const month = parseInt(parts[1]) - 1
      const day = parseInt(parts[2])
      const d = new Date(year, month, day)
      return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })
    }
    return endsAtStr
  }

  const handleSelectPlanCard = (planId: string) => {
    if (selectedPlan === planId) {
      if (!hasUsedTrial && (planId === 'basic' || planId === 'premium')) {
        const matchedPlan = SUBSCRIPTION_PLANS.find(p => p.id === planId)
        if (matchedPlan) setTrialModalPlan(matchedPlan)
      } else {
        router.push(`/checkout?planId=${planId}`)
      }
    } else {
      setSelectedPlan(planId)
    }
  }

  const handleProceedToPayment = (planId: string) => {
    if (selectedPlan === planId) {
      if (!hasUsedTrial && (planId === 'basic' || planId === 'premium')) {
        const matchedPlan = SUBSCRIPTION_PLANS.find(p => p.id === planId)
        if (matchedPlan) setTrialModalPlan(matchedPlan)
      } else {
        router.push(`/checkout?planId=${planId}`)
      }
    } else {
      setSelectedPlan(planId)
    }
  }
  
  // Modal states
  const [selectedInvoice, setSelectedInvoice] = useState<any>(null)
  const [cancelTargetOrderId, setCancelTargetOrderId] = useState<string | null>(null)

  const fetchBillingData = () => {
    setLoading(true)
    fetch('/api/user/billing')
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setPayments(data.payments)
          setActiveSubDetails(data.activeSubscription)
          setHasUsedTrial(data.hasUsedTrial)
          if (data.activeSubscription) {
            setActivePlan(data.activeSubscription.planId)
          } else {
            setActivePlan('free')
          }
        }
      })
      .catch(err => console.error('Error fetching billing info:', err))
      .finally(() => setLoading(false))
  }

  const handleActivateTrial = async (planId: string) => {
    setTrialLoading(true)
    setError('')
    try {
      const res = await fetch('/api/billing/trial', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planId })
      })
      const data = await res.json()
      if (res.ok && data.success) {
        setTrialModalPlan(null)
        if (typeof window !== 'undefined') {
          sessionStorage.removeItem('pendingTrialPlanId')
        }
        router.replace('/langganan')
        fetchBillingData()
      } else {
        setError(data.error || 'Gagal mengaktifkan trial. Coba lagi ya!')
      }
    } catch (err) {
      setError('Koneksi server bermasalah saat mengaktifkan trial.')
    } finally {
      setTrialLoading(false)
    }
  }

  const closeTrialModal = () => {
    setTrialModalPlan(null)
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('pendingTrialPlanId')
    }
    const searchParams = new URLSearchParams(window.location.search)
    if (searchParams.has('trialPlanId')) {
      router.replace('/langganan')
    }
  }

  // Handling pending trial from redirect after login
  useEffect(() => {
    if (!loading) {
      const searchParams = new URLSearchParams(window.location.search)
      const urlPlanId = searchParams.get('trialPlanId')
      const storedPlanId = typeof window !== 'undefined' ? sessionStorage.getItem('pendingTrialPlanId') : null
      const planId = urlPlanId || storedPlanId

      if (planId && (planId === 'basic' || planId === 'premium')) {
        if (!hasUsedTrial) {
          const matchedPlan = SUBSCRIPTION_PLANS.find(p => p.id === planId)
          if (matchedPlan) {
            setTrialModalPlan(matchedPlan)
          }
        } else {
          if (typeof window !== 'undefined') {
            sessionStorage.removeItem('pendingTrialPlanId')
          }
          const newParams = new URLSearchParams(window.location.search)
          newParams.delete('trialPlanId')
          const newSearch = newParams.toString()
          router.replace(`/langganan${newSearch ? `?${newSearch}` : ''}`)
        }
      }
    }
  }, [loading, hasUsedTrial])

  useEffect(() => {
    fetchBillingData()
  }, [])

  // Confirm order cancellation
  const handleCancelOrder = async () => {
    if (!cancelTargetOrderId) return
    setCancelLoading(true)
    setError('')
    try {
      const res = await fetch('/api/billing/cancel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId: cancelTargetOrderId })
      })
      const data = await res.json()
      if (res.ok && data.success) {
        setCancelTargetOrderId(null)
        fetchBillingData()
      } else {
        setError(data.error || 'Gagal membatalkan pesanan. Coba lagi.')
      }
    } catch (err) {
      setError('Koneksi server bermasalah saat membatalkan pesanan.')
    } finally {
      setCancelLoading(false)
    }
  }

  const handlePrint = () => {
    if (typeof window !== 'undefined') {
      window.print()
    }
  }

  // Helper status badge styling
  const getStatusBadge = (status: string) => {
    const s = status.toLowerCase()
    if (s === 'success' || s === 'paid') {
      return (
        <span style={{
          fontSize: 11, fontWeight: 700, borderRadius: 6, padding: '4px 10px',
          background: 'rgba(23,184,151,0.1)', color: 'var(--teal)', border: '1px solid rgba(23,184,151,0.2)'
        }}>
          PAID / LUNAS
        </span>
      )
    }
    if (s === 'pending' || s === 'unpaid') {
      return (
        <span style={{
          fontSize: 11, fontWeight: 700, borderRadius: 6, padding: '4px 10px',
          background: 'rgba(245,166,35,0.1)', color: 'var(--warning)', border: '1px solid rgba(245,166,35,0.2)'
        }}>
          PENDING
        </span>
      )
    }
    if (s === 'cancelled') {
      return (
        <span style={{
          fontSize: 11, fontWeight: 700, borderRadius: 6, padding: '4px 10px',
          background: 'rgba(255,255,255,0.06)', color: 'var(--text-muted)', border: '1px solid var(--border)'
        }}>
          BATAL
        </span>
      )
    }
    return (
      <span style={{
        fontSize: 11, fontWeight: 700, borderRadius: 6, padding: '4px 10px',
        background: 'rgba(211,47,47,0.1)', color: 'var(--error)', border: '1px solid rgba(211,47,47,0.2)'
      }}>
        EXPIRED
      </span>
    )
  }

  // Access check: is user on the highest plan (couple or admin)?
  const isHighestPlan = activePlan === 'couple' || activePlan === 'admin'

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', gap: 12 }}>
        <div className="spinner" style={{ borderColor: 'rgba(2,134,195,0.2)', borderTopColor: 'var(--brand-blue)', width: 32, height: 32 }} />
        <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Memuat data paket & transaksi...</p>
      </div>
    )
  }

  return (
    <>
      <div style={{ maxWidth: 840, margin: '0 auto' }}>
        
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 28 }}>
          <div style={{
            width: 40, height: 40, borderRadius: 8, background: 'rgba(2,134,195,0.08)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--brand-blue)'
          }}>
            <CreditCard size={20} />
          </div>
          <div>
            <h1 style={{ fontSize: 20, fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>Langganan &amp; Billing</h1>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: 0 }}>Upgrade paket kuis relasi kamu dan kelola riwayat transaksi secara asertif.</p>
          </div>
        </div>

        {error && (
          <div style={{ background: 'rgba(211,47,47,0.08)', border: '1px solid rgba(211,47,47,0.2)', color: 'var(--error)', padding: '10px 14px', borderRadius: 8, fontSize: 13, marginBottom: 20 }}>
            {error}
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
          
          {/* Active Subscription Status Banner */}
          <div className="card" style={{ padding: 20, background: 'linear-gradient(135deg, #1B1E28, #2E3347)', color: 'white' }}>
            <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)', margin: '0 0 2px' }}>Paket Kamu Saat Ini:</p>
            <h3 style={{ fontSize: 18, fontWeight: 800, color: 'white', margin: '0 0 8px', textTransform: 'uppercase' }}>
              {activePlan === 'admin' ? 'Admin (Akses Penuh)' : `${activePlan} Access`}
            </h3>
            
            {activeSubDetails ? (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: 12 }}>
                <div>
                  {activeSubDetails.isTrial === 1 || activeSubDetails.isTrial === true || activeSubDetails.isTrial === '1' ? (
                    <span style={{ fontSize: 12, fontWeight: 700, color: '#17B897', background: 'rgba(23,184,151,0.15)', padding: '4px 8px', borderRadius: 6, display: 'inline-block' }}>
                      Trial aktif sampai {formatEndsAt(activeSubDetails.endsAt)}
                    </span>
                  ) : (
                    <>
                      <p style={{ fontSize: 11.5, color: 'rgba(255,255,255,0.5)', margin: '0 0 2px' }}>
                        Aktif sejak: {activeSubDetails.startsAt} &bull; Berakhir: {activeSubDetails.endsAt}
                      </p>
                      {activeSubDetails.cancelAtPeriodEnd ? (
                        <span style={{ fontSize: 10.5, fontWeight: 700, color: 'var(--warning)', background: 'rgba(245,166,35,0.15)', padding: '2px 6px', borderRadius: 4 }}>
                          Akan berakhir (Auto-renewal nonaktif)
                        </span>
                      ) : (
                        <span style={{ fontSize: 10.5, fontWeight: 700, color: 'var(--teal)', background: 'rgba(23,184,151,0.15)', padding: '2px 6px', borderRadius: 4 }}>
                          Perpanjang otomatis aktif
                        </span>
                      )}
                    </>
                  )}
                </div>
              </div>
            ) : (
              <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', margin: 0 }}>Status: Aktif &amp; Gratis selamanya</p>
            )}
          </div>

          {/* Upgrade Section: Only show if user is NOT on the highest plan */}
          {isHighestPlan ? (
            <div className="card" style={{ padding: 32, textAlign: 'center', background: 'rgba(23,184,151,0.02)', border: '1.5px dashed rgba(23,184,151,0.3)' }}>
              <div style={{ display: 'inline-flex', width: 48, height: 48, background: 'rgba(23,184,151,0.1)', color: 'var(--teal)', borderRadius: '50%', alignItems: 'center', justifyContent: 'center', marginBottom: 14 }}>
                <ShieldCheck size={24} />
              </div>
              <h3 style={{ fontSize: 16, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 6 }}>Kamu Udah di Paket Tertinggi!</h3>
              <p style={{ fontSize: 13.5, color: 'var(--text-secondary)', maxWidth: 460, margin: '0 auto', lineHeight: 1.6 }}>
                Gokil! Semua fitur premium di platform ini udah kebuka penuh buat kamu. Nggak ada penawaran upgrade lagi ya, selamat menjelajah!
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <h3 style={{ fontSize: 15, fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>Pilih Paket Langganan Baru:</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }} className="grid-pricing">
                {SUBSCRIPTION_PLANS.filter(p => p.id !== 'free' && p.id !== activePlan).map(plan => (
                  <div 
                    key={plan.id}
                    className="card card-hover" 
                    onClick={() => handleSelectPlanCard(plan.id)}
                    style={{ 
                      padding: 20, 
                      display: 'flex', 
                      flexDirection: 'column', 
                      border: selectedPlan === plan.id ? '2px solid var(--brand-blue)' : '1px solid var(--border)',
                      background: selectedPlan === plan.id ? 'rgba(2,134,195,0.06)' : 'var(--surface)',
                      boxShadow: selectedPlan === plan.id ? '0 12px 24px -4px rgba(2, 134, 195, 0.16), 0 8px 12px -6px rgba(2, 134, 195, 0.16)' : 'none',
                      transform: selectedPlan === plan.id ? 'translateY(-4px)' : 'none',
                      transition: 'all 200ms ease',
                      cursor: 'pointer'
                    }}
                  >
                    <span style={{ fontSize: 14, fontWeight: 800, color: 'var(--text-primary)', textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>
                      {plan.name}
                    </span>
                    <p style={{ fontSize: 12, color: 'var(--text-secondary)', minHeight: 36, marginBottom: 14, lineHeight: 1.4 }}>
                      {plan.desc}
                    </p>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginBottom: 16 }}>
                      <span style={{ fontSize: 20, fontWeight: 800, color: 'var(--text-primary)' }}>
                        Rp {plan.price.toLocaleString('id-ID')}
                      </span>
                      <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>/30 hari</span>
                    </div>

                    {/* Benefits List */}
                    <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: 12, marginBottom: 20, flex: 1 }}>
                      <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 8 }}>Fitur Utama:</p>
                      <ul style={{ padding: 0, margin: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 6 }}>
                        {plan.benefits.map((b, idx) => (
                          <li key={idx} style={{ display: 'flex', gap: 6, alignItems: 'flex-start', fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                            <Check size={12} color="var(--brand-blue)" style={{ flexShrink: 0, marginTop: 2 }} />
                            <span>{b}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        if (!hasUsedTrial && (plan.id === 'basic' || plan.id === 'premium')) {
                          setTrialModalPlan(plan);
                        } else {
                          handleProceedToPayment(plan.id);
                        }
                      }}
                      className={`btn ${selectedPlan === plan.id ? 'btn-primary' : 'btn-secondary'}`}
                      style={{ width: '100%', justifyContent: 'center', gap: 6, transition: 'all 200ms ease' }}
                    >
                      {!hasUsedTrial && (plan.id === 'basic' || plan.id === 'premium') ? (
                        plan.id === 'basic' ? 'Coba 7 Hari Gratis' : 'Coba 14 Hari Gratis'
                      ) : (
                        selectedPlan === plan.id ? 'Gas ke Pembayaran' : 'Pilih Paket'
                      )}
                      <ArrowRight size={14} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Riwayat Pembayaran */}
          <div className="card animate-fadein" style={{ padding: 24 }}>
            <h3 style={{ fontSize: 15, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 16 }}>Riwayat Transaksi &amp; Invoice</h3>
            
            {payments.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '24px 0', color: 'var(--text-secondary)', fontSize: 13 }}>
                Belum ada riwayat transaksi pembayaran kuis relasi.
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                  <thead>
                    <tr style={{ background: 'var(--bg)', borderBottom: '1px solid var(--border)', textAlign: 'left' }}>
                      <th style={{ padding: '12px 16px', fontWeight: 700, color: 'var(--text-secondary)' }}>ID Transaksi</th>
                      <th style={{ padding: '12px 16px', fontWeight: 700, color: 'var(--text-secondary)' }}>Paket</th>
                      <th style={{ padding: '12px 16px', fontWeight: 700, color: 'var(--text-secondary)', textAlign: 'right' }}>Jumlah</th>
                      <th style={{ padding: '12px 16px', fontWeight: 700, color: 'var(--text-secondary)' }}>Metode</th>
                      <th style={{ padding: '12px 16px', fontWeight: 700, color: 'var(--text-secondary)' }}>Status</th>
                      <th style={{ padding: '12px 16px', fontWeight: 700, color: 'var(--text-secondary)' }}>Tanggal</th>
                      <th style={{ padding: '12px 16px', fontWeight: 700, color: 'var(--text-secondary)', textAlign: 'right' }}>Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {payments.map(p => {
                      const isPending = p.status.toLowerCase() === 'pending' || p.status.toLowerCase() === 'unpaid'
                      const isPaid = p.status.toLowerCase() === 'success' || p.status.toLowerCase() === 'paid'

                      return (
                        <tr key={p.id} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                          <td style={{ padding: '12px 16px', fontFamily: 'monospace', color: 'var(--text-primary)' }}>{p.id.substring(0, 8)}...</td>
                          <td style={{ padding: '12px 16px', fontWeight: 700, color: 'var(--text-primary)', textTransform: 'uppercase' }}>{p.plan}</td>
                          <td style={{ padding: '12px 16px', textAlign: 'right', fontWeight: 700, color: 'var(--text-primary)' }}>Rp {parseInt(p.amount).toLocaleString('id-ID')}</td>
                          <td style={{ padding: '12px 16px', color: 'var(--text-secondary)' }}>{p.method}</td>
                          <td style={{ padding: '12px 16px' }}>
                            {getStatusBadge(p.status)}
                          </td>
                          <td style={{ padding: '12px 16px', color: 'var(--text-secondary)' }}>{p.date}</td>
                          <td style={{ padding: '12px 16px', textAlign: 'right', display: 'flex', gap: 6, justifyContent: 'flex-end', alignItems: 'center' }}>
                            {isPending && p.orderId && (
                              <>
                                <Link
                                  href={`/payment/${p.orderId}`}
                                  className="btn btn-primary btn-sm"
                                  style={{ padding: '4px 10px', fontSize: 11.5, textDecoration: 'none' }}
                                >
                                  Bayar
                                </Link>
                                <button
                                  onClick={() => setCancelTargetOrderId(p.orderId)}
                                  className="btn btn-secondary btn-sm"
                                  style={{ padding: '4px 8px', fontSize: 11.5, borderColor: 'rgba(211,47,47,0.15)', color: 'var(--error)' }}
                                  title="Batalkan Pesanan"
                                >
                                  Batal
                                </button>
                              </>
                            )}
                            <button
                              onClick={() => setSelectedInvoice(p)}
                              className="btn btn-secondary btn-sm"
                              style={{ padding: '4px 10px', fontSize: 11.5 }}
                            >
                              Detail
                            </button>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* INVOICE MODAL */}
      <Modal isOpen={!!selectedInvoice} onClose={() => setSelectedInvoice(null)} maxWidth={580} title="Invoice Rincian Pembayaran">
        {selectedInvoice && (
          <div>
            {/* Printable Area */}
            <div id="printable-invoice" style={{ padding: '12px 0 24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 24, alignItems: 'flex-start' }}>
                <div>
                  <h2 style={{ fontSize: 22, fontWeight: 900, color: 'var(--brand-blue)', margin: '0 0 4px', letterSpacing: '-0.02em' }}>Insight Hub</h2>
                  <p style={{ fontSize: 12, color: 'var(--text-secondary)', margin: 0 }}>Platform Growth Hubungan &amp; Komunikasi</p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <h3 style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-muted)', margin: '0 0 4px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Invoice Resmi</h3>
                  <p style={{ fontSize: 13, fontFamily: 'monospace', color: 'var(--text-primary)', fontWeight: 700, margin: 0 }}>
                    {selectedInvoice.invoiceNumber || `INV-${selectedInvoice.id.substring(0, 8).toUpperCase()}`}
                  </p>
                </div>
              </div>
              
              <hr style={{ border: 'none', borderTop: '1px solid var(--border-subtle)', marginBottom: 20 }} />
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, fontSize: 12.5, color: 'var(--text-secondary)', marginBottom: 24 }}>
                <div>
                  <p style={{ fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', fontSize: 11, margin: '0 0 6px' }}>Pelanggan:</p>
                  <p style={{ fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 2px' }}>Pelanggan Insight Hub</p>
                  <p style={{ margin: 0 }}>Status Akun: Premium Mode</p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <p style={{ fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', fontSize: 11, margin: '0 0 6px' }}>Detail Transaksi:</p>
                  <p style={{ margin: '0 0 2px' }}>Tanggal: <strong>{selectedInvoice.date}</strong></p>
                  <p style={{ margin: '0 0 2px' }}>Metode: <strong>{selectedInvoice.method}</strong></p>
                  <p style={{ margin: 0 }}>
                    Status: <span style={{ display: 'inline-block', transform: 'scale(0.9)', transformOrigin: 'right' }}>{getStatusBadge(selectedInvoice.status)}</span>
                  </p>
                </div>
              </div>
              
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
                      <strong style={{ color: 'var(--text-primary)' }}>Paket Langganan {selectedInvoice.plan.toUpperCase()} (30 Hari)</strong>
                      <span style={{ display: 'block', fontSize: 11.5, color: 'var(--text-muted)', marginTop: 4, lineHeight: 1.5 }}>
                        {SUBSCRIPTION_PLANS.find(p => p.id === selectedInvoice.plan.toLowerCase())?.desc || 'Akses penuh fitur premium relasi.'}
                      </span>
                      <div style={{ marginTop: 8 }}>
                        <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', margin: '0 0 4px' }}>Rincian Benefit:</p>
                        <ul style={{ margin: 0, paddingLeft: 12, fontSize: 11, color: 'var(--text-secondary)' }}>
                          {SUBSCRIPTION_PLANS.find(p => p.id === selectedInvoice.plan.toLowerCase())?.benefits.map((b, idx) => (
                            <li key={idx}>{b}</li>
                          )) || <li>Akses fitur platform penuh</li>}
                        </ul>
                      </div>
                    </td>
                    <td style={{ padding: '12px 0', textAlign: 'right', fontWeight: 700, color: 'var(--text-primary)', verticalAlign: 'top' }}>
                      Rp {parseInt(selectedInvoice.amount).toLocaleString('id-ID')}
                    </td>
                  </tr>
                  <tr>
                    <td style={{ padding: '14px 0 6px', color: 'var(--text-secondary)' }}>Subtotal</td>
                    <td style={{ padding: '14px 0 6px', textAlign: 'right', fontWeight: 700, color: 'var(--text-primary)' }}>
                      Rp {parseInt(selectedInvoice.amount).toLocaleString('id-ID')}
                    </td>
                  </tr>
                  <tr>
                    <td style={{ padding: '6px 0', color: 'var(--text-secondary)' }}>Biaya Transaksi</td>
                    <td style={{ padding: '6px 0', textAlign: 'right', color: 'var(--text-secondary)' }}>Free</td>
                  </tr>
                  <tr style={{ borderTop: '1px dotted var(--border)' }}>
                    <td style={{ padding: '14px 0', fontWeight: 800, color: 'var(--text-primary)', fontSize: 14 }}>Total yang Harus Dibayar</td>
                    <td style={{ padding: '14px 0', textAlign: 'right', fontWeight: 900, fontSize: 16, color: 'var(--brand-blue)' }}>
                      Rp {parseInt(selectedInvoice.amount).toLocaleString('id-ID')}
                    </td>
                  </tr>
                </tbody>
              </table>
              
              <div style={{ background: 'var(--bg)', padding: 16, borderRadius: 10, border: '1px solid var(--border-subtle)', textAlign: 'center', fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                Terima kasih telah mempercayai <strong>Insight Hub</strong> untuk menemani journey relasi kamu!
              </div>
            </div>
            
            {/* Modal Footer */}
            <div style={{ display: 'flex', gap: 12, paddingTop: 16, borderTop: '1px solid var(--border-subtle)' }}>
              <button
                onClick={handlePrint}
                className="btn btn-primary"
                style={{ flex: 1, justifyContent: 'center', gap: 6 }}
              >
                <Printer size={14} />
                Cetak Invoice
              </button>
              <button
                onClick={() => setSelectedInvoice(null)}
                className="btn btn-secondary"
                style={{ flex: 1, justifyContent: 'center' }}
              >
                Tutup
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* FREE TRIAL MODAL (Gen Z copywriting) */}
      {trialModalPlan && (
        <div
          onClick={closeTrialModal}
          style={{
            position: 'fixed', inset: 0, backgroundColor: 'rgba(9, 11, 16, 0.8)',
            backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', zIndex: 999999,
            display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px',
            animation: 'fadeIn 0.25s cubic-bezier(0.16, 1, 0.3, 1) both',
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: 'var(--surface)', borderRadius: '20px',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.05)',
              border: '1px solid var(--border-subtle)', maxWidth: '440px', width: '100%',
              padding: '32px', display: 'flex', flexDirection: 'column', alignItems: 'center',
              textAlign: 'center', position: 'relative',
              animation: 'fadeInScale 0.3s cubic-bezier(0.34, 1.56, 0.64, 1) both',
            }}
          >
            <button
              onClick={closeTrialModal}
              style={{ position: 'absolute', top: 16, right: 16, border: 'none', background: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 4 }}
            >
              <X size={18} />
            </button>
            
            <div style={{
              width: '64px', height: '64px', borderRadius: '50%', background: 'rgba(2,134,195,0.1)',
              color: 'var(--brand-blue)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '20px'
            }}>
              <Clock size={28} />
            </div>

            <h3 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 10px 0' }}>
              Gas mulai trial?
            </h3>
            
            <div style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: 1.6, margin: '0 0 24px 0', textAlign: 'left', width: '100%' }}>
              <p style={{ margin: '0 0 12px 0', textAlign: 'center', fontWeight: 600, color: 'var(--text-primary)' }}>
                Paket Pilihan: {trialModalPlan.name} ({trialModalPlan.id === 'basic' ? '7 Hari' : '14 Hari'} Trial)
              </p>
              <ul style={{ margin: 0, paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <li>Kamu bakal dapet akses full sesuai paket ini selama {trialModalPlan.id === 'basic' ? '7' : '14'} hari.</li>
                <li>Kalau trial udah kelar, akses premium bakal stop otomatis dan akun balik ke versi gratis.</li>
                <li>Trial ini cuma bisa sekali per akun, ya.</li>
              </ul>
            </div>

            <div style={{ display: 'flex', gap: 12, width: '100%' }}>
              <button
                className="btn btn-secondary"
                disabled={trialLoading}
                onClick={closeTrialModal}
                style={{ flex: 1, justifyContent: 'center', padding: '12px', fontSize: '14px', fontWeight: 600, borderRadius: '10px' }}
              >
                Nggak jadi deh
              </button>
              <button
                className="btn btn-primary"
                disabled={trialLoading}
                onClick={() => handleActivateTrial(trialModalPlan.id)}
                style={{
                  flex: 1, justifyContent: 'center', padding: '12px', fontSize: '14px', fontWeight: 700, borderRadius: '10px',
                  background: 'linear-gradient(135deg, #0286C3, #17B897)', border: 'none', color: 'white',
                  boxShadow: '0 4px 12px rgba(2, 134, 195, 0.25)'
                }}
              >
                {trialLoading ? 'Mengaktifkan...' : 'Setuju & Mulai Trial'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CONFIRM CANCELLATION MODAL (Gen Z copywriting) */}
      {cancelTargetOrderId && (
        <div
          onClick={() => setCancelTargetOrderId(null)}
          style={{
            position: 'fixed', inset: 0, backgroundColor: 'rgba(9, 11, 16, 0.8)',
            backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', zIndex: 999999,
            display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px',
            animation: 'fadeIn 0.25s cubic-bezier(0.16, 1, 0.3, 1) both',
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: 'var(--surface)', borderRadius: '20px',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.05)',
              border: '1px solid var(--border-subtle)', maxWidth: '440px', width: '100%',
              padding: '32px', display: 'flex', flexDirection: 'column', alignItems: 'center',
              textAlign: 'center', position: 'relative',
              animation: 'fadeInScale 0.3s cubic-bezier(0.34, 1.56, 0.64, 1) both',
            }}
          >
            <button
              onClick={() => setCancelTargetOrderId(null)}
              style={{ position: 'absolute', top: 16, right: 16, border: 'none', background: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 4 }}
            >
              <X size={18} />
            </button>
            
            <div style={{
              width: '64px', height: '64px', borderRadius: '50%', background: 'rgba(211,47,47,0.1)',
              color: 'var(--error)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '20px'
            }}>
              <AlertCircle size={28} />
            </div>

            <h3 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 10px 0' }}>
              Batalin pesanan?
            </h3>
            
            <p style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: 1.6, margin: '0 0 24px 0' }}>
              Tenang, kalau pesanan ini dibatalin sekarang, status pembayaran bakal dihentikan dan paketnya nggak akan aktif. Lanjut batal atau mau lanjut bayar aja?
            </p>

            <div style={{ display: 'flex', gap: 12, width: '100%' }}>
              <button
                className="btn btn-secondary"
                disabled={cancelLoading}
                onClick={() => setCancelTargetOrderId(null)}
                style={{ flex: 1, justifyContent: 'center', padding: '12px', fontSize: '14px', fontWeight: 600, borderRadius: '10px' }}
              >
                Nggak jadi
              </button>
              <button
                className="btn btn-primary"
                disabled={cancelLoading}
                onClick={handleCancelOrder}
                style={{
                  flex: 1, justifyContent: 'center', padding: '12px', fontSize: '14px', fontWeight: 700, borderRadius: '10px',
                  background: 'linear-gradient(135deg, #EF4444, #DC2626)', border: 'none', color: 'white',
                  boxShadow: '0 4px 12px rgba(239, 68, 68, 0.25)'
                }}
              >
                {cancelLoading ? 'Batalin...' : 'Iya, batalin'}
              </button>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        @media (max-width: 991px) {
          .grid-pricing {
            grid-template-columns: 1fr !important;
          }
        }
        @media print {
          body * {
            visibility: hidden;
          }
          #printable-invoice, #printable-invoice * {
            visibility: visible;
          }
          #printable-invoice {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }
        }
      `}</style>
    </>
  )
}
