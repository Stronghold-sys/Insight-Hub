'use client'

import { useState, useEffect } from 'react'
import { TrendingUp, Users, Activity, BarChart2, PieChart, Eye, BookOpen, MessageSquare, FileText, RefreshCw, ArrowUp, ArrowDown } from 'lucide-react'

const COLORS = ['#0286C3', '#17B897', '#7C3AED', '#F59E0B', '#EF4444', '#EC4899']

function SimpleBar({ value, max, color }: { value: number; max: number; color: string }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0
  return (
    <div style={{ width: '100%', background: 'rgba(255,255,255,0.15)', borderRadius: 999, height: 8, overflow: 'hidden' }}>
      <div style={{ width: `${pct}%`, background: color, height: '100%', borderRadius: 999, transition: 'width 0.8s ease' }} />
    </div>
  )
}

function StatCard({ label, value, change, icon: Icon, color, bg }: any) {
  const isPositive = change >= 0
  return (
    <div className="card animate-fadein" style={{ padding: 20 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
        <div style={{ width: 36, height: 36, borderRadius: 8, background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon size={18} color={color} />
        </div>
        {change !== undefined && (
          <span style={{ fontSize: 11, fontWeight: 700, color: isPositive ? 'var(--teal)' : 'var(--error)', display: 'flex', alignItems: 'center', gap: 2 }}>
            {isPositive ? <ArrowUp size={10} /> : <ArrowDown size={10} />}
            {Math.abs(change)}%
          </span>
        )}
      </div>
      <div style={{ fontSize: 26, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 4 }}>{value}</div>
      <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{label}</div>
    </div>
  )
}

export default function AdminAnalyticsPage() {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [timeRange, setTimeRange] = useState('30d')
  const [error, setError] = useState('')

  const fetchAnalytics = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await fetch(`/api/admin/analytics?range=${timeRange}`)
      const json = await res.json()
      if (json.success) {
        setData(json)
      } else {
        setError(json.message || 'Gagal memuat data analytics.')
      }
    } catch (e) {
      setError('Gagal connect ke server.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAnalytics()
  }, [timeRange])

  const featureUsage = data?.featureUsage || [
    { name: 'Assessment', count: data?.stats?.totalAssessments || 0, color: '#0286C3' },
    { name: 'Jurnal', count: data?.stats?.totalJournals || 0, color: '#17B897' },
    { name: 'Chat Analyzer', count: data?.stats?.totalChats || 0, color: '#7C3AED' },
    { name: 'Voice Talk', count: data?.stats?.totalVoice || 0, color: '#F59E0B' },
    { name: 'Mood Tracker', count: data?.stats?.totalMoods || 0, color: '#EC4899' },
  ]

  const maxFeatureCount = Math.max(...featureUsage.map((f: any) => f.count), 1)

  const topContent = data?.topContent || []
  const userGrowth = data?.userGrowth || []

  return (
    <div className="animate-fadein">
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: 'var(--text-primary)', margin: '0 0 4px' }}>Analytics & Growth</h1>
          <p style={{ color: 'var(--text-secondary)', margin: 0 }}>Pantau performa platform, funnel konversi, dan tren penggunaan fitur.</p>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <div style={{ display: 'flex', gap: 4, background: 'rgba(255,255,255,0.3)', backdropFilter: 'blur(8px)', padding: 4, borderRadius: 8, border: '1px solid rgba(255,255,255,0.3)' }}>
            {['7d', '30d', '90d'].map(r => (
              <button
                key={r}
                onClick={() => setTimeRange(r)}
                className="btn btn-sm"
                style={{
                  padding: '5px 12px',
                  fontSize: 11,
                  fontWeight: 700,
                  background: timeRange === r ? 'var(--brand-blue)' : 'transparent',
                  color: timeRange === r ? 'white' : 'var(--text-secondary)',
                  border: 'none',
                  borderRadius: 6
                }}
              >
                {r === '7d' ? '7 Hari' : r === '30d' ? '30 Hari' : '90 Hari'}
              </button>
            ))}
          </div>
          <button onClick={fetchAnalytics} className="btn btn-secondary btn-sm" style={{ gap: 6 }}>
            <RefreshCw size={12} />
            Refresh
          </button>
        </div>
      </div>

      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '50vh', gap: 12 }}>
          <div className="spinner" style={{ width: 36, height: 36, borderColor: 'rgba(2,134,195,0.2)', borderTopColor: 'var(--brand-blue)' }} />
          <p style={{ color: 'var(--text-secondary)', fontSize: 13 }}>Memuat data analytics...</p>
        </div>
      ) : error ? (
        <div className="card" style={{ padding: 40, textAlign: 'center' }}>
          <p style={{ color: 'var(--error)', fontSize: 14 }}>{error}</p>
          <button className="btn btn-primary btn-sm" onClick={fetchAnalytics} style={{ marginTop: 12 }}>Coba Lagi</button>
        </div>
      ) : (
        <>
          {/* Summary Stats */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
            <StatCard label="Total User" value={data?.stats?.totalUsers || 0} change={12} icon={Users} color="#0286C3" bg="rgba(2,134,195,0.1)" />
            <StatCard label="User Aktif (DAU)" value={data?.stats?.activeUsers || 0} change={8} icon={Activity} color="#17B897" bg="rgba(23,184,151,0.1)" />
            <StatCard label="Total Sesi" value={data?.stats?.totalSessions || 0} change={-3} icon={Eye} color="#7C3AED" bg="rgba(124,58,237,0.1)" />
            <StatCard label="Konversi Free→Paid" value={`${data?.stats?.conversionRate || 0}%`} change={5} icon={TrendingUp} color="#F59E0B" bg="rgba(245,159,11,0.1)" />
          </div>

          {/* Main Content */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 24 }}>
            {/* Feature Usage */}
            <div className="card" style={{ padding: 24 }}>
              <h3 style={{ fontSize: 15, fontWeight: 800, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
                <BarChart2 size={16} color="var(--brand-blue)" />
                Penggunaan Fitur
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {featureUsage.map((f: any, i: number) => (
                  <div key={i}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                      <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{f.name}</span>
                      <span style={{ fontSize: 13, fontWeight: 700, color: f.color }}>{f.count}</span>
                    </div>
                    <SimpleBar value={f.count} max={maxFeatureCount} color={f.color} />
                  </div>
                ))}
              </div>
            </div>

            {/* Top Content */}
            <div className="card" style={{ padding: 24 }}>
              <h3 style={{ fontSize: 15, fontWeight: 800, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
                <BookOpen size={16} color="var(--teal)" />
                Konten Terpopuler
              </h3>
              {topContent.length === 0 ? (
                <div style={{ textAlign: 'center', padding: 24, color: 'var(--text-muted)', fontSize: 13 }}>
                  Belum ada data konten.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {topContent.map((item: any, i: number) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderBottom: i < topContent.length - 1 ? '1px solid var(--border-subtle)' : 'none' }}>
                      <div style={{ width: 24, height: 24, borderRadius: '50%', background: `${COLORS[i % COLORS.length]}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 800, color: COLORS[i % COLORS.length] }}>
                        {i + 1}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--text-primary)', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.title}</p>
                        <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: 0 }}>{item.views} views • {item.category}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Funnel + User Growth */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            {/* Conversion Funnel */}
            <div className="card" style={{ padding: 24 }}>
              <h3 style={{ fontSize: 15, fontWeight: 800, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
                <TrendingUp size={16} color="var(--warning)" />
                Conversion Funnel
              </h3>
              {[
                { label: 'Landing Page Visit', value: data?.funnel?.visits || 0, color: '#0286C3' },
                { label: 'Klik CTA Daftar', value: data?.funnel?.ctaClicks || 0, color: '#17B897' },
                { label: 'Selesai Registrasi', value: data?.stats?.totalUsers || 0, color: '#7C3AED' },
                { label: 'Selesai Onboarding', value: data?.funnel?.onboardingComplete || 0, color: '#F59E0B' },
                { label: 'Upgrade ke Berbayar', value: data?.funnel?.paidUsers || 0, color: '#EC4899' },
              ].map((step, i, arr) => {
                const max = arr[0].value || 1
                const pct = Math.round((step.value / max) * 100)
                return (
                  <div key={i} style={{ marginBottom: 12 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                      <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{step.label}</span>
                      <span style={{ fontSize: 12, fontWeight: 700, color: step.color }}>{step.value} <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>({pct}%)</span></span>
                    </div>
                    <div style={{ width: '100%', background: 'rgba(255,255,255,0.15)', borderRadius: 999, height: 6, overflow: 'hidden' }}>
                      <div style={{ width: `${pct}%`, background: step.color, height: '100%', borderRadius: 999, transition: 'width 0.8s ease' }} />
                    </div>
                  </div>
                )
              })}
            </div>

            {/* User Growth Table */}
            <div className="card" style={{ padding: 24 }}>
              <h3 style={{ fontSize: 15, fontWeight: 800, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
                <Users size={16} color="#9B59B6" />
                Pertumbuhan User (Harian)
              </h3>
              {userGrowth.length === 0 ? (
                <div style={{ textAlign: 'center', padding: 24, color: 'var(--text-muted)', fontSize: 13 }}>
                  Belum ada data pertumbuhan.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4, overflowY: 'auto', maxHeight: 280 }}>
                  {userGrowth.slice(0, 10).map((day: any, i: number) => (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border-subtle)', alignItems: 'center' }}>
                      <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{day.date}</span>
                      <div style={{ display: 'flex', gap: 16 }}>
                        <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--brand-blue)' }}>+{day.newUsers || 0} baru</span>
                        <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{day.activeUsers || 0} aktif</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
