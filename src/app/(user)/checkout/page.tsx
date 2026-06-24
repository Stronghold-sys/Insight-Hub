'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { CreditCard, Check, ArrowRight, ShieldCheck, Ticket, AlertCircle, Loader2, X, Sparkles } from 'lucide-react'

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
    return promoApplied ? subtotal * (promoDiscount / 100) : 0
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

  if (error && !plan) {
    return (
      <div className="card" style={{ padding: 40, textAlign: 'center', maxWidth: 500, margin: '40px auto' }}>
        <AlertCircle size={48} color="var(--error)" style={{ margin: '0 auto 16px' }} />
        <h2 style={{ fontSize: 18, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 8 }}>Terjadi Kesalahan</h2>
        <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 20 }}>{error}</p>
        <Link href="/langganan" className="btn btn-primary" style={{ display: 'inline-flex' }}>Kembali</Link>
      </div>
    )
  }

  return (
    <>
      <div style={{ maxWidth: 880, margin: '0 auto' }}>
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

        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 24 }} className="grid-checkout">
          {/* Left panel: Plan Switcher & Payment Method */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {error && (
              <div style={{ background: 'rgba(211,47,47,0.08)', border: '1px solid rgba(211,47,47,0.2)', color: 'var(--error)', padding: '12px 14px', borderRadius: 10, fontSize: 13 }}>
                {error}
              </div>
            )}

            {/* Premium Plan Switcher Box */}
            <div className="card" style={{ padding: 24 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                <Sparkles size={16} color="var(--brand-blue)" />
                <h3 style={{ fontSize: 15, fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>Ganti Paket Langganan</h3>
              </div>
              <p style={{ fontSize: 12.5, color: 'var(--text-secondary)', marginBottom: 16 }}>
                Bisa ganti paket langsung di sini kalau kamu berubah pikiran ya!
              </p>
              
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
                {SUBSCRIPTION_PLANS.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => setSelectedPlanId(p.id)}
                    type="button"
                    style={{
                      padding: '12px 8px',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      borderRadius: 12,
                      border: selectedPlanId === p.id ? '2px solid var(--brand-blue)' : '1px solid var(--border)',
                      background: selectedPlanId === p.id ? 'rgba(2,134,195,0.06)' : 'var(--surface)',
                      color: selectedPlanId === p.id ? 'var(--brand-blue)' : 'var(--text-primary)',
                      cursor: 'pointer',
                      transition: 'all 150ms ease',
                      outline: 'none',
                    }}
                  >
                    <span style={{ fontSize: 13, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.02em' }}>{p.name}</span>
                    <span style={{ fontSize: 11, fontWeight: 700, marginTop: 4, opacity: 0.8 }}>
                      Rp {p.price.toLocaleString('id-ID')}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Payment Method Selector */}
            <div className="card" style={{ padding: 24 }}>
              <h3 style={{ fontSize: 15, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 6 }}>Pilih Metode Pembayaran</h3>
              <p style={{ fontSize: 12.5, color: 'var(--text-secondary)', marginBottom: 16 }}>
                Kalau udah oke, lanjut ke pembayaran.
              </p>

              {loadingMethods ? (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '40px 0', gap: 10 }}>
                  <Loader2 size={32} className="animate-spin" color="var(--brand-blue)" />
                  <p style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Memuat metode pembayaran aman...</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {paymentMethods.map((method) => (
                    <label
                      key={method.paymentMethod}
                      style={{
                        display: 'flex', alignItems: 'center',
                        padding: '14px 16px', borderRadius: 12,
                        background: selectedMethod === method.paymentMethod ? 'rgba(2,134,195,0.04)' : 'var(--surface)',
                        border: selectedMethod === method.paymentMethod ? '2px solid var(--brand-blue)' : '1px solid var(--border)',
                        cursor: 'pointer', transition: 'all 120ms ease',
                      }}
                    >
                      <input
                        type="radio"
                        name="payment_method"
                        value={method.paymentMethod}
                        checked={selectedMethod === method.paymentMethod}
                        onChange={() => setSelectedMethod(method.paymentMethod)}
                        style={{ marginRight: 14, accentColor: 'var(--brand-blue)', width: 16, height: 16 }}
                      />
                      <div style={{ width: 44, height: 28, position: 'relative', background: 'white', borderRadius: 6, padding: 3, border: '1px solid var(--border-subtle)', marginRight: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <img src={method.paymentImage} alt={method.name} style={{ maxHeight: '100%', maxWidth: '100%', objectFit: 'contain' }} />
                      </div>
                      <span style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--text-primary)' }}>{method.name}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right panel: Order Summary & Voucher */}
          {plan && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <div className="card" style={{ padding: 24, height: 'fit-content', display: 'flex', flexDirection: 'column' }}>
                <h3 style={{ fontSize: 15, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 16 }}>Rincian Tagihan</h3>

                {/* Selected Plan Details */}
                <div style={{ background: 'var(--bg)', border: '1px solid var(--border-subtle)', borderRadius: 10, padding: 16, marginBottom: 20 }}>
                  <span style={{ fontSize: 14, fontWeight: 800, color: 'var(--text-primary)', display: 'block', marginBottom: 4, textTransform: 'uppercase' }}>
                    Paket {plan.name} (30 Hari)
                  </span>
                  <p style={{ fontSize: 12, color: 'var(--text-secondary)', margin: '0 0 12px 0', lineHeight: 1.4 }}>{plan.desc}</p>
                  
                  <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: 10 }}>
                    <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', margin: '0 0 6px 0' }}>Fitur &amp; Benefit:</p>
                    <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 6 }}>
                      {plan.benefits.map((b: string, i: number) => (
                        <li key={i} style={{ display: 'flex', gap: 6, alignItems: 'center', fontSize: 11.5, color: 'var(--text-secondary)' }}>
                          <Check size={12} color="var(--brand-blue)" />
                          <span>{b}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Voucher Input */}
                <div style={{ marginBottom: 20 }}>
                  <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>
                    Punya kode promo?
                  </label>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <div style={{ position: 'relative', flex: 1 }}>
                      <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', display: 'flex', alignItems: 'center' }}>
                        <Ticket size={14} />
                      </span>
                      <input
                        type="text"
                        placeholder="Punya kode promo? masukin aja di sini"
                        value={promoCode}
                        onChange={e => handlePromoInputChange(e.target.value)}
                        disabled={promoApplied}
                        style={{ 
                          width: '100%', 
                          padding: '9px 10px 9px 32px', 
                          borderRadius: 8, 
                          border: '1px solid var(--border)', 
                          background: promoApplied ? 'rgba(2, 134, 195, 0.04)' : 'var(--bg)', 
                          fontSize: 12.5,
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
                        style={{ fontSize: 12.5, padding: '0 16px', borderRadius: 8, height: 38 }}
                      >
                        {promoLoading ? <Loader2 size={14} className="animate-spin" /> : 'Pakai'}
                      </button>
                    )}
                  </div>

                  {/* Promo Message & Errors */}
                  {promoMessage && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--teal)', fontSize: 12, fontWeight: 700, marginTop: 8 }}>
                      <Check size={14} />
                      <span>{promoMessage}</span>
                    </div>
                  )}
                  {promoError && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--error)', fontSize: 12, fontWeight: 700, marginTop: 8 }}>
                      <AlertCircle size={14} />
                      <span>{promoError}</span>
                    </div>
                  )}
                </div>

                {/* Pricing Details */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, fontSize: 13, color: 'var(--text-secondary)', marginBottom: 20, borderBottom: '1px solid var(--border-subtle)', paddingBottom: 16 }}>
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
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-primary)', fontWeight: 800, fontSize: 14, paddingTop: 10, borderTop: '1px dotted var(--border)' }}>
                    <span>Total yang Harus Dibayar:</span>
                    <span style={{ fontSize: 16, color: 'var(--brand-blue)' }}>Rp {getGrandTotal().toLocaleString('id-ID')}</span>
                  </div>
                </div>

                {/* Submit CTA */}
                <button
                  onClick={handleCheckout}
                  disabled={submitLoading || loadingMethods || !selectedMethod}
                  className="btn btn-primary"
                  style={{ width: '100%', justifyContent: 'center', gap: 8, height: 42, opacity: submitLoading || !selectedMethod ? 0.7 : 1, fontSize: 14, fontWeight: 800 }}
                >
                  {submitLoading ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      Sedang diproses ya...
                    </>
                  ) : (
                    <>
                      Gas Bayar
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
        @media (min-width: 768px) {
          .grid-checkout {
            grid-template-columns: 1.15fr 0.85fr !important;
          }
        }
      `}</style>
    </>
  )
}
