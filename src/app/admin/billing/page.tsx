'use client'

import { useState, useEffect } from 'react'
import { CreditCard, Package, DollarSign, AlertCircle, CheckCircle, RefreshCw, Gift, Clock, Zap, Users } from 'lucide-react'

export default function AdminBillingPage() {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'plans' | 'subscriptions' | 'promo'>('plans')
  const [error, setError] = useState('')
  const [promoInput, setPromoInput] = useState({ code: '', discount: '', maxUses: '', expiresAt: '' })
  const [promoLoading, setPromoLoading] = useState(false)
  const [promoSuccess, setPromoSuccess] = useState('')

  const fetchData = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/admin/billing')
      const json = await res.json()
      if (json.success) {
        setData(json)
      } else {
        setError(json.message || 'Gagal memuat data billing.')
      }
    } catch {
      setError('Gagal connect ke server.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchData() }, [])

  const handleCreatePromo = async () => {
    if (!promoInput.code || !promoInput.discount) return
    setPromoLoading(true)
    try {
      const res = await fetch('/api/admin/billing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'create_promo', ...promoInput })
      })
      const json = await res.json()
      if (json.success) {
        setPromoSuccess('Kode promo berhasil dibuat!')
        setPromoInput({ code: '', discount: '', maxUses: '', expiresAt: '' })
        fetchData()
        setTimeout(() => setPromoSuccess(''), 3000)
      } else {
        setError(json.message || 'Gagal membuat promo.')
      }
    } catch {
      setError('Gagal membuat promo.')
    } finally {
      setPromoLoading(false)
    }
  }

  const staticPlansInfo: Record<string, { color: string; features: string[] }> = {
    free: {
      color: '#64748B',
      features: ['5 Assessment/bulan', '10 Jurnal/bulan', 'Chat Analyzer basic', 'Mood Tracker']
    },
    basic: {
      color: '#0286C3',
      features: ['20 Assessment/bulan', 'Jurnal tak terbatas', 'Chat Analyzer lengkap', 'Voice Talk', 'Library akses penuh']
    },
    premium: {
      color: '#7C3AED',
      features: ['Assessment tak terbatas', 'Semua fitur BASIC', 'Simulasi Percakapan', 'Analisis mendalam', 'Prioritas support']
    },
    couple: {
      color: '#E91E63',
      features: ['Semua fitur Premium untuk 2 akun', 'Couple compatibility report', 'Shared journal mode', 'Conflict resolution guide']
    }
  }

  const plans = (data?.plans || [
    { id: 'free', name: 'FREE', price: 0 },
    { id: 'basic', name: 'BASIC', price: 49000 },
    { id: 'premium', name: 'PREMIUM', price: 99000 },
  ]).map((p: any) => {
    const info = staticPlansInfo[p.id] || { color: '#0286C3', features: [] }
    return {
      ...p,
      users: data?.planCounts?.[p.id] || 0,
      color: info.color,
      features: info.features
    }
  })


  const subscriptions = data?.latestSubscriptions || []
  const promoCodes = data?.promoCodes || []

  return (
    <div className="animate-fadein">
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: 'var(--text-primary)', margin: '0 0 4px' }}>Billing & Subscription</h1>
          <p style={{ color: 'var(--text-secondary)', margin: 0 }}>Kelola paket langganan, riwayat pembayaran, dan kode promo platform.</p>
        </div>
        <button onClick={fetchData} className="btn btn-secondary btn-sm" style={{ gap: 6 }}>
          <RefreshCw size={12} />
          Refresh
        </button>
      </div>

      {/* Summary Cards */}
      {!loading && data && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
          <div className="card animate-fadein" style={{ padding: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
              <div style={{ width: 36, height: 36, borderRadius: 8, background: 'rgba(2,134,195,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Users size={18} color="var(--brand-blue)" />
              </div>
            </div>
            <div style={{ fontSize: 26, fontWeight: 800, color: 'var(--text-primary)' }}>{data.stats?.totalPaidUsers || 0}</div>
            <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Total Subscriber Berbayar</div>
          </div>
          <div className="card animate-fadein" style={{ padding: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
              <div style={{ width: 36, height: 36, borderRadius: 8, background: 'rgba(23,184,151,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <DollarSign size={18} color="var(--teal)" />
              </div>
            </div>
            <div style={{ fontSize: 26, fontWeight: 800, color: 'var(--text-primary)' }}>Rp {(data.stats?.mrr || 0).toLocaleString('id-ID')}</div>
            <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Monthly Revenue (MRR)</div>
          </div>
          <div className="card animate-fadein" style={{ padding: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
              <div style={{ width: 36, height: 36, borderRadius: 8, background: 'rgba(245,159,11,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Gift size={18} color="var(--warning)" />
              </div>
            </div>
            <div style={{ fontSize: 26, fontWeight: 800, color: 'var(--text-primary)' }}>{data.stats?.activePromos || 0}</div>
            <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Kode Promo Aktif</div>
          </div>
          <div className="card animate-fadein" style={{ padding: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
              <div style={{ width: 36, height: 36, borderRadius: 8, background: 'rgba(124,58,237,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Zap size={18} color="#7C3AED" />
              </div>
            </div>
            <div style={{ fontSize: 26, fontWeight: 800, color: 'var(--text-primary)' }}>{data.stats?.conversionRate || 0}%</div>
            <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Free → Paid Conversion</div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, background: 'rgba(255,255,255,0.3)', backdropFilter: 'blur(8px)', padding: 4, borderRadius: 10, border: '1px solid rgba(255,255,255,0.3)', marginBottom: 20, width: 'fit-content' }}>
        {(['plans', 'subscriptions', 'promo'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className="btn btn-sm"
            style={{
              background: activeTab === tab ? 'var(--brand-blue)' : 'transparent',
              color: activeTab === tab ? 'white' : 'var(--text-secondary)',
              border: 'none',
              borderRadius: 7,
              padding: '7px 16px'
            }}
          >
            {tab === 'plans' ? 'Paket' : tab === 'subscriptions' ? 'Langganan' : 'Promo Code'}
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 200, gap: 12 }}>
          <div className="spinner" style={{ width: 32, height: 32 }} />
          <p style={{ color: 'var(--text-secondary)', fontSize: 13 }}>Memuat data billing...</p>
        </div>
      ) : error ? (
        <div className="card" style={{ padding: 40, textAlign: 'center' }}>
          <AlertCircle size={32} color="var(--error)" style={{ margin: '0 auto 12px' }} />
          <p style={{ color: 'var(--error)', fontSize: 14 }}>{error}</p>
          <button className="btn btn-primary btn-sm" onClick={fetchData} style={{ marginTop: 12 }}>Coba Lagi</button>
        </div>
      ) : (
        <>
          {/* Plans Tab */}
          {activeTab === 'plans' && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20 }}>
              {plans.map((plan: any) => (
                <div key={plan.id} className="card card-hover" style={{ padding: 24, border: `2px solid ${plan.color}20` }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                    <span style={{ fontSize: 12, fontWeight: 800, background: `${plan.color}15`, color: plan.color, padding: '4px 12px', borderRadius: 999 }}>
                      {plan.name}
                    </span>
                    <Package size={20} color={plan.color} />
                  </div>
                  <div style={{ fontSize: 28, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 4 }}>
                    {plan.price === 0 ? 'Gratis' : `Rp ${plan.price.toLocaleString('id-ID')}/bln`}
                  </div>
                  <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 16 }}>
                    <strong style={{ color: plan.color }}>{plan.users}</strong> user aktif
                  </div>
                  <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {plan.features.map((f: string, i: number) => (
                      <li key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12.5, color: 'var(--text-secondary)' }}>
                        <CheckCircle size={13} color={plan.color} />
                        {f}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          )}

          {/* Subscriptions Tab */}
          {activeTab === 'subscriptions' && (
            <div className="card" style={{ padding: 0, overflowX: 'auto' }}>
              {subscriptions.length === 0 ? (
                <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
                  Belum ada data langganan.
                </div>
              ) : (
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--border-subtle)', color: 'var(--text-secondary)' }}>
                      <th style={{ padding: '12px 16px', textAlign: 'left' }}>User</th>
                      <th style={{ padding: '12px 16px', textAlign: 'left' }}>Plan</th>
                      <th style={{ padding: '12px 16px', textAlign: 'left' }}>Status</th>
                      <th style={{ padding: '12px 16px', textAlign: 'left' }}>Mulai</th>
                      <th style={{ padding: '12px 16px', textAlign: 'left' }}>Berakhir</th>
                      <th style={{ padding: '12px 16px', textAlign: 'right' }}>Nilai</th>
                    </tr>
                  </thead>
                  <tbody>
                    {subscriptions.map((sub: any, i: number) => (
                      <tr key={i} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                        <td style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--text-primary)' }}>{sub.email || sub.userId}</td>
                        <td style={{ padding: '12px 16px' }}>
                          <span style={{ padding: '2px 8px', borderRadius: 999, fontSize: 11, fontWeight: 700, background: 'rgba(2,134,195,0.1)', color: 'var(--brand-blue)', textTransform: 'uppercase' }}>
                            {sub.planId}
                          </span>
                        </td>
                        <td style={{ padding: '12px 16px' }}>
                          <span style={{ padding: '2px 8px', borderRadius: 999, fontSize: 11, fontWeight: 700, background: sub.status === 'active' ? 'rgba(23,184,151,0.1)' : 'rgba(211,47,47,0.1)', color: sub.status === 'active' ? 'var(--teal)' : 'var(--error)' }}>
                            {sub.status}
                          </span>
                        </td>
                        <td style={{ padding: '12px 16px', color: 'var(--text-secondary)' }}>{sub.startDate}</td>
                        <td style={{ padding: '12px 16px', color: 'var(--text-secondary)' }}>{sub.endDate}</td>
                        <td style={{ padding: '12px 16px', fontWeight: 700, color: 'var(--text-primary)', textAlign: 'right' }}>
                          {sub.amount ? `Rp ${Number(sub.amount).toLocaleString('id-ID')}` : '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}

          {/* Promo Tab */}
          {activeTab === 'promo' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
              {/* Create Promo */}
              <div className="card" style={{ padding: 24 }}>
                <h3 style={{ fontSize: 15, fontWeight: 800, marginBottom: 16 }}>Buat Kode Promo Baru</h3>
                {promoSuccess && (
                  <div style={{ padding: '10px 14px', background: 'rgba(23,184,151,0.08)', border: '1px solid var(--teal)', borderRadius: 8, fontSize: 13, color: 'var(--teal)', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                    <CheckCircle size={14} /> {promoSuccess}
                  </div>
                )}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <div>
                    <label className="label">Kode Promo</label>
                    <input className="input" placeholder="contoh: INSIGHTHUB50" value={promoInput.code} onChange={e => setPromoInput(p => ({ ...p, code: e.target.value.toUpperCase() }))} />
                  </div>
                  <div>
                    <label className="label">Diskon (%)</label>
                    <input className="input" type="number" placeholder="contoh: 50" min={1} max={100} value={promoInput.discount} onChange={e => setPromoInput(p => ({ ...p, discount: e.target.value }))} />
                  </div>
                  <div>
                    <label className="label">Maksimal Pemakaian</label>
                    <input className="input" type="number" placeholder="Kosongkan = unlimited" value={promoInput.maxUses} onChange={e => setPromoInput(p => ({ ...p, maxUses: e.target.value }))} />
                  </div>
                  <div>
                    <label className="label">Kadaluarsa</label>
                    <input className="input" type="date" value={promoInput.expiresAt} onChange={e => setPromoInput(p => ({ ...p, expiresAt: e.target.value }))} />
                  </div>
                  <button className="btn btn-primary" onClick={handleCreatePromo} disabled={promoLoading || !promoInput.code || !promoInput.discount}>
                    {promoLoading ? <><div className="spinner spinner-sm" style={{ borderTopColor: 'white', borderColor: 'rgba(255,255,255,0.2)' }} /> Menyimpan...</> : <><Gift size={14} /> Buat Promo</>}
                  </button>
                </div>
              </div>

              {/* Promo List */}
              <div className="card" style={{ padding: 24 }}>
                <h3 style={{ fontSize: 15, fontWeight: 800, marginBottom: 16 }}>Daftar Kode Promo</h3>
                {promoCodes.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: 24, color: 'var(--text-muted)', fontSize: 13 }}>
                    Belum ada kode promo.
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {promoCodes.map((p: any, i: number) => (
                      <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 14px', background: 'rgba(255,255,255,0.3)', borderRadius: 8, border: '1px solid rgba(255,255,255,0.3)' }}>
                        <div>
                          <p style={{ fontSize: 13, fontWeight: 800, color: 'var(--brand-blue)', margin: '0 0 2px', fontFamily: 'monospace' }}>{p.code}</p>
                          <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: 0 }}>
                            {p.discountPercent}% off • {p.usedCount || 0}/{p.maxUses || '∞'} terpakai
                          </p>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <Clock size={11} color="var(--text-muted)" />
                          <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{p.expiresAt ? new Date(p.expiresAt).toLocaleDateString('id-ID') : '∞'}</span>
                          <span style={{ padding: '2px 8px', borderRadius: 999, fontSize: 10, fontWeight: 700, background: p.isActive ? 'rgba(23,184,151,0.1)' : 'rgba(211,47,47,0.1)', color: p.isActive ? 'var(--teal)' : 'var(--error)' }}>
                            {p.isActive ? 'AKTIF' : 'NONAKTIF'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
