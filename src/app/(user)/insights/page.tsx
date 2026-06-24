'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  TrendingUp, Award, AlertCircle, CheckCircle, Star,
  Target, Zap, Brain, ArrowRight, BarChart2, Info, Heart, Users,
  RefreshCw, BookOpen, Activity
} from 'lucide-react'
import {
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  Radar, ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  BarChart, Bar, Cell
} from 'recharts'

interface AssessmentResult {
  id: string
  sessionId: string
  categoryId: string
  title: string
  dominant: string
  scores: Record<string, number>
  confidenceScore: number
  dataQuality: number
  summary: string
  completedAt: string
}

interface MoodPoint {
  date: string
  energy: number
  stress: number
  mood: string
}

interface RadarPoint {
  subject: string
  A: number
}

interface InsightsData {
  stats: {
    assessmentsCompleted: number
    totalAssessments: number
    avgScore: number
    moodTrackingDays: number
    totalJournals: number
  }
  assessmentResults: AssessmentResult[]
  moodTrend: MoodPoint[]
  radarData: RadarPoint[]
  hasRealData: boolean
}

const PATTERN_INSIGHTS_DEFAULT = [
  {
    type: 'strength',
    title: 'Mulai eksplorasi diri kamu yuk!',
    detail: 'Selesaikan beberapa assessment untuk mendapatkan pola personal yang terdeteksi dari data kamu. Semakin banyak data, semakin akurat insight-nya.',
  }
]

const GROWTH_AREAS_DEFAULT = [
  { label: 'Selesaikan Assessment', current: 0, target: 5, trend: 'up', tip: 'Mulai dari Love Language atau Attachment Style untuk fondasi yang kuat.' },
  { label: 'Rutin Mood Tracking', current: 0, target: 7, trend: 'neutral', tip: 'Catat mood tiap hari selama 7 hari untuk mulai melihat pola emosi kamu.' },
  { label: 'Journaling Reflektif', current: 0, target: 5, trend: 'up', tip: 'Tulis 5 jurnal untuk memulai rekam jejak komunikasi dan refleksi kamu.' },
]

export default function InsightsPage() {
  const [activeTab, setActiveTab] = useState<'ringkasan' | 'pertumbuhan' | 'pola' | 'recap' | 'kompatibilitas'>('ringkasan')
  const [recapType, setRecapType] = useState<'daily' | 'weekly' | 'monthly'>('weekly')
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<InsightsData | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Couple state
  const [coupleMode, setCoupleMode] = useState(false)
  const [partnerCodeInput, setPartnerCodeInput] = useState('')
  const [connectedPartner, setConnectedPartner] = useState<string | null>(null)
  const [connecting, setConnecting] = useState(false)
  const [connectError, setConnectError] = useState('')

  useEffect(() => {
    const fetchInsights = async () => {
      setLoading(true)
      try {
        const res = await fetch('/api/user/insights')
        const json = await res.json()
        if (json.success) {
          setData(json)
        } else {
          setError('Gagal memuat data insight.')
        }
      } catch {
        setError('Koneksi bermasalah. Coba refresh halaman.')
      } finally {
        setLoading(false)
      }
    }
    fetchInsights()
  }, [])

  const handleConnectPartner = (e: React.FormEvent) => {
    e.preventDefault()
    if (!partnerCodeInput.trim()) {
      setConnectError('Masukkan kode partner kamu dulu ya!')
      return
    }
    setConnecting(true)
    setConnectError('')
    setTimeout(() => {
      setConnecting(false)
      setConnectedPartner('Pasanganmu')
      setCoupleMode(true)
    }, 1200)
  }

  const handleDisconnect = () => {
    setConnectedPartner(null)
    setCoupleMode(false)
    setPartnerCodeInput('')
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 360, gap: 16 }}>
        <RefreshCw size={28} className="animate-spin" color="var(--brand-blue)" />
        <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>Memuat insight personal kamu...</p>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div style={{ textAlign: 'center', padding: '60px 20px' }}>
        <AlertCircle size={32} color="var(--error)" style={{ marginBottom: 12 }} />
        <p style={{ color: 'var(--text-secondary)' }}>{error || 'Gagal memuat data.'}</p>
        <button onClick={() => window.location.reload()} className="btn btn-primary" style={{ marginTop: 16 }}>
          Coba Lagi
        </button>
      </div>
    )
  }

  const { stats, assessmentResults, moodTrend, radarData, hasRealData } = data

  // Radardata fallback
  const displayRadar = hasRealData ? radarData : [
    { subject: 'Komunikasi', A: 0 },
    { subject: 'Empati', A: 0 },
    { subject: 'Boundary', A: 0 },
    { subject: 'Konflik', A: 0 },
    { subject: 'Kepercayaan', A: 0 },
    { subject: 'Keterbukaan', A: 0 },
  ]

  const isEmpty = assessmentResults.length === 0

  return (
    <div className="animate-fadein">
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, marginBottom: 4 }}>
          {activeTab === 'kompatibilitas' ? 'Analisis Hubungan' : 'Insight Personal'}
        </h1>
        <p style={{ color: 'var(--text-secondary)', margin: 0 }}>
          {activeTab === 'kompatibilitas'
            ? 'Hasil pemetaan dan kecocokan dinamika hubungan kamu dengan pasangan.'
            : 'Rangkuman dan pola dari semua data yang udah kamu kumpulkan.'}
        </p>
      </div>

      {/* Tab Navigation */}
      <div className="tabs-scroll" style={{ display: 'flex', gap: 8, marginBottom: 24, overflowX: 'auto', paddingBottom: 4 }}>
        {[
          { id: 'ringkasan', label: 'Ringkasan' },
          { id: 'recap', label: 'Recap Berkala' },
          { id: 'pertumbuhan', label: 'Tingkat Tumbuh' },
          { id: 'pola', label: 'Sinyal Pola' },
          { id: 'kompatibilitas', label: 'Kompatibilitas Pasangan' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className="btn btn-sm"
            style={{
              background: activeTab === tab.id ? 'var(--brand-blue)' : 'var(--surface)',
              color: activeTab === tab.id ? 'white' : 'var(--text-secondary)',
              borderColor: activeTab === tab.id ? 'var(--brand-blue)' : 'var(--border)',
              textTransform: 'capitalize',
              flexShrink: 0
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ============================================================ */}
      {/* TAB: RINGKASAN */}
      {/* ============================================================ */}
      {activeTab === 'ringkasan' && (
        <div className="animate-fadein">
          {/* Quick stats */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 24 }}>
            {[
              { label: 'Assessment Selesai', value: `${stats.assessmentsCompleted}/${stats.totalAssessments}`, color: 'var(--brand-blue)', icon: BarChart2 },
              { label: 'Skor Rata-rata', value: stats.avgScore > 0 ? `${stats.avgScore}` : '—', color: 'var(--teal)', icon: TrendingUp },
              { label: 'Hari Mood Tracking', value: stats.moodTrackingDays > 0 ? `${stats.moodTrackingDays}` : '—', color: 'var(--warning)', icon: Activity },
              { label: 'Total Jurnal', value: stats.totalJournals > 0 ? `${stats.totalJournals}` : '—', color: '#9B59B6', icon: BookOpen },
            ].map(s => (
              <div key={s.label} className="card" style={{ padding: 16, textAlign: 'center' }}>
                <s.icon size={18} color={s.color} style={{ marginBottom: 6 }} />
                <p style={{ fontSize: 22, fontWeight: 800, color: s.color, margin: '0 0 4px' }}>{s.value}</p>
                <p style={{ fontSize: 11, color: 'var(--text-secondary)', margin: 0 }}>{s.label}</p>
              </div>
            ))}
          </div>

          {/* Charts */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 24 }}>
            {/* Radar */}
            <div className="card" style={{ padding: 20 }}>
              <h3 style={{ fontSize: 14, marginBottom: 4 }}>Profil Relasi</h3>
              <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 16 }}>
                {hasRealData ? 'Berdasarkan assessment yang sudah kamu selesaikan' : 'Selesaikan assessment untuk melihat profil kamu'}
              </p>
              {!hasRealData && (
                <div style={{ textAlign: 'center', padding: '16px 0', marginBottom: 8 }}>
                  <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>Belum ada data assessment</p>
                  <Link href="/assessment" className="btn btn-sm btn-primary" style={{ marginTop: 8 }}>
                    Mulai Assessment
                  </Link>
                </div>
              )}
              <ResponsiveContainer width="100%" height={220}>
                <RadarChart data={displayRadar}>
                  <PolarGrid stroke="var(--border-subtle)" />
                  <PolarAngleAxis dataKey="subject" tick={{ fontSize: 11, fill: 'var(--text-secondary)' }} />
                  <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                  <Radar dataKey="A" stroke="#0286C3" fill="#0286C3" fillOpacity={hasRealData ? 0.2 : 0.05} strokeWidth={2} />
                </RadarChart>
              </ResponsiveContainer>
            </div>

            {/* Mood trend */}
            <div className="card" style={{ padding: 20 }}>
              <h3 style={{ fontSize: 14, marginBottom: 4 }}>Tren Energi & Stres</h3>
              <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 16 }}>
                {moodTrend.length > 0 ? `${moodTrend.length} data terakhir` : 'Belum ada data mood'}
              </p>
              {moodTrend.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '30px 0' }}>
                  <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 12 }}>Mulai catat mood kamu setiap hari</p>
                  <Link href="/mood" className="btn btn-sm btn-primary">Catat Mood Sekarang</Link>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={220}>
                  <AreaChart data={moodTrend}>
                    <defs>
                      <linearGradient id="energyGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#17B897" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#17B897" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="stressGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#D32F2F" stopOpacity={0.2} />
                        <stop offset="95%" stopColor="#D32F2F" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" />
                    <XAxis dataKey="date" tick={{ fontSize: 11, fill: 'var(--text-muted)' }} />
                    <YAxis domain={[0, 10]} tick={{ fontSize: 11, fill: 'var(--text-muted)' }} />
                    <Tooltip contentStyle={{ background: 'var(--surface)', border: '1px solid var(--border-subtle)', borderRadius: 6, fontSize: 12 }} />
                    <Area type="monotone" dataKey="energy" name="Energi" stroke="#17B897" fill="url(#energyGrad)" strokeWidth={2} dot={false} />
                    <Area type="monotone" dataKey="stress" name="Stres" stroke="#D32F2F" fill="url(#stressGrad)" strokeWidth={2} dot={false} />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* Assessment Results */}
          <div className="card" style={{ padding: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h3 style={{ fontSize: 14, margin: 0 }}>Hasil Assessment Terselesaikan</h3>
              <Link href="/assessment" className="btn btn-ghost btn-sm">
                Lihat Semua <ArrowRight size={12} />
              </Link>
            </div>
            {isEmpty ? (
              <div style={{ textAlign: 'center', padding: '32px 20px', borderRadius: 8, border: '2px dashed var(--border-subtle)' }}>
                <BarChart2 size={32} color="var(--text-muted)" style={{ marginBottom: 12 }} />
                <h4 style={{ fontSize: 15, margin: '0 0 8px', color: 'var(--text-primary)' }}>Belum ada assessment yang selesai</h4>
                <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: '0 0 16px' }}>
                  Mulai eksplorasi diri kamu dengan assessment pertama — cuma 6-8 menit!
                </p>
                <Link href="/assessment" className="btn btn-primary">
                  Mulai Assessment Pertama
                </Link>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {assessmentResults.slice(0, 5).map(result => {
                  const sortedScores = Object.entries(result.scores)
                    .sort(([, a], [, b]) => b - a)
                    .slice(0, 4)
                  return (
                    <div key={result.id} style={{ padding: 16, borderRadius: 8, background: 'var(--bg)', border: '1px solid var(--border-subtle)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                        <div>
                          <h4 style={{ fontSize: 14, margin: '0 0 4px', textTransform: 'capitalize' }}>
                            {result.title || result.categoryId}
                          </h4>
                          <p style={{ fontSize: 13, color: 'var(--brand-blue)', margin: 0, fontWeight: 600 }}>
                            Dominan: {result.dominant}
                          </p>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: '0 0 2px' }}>Confidence</p>
                          <p style={{ fontSize: 16, fontWeight: 800, color: 'var(--teal)', margin: 0 }}>{result.confidenceScore}%</p>
                        </div>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {sortedScores.map(([dim, score]) => (
                          <div key={dim}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                              <span style={{ fontSize: 12, color: 'var(--text-secondary)', textTransform: 'capitalize' }}>
                                {dim.replace(/([A-Z])/g, ' $1').replace(/[-_]/g, ' ').trim()}
                              </span>
                              <span style={{ fontSize: 12, fontWeight: 700, color: score >= 70 ? 'var(--brand-blue)' : 'var(--text-secondary)' }}>
                                {score}%
                              </span>
                            </div>
                            <div className="progress-bar">
                              <div
                                className="progress-fill"
                                style={{ width: `${score}%`, background: score >= 70 ? 'var(--brand-blue)' : 'var(--border)' }}
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                      <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: '10px 0 0', fontStyle: 'italic' }}>
                        {result.completedAt ? new Date(result.completedAt).toLocaleDateString('id-ID', { year: 'numeric', month: 'short', day: 'numeric' }) : ''}
                      </p>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* TAB: PERTUMBUHAN */}
      {/* ============================================================ */}
      {activeTab === 'pertumbuhan' && (
        <div className="animate-fadein">
          {isEmpty ? (
            <div style={{ textAlign: 'center', padding: '60px 20px' }}>
              <Target size={36} color="var(--text-muted)" style={{ marginBottom: 16 }} />
              <h3 style={{ fontSize: 16, marginBottom: 8 }}>Data Belum Tersedia</h3>
              <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 16 }}>
                Selesaikan assessment untuk mulai melihat progres pertumbuhanmu.
              </p>
              <Link href="/assessment" className="btn btn-primary">Mulai Assessment</Link>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {assessmentResults.slice(0, 6).map((result) => {
                const sortedScores = Object.entries(result.scores).sort(([, a], [, b]) => b - a)
                const topDim = sortedScores[0]
                const topScore = topDim ? topDim[1] : 0
                const target = Math.min(100, topScore + 15)
                const gap = target - topScore

                return (
                  <div key={result.id} className="card" style={{ padding: 20 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                      <div>
                        <h3 style={{ fontSize: 15, margin: '0 0 4px', textTransform: 'capitalize' }}>
                          {result.title || result.categoryId}
                        </h3>
                        <p style={{ fontSize: 12, color: 'var(--text-secondary)', margin: 0 }}>
                          Gap ke target:{' '}
                          <strong style={{ color: 'var(--brand-blue)' }}>+{gap} poin</strong>
                        </p>
                      </div>
                      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                        <div style={{ textAlign: 'right' }}>
                          <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: '0 0 2px' }}>Sekarang</p>
                          <p style={{ fontSize: 20, fontWeight: 800, color: 'var(--brand-blue)', margin: 0 }}>{topScore}</p>
                        </div>
                        <div style={{ color: 'var(--border)', fontWeight: 700 }}>→</div>
                        <div style={{ textAlign: 'right' }}>
                          <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: '0 0 2px' }}>Target</p>
                          <p style={{ fontSize: 20, fontWeight: 800, color: 'var(--teal)', margin: 0 }}>{target}</p>
                        </div>
                      </div>
                    </div>

                    <div style={{ position: 'relative', marginBottom: 12 }}>
                      <div className="progress-bar" style={{ height: 10 }}>
                        <div className="progress-fill" style={{ width: `${topScore}%` }} />
                      </div>
                      <div style={{
                        position: 'absolute', left: `${target}%`, top: -4, transform: 'translateX(-50%)',
                        width: 2, height: 18, background: 'var(--teal)', borderRadius: 1,
                      }}>
                        <div style={{ position: 'absolute', top: -12, left: '50%', transform: 'translateX(-50%)', fontSize: 8, color: 'var(--teal)', fontWeight: 700, whiteSpace: 'nowrap' }}>target</div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: 8, padding: '10px 12px', borderRadius: 8, background: 'rgba(2,134,195,0.05)', border: '1px solid rgba(2,134,195,0.12)' }}>
                      <Zap size={14} color="var(--brand-blue)" style={{ flexShrink: 0, marginTop: 1 }} />
                      <p style={{ fontSize: 13, color: 'var(--text-primary)', margin: 0, lineHeight: 1.5 }}>
                        {result.summary
                          ? result.summary.slice(0, 120) + (result.summary.length > 120 ? '...' : '')
                          : `Latihan skenario terkait ${result.title} di fitur Simulasi untuk meningkatkan skor.`}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* ============================================================ */}
      {/* TAB: POLA */}
      {/* ============================================================ */}
      {activeTab === 'pola' && (
        <div className="animate-fadein">
          <div style={{ marginBottom: 16 }}>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
              Pola-pola ini terdeteksi dari kombinasi assessment, mood tracker, dan jurnal kamu. Ini bukan vonis, tapi temuan untuk refleksi.
            </p>
          </div>

          {isEmpty ? (
            <div style={{ textAlign: 'center', padding: '40px 20px' }}>
              <Brain size={36} color="var(--text-muted)" style={{ marginBottom: 16 }} />
              <h3 style={{ fontSize: 16, marginBottom: 8 }}>Belum Ada Pola Terdeteksi</h3>
              <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 16 }}>
                Selesaikan beberapa assessment untuk mulai melihat pola personal kamu.
              </p>
              <Link href="/assessment" className="btn btn-primary">Mulai Assessment</Link>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {assessmentResults.slice(0, 4).map((result, i) => {
                const type = i % 3 === 0 ? 'strength' : i % 3 === 1 ? 'watch' : 'growth'
                const color = type === 'strength' ? 'var(--teal)' : type === 'watch' ? 'var(--warning)' : 'var(--brand-blue)'
                const bg = type === 'strength' ? 'rgba(23,184,151,0.12)' : type === 'watch' ? 'rgba(245,166,35,0.12)' : 'rgba(2,134,195,0.12)'

                return (
                  <div key={result.id} className="card" style={{ padding: 20, borderLeft: `4px solid ${color}` }}>
                    <div style={{ display: 'flex', gap: 14 }}>
                      <div style={{
                        width: 32, height: 32, borderRadius: 6, flexShrink: 0,
                        background: bg,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color,
                      }}>
                        {type === 'strength' ? <CheckCircle size={16} /> : type === 'watch' ? <AlertCircle size={16} /> : <Star size={16} />}
                      </div>
                      <div>
                        <h3 style={{ fontSize: 15, margin: '0 0 6px', textTransform: 'capitalize' }}>
                          {result.title || result.categoryId}: {result.dominant}
                        </h3>
                        <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: 0, lineHeight: 1.7 }}>
                          {result.summary || 'Analisis berhasil diselesaikan. Baca detail di halaman hasil assessment untuk insight yang lebih mendalam.'}
                        </p>
                        <div style={{ marginTop: 10 }}>
                          <span style={{ fontSize: 11, fontWeight: 700, color, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                            {type === 'strength' ? 'Kekuatan' : type === 'watch' ? 'Perlu Perhatian' : 'Area Tumbuh'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          <div style={{ display: 'flex', gap: 8, padding: '14px 16px', borderRadius: 8, background: 'var(--bg)', border: '1px solid var(--border-subtle)', marginTop: 20 }}>
            <Info size={14} color="var(--text-muted)" style={{ flexShrink: 0, marginTop: 1 }} />
            <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: 0, lineHeight: 1.6 }}>
              Semakin banyak assessment yang kamu selesaikan dan data yang kamu catat, semakin akurat pola yang bisa kita deteksi.
            </p>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* TAB: RECAP BERKALA */}
      {/* ============================================================ */}
      {activeTab === 'recap' && (
        <div className="animate-fadein" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Sub-tabs */}
          <div style={{ display: 'flex', gap: 8, background: 'var(--surface)', padding: 4, borderRadius: 8, border: '1px solid var(--border-subtle)', alignSelf: 'flex-start' }}>
            {[
              { id: 'daily', label: 'Harian' },
              { id: 'weekly', label: 'Mingguan' },
              { id: 'monthly', label: 'Bulanan' }
            ].map(type => (
              <button
                key={type.id}
                onClick={() => setRecapType(type.id as any)}
                className="btn btn-sm"
                style={{
                  background: recapType === type.id ? 'var(--brand-blue)' : 'transparent',
                  color: recapType === type.id ? 'white' : 'var(--text-secondary)',
                  border: 'none',
                  boxShadow: recapType === type.id ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                }}
              >
                {type.label}
              </button>
            ))}
          </div>

          {/* Summary */}
          <div className="card" style={{ padding: 24 }}>
            {recapType === 'daily' && (
              <div>
                <h3 style={{ fontSize: 16, marginBottom: 8, color: 'var(--text-primary)' }}>Recap Harian</h3>
                {moodTrend.length > 0 ? (
                  <div>
                    <p style={{ fontSize: 13.5, color: 'var(--text-secondary)', lineHeight: 1.6, margin: 0 }}>
                      Data mood terakhir kamu menunjukkan energi{' '}
                      <strong>{moodTrend[moodTrend.length - 1]?.energy ?? '—'}/10</strong> dan stres level{' '}
                      <strong>{moodTrend[moodTrend.length - 1]?.stress ?? '—'}/10</strong>. Terus konsisten mencatat mood setiap hari untuk mendapatkan insight yang lebih tajam.
                    </p>
                  </div>
                ) : (
                  <p style={{ fontSize: 13.5, color: 'var(--text-secondary)', lineHeight: 1.6, margin: 0 }}>
                    Belum ada data mood hari ini. Yuk catat mood kamu sekarang untuk mulai mendapatkan recap harian yang personal!
                  </p>
                )}
              </div>
            )}

            {recapType === 'weekly' && (
              <div>
                <h3 style={{ fontSize: 16, marginBottom: 8, color: 'var(--text-primary)' }}>Recap Mingguan</h3>
                <p style={{ fontSize: 13.5, color: 'var(--text-secondary)', lineHeight: 1.6, margin: 0 }}>
                  {stats.assessmentsCompleted > 0
                    ? `Minggu ini kamu sudah menyelesaikan ${stats.assessmentsCompleted} assessment dan memiliki ${stats.moodTrackingDays} data mood. Tetap konsisten dan lanjutkan assessment yang belum selesai.`
                    : 'Mulai aktif minggu ini! Selesaikan assessment pertamamu dan catat mood tiap hari untuk mendapatkan recap mingguan yang bermakna.'}
                </p>
              </div>
            )}

            {recapType === 'monthly' && (
              <div>
                <h3 style={{ fontSize: 16, marginBottom: 8, color: 'var(--text-primary)' }}>Recap Bulanan</h3>
                <p style={{ fontSize: 13.5, color: 'var(--text-secondary)', lineHeight: 1.6, margin: 0 }}>
                  {stats.assessmentsCompleted > 0
                    ? `Bulan ini kamu telah menyelesaikan ${stats.assessmentsCompleted} dari ${stats.totalAssessments} assessment, mencatat mood ${stats.moodTrackingDays} kali, dan menulis ${stats.totalJournals} jurnal. Perjalanan memahami diri kamu terus berkembang!`
                    : 'Belum ada aktivitas bulan ini. Ini saat yang tepat untuk mulai! Coba selesaikan 1 assessment dan catat mood 3 hari berturut-turut untuk awal yang baik.'}
                </p>
              </div>
            )}
          </div>

          {/* Pattern Cards */}
          {stats.assessmentsCompleted > 0 && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              {[
                {
                  title: 'Assessment Selesai',
                  desc: `${stats.assessmentsCompleted} dari ${stats.totalAssessments} kuis berhasil diselesaikan. Terus eksplorasi sisi diri kamu yang belum terjamah.`,
                  color: 'var(--brand-blue)',
                  bg: 'rgba(2,134,195,0.06)'
                },
                {
                  title: 'Hari Aktif Tracking',
                  desc: stats.moodTrackingDays > 0
                    ? `${stats.moodTrackingDays} hari mood ter-track. Konsistensi ini membantu AI mendeteksi pola emosi yang lebih akurat.`
                    : 'Belum ada data mood tracking. Mulai catat hari ini!',
                  color: 'var(--teal)',
                  bg: 'rgba(23,184,151,0.06)'
                },
                {
                  title: 'Skor Rata-rata',
                  desc: stats.avgScore > 0
                    ? `Rata-rata skor dari seluruh dimensi yang telah dikerjakan: ${stats.avgScore}%.`
                    : 'Belum ada skor assessment. Selesaikan assessment pertamamu untuk melihat skor!',
                  color: '#9B59B6',
                  bg: 'rgba(155,89,182,0.06)'
                },
                {
                  title: 'Jurnal Reflektif',
                  desc: stats.totalJournals > 0
                    ? `${stats.totalJournals} jurnal telah kamu tulis. Ini membantu memperkuat kesadaran diri dan pola komunikasi.`
                    : 'Belum ada jurnal. Yuk mulai tulis jurnal pertamamu!',
                  color: 'var(--warning)',
                  bg: 'rgba(245,166,35,0.06)'
                }
              ].map(item => (
                <div key={item.title} className="card" style={{ padding: 18, borderLeft: `4px solid ${item.color}`, background: item.bg }}>
                  <h4 style={{ fontSize: 13.5, fontWeight: 800, color: item.color, marginBottom: 6 }}>{item.title}</h4>
                  <p style={{ fontSize: 12.5, color: 'var(--text-secondary)', margin: 0, lineHeight: 1.5 }}>{item.desc}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ============================================================ */}
      {/* TAB: KOMPATIBILITAS PASANGAN */}
      {/* ============================================================ */}
      {activeTab === 'kompatibilitas' && (
        <div className="animate-fadein" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {!coupleMode ? (
            <div className="card" style={{ padding: 40, textAlign: 'center', maxWidth: 640, margin: '20px auto', background: 'linear-gradient(135deg, rgba(2, 132, 195, 0.03) 0%, rgba(23, 184, 151, 0.03) 100%)', border: '1px solid var(--border-subtle)' }}>
              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 16, marginBottom: 24 }}>
                <div style={{ width: 50, height: 50, borderRadius: '50%', background: 'rgba(2, 134, 195, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700 }}>Kamu</div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                  <div style={{ width: 40, height: 2, background: 'var(--border)', borderStyle: 'dashed' }} />
                  <Heart size={16} color="var(--text-muted)" style={{ opacity: 0.5 }} />
                  <div style={{ width: 40, height: 2, background: 'var(--border)', borderStyle: 'dashed' }} />
                </div>
                <div style={{ width: 50, height: 50, borderRadius: '50%', background: 'rgba(23, 184, 151, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700 }}>Partner</div>
              </div>

              <h2 style={{ fontSize: 18, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 8 }}>Aktifkan Couple Mode</h2>
              <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6, maxWidth: 480, margin: '0 auto 24px' }}>
                Bandingkan love language, attachment style, dan pola komunikasi kamu secara real-time. Temukan titik rawan konflik dan cara antisipasinya sebelum jadi ribut besar.
              </p>

              <form onSubmit={handleConnectPartner} style={{ maxWidth: 360, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 12 }}>
                {connectError && (
                  <p style={{ fontSize: 12, color: 'var(--error)', margin: '0 0 4px', fontWeight: 600 }}>{connectError}</p>
                )}
                <div style={{ display: 'flex', gap: 8 }}>
                  <input
                    type="text"
                    className="input"
                    placeholder="Masukkan kode partner (misal: PEM-492-XYZ)"
                    value={partnerCodeInput}
                    onChange={e => setPartnerCodeInput(e.target.value.toUpperCase())}
                    style={{ textTransform: 'uppercase', fontSize: 13 }}
                  />
                  <button type="submit" disabled={connecting} className="btn btn-primary" style={{ flexShrink: 0 }}>
                    {connecting ? 'Menghubungkan...' : 'Sambung'}
                  </button>
                </div>
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 8, marginTop: 12, borderTop: '1px solid var(--border-subtle)', paddingTop: 12 }}>
                  <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Fitur ini tersedia di paket <strong style={{ color: 'var(--text-primary)' }}>Couple Plan</strong></span>
                </div>
              </form>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
              <div className="card" style={{ padding: 20, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16, background: 'rgba(23, 184, 151, 0.03)', borderColor: 'var(--teal)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--teal)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800 }}>
                    <Heart size={16} fill="white" />
                  </div>
                  <div>
                    <h3 style={{ fontSize: 14, margin: '0 0 2px', color: 'var(--text-primary)' }}>Terhubung dengan {connectedPartner}</h3>
                    <p style={{ fontSize: 12, color: 'var(--text-secondary)', margin: 0 }}>Couple Mode Aktif · Couple Plan</p>
                  </div>
                </div>
                <button onClick={handleDisconnect} className="btn btn-ghost btn-sm" style={{ color: 'var(--error)' }}>Putuskan Sesi</button>
              </div>

              <div className="card" style={{ padding: 24, textAlign: 'center' }}>
                <Users size={32} color="var(--text-muted)" style={{ marginBottom: 12 }} />
                <h3 style={{ fontSize: 16, marginBottom: 8 }}>Kompatibilitas Data Belum Tersedia</h3>
                <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                  Minta partner kamu untuk menyelesaikan assessment agar data kompatibilitas bisa dibandingkan secara real-time.
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      <style jsx>{`
        @media (max-width: 767px) {
          div[style*="repeat(4"] { grid-template-columns: repeat(2, 1fr) !important; }
          div[style*="1fr 1fr"] { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  )
}
