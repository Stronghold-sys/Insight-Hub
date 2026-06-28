'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { CreditCard, Check, ArrowRight, ShieldCheck, Download, Printer, X, AlertCircle, Trash2, Clock, Copy, Share2, CheckCircle2 } from 'lucide-react'
import Modal from '@/components/ui/Modal'
import ConfirmDialog from '@/components/ui/ConfirmDialog'
import { getRemainingTimeText } from '@/lib/dateUtils'
import { supabase, createSafeChannel } from '@/lib/supabaseClient'
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

interface SubscriptionDetail {
  planId: string
  isTrial: boolean | number | string
  startsAt: string
  endsAt: string
  cancelAtPeriodEnd: boolean | number | string
}

interface PaymentTransaction {
  id: string
  orderId?: string | null
  reference?: string | null
  amount: string | number
  status: string
  method: string
  channel?: string | null
  vaNumber?: string | null
  paymentUrl?: string | null
  expiresAt?: string | null
  paidAt?: string | null
  date: string
  plan: string
  basePrice?: string | number | null
  discount?: string | number | null
  adminFee?: string | number | null
  couponCode?: string | null
  invoiceNumber?: string | null
  pdfUrl?: string | null
  email?: string | null
  userFullName?: string | null
}

interface SubscriptionPlan {
  id: string
  name: string
  price: number
  desc: string
  benefits: string[]
}

export default function LanggananPage() {
  const router = useRouter()
  const [activePlan, setActivePlan] = useState('free')
  const [activeSubDetails, setActiveSubDetails] = useState<SubscriptionDetail | null>(null)
  const [payments, setPayments] = useState<PaymentTransaction[]>([])
  const [selectedPlan, setSelectedPlan] = useState('premium')
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])
  const [loading, setLoading] = useState(true)
  const [cancelLoading, setCancelLoading] = useState(false)
  const [error, setError] = useState('')
  const [hasUsedTrial, setHasUsedTrial] = useState(false)
  const [trialModalPlan, setTrialModalPlan] = useState<SubscriptionPlan | null>(null)
  const [trialLoading, setTrialLoading] = useState(false)
  const [refreshBilling, setRefreshBilling] = useState(0)
  const [filterStatus, setFilterStatus] = useState('all')
  const [copyState, setCopyState] = useState<Record<string, boolean>>({})

  const handleCopyField = (key: string, text: string) => {
    navigator.clipboard.writeText(text)
    setCopyState(prev => ({ ...prev, [key]: true }))
    setTimeout(() => {
      setCopyState(prev => ({ ...prev, [key]: false }))
    }, 2000)
  }

  const [sharingLoading, setSharingLoading] = useState(false)
  const [downloading, setDownloading] = useState(false)
  const [toastMsg, setToastMsg] = useState('')
  const [toastVariant, setToastVariant] = useState<'success' | 'error'>('success')

  const showToast = (msg: string, variant: 'success' | 'error' = 'success', ms = 3000) => {
    setToastMsg(msg)
    setToastVariant(variant)
    setTimeout(() => setToastMsg(''), ms)
  }

  const handleShare = async (invoice: PaymentTransaction) => {
    if (sharingLoading) return
    setSharingLoading(true)
    const invoiceNum = invoice.invoiceNumber || `INV-${invoice.id.substring(0, 8).toUpperCase()}`
    try {
      const res = await fetch('/api/invoice/share', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ invoiceNumber: invoiceNum, expiryType: 'forever' })
      })
      const data = await res.json()
      if (data.success && data.shareToken) {
        const shareUrl = `${window.location.origin}/invoice/share/${data.shareToken}`
        const text = `Invoice ${invoiceNum} - Paket ${invoice.plan.toUpperCase()} di Insight Hub`
        if (typeof navigator !== 'undefined' && navigator.share) {
          navigator.share({
            title: 'Invoice Insight Hub',
            text,
            url: shareUrl,
          }).catch(console.error)
        } else {
          navigator.clipboard.writeText(`${text}\nLink: ${shareUrl}`)
          showToast('Link sharing invoice berhasil disalin ke clipboard!')
        }
      } else {
        showToast(data.error || 'Gagal membuat link sharing.', 'error')
      }
    } catch (e) {
      showToast('Gagal menghubungi server untuk membuat link sharing.', 'error')
    } finally {
      setSharingLoading(false)
    }
  }

  const handleDownloadPDF = async () => {
    if (!selectedInvoice || downloading) return
    setDownloading(true)

    const invoiceNum = selectedInvoice.invoiceNumber || `INV-${selectedInvoice.id.substring(0, 8).toUpperCase()}`

    const opt = {
      margin:       [10, 10, 10, 10],
      filename:     `Invoice-${invoiceNum}.pdf`,
      image:        { type: 'jpeg', quality: 0.98 },
      html2canvas:  { scale: 2, useCORS: true, logging: false },
      jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' }
    }

    if (typeof window !== 'undefined') {
      const runGeneration = () => {
        const element = document.getElementById('printable-invoice')
        if (element) {
          const html2pdf = (window as any).html2pdf
          html2pdf().set(opt).from(element).save().then(() => {
            setDownloading(false)
          }).catch((err: any) => {
            console.error('PDF error:', err)
            setDownloading(false)
          })
        } else {
          setDownloading(false)
        }
      }

      if (!(window as any).html2pdf) {
        const script = document.createElement('script')
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js'
        script.onload = runGeneration
        document.head.appendChild(script)
      } else {
        runGeneration()
      }
    }
  }

  // Sync selectedPlan state when activePlan loads
  useEffect(() => {
    const availablePlans = SUBSCRIPTION_PLANS.filter(p => p.id !== 'free' && p.id !== activePlan)
    if (availablePlans.length > 0) {
      if (!availablePlans.some(p => p.id === selectedPlan)) {
        const timer = setTimeout(() => {
          setSelectedPlan(availablePlans[0].id)
        }, 0)
        return () => clearTimeout(timer)
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
  const [selectedInvoice, setSelectedInvoice] = useState<PaymentTransaction | null>(null)
  const [cancelTargetOrderId, setCancelTargetOrderId] = useState<string | null>(null)

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
        setRefreshBilling(c => c + 1)
        window.dispatchEvent(new Event('plan-updated'))
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
            const timer = setTimeout(() => {
              setTrialModalPlan(matchedPlan)
            }, 0)
            return () => clearTimeout(timer)
          }
        } else {
          const timer = setTimeout(() => {
            if (typeof window !== 'undefined') {
              sessionStorage.removeItem('pendingTrialPlanId')
            }
            const newParams = new URLSearchParams(window.location.search)
            newParams.delete('trialPlanId')
            const newSearch = newParams.toString()
            router.replace(`/langganan${newSearch ? `?${newSearch}` : ''}`)
          }, 0)
          return () => clearTimeout(timer)
        }
      }
    }
  }, [loading, hasUsedTrial])

  useEffect(() => {
    const timer = setTimeout(() => {
      const fetchBillingData = async () => {
        try {
          const res = await fetch('/api/user/billing')
          const data = await res.json()
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
        } catch (err) {
          console.error('Error fetching billing info:', err)
        } finally {
          setLoading(false)
        }
      }
      fetchBillingData()
    }, 0)
    return () => clearTimeout(timer)
  }, [refreshBilling])

  // Realtime subscription changes synchronization
  useEffect(() => {
    let channel: any = null;
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user?.id) {
        const userId = session.user.id;
        channel = createSafeChannel(`langganan:subscriptions:user:${userId}`)
          .on(
            'postgres_changes',
            {
              event: '*',
              schema: 'public',
              table: 'subscriptions',
              filter: `user_id=eq.${userId}`
            },
            (payload) => {
              console.log('[LanggananPage] Realtime subscription update received:', payload);
              setRefreshBilling(c => c + 1);
              window.dispatchEvent(new Event('plan-updated'));
            }
          )
          .subscribe();
      }
    });

    return () => {
      if (channel) channel.unsubscribe();
    };
  }, []);

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
        setRefreshBilling(c => c + 1)
        window.dispatchEvent(new Event('plan-updated'))
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
    if (!selectedInvoice) return
    const invoiceNum = selectedInvoice.invoiceNumber || `INV-${selectedInvoice.id.substring(0, 8).toUpperCase()}`
    window.open(`/invoice/print/${invoiceNum}`, '_blank')
  }

  // Helper status badge styling
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
      case 'PROCESSING':
        return (
          <span style={{
            fontSize: 11, fontWeight: 700, borderRadius: 6, padding: '4px 10px',
            background: 'rgba(2,134,195,0.1)', color: 'var(--brand-blue)', border: '1px solid rgba(2,134,195,0.2)'
          }}>
            PROCESSING
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
      case 'CHARGEBACK':
        return (
          <span style={{
            fontSize: 11, fontWeight: 700, borderRadius: 6, padding: '4px 10px',
            background: 'rgba(156,39,176,0.15)', color: '#9c27b0', border: '1px solid rgba(156,39,176,0.25)'
          }}>
            CHARGEBACK
          </span>
        )
      case 'FAILED':
        return (
          <span style={{
            fontSize: 11, fontWeight: 700, borderRadius: 6, padding: '4px 10px',
            background: 'rgba(211,47,47,0.1)', color: 'var(--error)', border: '1px solid rgba(211,47,47,0.2)'
          }}>
            GAGAL
          </span>
        )
      case 'EXPIRED':
      default:
        return (
          <span style={{
            fontSize: 11, fontWeight: 700, borderRadius: 6, padding: '4px 10px',
            background: 'rgba(211,47,47,0.1)', color: 'var(--error)', border: '1px solid rgba(211,47,47,0.2)'
          }}>
            EXPIRED
          </span>
        )
    }
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
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      <span style={{ fontSize: 12, fontWeight: 700, color: '#17B897', background: 'rgba(23,184,151,0.15)', padding: '4px 8px', borderRadius: 6, display: 'inline-block', alignSelf: 'flex-start' }}>
                        Trial aktif sampai {activeSubDetails.endsAt} &bull; 23:59 WIB
                      </span>
                      {mounted && (activeSubDetails as any).endsAtFull && (
                        <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.8)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#17B897', display: 'inline-block', flexShrink: 0 }} />
                          Sisa Waktu: {getRemainingTimeText((activeSubDetails as any).endsAtFull)}
                        </span>
                      )}
                    </div>
                  ) : (
                    <>
                      <p style={{ fontSize: 11.5, color: 'rgba(255,255,255,0.5)', margin: '0 0 4px' }}>
                        Aktif sejak: {activeSubDetails.startsAt} &bull; Berakhir: {activeSubDetails.endsAt} • 23:59 WIB
                      </p>
                      {mounted && (activeSubDetails as any).endsAtFull && (
                        <p style={{ fontSize: 12, color: 'var(--teal)', fontWeight: 700, margin: '4px 0 6px', display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--teal)', display: 'inline-block', flexShrink: 0 }} />
                          Sisa Waktu: {getRemainingTimeText((activeSubDetails as any).endsAtFull)}
                        </p>
                      )}
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
            
            {/* Filter buttons */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 18, overflowX: 'auto', paddingBottom: 6 }}>
              {[
                { id: 'all', label: 'Semua' },
                { id: 'pending', label: 'Pending' },
                { id: 'berhasil', label: 'Berhasil' },
                { id: 'diproses', label: 'Diproses' },
                { id: 'expired', label: 'Expired' },
                { id: 'refund', label: 'Refund' },
                { id: 'gagal', label: 'Gagal' },
                { id: 'cancelled', label: 'Cancelled' },
              ].map(f => (
                <button
                  key={f.id}
                  onClick={() => setFilterStatus(f.id)}
                  className="btn btn-sm"
                  style={{
                    flexShrink: 0,
                    background: filterStatus === f.id ? 'var(--brand-blue)' : 'var(--surface)',
                    color: filterStatus === f.id ? 'white' : 'var(--text-secondary)',
                    borderColor: filterStatus === f.id ? 'var(--brand-blue)' : 'var(--border)',
                    padding: '6px 12px',
                    fontSize: 12
                  }}
                >
                  {f.label}
                </button>
              ))}
            </div>

            {payments.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '24px 0', color: 'var(--text-secondary)', fontSize: 13 }}>
                Belum ada riwayat transaksi pembayaran kuis relasi.
              </div>
            ) : (() => {
              const filteredPayments = payments.filter(p => {
                if (filterStatus === 'all') return true
                const s = p.status.toUpperCase()
                if (filterStatus === 'pending') return ['PENDING', 'WAITING_PAYMENT'].includes(s)
                if (filterStatus === 'berhasil') return ['SUCCESS', 'PAID'].includes(s)
                if (filterStatus === 'diproses') return ['PROCESSING'].includes(s)
                if (filterStatus === 'expired') return ['EXPIRED'].includes(s)
                if (filterStatus === 'refund') return ['REFUNDED'].includes(s)
                if (filterStatus === 'gagal') return ['FAILED'].includes(s)
                if (filterStatus === 'cancelled') return ['CANCELLED'].includes(s)
                return true
              })

              if (filteredPayments.length === 0) {
                return (
                  <div style={{ textAlign: 'center', padding: '24px 0', color: 'var(--text-secondary)', fontSize: 13 }}>
                    Tidak ada transaksi dengan status ini.
                  </div>
                )
              }

              return (
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
                      {filteredPayments.map(p => {
                        const isPending = ['pending', 'unpaid', 'waiting_payment'].includes(p.status.toLowerCase())

                        return (
                          <tr key={p.id} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                            <td style={{ padding: '12px 16px', fontFamily: 'monospace', color: 'var(--text-primary)' }}>{p.id.substring(0, 8)}...</td>
                            <td style={{ padding: '12px 16px', fontWeight: 700, color: 'var(--text-primary)', textTransform: 'uppercase' }}>{p.plan}</td>
                            <td style={{ padding: '12px 16px', textAlign: 'right', fontWeight: 700, color: 'var(--text-primary)' }}>Rp {parseInt(String(p.amount)).toLocaleString('id-ID')}</td>
                            <td style={{ padding: '12px 16px', color: 'var(--text-secondary)' }}>{formatPaymentMethod(p.method || '', p.channel || undefined)}</td>
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
                                    onClick={() => setCancelTargetOrderId(p.orderId || null)}
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
              )
            })()}
          </div>
        </div>
      </div>

      {/* INVOICE MODAL */}
      <Modal isOpen={!!selectedInvoice} onClose={() => setSelectedInvoice(null)} maxWidth={640} title="Invoice Rincian Pembayaran">
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
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, justifyContent: 'flex-end' }}>
                    <p style={{ fontSize: 13, fontFamily: 'monospace', color: 'var(--text-primary)', fontWeight: 700, margin: 0 }}>
                      {selectedInvoice.invoiceNumber || `INV-${selectedInvoice.id.substring(0, 8).toUpperCase()}`}
                    </p>
                    <button 
                      onClick={() => handleCopyField('invNo', selectedInvoice.invoiceNumber || `INV-${selectedInvoice.id.substring(0, 8).toUpperCase()}`)}
                      style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 2 }}
                      title="Salin Nomor Invoice"
                    >
                      {copyState.invNo ? <CheckCircle2 size={13} color="var(--teal)" /> : <Copy size={13} />}
                    </button>
                  </div>
                </div>
              </div>
              
              <hr style={{ border: 'none', borderTop: '1px solid var(--border-subtle)', marginBottom: 20 }} />
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, fontSize: 12.5, color: 'var(--text-secondary)', marginBottom: 24 }}>
                <div>
                  <p style={{ fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', fontSize: 11, margin: '0 0 6px' }}>Pelanggan:</p>
                  <p style={{ fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 2px' }}>{selectedInvoice.userFullName || 'Pelanggan Insight Hub'}</p>
                  <p style={{ margin: '0 0 2px' }}>Email: {selectedInvoice.email || '-'}</p>
                  <p style={{ margin: 0 }}>Status: Premium Subscriber</p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <p style={{ fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', fontSize: 11, margin: '0 0 6px' }}>Detail Transaksi:</p>
                  <p style={{ margin: '0 0 2px' }}>Tanggal Dibuat: <strong>{selectedInvoice.date}</strong></p>
                  {selectedInvoice.paidAt && <p style={{ margin: '0 0 2px' }}>Tanggal Dibayar: <strong>{selectedInvoice.paidAt}</strong></p>}
                  {selectedInvoice.expiresAt && <p style={{ margin: '0 0 2px' }}>Tanggal Expired: <strong>{selectedInvoice.expiresAt}</strong></p>}
                  <p style={{ margin: '0 0 2px' }}>Metode: <strong>{formatPaymentMethod(selectedInvoice.method || '', selectedInvoice.channel || undefined)}</strong></p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4, justifyContent: 'flex-end', marginTop: 4 }}>
                    <span style={{ fontSize: 12 }}>Status:</span>
                    {getStatusBadge(selectedInvoice.status)}
                  </div>
                </div>
              </div>

              {/* References Box */}
              <div style={{ background: 'var(--bg)', border: '1px solid var(--border-subtle)', borderRadius: 8, padding: 12, fontSize: 11.5, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 24 }}>
                <div>
                  <span style={{ display: 'block', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', fontSize: 9.5 }}>ID Transaksi</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontFamily: 'monospace', color: 'var(--text-primary)' }}>
                    <span>{selectedInvoice.id}</span>
                    <button 
                      onClick={() => handleCopyField('txId', selectedInvoice.id)}
                      style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 1 }}
                    >
                      {copyState.txId ? <CheckCircle2 size={11} color="var(--teal)" /> : <Copy size={11} />}
                    </button>
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span style={{ display: 'block', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', fontSize: 9.5 }}>Referensi</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontFamily: 'monospace', color: 'var(--text-primary)', justifyContent: 'flex-end' }}>
                    <span>{selectedInvoice.reference || '-'}</span>
                    {selectedInvoice.reference && (
                      <button 
                        onClick={() => handleCopyField('refNo', selectedInvoice.reference || '')}
                        style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 1 }}
                      >
                        {copyState.refNo ? <CheckCircle2 size={11} color="var(--teal)" /> : <Copy size={11} />}
                      </button>
                    )}
                  </div>
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
                      {/* Features/Benefits List based on Selected Plan */}
                      <div style={{ marginTop: 8, borderTop: '1px dashed var(--border-subtle)', paddingTop: 8 }}>
                        <span style={{ fontSize: 10.5, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>Fitur Utama Paket:</span>
                        <ul style={{ padding: 0, margin: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 4 }}>
                          {SUBSCRIPTION_PLANS.find(p => p.id === selectedInvoice.plan.toLowerCase())?.benefits.map((b, idx) => (
                            <li key={idx} style={{ display: 'flex', gap: 6, alignItems: 'center', fontSize: 11, color: 'var(--text-secondary)' }}>
                              <span style={{ color: 'var(--teal)', fontWeight: 'bold' }}>✓</span>
                              <span>{b}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </td>
                    <td style={{ padding: '12px 0', textAlign: 'right', fontWeight: 700, color: 'var(--text-primary)', verticalAlign: 'top' }}>
                      Rp {parseInt(String(selectedInvoice.basePrice || selectedInvoice.amount)).toLocaleString('id-ID')}
                    </td>
                  </tr>
                  <tr>
                    <td style={{ padding: '10px 0 4px', color: 'var(--text-secondary)' }}>Harga Paket</td>
                    <td style={{ padding: '10px 0 4px', textAlign: 'right', fontWeight: 600, color: 'var(--text-primary)' }}>
                      Rp {parseInt(String(selectedInvoice.basePrice || selectedInvoice.amount)).toLocaleString('id-ID')}
                    </td>
                  </tr>
                  {selectedInvoice.discount && parseInt(String(selectedInvoice.discount)) > 0 && (
                    <tr>
                      <td style={{ padding: '4px 0', color: 'var(--error)' }}>Diskon Voucher {selectedInvoice.couponCode ? `(${selectedInvoice.couponCode})` : ''}</td>
                      <td style={{ padding: '4px 0', textAlign: 'right', fontWeight: 600, color: 'var(--error)' }}>
                        -Rp {parseInt(String(selectedInvoice.discount)).toLocaleString('id-ID')}
                      </td>
                    </tr>
                  )}
                  {selectedInvoice.adminFee && parseInt(String(selectedInvoice.adminFee)) > 0 && (
                    <tr>
                      <td style={{ padding: '4px 0', color: 'var(--text-secondary)' }}>Biaya Admin</td>
                      <td style={{ padding: '4px 0', textAlign: 'right', fontWeight: 600, color: 'var(--text-primary)' }}>
                        Rp {parseInt(String(selectedInvoice.adminFee)).toLocaleString('id-ID')}
                      </td>
                    </tr>
                  )}
                  <tr style={{ borderTop: '1px dotted var(--border)' }}>
                    <td style={{ padding: '14px 0', fontWeight: 800, color: 'var(--text-primary)', fontSize: 14 }}>Total yang Harus Dibayar</td>
                    <td style={{ padding: '14px 0', textAlign: 'right', fontWeight: 900, fontSize: 16, color: 'var(--brand-blue)' }}>
                      Rp {parseInt(String(selectedInvoice.amount)).toLocaleString('id-ID')}
                    </td>
                  </tr>
                </tbody>
              </table>
              
              <div style={{ background: 'var(--bg)', padding: 16, borderRadius: 10, border: '1px solid var(--border-subtle)', textAlign: 'center', fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                Terima kasih telah mempercayai <strong>Insight Hub</strong> untuk menemani journey relasi kamu!
              </div>
            </div>
            
            {/* Modal Footer */}
            <div style={{ display: 'flex', gap: 10, paddingTop: 16, borderTop: '1px solid var(--border-subtle)', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setSelectedInvoice(null)}
                className="btn btn-secondary"
                style={{ justifyContent: 'center', minWidth: 100 }}
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
              title="Tutup"
              aria-label="Tutup"
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
              title="Tutup"
              aria-label="Tutup"
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

      <style jsx global>{`
        @media (max-width: 991px) {
          .grid-pricing {
            grid-template-columns: 1fr !important;
          }
        }
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
          }
        }
      `}</style>

      {/* Toast notification */}
      {toastMsg && (
        <div
          className="animate-fadein"
          style={{
            position: 'fixed',
            bottom: 24,
            right: 24,
            zIndex: 9998,
            background: toastVariant === 'success' ? 'rgba(23,184,151,0.12)' : 'rgba(211,47,47,0.12)',
            border: `1px solid ${toastVariant === 'success' ? 'rgba(23,184,151,0.3)' : 'rgba(211,47,47,0.3)'}`,
            color: toastVariant === 'success' ? 'var(--teal)' : 'var(--error)',
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
    </>
  )
}
