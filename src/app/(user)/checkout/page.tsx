'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { 
  CreditCard, Check, ArrowRight, ShieldCheck, Ticket, AlertCircle, Loader2, X, Sparkles, 
  Search, Wallet, Building2, ArrowRightLeft, Store, Clock, Star, CheckCircle
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase } from '@/lib/supabaseClient'

const SUBSCRIPTION_PLANS = [
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

const CATEGORIES = [
  { id: 'all', label: 'Semua Metode', icon: CreditCard },
  { id: 'qris', label: 'QRIS', icon: Sparkles },
  { id: 'ewallet', label: 'E-Wallet', icon: Wallet },
  { id: 'va', label: 'Virtual Account', icon: Building2 },
  { id: 'transfer', label: 'Transfer Bank', icon: ArrowRightLeft },
  { id: 'retail', label: 'Retail / Gerai', icon: Store },
  { id: 'card', label: 'Kartu Kredit', icon: CreditCard },
  { id: 'paylater', label: 'PayLater', icon: Clock },
]

export default function CheckoutPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const initialPlanId = searchParams.get('planId') || 'premium'

  const [selectedPlanId, setSelectedPlanId] = useState<string>(initialPlanId)
  const [plan, setPlan] = useState<any>(null)
  const [paymentMethods, setPaymentMethods] = useState<any[]>([])
  const [selectedMethod, setSelectedMethod] = useState<string>('')
  
  const [promoCode, setPromoCode] = useState('')
  const [promoApplied, setPromoApplied] = useState(false)
  const [promoDiscount, setPromoDiscount] = useState(0)
  const [promoMessage, setPromoMessage] = useState('')
  const [promoError, setPromoError] = useState('')
  const [promoLoading, setPromoLoading] = useState(false)
  
  const [loadingMethods, setLoadingMethods] = useState(true)
  const [submitLoading, setSubmitLoading] = useState(false)
  const [error, setError] = useState('')

  // Redesign state variables
  const [searchQuery, setSearchQuery] = useState('')
  const [activeCategory, setActiveCategory] = useState('all')
  const [favoriteMethod, setFavoriteMethod] = useState<string>('')

  // Read favorite payment method from localStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setFavoriteMethod(localStorage.getItem('favorite_payment_method') || '')
    }
  }, [])

  // 1. Update selected plan details dynamically
  useEffect(() => {
    const chosen = SUBSCRIPTION_PLANS.find(p => p.id === selectedPlanId)
    if (!chosen) {
      setError('Paket tidak valid!')
    } else {
      setPlan(chosen)
      setError('')
    }
  }, [selectedPlanId])

  // 2. Calculate prices
  const getSubtotal = () => plan ? plan.price : 0
  const getDiscountAmount = () => {
    const subtotal = getSubtotal()
    return promoApplied ? Math.round(subtotal * (promoDiscount / 100)) : 0
  }
  const getGrandTotal = () => {
    return getSubtotal() - getDiscountAmount()
  }

  const grandTotal = getGrandTotal()

  // 3. Fetch payment methods from Duitku based on amount
  useEffect(() => {
    if (grandTotal <= 0) return

    setLoadingMethods(true)
    fetch(`/api/billing/payment-methods?amount=${grandTotal}`)
      .then(res => res.json())
      .then(data => {
        if (data.success && data.methods.length > 0) {
          setPaymentMethods(data.methods)
          // Keep current selection if valid, otherwise select first method
          if (!data.methods.some((m: any) => m.paymentMethod === selectedMethod)) {
            setSelectedMethod(data.methods[0].paymentMethod)
          }
        } else {
          setError('Gagal memuat metode pembayaran dari gateway.')
        }
      })
      .catch(err => {
        console.error('Error fetching payment methods:', err)
        setError('Koneksi bermasalah saat mengambil metode pembayaran.')
      })
      .finally(() => {
        setLoadingMethods(false)
      })
  }, [selectedPlanId, grandTotal])

  // 4. Validate coupon code calling the backend API
  const handleApplyPromo = async () => {
    if (!promoCode.trim()) return
    setPromoLoading(true)
    setPromoError('')
    setPromoMessage('')
    setPromoApplied(false)
    setPromoDiscount(0)

    try {
      const res = await fetch(`/api/billing/voucher?code=${encodeURIComponent(promoCode.trim())}`)
      const data = await res.json()
      
      if (res.ok && data.success) {
        setPromoApplied(true)
        setPromoDiscount(data.discountPct)
        setPromoMessage(data.message || 'Yeay, voucher-nya kepake!')
      } else {
        setPromoError(data.error || 'Kode promo-nya belum cocok, coba cek lagi ya.')
      }
    } catch (err) {
      console.error('Promo error:', err)
      setPromoError('Gagal validasi voucher. Jaringan lagi bermasalah nih.')
    } finally {
      setPromoLoading(false)
    }
  }

  // Clear promo feedback when user modifies code input
  const handlePromoInputChange = (val: string) => {
    setPromoCode(val)
    if (promoError) setPromoError('')
    if (promoMessage) setPromoMessage('')
  }

  // Reset coupon usage
  const handleRemovePromo = () => {
    setPromoCode('')
    setPromoApplied(false)
    setPromoDiscount(0)
    setPromoMessage('')
    setPromoError('')
  }

  // 5. Submit Checkout
  const handleCheckout = async () => {
    if (!plan || !selectedMethod) {
      setError('Pilih metode pembayaran terlebih dahulu!')
      return
    }

    setSubmitLoading(true)
    setError('')

    try {
      const res = await fetch('/api/billing/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          planId: plan.id,
          paymentMethodCode: selectedMethod,
          promoCode: promoApplied ? promoCode.trim() : null
        })
      })

      const data = await res.json()
      if (res.ok && data.success) {
        // Save favorite payment method in localstorage
        if (typeof window !== 'undefined') {
          localStorage.setItem('favorite_payment_method', selectedMethod)
        }
        // Redirect to custom payment instructions page
        router.push(`/payment/${data.orderId}`)
      } else {
        setError(data.error || 'Gagal memproses transaksi. Coba lagi.')
      }
    } catch (err) {
      console.error(err)
      setError('Koneksi terputus. Harap periksa jaringan internet Anda.')
    } finally {
      setSubmitLoading(false)
    }
  }

  // ============================================================
  // DYNAMIC CATEGORIZATION & DETAILS (Redesign logic)
  // ============================================================
  const categorizeMethod = (method: any) => {
    const code = method.paymentMethod.toUpperCase()
    const name = method.name.toLowerCase()

    if (code === 'SP' || name.includes('qris')) {
      return 'qris'
    }
    if (
      ['OV', 'DA', 'SA', 'LA', 'GP', 'AP', 'LINKAJA', 'SHOPEE', 'GOPAY', 'DANA', 'OVO'].some(x => code.includes(x) || name.includes(x.toLowerCase()))
    ) {
      return 'ewallet'
    }
    if (
      ['VA', 'BC', 'M2', 'I1', 'BT', 'BR', 'DN', 'MB', 'C1'].some(x => code.includes(x)) || name.includes('virtual account') || name.includes(' va')
    ) {
      return 'va'
    }
    if (name.includes('transfer') || name.includes('bank')) {
      return 'transfer'
    }
    if (['retail', 'outlet', 'indomaret', 'alfamart', 'lawson'].some(x => name.includes(x))) {
      return 'retail'
    }
    if (['cc', 'card', 'kartu', 'credit', 'visa', 'mastercard', 'jcb'].some(x => code.includes(x) || name.includes(x))) {
      return 'card'
    }
    if (['paylater', 'kredivo', 'akulaku', 'indodana'].some(x => name.includes(x))) {
      return 'paylater'
    }
    return 'other'
  }

  const getMethodDetails = (method: any) => {
    const code = method.paymentMethod.toUpperCase()
    const name = method.name.toLowerCase()
    
    let badge = ''
    let est = 'Instan'
    let desc = 'Selesaikan pembayaran secara instan dan aman.'
    let maintenance = false // Set true if channel is disabled/maintenance

    // Simulasi maintenance untuk beberapa channel jika diperlukan
    if (code === 'C1' && name.includes('cimb')) {
      // CIMB Virtual Account maintenance simulation (contoh)
      // maintenance = true
    }

    if (code === 'SP' || name.includes('qris')) {
      badge = 'Paling Populer'
      est = 'Instan'
      desc = 'Scan QRIS menggunakan GoPay, OVO, DANA, LinkAja, ShopeePay, atau m-Banking.'
    } else if (code === 'BC') {
      badge = 'Tercepat'
      est = '< 1 Menit'
      desc = 'Transfer via m-BCA, klikBCA, atau ATM BCA.'
    } else if (code === 'M2') {
      badge = 'Tercepat'
      est = '< 2 Menit'
      desc = 'Bayar via Livin by Mandiri, ATM Mandiri, atau internet banking.'
    } else if (code === 'I1') {
      badge = 'Tercepat'
      est = '< 2 Menit'
      desc = 'Bayar via BNI Mobile Banking, ATM BNI, atau internet banking.'
    } else if (code === 'BT') {
      badge = 'Biaya Admin Murah'
      est = '< 2 Menit'
      desc = 'Bayar via PermataMobile X, ATM Permata, Prima, atau Alto.'
    } else if (name.includes('dana')) {
      badge = 'Promo Cashback'
      est = 'Instan'
      desc = 'Pembayaran instan langsung potong saldo DANA.'
    } else if (name.includes('gopay')) {
      badge = 'Promo'
      est = 'Instan'
      desc = 'Pembayaran instan langsung potong saldo GoPay.'
    } else if (name.includes('ovo')) {
      badge = 'Cashback'
      est = 'Instan'
      desc = 'Pembayaran instan langsung potong saldo OVO.'
    }

    const fee = method.totalFee || 0
    const feeText = fee === 0 ? 'Bebas Biaya' : `Rp ${fee.toLocaleString('id-ID')}`

    return { badge, est, desc, feeText, maintenance }
  }

  // Filter & sort methods dynamically
  const getFilteredAndSortedMethods = () => {
    let items = paymentMethods.map(m => {
      const category = categorizeMethod(m)
      const details = getMethodDetails(m)
      const isFavorite = m.paymentMethod === favoriteMethod
      const isRecommended = m.paymentMethod === 'SP' || m.paymentMethod === 'BC'

      return {
        ...m,
        category,
        details,
        isFavorite,
        isRecommended
      }
    })

    // Filter by active category
    if (activeCategory !== 'all') {
      items = items.filter(m => m.category === activeCategory)
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      items = items.filter(
        m => m.name.toLowerCase().includes(q) || m.paymentMethod.toLowerCase().includes(q)
      )
    }

    // Sort order:
    // 1. Favorite (Sering Digunakan)
    // 2. Recommended (Rekomendasi)
    // 3. Other methods
    return items.sort((a, b) => {
      if (a.isFavorite && !b.isFavorite) return -1
      if (!a.isFavorite && b.isFavorite) return 1
      if (a.isRecommended && !b.isRecommended) return -1
      if (!a.isRecommended && b.isRecommended) return 1
      return 0
    })
  }

  const filteredMethods = getFilteredAndSortedMethods()

  return (
    <>
      <div style={{ maxWidth: 1040, margin: '0 auto', padding: '0 16px' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 28 }}>
          <div style={{
            width: 40, height: 40, borderRadius: 8, background: 'rgba(2,134,195,0.08)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--brand-blue)'
          }}>
            <CreditCard size={20} />
          </div>
          <div>
            <h1 style={{ fontSize: 20, fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>Rangkuman Pembayaran Kamu</h1>
            <p style={{ fontSize: 13.5, color: 'var(--text-secondary)', margin: '4px 0 0' }}>
              Cek dulu detailnya sebelum lanjut. Tenang, semua detailnya udah dirangkum di bawah.
            </p>
          </div>
        </div>

        <div className="grid-checkout" style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 24 }}>
          
          {/* LEFT: REDESIGNED PAYMENT METHODS */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {error && (
              <div style={{ background: 'rgba(211,47,47,0.08)', border: '1px solid rgba(211,47,47,0.2)', color: 'var(--error)', padding: '12px 14px', borderRadius: 10, fontSize: 13 }}>
                {error}
              </div>
            )}

            {/* Premium Plan Switcher Box */}
            <div className="card glass-container" style={{ padding: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                <Sparkles size={16} color="var(--brand-blue)" />
                <h3 style={{ fontSize: 14, fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>Ganti Paket Langganan</h3>
              </div>
              <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 12 }}>
                Bisa ganti paket langsung di sini kalau kamu berubah pikiran ya!
              </p>
              
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
                {SUBSCRIPTION_PLANS.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => setSelectedPlanId(p.id)}
                    type="button"
                    style={{
                      padding: '10px 6px',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      borderRadius: 10,
                      border: selectedPlanId === p.id ? '2px solid var(--brand-blue)' : '1px solid var(--border)',
                      background: selectedPlanId === p.id ? 'rgba(2,134,195,0.06)' : 'var(--surface)',
                      color: selectedPlanId === p.id ? 'var(--brand-blue)' : 'var(--text-primary)',
                      cursor: 'pointer',
                      transition: 'all 150ms ease',
                      outline: 'none',
                    }}
                  >
                    <span style={{ fontSize: 12, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.02em' }}>{p.name}</span>
                    <span style={{ fontSize: 10.5, fontWeight: 700, marginTop: 2, opacity: 0.8 }}>
                      Rp {p.price.toLocaleString('id-ID')}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* REDESIGNED PAYMENT SELECTOR */}
            <div className="card glass-container" style={{ padding: 20, position: 'relative' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12, marginBottom: 16 }}>
                <div>
                  <h3 style={{ fontSize: 15, fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>Pilih Metode Pembayaran</h3>
                  <p style={{ fontSize: 12, color: 'var(--text-secondary)', margin: '4px 0 0' }}>Daftar metode pembayaran aman dari Duitku.</p>
                </div>

                {/* SEARCH INPUT */}
                <div style={{ position: 'relative', width: '100%', maxWidth: 220 }} className="search-box">
                  <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                  <input
                    type="text"
                    placeholder="Cari metode bayar..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '7px 10px 7px 30px',
                      borderRadius: 8,
                      border: '1px solid var(--border)',
                      background: 'var(--bg)',
                      fontSize: 12,
                      color: 'var(--text-primary)',
                      outline: 'none'
                    }}
                  />
                  {searchQuery && (
                    <button 
                      onClick={() => setSearchQuery('')}
                      style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', border: 'none', background: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
                    >
                      <X size={12} />
                    </button>
                  )}
                </div>
              </div>

              {loadingMethods ? (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '60px 0', gap: 12 }}>
                  <Loader2 size={32} className="animate-spin" color="var(--brand-blue)" />
                  <p style={{ fontSize: 12.5, color: 'var(--text-secondary)' }}>Memuat metode pembayaran Duitku...</p>
                </div>
              ) : (
                <div className="payment-layout" style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 16 }}>
                  
                  {/* CATEGORIES / SIDEBAR (Responsive Tab/Scroll/List) */}
                  <div className="category-container">
                    {/* Desktop Sidebar style / Mobile Tab style */}
                    <div className="category-tabs">
                      {CATEGORIES.map(cat => {
                        const Icon = cat.icon
                        const count = paymentMethods.filter(m => cat.id === 'all' || categorizeMethod(m) === cat.id).length
                        if (count === 0 && cat.id !== 'all') return null // Only show categories with available methods

                        const isActive = activeCategory === cat.id
                        return (
                          <button
                            key={cat.id}
                            onClick={() => setActiveCategory(cat.id)}
                            className={`category-tab-btn ${isActive ? 'active' : ''}`}
                            type="button"
                          >
                            <Icon size={14} />
                            <span>{cat.label}</span>
                            <span className="count-badge">{count}</span>
                          </button>
                        )
                      })}
                    </div>
                  </div>

                  {/* METODE PEMBAYARAN LIST (Right/Bottom) */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    <AnimatePresence mode="popLayout">
                      {filteredMethods.length === 0 ? (
                        <motion.div 
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          style={{ textAlign: 'center', padding: '48px 0', color: 'var(--text-secondary)' }}
                        >
                          <AlertCircle size={32} style={{ margin: '0 auto 8px', color: 'var(--text-muted)' }} />
                          <p style={{ fontSize: 13, margin: 0 }}>Metode pembayaran tidak ditemukan.</p>
                        </motion.div>
                      ) : (
                        filteredMethods.map((method) => {
                          const isSelected = selectedMethod === method.paymentMethod
                          const { badge, est, desc, feeText, maintenance } = method.details

                          return (
                            <motion.div
                              key={method.paymentMethod}
                              layout
                              initial={{ opacity: 0, scale: 0.98 }}
                              animate={{ opacity: 1, scale: 1 }}
                              exit={{ opacity: 0, scale: 0.98 }}
                              onClick={() => {
                                if (!maintenance) setSelectedMethod(method.paymentMethod)
                              }}
                              className={`payment-card ${isSelected ? 'selected' : ''} ${maintenance ? 'maintenance' : ''}`}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                padding: '14px 16px',
                                borderRadius: 12,
                                border: isSelected ? '2px solid var(--brand-blue)' : '1px solid var(--border)',
                                background: isSelected ? 'rgba(2,134,195,0.06)' : 'var(--surface)',
                                cursor: maintenance ? 'not-allowed' : 'pointer',
                                transition: 'all 150ms ease',
                                position: 'relative',
                                opacity: maintenance ? 0.5 : 1,
                                boxShadow: isSelected ? '0 0 14px rgba(2,134,195,0.12)' : 'none'
                              }}
                              whileHover={maintenance ? {} : { scale: 1.01 }}
                              whileTap={maintenance ? {} : { scale: 0.99 }}
                            >
                              {/* Left Logo */}
                              <div style={{ 
                                width: 50, 
                                height: 32, 
                                background: 'white', 
                                borderRadius: 8, 
                                padding: 4, 
                                border: '1px solid var(--border-subtle)', 
                                marginRight: 14, 
                                display: 'flex', 
                                alignItems: 'center', 
                                justifyContent: 'center', 
                                flexShrink: 0 
                              }}>
                                <img 
                                  src={method.paymentImage} 
                                  alt={method.name} 
                                  loading="lazy"
                                  style={{ maxHeight: '100%', maxWidth: '100%', objectFit: 'contain' }} 
                                />
                              </div>

                              {/* Center Content */}
                              <div style={{ flex: 1 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                                  <span style={{ fontSize: 13.5, fontWeight: 800, color: 'var(--text-primary)' }}>
                                    {method.name}
                                  </span>

                                  {/* DYNAMIC BADGES */}
                                  {method.isFavorite && (
                                    <span className="badge-payment fav">Sering Digunakan</span>
                                  )}
                                  {method.isRecommended && !method.isFavorite && (
                                    <span className="badge-payment rec">Rekomendasi</span>
                                  )}
                                  {badge && !method.isFavorite && (
                                    <span className="badge-payment general">{badge}</span>
                                  )}
                                  {maintenance && (
                                    <span className="badge-payment maint">Maintenance</span>
                                  )}
                                </div>
                                <p style={{ fontSize: 11.5, color: 'var(--text-secondary)', margin: '4px 0 0', lineHeight: 1.4 }}>
                                  {desc}
                                </p>
                              </div>

                              {/* Right Details */}
                              <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', gap: 2, marginRight: isSelected ? 24 : 0 }}>
                                <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)' }}>
                                  {feeText}
                                </span>
                                <span style={{ fontSize: 10.5, color: 'var(--text-secondary)' }}>
                                  {est}
                                </span>
                              </div>

                              {/* Selected Check Icon */}
                              {isSelected && (
                                <div style={{ position: 'absolute', right: 12, color: 'var(--brand-blue)', display: 'flex', alignItems: 'center' }}>
                                  <CheckCircle size={18} fill="rgba(2,134,195,0.1)" />
                                </div>
                              )}
                            </motion.div>
                          )
                        })
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              )}
            </div>
          </div>
          
          {/* RIGHT: ORDER SUMMARY & VOUCHER */}
          {plan && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <div className="card glass-container" style={{ padding: 20, height: 'fit-content', display: 'flex', flexDirection: 'column' }}>
                <h3 style={{ fontSize: 14, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 14 }}>Rincian Tagihan</h3>

                {/* Selected Plan Details */}
                <div style={{ background: 'var(--bg)', border: '1px solid var(--border-subtle)', borderRadius: 10, padding: 14, marginBottom: 16 }}>
                  <span style={{ fontSize: 13, fontWeight: 800, color: 'var(--text-primary)', display: 'block', marginBottom: 2, textTransform: 'uppercase' }}>
                    Paket {plan.name} (30 Hari)
                  </span>
                  <p style={{ fontSize: 11.5, color: 'var(--text-secondary)', margin: '0 0 10px 0', lineHeight: 1.4 }}>{plan.desc}</p>
                  
                  <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: 8 }}>
                    <p style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', margin: '0 0 4px 0' }}>Fitur &amp; Benefit:</p>
                    <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 5 }}>
                      {plan.benefits.map((b: string, i: number) => (
                        <li key={i} style={{ display: 'flex', gap: 5, alignItems: 'center', fontSize: 11, color: 'var(--text-secondary)' }}>
                          <Check size={11} color="var(--brand-blue)" />
                          <span>{b}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Voucher Input */}
                <div style={{ marginBottom: 16 }}>
                  <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>
                    Punya kode promo?
                  </label>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <div style={{ position: 'relative', flex: 1 }}>
                      <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', display: 'flex', alignItems: 'center' }}>
                        <Ticket size={14} />
                      </span>
                      <input
                        type="text"
                        placeholder="Masukkan kode promo..."
                        value={promoCode}
                        onChange={e => handlePromoInputChange(e.target.value)}
                        disabled={promoApplied}
                        style={{ 
                          width: '100%', 
                          padding: '8px 10px 8px 30px', 
                          borderRadius: 8, 
                          border: '1px solid var(--border)', 
                          background: promoApplied ? 'rgba(2, 134, 195, 0.04)' : 'var(--bg)', 
                          fontSize: 12,
                          fontWeight: promoApplied ? 700 : 500,
                          color: promoApplied ? 'var(--brand-blue)' : 'var(--text-primary)',
                        }}
                      />
                      {promoApplied && (
                        <button
                          onClick={handleRemovePromo}
                          type="button"
                          style={{
                            position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)',
                            border: 'none', background: 'none', color: 'var(--error)', cursor: 'pointer', padding: 2
                          }}
                          title="Hapus Voucher"
                        >
                          <X size={14} />
                        </button>
                      )}
                    </div>
                    {!promoApplied && (
                      <button 
                        onClick={handleApplyPromo} 
                        disabled={promoLoading || !promoCode.trim()}
                        className="btn btn-secondary" 
                        style={{ fontSize: 12, padding: '0 12px', borderRadius: 8, height: 35 }}
                      >
                        {promoLoading ? <Loader2 size={12} className="animate-spin" /> : 'Pakai'}
                      </button>
                    )}
                  </div>

                  {/* Promo Message & Errors */}
                  {promoMessage && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'var(--teal)', fontSize: 11, fontWeight: 700, marginTop: 6 }}>
                      <Check size={12} />
                      <span>{promoMessage}</span>
                    </div>
                  )}
                  {promoError && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'var(--error)', fontSize: 11, fontWeight: 700, marginTop: 6 }}>
                      <AlertCircle size={12} />
                      <span>{promoError}</span>
                    </div>
                  )}
                </div>

                {/* Pricing Details */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: 12.5, color: 'var(--text-secondary)', marginBottom: 16, borderBottom: '1px solid var(--border-subtle)', paddingBottom: 12 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>Harga Paket:</span>
                    <span style={{ fontWeight: 600 }}>Rp {getSubtotal().toLocaleString('id-ID')}</span>
                  </div>
                  {promoApplied && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--teal)', fontWeight: 700 }}>
                      <span>Diskon Voucher ({promoDiscount}%):</span>
                      <span>- Rp {getDiscountAmount().toLocaleString('id-ID')}</span>
                    </div>
                  )}
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>Biaya Transaksi:</span>
                    <span style={{ fontWeight: 600 }}>Free</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-primary)', fontWeight: 800, fontSize: 13, paddingTop: 8, borderTop: '1px dotted var(--border)' }}>
                    <span>Total yang Harus Dibayar:</span>
                    <span style={{ fontSize: 15, color: 'var(--brand-blue)' }}>Rp {getGrandTotal().toLocaleString('id-ID')}</span>
                  </div>
                </div>

                {/* Submit CTA */}
                <button
                  onClick={handleCheckout}
                  disabled={submitLoading || loadingMethods || !selectedMethod}
                  className="btn btn-primary animate-pulse"
                  style={{ width: '100%', justifyContent: 'center', gap: 8, height: 40, opacity: submitLoading || !selectedMethod ? 0.7 : 1, fontSize: 13, fontWeight: 800 }}
                >
                  {submitLoading ? (
                    <>
                      <Loader2 size={14} className="animate-spin" />
                      Sedang diproses ya...
                    </>
                  ) : (
                    <>
                      Bayar Sekarang
                      <ArrowRight size={14} />
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <style jsx>{`
        /* Glassmorphism Styles */
        .glass-container {
          background: rgba(255, 255, 255, 0.03) !important;
          backdrop-filter: blur(10px) !important;
          border: 1px solid rgba(255, 255, 255, 0.08) !important;
          box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.05) !important;
        }

        .payment-card {
          transition: all 200ms ease;
        }
        .payment-card.selected {
          background: rgba(2, 134, 195, 0.06) !important;
          border-color: var(--brand-blue) !important;
        }
        .payment-card:hover:not(.maintenance) {
          border-color: rgba(2, 134, 195, 0.4) !important;
        }

        /* Responsive Categories Style */
        .category-tabs {
          display: flex;
          gap: 6px;
          overflow-x: auto;
          padding-bottom: 8px;
          margin-bottom: 8px;
          border-bottom: 1px solid var(--border-subtle);
          scrollbar-width: none; /* Firefox */
        }
        .category-tabs::-webkit-scrollbar {
          display: none; /* Safari and Chrome */
        }

        .category-tab-btn {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 8px 12px;
          border-radius: 8px;
          border: 1px solid var(--border);
          background: var(--surface);
          color: var(--text-secondary);
          font-size: 11.5px;
          font-weight: 700;
          cursor: pointer;
          white-space: nowrap;
          transition: all 150ms ease;
        }
        .category-tab-btn:hover {
          background: var(--bg);
          color: var(--text-primary);
        }
        .category-tab-btn.active {
          background: var(--brand-blue);
          border-color: var(--brand-blue);
          color: white;
          box-shadow: 0 4px 10px rgba(2, 134, 195, 0.2);
        }

        .count-badge {
          background: rgba(0, 0, 0, 0.05);
          padding: 1px 5px;
          border-radius: 6px;
          font-size: 9.5px;
          font-weight: 800;
        }
        .category-tab-btn.active .count-badge {
          background: rgba(255, 255, 255, 0.2);
          color: white;
        }

        /* Dynamic Badges style */
        .badge-payment {
          font-size: 9px;
          font-weight: 800;
          padding: 2px 6px;
          border-radius: 5px;
          text-transform: uppercase;
        }
        .badge-payment.fav {
          background: rgba(245, 166, 35, 0.1);
          color: var(--warning);
          border: 1px solid rgba(245, 166, 35, 0.2);
        }
        .badge-payment.rec {
          background: rgba(23, 184, 151, 0.1);
          color: var(--teal);
          border: 1px solid rgba(23, 184, 151, 0.2);
        }
        .badge-payment.general {
          background: rgba(2, 134, 195, 0.1);
          color: var(--brand-blue);
          border: 1px solid rgba(2, 134, 195, 0.2);
        }
        .badge-payment.maint {
          background: rgba(211, 47, 47, 0.1);
          color: var(--error);
          border: 1px solid rgba(211, 47, 47, 0.2);
        }

        /* Layout queries */
        @media (min-width: 768px) {
          .payment-layout {
            grid-template-columns: 200px 1fr !important;
          }
          .category-tabs {
            flex-direction: column;
            border-bottom: none;
            border-right: 1px solid var(--border-subtle);
            padding-right: 12px;
            padding-bottom: 0;
            overflow-x: visible;
          }
          .category-tab-btn {
            width: 100%;
            justify-content: flex-start;
          }
          .grid-checkout {
            grid-template-columns: 1.25fr 0.75fr !important;
          }
        }
      `}</style>
    </>
  )
}
