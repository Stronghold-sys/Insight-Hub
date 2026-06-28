'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabaseClient'
import {
  TrendingUp, Activity, BookOpen, MessageSquare,
  ClipboardList, Flame, ChevronRight,
  AlertTriangle, CheckCircle, Bell
} from 'lucide-react'
import { ASSESSMENTS } from '@/lib/data'
import { getMoodColor } from '@/lib/utils'
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid, Line
} from 'recharts'
import { LoadingState, ErrorState } from '@/components/ui/FeedbackStates'
import Modal from '@/components/ui/Modal'

// ========================
// STAT CARDS
// ========================
function StatCards({ stats }: { stats: any }) {
  const statItems = [
    {
      label: 'Streak Aktif',
      value: `${stats.streak} hari`,
      change: 'Konsisten ya!',
      changeType: 'positive',
      icon: Flame,
      color: 'var(--warning)',
      bg: 'rgba(245,166,35,0.1)',
    },
    {
      label: 'Assessment Selesai',
      value: `${stats.completedAssessments}/19`,
      change: 'Ayo cicil tesnya!',
      changeType: 'neutral',
      icon: ClipboardList,
      color: 'var(--brand-blue)',
      bg: 'rgba(2,134,195,0.1)',
    },
    {
      label: 'Entri Journal',
      value: `${stats.totalJournalEntries}`,
      change: 'Refleksi itu waras',
      changeType: 'positive',
      icon: BookOpen,
      color: 'var(--teal)',
      bg: 'rgba(23,184,151,0.1)',
    },
    {
      label: 'Mood Hari Ini',
      value: stats.todayMood?.mood ? stats.todayMood.mood.charAt(0).toUpperCase() + stats.todayMood.mood.slice(1) : 'Belum isi',
      change: stats.todayMood ? `Stres level: ${stats.todayMood.stress}/10` : 'Luangkan 10 detik',
      changeType: stats.todayMood ? 'positive' : 'neutral',
      icon: Activity,
      color: stats.todayMood?.mood ? getMoodColor(stats.todayMood.mood) : 'var(--text-muted)',
      bg: stats.todayMood?.mood ? `${getMoodColor(stats.todayMood.mood)}15` : 'rgba(141,164,190,0.1)',
    },
  ]

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
      {statItems.map((stat, i) => (
        <div key={stat.label} className="stat-card animate-fadein" style={{ animationDelay: `${i * 80}ms` }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 12 }}>
            <div style={{ width: 36, height: 36, borderRadius: 8, background: stat.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <stat.icon size={18} color={stat.color} />
            </div>
          </div>
          <div className="stat-value">{stat.value}</div>
          <div className="stat-label">{stat.label}</div>
          <div style={{ marginTop: 8 }}>
            <span className={`stat-change-${stat.changeType}`}>{stat.change}</span>
          </div>
        </div>
      ))}

      <style jsx>{`
        @media (max-width: 767px) {
          div { grid-template-columns: repeat(2, 1fr) !important; }
        }
      `}</style>
    </div>
  )
}

// ========================
// MOOD CHART
// ========================
function MoodChart({ moodHistory }: { moodHistory: any[] }) {
  const [detailEntry, setDetailEntry] = useState<any>(null)

  const moodToNum = (m: string) => ({
    happy: 9, excited: 9, hopeful: 8, calm: 7, grateful: 8,
    neutral: 5, anxious: 3, sad: 3, frustrated: 2, overwhelmed: 2
  }[m] || 3)

  const MOOD_LABEL_MAP: Record<string, string> = {
    happy: 'Senang', calm: 'Tenang', hopeful: 'Hopeful', grateful: 'Bersyukur',
    neutral: 'Biasa aja', anxious: 'Cemas', sad: 'Sedih',
    frustrated: 'Frustrasi', overwhelmed: 'Overwhelmed', excited: 'Excited',
  }

  const data = moodHistory.map(d => ({
    date: d.date.slice(5),
    mood: moodToNum(d.mood),
    stress: d.stress,
    energy: d.energy,
    moodLabel: MOOD_LABEL_MAP[d.mood] || d.mood,
    rawEntry: d,
  }))

  const hasData = moodHistory.length > 0;

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border-subtle)', borderRadius: 10, padding: '10px 14px', fontSize: 12, boxShadow: '0 4px 16px rgba(0,0,0,0.12)' }}>
          <p style={{ fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 6px' }}>{label}</p>
          {payload.map((p: any) => (
            <div key={p.name} style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
              <div style={{ width: 7, height: 7, borderRadius: '50%', background: p.color }} />
              <span style={{ color: 'var(--text-secondary)' }}>{p.name}: <strong style={{ color: 'var(--text-primary)' }}>{p.value}</strong></span>
            </div>
          ))}
          <p style={{ fontSize: 10, color: 'var(--text-muted)', margin: '6px 0 0' }}>Klik untuk detail</p>
        </div>
      )
    }
    return null
  }

  const getMoodColor = (m: string) => {
    const score = moodToNum(m)
    if (score >= 7) return '#17B897'
    if (score >= 5) return '#0286C3'
    return '#E67E22'
  }

  return (
    <div className="card" style={{ padding: 20 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <h3 style={{ fontSize: 15, marginBottom: 2 }}>Pola Energi & Stress</h3>
          <p style={{ fontSize: 12, color: 'var(--text-secondary)', margin: 0 }}>Klik titik grafik untuk lihat detail hari itu</p>
        </div>
        <Link href="/mood" className="btn btn-secondary btn-sm">Buka Tracker</Link>
      </div>

      {!hasData ? (
        <div style={{ height: 160, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)', borderRadius: 8, border: '1px dashed var(--border)' }}>
          <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: '0 0 8px' }}>Belum ada data mood seminggu ini.</p>
          <Link href="/mood" className="btn btn-primary btn-sm" style={{ padding: '4px 10px', fontSize: 11 }}>Input Mood Sekarang</Link>
        </div>
      ) : (
        <>
          <ResponsiveContainer width="100%" height={160}>
            <AreaChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}
              onClick={(e: any) => {
                if (e && e.activePayload && e.activePayload.length > 0) {
                  const entry = e.activePayload[0].payload.rawEntry
                  if (entry) setDetailEntry(entry)
                }
              }}
              style={{ cursor: 'pointer' }}
            >
              <defs>
                <linearGradient id="moodGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#0286C3" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#0286C3" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="energyGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#17B897" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#17B897" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" vertical={false} />
              <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#8DA4BE' }} axisLine={false} tickLine={false} />
              <YAxis domain={[0, 10]} tick={{ fontSize: 11, fill: '#8DA4BE' }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="mood" name="Mood" stroke="#0286C3" strokeWidth={2} fill="url(#moodGrad)" dot={{ fill: '#0286C3', strokeWidth: 0, r: 4, cursor: 'pointer' }} activeDot={{ r: 6, stroke: '#0286C3', strokeWidth: 2, fill: '#fff' }} />
              <Area type="monotone" dataKey="energy" name="Energi" stroke="#17B897" strokeWidth={2} fill="url(#energyGrad)" dot={{ fill: '#17B897', strokeWidth: 0, r: 4 }} activeDot={{ r: 6 }} />
            </AreaChart>
          </ResponsiveContainer>

          {/* Legend */}
          <div style={{ display: 'flex', gap: 14, marginTop: 10 }}>
            {[{ color: '#0286C3', label: 'Mood' }, { color: '#17B897', label: 'Energi' }].map(l => (
              <div key={l.label} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <div style={{ width: 10, height: 3, borderRadius: 2, background: l.color }} />
                <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{l.label}</span>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Detail modal */}
      <Modal isOpen={!!detailEntry} onClose={() => setDetailEntry(null)} maxWidth={420}>
        {detailEntry && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 40, height: 40, borderRadius: '50%', background: `${getMoodColor(detailEntry.mood)}20`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <div style={{ width: 14, height: 14, borderRadius: '50%', background: getMoodColor(detailEntry.mood) }} />
                </div>
                <div>
                  <h4 style={{ margin: '0 0 2px', fontSize: 16, textTransform: 'capitalize' }}>{MOOD_LABEL_MAP[detailEntry.mood] || detailEntry.mood}</h4>
                  <p style={{ margin: 0, fontSize: 12, color: 'var(--text-muted)' }}>{detailEntry.date}</p>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-muted)' }}>
                <Activity size={16} />
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
              <div style={{ padding: '12px', borderRadius: 8, background: 'var(--bg)', border: '1px solid var(--border-subtle)', textAlign: 'center' }}>
                <p style={{ fontSize: 20, fontWeight: 800, color: 'var(--brand-blue)', margin: '0 0 2px' }}>{detailEntry.energy}/10</p>
                <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: 0 }}>Energi</p>
              </div>
              <div style={{ padding: '12px', borderRadius: 8, background: 'var(--bg)', border: '1px solid var(--border-subtle)', textAlign: 'center' }}>
                <p style={{ fontSize: 20, fontWeight: 800, color: detailEntry.stress >= 7 ? 'var(--error)' : 'var(--warning)', margin: '0 0 2px' }}>{detailEntry.stress}/10</p>
                <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: 0 }}>Stres</p>
              </div>
            </div>
            {detailEntry.note && (
              <div style={{ padding: '12px 14px', borderRadius: 8, background: 'var(--bg)', border: '1px solid var(--border-subtle)', marginBottom: 16 }}>
                <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: '0 0 4px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Catatan</p>
                <p style={{ fontSize: 13, color: 'var(--text-primary)', margin: 0, lineHeight: 1.6 }}>{detailEntry.note}</p>
              </div>
            )}
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => setDetailEntry(null)} className="btn btn-secondary" style={{ flex: 1, justifyContent: 'center' }}>Tutup</button>
              <Link href="/mood" className="btn btn-primary" style={{ flex: 1, justifyContent: 'center', textDecoration: 'none' }}>Buka Tracker</Link>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}

// ========================
// RECENT INSIGHTS
// ========================
function RecentInsights({ insights }: { insights: any[] }) {
  return (
    <div className="card" style={{ padding: 20 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <h3 style={{ fontSize: 15, margin: 0 }}>Insight Hubungan</h3>
        <Link href="/insights" className="btn btn-ghost btn-sm">Selengkapnya</Link>
      </div>

      {insights.length === 0 ? (
        <div style={{ padding: 20, textAlign: 'center', background: 'var(--bg)', border: '1px dashed var(--border)', borderRadius: 8 }}>
          <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: '0 0 10px' }}>Belum ada analisis kepribadian. Selesaikan tes assessment pertama kamu!</p>
          <Link href="/assessment" className="btn btn-primary btn-sm" style={{ display: 'inline-flex', padding: '4px 10px', fontSize: 11 }}>Mulai Tes</Link>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {insights.map((insight, i) => (
            <div key={i} style={{
              padding: 14, borderRadius: 8, borderLeft: '3px solid var(--brand-blue)',
              background: 'rgba(2,134,195,0.05)',
              display: 'flex', gap: 12, alignItems: 'flex-start',
            }}>
              <TrendingUp size={16} color="var(--brand-blue)" style={{ marginTop: 2, flexShrink: 0 }} />
              <div style={{ flex: 1 }}>
                <strong style={{ fontSize: 13, color: 'var(--text-primary)', display: 'block', marginBottom: 2 }}>
                  {insight.title}
                </strong>
                <p style={{ fontSize: 12, color: 'var(--text-secondary)', margin: 0, lineHeight: 1.5 }}>
                  {insight.dominant_category}
                </p>
                <span style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 4, display: 'inline-block' }}>
                  Dibuat: {insight.date}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ========================
// ASSESSMENT PROGRESS
// ========================
function AssessmentProgress({ completedIds }: { completedIds: string[] }) {
  const totalCompleted = completedIds.length;
  
  // Ambil assessment yang belum selesai
  const recommended = ASSESSMENTS.filter(a => !completedIds.includes(a.id)).slice(0, 3);

  return (
    <div className="card" style={{ padding: 20 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
        <h3 style={{ fontSize: 15, margin: 0 }}>Assessment Kamu</h3>
        <Link href="/assessment" className="btn btn-ghost btn-sm">Lihat semua</Link>
      </div>
      <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 16 }}>
        {totalCompleted} dari 19 selesai
      </p>

      <div className="progress-bar" style={{ marginBottom: 20, height: 6, background: 'var(--border-subtle)', borderRadius: 3, overflow: 'hidden' }}>
        <div className="progress-fill" style={{ width: `${(totalCompleted / 19) * 100}%`, height: '100%', background: 'var(--brand-blue)' }} />
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 4px' }}>
          Rekomendasi Test Berikutnya
        </p>
        {recommended.length > 0 ? (
          recommended.map(assessment => (
            <Link
              key={assessment.id}
              href={`/assessment/${assessment.id}`}
              style={{
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '10px 12px', borderRadius: 8,
                border: '1px solid var(--border-subtle)',
                textDecoration: 'none',
                transition: 'all 150ms ease',
                background: 'var(--surface)',
              }}
              onMouseOver={e => {
                e.currentTarget.style.borderColor = 'var(--brand-blue)'
                e.currentTarget.style.background = 'rgba(2,134,195,0.03)'
              }}
              onMouseOut={e => {
                e.currentTarget.style.borderColor = 'var(--border-subtle)'
                e.currentTarget.style.background = 'var(--surface)'
              }}
            >
              <div style={{
                width: 32, height: 32, borderRadius: 8, flexShrink: 0,
                background: `${assessment.color}15`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 13, color: assessment.color, fontWeight: 700,
              }}>
                {assessment.title.charAt(0)}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', margin: '0 0 2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{assessment.title}</p>
                <p style={{ fontSize: 11, color: 'var(--text-secondary)', margin: 0 }}>{assessment.duration} · {assessment.questions} pertanyaan</p>
              </div>
              <ChevronRight size={14} color="var(--text-muted)" />
            </Link>
          ))
        ) : (
          <div style={{ padding: 12, textAlign: 'center', background: 'rgba(23,184,151,0.05)', border: '1px solid rgba(23,184,151,0.15)', borderRadius: 8 }}>
            <p style={{ fontSize: 12, color: 'var(--teal)', fontWeight: 700, margin: 0 }}>Luar Biasa! Semua 19 assessment sudah selesai!</p>
          </div>
        )}
      </div>
    </div>
  )
}

// ========================
// QUICK ACTIONS
// ========================
function QuickActions() {
  const actions = [
    { label: 'Input mood hari ini', href: '/mood/tambah', icon: Activity, color: 'var(--teal)', bg: 'rgba(23,184,151,0.1)' },
    { label: 'Tulis di jurnal', href: '/journal/tambah', icon: BookOpen, color: 'var(--brand-blue)', bg: 'rgba(2,134,195,0.1)' },
    { label: 'Analisis chat', href: '/chat-analyzer', icon: MessageSquare, color: 'var(--warning)', bg: 'rgba(245,166,35,0.1)' },
    { label: 'Mulai assessment', href: '/assessment', icon: ClipboardList, color: '#9B59B6', bg: 'rgba(155,89,182,0.1)' },
  ]

  return (
    <div className="card" style={{ padding: 20 }}>
      <h3 style={{ fontSize: 15, marginBottom: 16 }}>Aksi Cepat</h3>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10 }}>
        {actions.map(action => (
          <Link
            key={action.label}
            href={action.href}
            style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '12px 14px', borderRadius: 8,
              border: '1px solid var(--border-subtle)',
              textDecoration: 'none',
              transition: 'all 150ms ease',
              background: 'var(--surface)',
            }}
            onMouseOver={e => {
              e.currentTarget.style.background = action.bg
              e.currentTarget.style.borderColor = action.color
            }}
            onMouseOut={e => {
              e.currentTarget.style.background = 'var(--surface)'
              e.currentTarget.style.borderColor = 'var(--border-subtle)'
            }}
          >
            <div style={{ width: 32, height: 32, borderRadius: 8, background: action.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <action.icon size={16} color={action.color} />
            </div>
            <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', lineHeight: 1.3 }}>{action.label}</span>
          </Link>
        ))}
      </div>
    </div>
  )
}

// ========================
// RECENT JOURNAL ENTRIES
// ========================
function RecentJournal({ journals }: { journals: any[] }) {
  return (
    <div className="card" style={{ padding: 20 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <h3 style={{ fontSize: 15, margin: 0 }}>Jurnal Hubungan</h3>
        <Link href="/journal" className="btn btn-ghost btn-sm">Buka Jurnal</Link>
      </div>

      {journals.length === 0 ? (
        <div style={{ padding: 24, textAlign: 'center', background: '#F8FAFC', border: '1px dashed var(--border)', borderRadius: 8 }}>
          <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 12 }}>Belum menulis jurnal hari ini. Urai perasaanmu di sini.</p>
          <Link href="/journal/tambah" className="btn btn-primary btn-sm">Tulis Jurnal Pertama</Link>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {journals.map((entry, i) => (
            <Link
              key={i}
              href="/journal"
              style={{
                display: 'block', padding: '12px 14px', borderRadius: 8,
                border: '1px solid var(--border-subtle)', textDecoration: 'none',
                transition: 'all 150ms ease',
              }}
              onMouseOver={e => e.currentTarget.style.borderColor = 'var(--brand-blue)'}
              onMouseOut={e => e.currentTarget.style.borderColor = 'var(--border-subtle)'}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 4 }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>{entry.title}</span>
                <div style={{
                  width: 10, height: 10, borderRadius: '50%',
                  background: getMoodColor(entry.mood),
                  flexShrink: 0, marginTop: 3,
                }} />
              </div>
              <p style={{ fontSize: 12, color: 'var(--text-secondary)', margin: '0 0 8px', lineHeight: 1.5 }}>
                {entry.content.length > 80 ? entry.content.substring(0, 80) + '...' : entry.content}
              </p>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span className="tag" style={{ background: 'var(--bg)', border: '1px solid var(--border-subtle)', padding: '2px 6px', borderRadius: 4, fontSize: 10, color: 'var(--text-secondary)' }}>
                  {entry.tag || 'Refleksi'}
                </span>
                <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{entry.date}</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}

// ========================
// WELCOME HEADER
// ========================
function WelcomeHeader({ stats }: { stats: any }) {
  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Selamat pagi' : hour < 17 ? 'Selamat siang' : 'Selamat malam'

  return (
    <div style={{ marginBottom: 24 }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, margin: '0 0 4px', color: 'var(--text-primary)' }}>
            {greeting}, {stats.nickname}!
          </h1>
          <p style={{ color: 'var(--text-secondary)', margin: 0, fontSize: 14 }}>
            Streak keaktifan kamu <strong style={{ color: 'var(--warning)' }}>{stats.streak} hari</strong> berturut-turut. Tetap waras ya!
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <Link href="/mood/tambah" className="btn btn-secondary">
            <Activity size={14} />
            Catat Mood
          </Link>
          <Link href="/journal/tambah" className="btn btn-primary">
            <BookOpen size={14} />
            Tulis Jurnal
          </Link>
        </div>
      </div>
    </div>
  )
}

// ========================
// CHAT STATS CARD
// ========================
function ChatStatsCard({ chatStats }: { chatStats: any }) {
  const total = chatStats?.totalChats || 0
  const last = chatStats?.lastChat

  return (
    <div className="card" style={{ padding: 20 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <h3 style={{ fontSize: 15, margin: 0 }}>Ringkasan Chat Analyzer</h3>
        <Link href="/chat-analyzer" className="btn btn-ghost btn-sm">Buka Analyzer</Link>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 16, alignItems: 'center' }}>
        <div style={{ padding: 16, borderRadius: 8, background: 'var(--bg)', border: '1px solid var(--border-subtle)', textAlign: 'center' }}>
          <p style={{ fontSize: 24, fontWeight: 800, color: 'var(--brand-blue)', margin: '0 0 2px' }}>{total}</p>
          <p style={{ fontSize: 11, color: 'var(--text-secondary)', margin: 0 }}>Chat Dianalisis</p>
        </div>

        {last ? (
          <div style={{ padding: '12px 14px', borderRadius: 8, background: last.urgency === 'high' ? 'rgba(211,47,47,0.05)' : 'rgba(245,166,35,0.05)', border: `1px solid ${last.urgency === 'high' ? 'rgba(211,47,47,0.15)' : 'rgba(245,166,35,0.15)'}` }}>
            <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: '0 0 4px', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>Hasil Analisis Terakhir</p>
            <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 2px' }}>Tone: {last.tone}</p>
            <p style={{ fontSize: 11, color: 'var(--text-secondary)', margin: 0 }}>Risiko: <span style={{ color: last.urgency === 'high' ? 'var(--error)' : 'var(--warning)', fontWeight: 600 }}>{last.urgency.toUpperCase()}</span> · {last.date}</p>
          </div>
        ) : (
          <div style={{ padding: 14, borderRadius: 8, background: 'var(--bg)', border: '1px dashed var(--border)', textAlign: 'center', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: 0 }}>Belum ada riwayat chat dianalisis.</p>
          </div>
        )}
      </div>
    </div>
  )
}

// ========================
// NOTIFICATIONS CARD
// ========================
function NotificationsCard({ notifications }: { notifications: any[] }) {
  return (
    <div className="card" style={{ padding: 20 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <h3 style={{ fontSize: 15, margin: 0 }}>Notifikasi Penting</h3>
        <Link href="/notifikasi" className="btn btn-ghost btn-sm">Buka Inbox</Link>
      </div>

      {notifications.length === 0 ? (
        <div style={{ padding: 16, textAlign: 'center', background: 'var(--bg)', border: '1px dashed var(--border)', borderRadius: 8 }}>
          <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: 0 }}>Inbox kosong. Kamu baik-baik saja!</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {notifications.map(notif => {
            const isUnread = notif.isRead === false || notif.isRead === 0 || notif.isRead === 'false';
            return (
              <div key={notif.id} style={{
                padding: 12,
                borderRadius: 8,
                background: isUnread ? 'rgba(2,134,195,0.03)' : 'var(--bg)',
                border: isUnread ? '1px solid rgba(2,134,195,0.2)' : '1px solid var(--border-subtle)',
                position: 'relative'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    {isUnread && <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--brand-blue)', display: 'inline-block' }} />}
                    <span style={{ fontSize: 12.5, fontWeight: isUnread ? 800 : 700, color: notif.priority === 'high' ? 'var(--error)' : 'var(--text-primary)' }}>{notif.title}</span>
                  </div>
                  <span style={{ fontSize: 9, color: 'var(--text-muted)' }}>{notif.date}</span>
                </div>
                <p style={{ fontSize: 11.5, color: 'var(--text-secondary)', margin: 0, lineHeight: 1.4 }}>{notif.message}</p>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ========================
// ACTIVITIES CARD
// ========================
function ActivitiesCard({ activities }: { activities: any[] }) {
  const getFriendlyActivity = (type: string) => {
    const mapping: Record<string, string> = {
      assessment_completed: 'Selesaikan Tes',
      assessment_taken: 'Mulai Tes',
      journal_created: 'Tulis Jurnal',
      chat_analyzed: 'Analisis Chat',
      onboarding_completed: 'Setup Profil',
      profile_updated: 'Update Profil',
      langganan_upgraded: 'Upgrade Paket'
    }
    return mapping[type] || 'Aktivitas'
  }

  return (
    <div className="card" style={{ padding: 20 }}>
      <h3 style={{ fontSize: 15, marginBottom: 16 }}>Riwayat Sesi Terakhir</h3>

      {activities.length === 0 ? (
        <div style={{ padding: 16, textAlign: 'center', background: 'var(--bg)', border: '1px dashed var(--border)', borderRadius: 8 }}>
          <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: 0 }}>Belum ada aktivitas hari ini.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, position: 'relative', paddingLeft: 12 }}>
          <div style={{ position: 'absolute', left: 4, top: 8, bottom: 8, width: 2, background: 'var(--border-subtle)' }} />

          {activities.map((act, i) => (
            <div key={i} style={{ position: 'relative', display: 'flex', flexDirection: 'column', gap: 2 }}>
              <div style={{ position: 'absolute', left: -12, top: 4, width: 8, height: 8, borderRadius: '50%', background: 'var(--brand-blue)', border: '2px solid var(--surface)' }} />
              
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)' }}>{getFriendlyActivity(act.activity_type)}</span>
                <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>{act.date}</span>
              </div>
              <p style={{ fontSize: 11.5, color: 'var(--text-secondary)', margin: 0 }}>{act.description}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ========================
// MAIN DASHBOARD PAGE
// ========================
export default function DashboardPage() {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const fetchDashboardData = () => {
    fetch('/api/user/dashboard')
      .then(res => {
        if (!res.ok) {
          throw new Error('Gagal memuat data dasbor.')
        }
        return res.json()
      })
      .then(resData => {
        if (resData.success) {
          setData(resData)
        } else {
          setError(resData.message || 'Gagal memuat data.')
        }
        setLoading(false)
      })
      .catch(err => {
        console.error(err)
        setError('Gagal menghubungkan ke server.')
        setLoading(false)
      })
  }

  useEffect(() => {
    fetchDashboardData()
  }, [])

  useEffect(() => {
    const channel = supabase
      .channel('dashboard-live')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'notifications' }, () => fetchDashboardData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'mood_entries' }, () => fetchDashboardData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'journal_entries' }, () => fetchDashboardData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'user_activities' }, () => fetchDashboardData())
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
        <LoadingState message="Mengumpulkan insight hubungan kamu..." />
      </div>
    )
  }

  if (error) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
        <ErrorState message={error} onRetry={() => window.location.reload()} />
      </div>
    )
  }

  const stats = data?.stats || { nickname: 'Kamu', streak: 1, completedAssessments: 0, totalJournalEntries: 0, todayMood: null }

  return (
    <div className="animate-fadein">
      <WelcomeHeader stats={stats} />
      <StatCards stats={stats} />

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 16 }}>
        {/* Left column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <MoodChart moodHistory={data?.moodHistory || []} />
          <RecentJournal journals={data?.recentJournals || []} />
          <ChatStatsCard chatStats={data?.chatStats} />
        </div>

        {/* Right column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <QuickActions />
          <NotificationsCard notifications={data?.recentNotifications || []} />
          <RecentInsights insights={data?.recentInsights || []} />
          <AssessmentProgress completedIds={data?.completedIds || []} />
          <ActivitiesCard activities={data?.recentActivities || []} />
        </div>
      </div>

      <style jsx>{`
        @media (max-width: 1023px) {
          div > div { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  )
}
