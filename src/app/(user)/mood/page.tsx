'use client'

import { useState, useEffect } from 'react'
import { Plus, X, Check, ChevronRight, Zap, Activity, TrendingDown, TrendingUp } from 'lucide-react'
import { MOCK_MOOD_DATA } from '@/lib/data'
import Modal from '@/components/ui/Modal'
import { getMoodColor, formatDate } from '@/lib/utils'
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, Line, LineChart, CartesianGrid } from 'recharts'

const MOODS = [
  { id: 'happy', label: 'Senang', color: '#F5A623' },
  { id: 'calm', label: 'Tenang', color: '#17B897' },
  { id: 'hopeful', label: 'Hopeful', color: '#1ABC9C' },
  { id: 'grateful', label: 'Bersyukur', color: '#2ECC71' },
  { id: 'neutral', label: 'Biasa aja', color: '#8DA4BE' },
  { id: 'anxious', label: 'Cemas', color: '#E67E22' },
  { id: 'sad', label: 'Sedih', color: '#3498DB' },
  { id: 'frustrated', label: 'Frustrasi', color: '#D32F2F' },
  { id: 'overwhelmed', label: 'Overwhelmed', color: '#E74C3C' },
  { id: 'excited', label: 'Excited', color: '#9B59B6' },
]

const TRIGGERS = [
  'Percakapan yang melelahkan', 'Konflik kecil', 'Momen positif',
  'Kerjaan menumpuk', 'Nggak dapat respons', 'Quality time',
  'Sendirian', 'Overthinking', 'Sesuatu yang nggak terduga',
  'Lagi PMS/kurang tidur',
]

const moodToNum = (m: string) => ({
  happy: 9, excited: 9, hopeful: 8, calm: 7, grateful: 8,
  neutral: 5, anxious: 3, sad: 3, frustrated: 2, overwhelmed: 2
}[m] || 5)

const MOOD_LABEL_MAP: Record<string, string> = {
  happy: 'Senang', calm: 'Tenang', hopeful: 'Hopeful', grateful: 'Bersyukur',
  neutral: 'Biasa aja', anxious: 'Cemas', sad: 'Sedih',
  frustrated: 'Frustrasi', overwhelmed: 'Overwhelmed', excited: 'Excited',
}

function CustomTooltip({ active, payload, label }: any) {
  if (active && payload && payload.length) {
    return (
      <div style={{
        background: 'var(--surface)', border: '1px solid var(--border-subtle)',
        borderRadius: 10, padding: '10px 14px', fontSize: 12,
        boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
      }}>
        <p style={{ fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 6px' }}>{label}</p>
        {payload.map((p: any) => (
          <div key={p.name} style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: p.color }} />
            <span style={{ color: 'var(--text-secondary)' }}>{p.name}: <strong style={{ color: 'var(--text-primary)' }}>{p.value}</strong></span>
          </div>
        ))}
      </div>
    )
  }
  return null
}

export default function MoodTrackerPage() {
  const [showInputForm, setShowInputForm] = useState(false)
  const [selectedMood, setSelectedMood] = useState<string | null>(null)
  const [energy, setEnergy] = useState(5)
  const [stress, setStress] = useState(5)
  const [selectedTriggers, setSelectedTriggers] = useState<string[]>([])
  const [note, setNote] = useState('')
  const [saved, setSaved] = useState(false)
  const [activeView, setActiveView] = useState<'day' | 'week' | 'month'>('week')
  const [selectedEntry, setSelectedEntry] = useState<any>(null)
  
  const [dbMoods, setDbMoods] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const fetchMoods = async () => {
    try {
      const res = await fetch('/api/mood')
      const resData = await res.json()
      if (resData.success && resData.data.length > 0) {
        setDbMoods(resData.data)
      } else {
        setDbMoods(MOCK_MOOD_DATA)
      }
    } catch (e) {
      console.error(e)
      setDbMoods(MOCK_MOOD_DATA)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchMoods()
    if (typeof window !== 'undefined' && window.location.search.includes('tambah=true')) {
      setShowInputForm(true)
    }
  }, [])

  // Filter data sesuai view
  const today = new Date().toISOString().split('T')[0]
  const filteredMoods = activeView === 'day'
    ? dbMoods.filter(d => d.date === today).slice(-1) // today only
    : activeView === 'week'
    ? dbMoods.slice(-7)
    : dbMoods.slice(-30)

  // Untuk mode harian, tampilkan semua data hari ini dengan label jam (jika ada)
  // atau tampilkan 1 data saja
  const chartData = filteredMoods.map((d, idx) => ({
    date: activeView === 'day' ? 'Hari Ini' : d.date.slice(5),
    mood: moodToNum(d.mood),
    energy: d.energy,
    stress: d.stress,
    label: MOOD_LABEL_MAP[d.mood] || d.mood,
    rawEntry: d,
  }))

  const handleSave = async () => {
    if (!selectedMood) return
    
    const payload = {
      mood: selectedMood,
      energy,
      stress,
      note: note + (selectedTriggers.length > 0 ? ` [Trigger: ${selectedTriggers.join(', ')}]` : ''),
      date: new Date().toISOString().split('T')[0]
    }

    try {
      const res = await fetch('/api/mood', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
      if (res.ok) {
        setSaved(true)
        setShowInputForm(false)
        setSelectedMood(null)
        setEnergy(5)
        setStress(5)
        setSelectedTriggers([])
        setNote('')
        fetchMoods()
        setTimeout(() => setSaved(false), 3000)
      }
    } catch (err) {
      console.error(err)
    }
  }

  const toggleTrigger = (t: string) => {
    setSelectedTriggers(prev =>
      prev.includes(t) ? prev.filter(x => x !== t) : [...prev, t]
    )
  }

  const todayEntry = dbMoods[dbMoods.length - 1] || { mood: 'calm', energy: 7, stress: 3, date: '2026-06-23' }

  // Stats ringkasan
  const avgMood = dbMoods.length > 0 ? Math.round(dbMoods.reduce((s, d) => s + moodToNum(d.mood), 0) / dbMoods.length * 10) / 10 : 0
  const avgEnergy = dbMoods.length > 0 ? Math.round(dbMoods.reduce((s, d) => s + d.energy, 0) / dbMoods.length * 10) / 10 : 0
  const avgStress = dbMoods.length > 0 ? Math.round(dbMoods.reduce((s, d) => s + d.stress, 0) / dbMoods.length * 10) / 10 : 0

  return (
    <div className="animate-fadein">
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h1 style={{ fontSize: 22, marginBottom: 4 }}>Mood Tracker</h1>
          <p style={{ color: 'var(--text-secondary)', margin: 0 }}>
            Rekam mood, energi, dan stres harianmu buat lihat pola yang muncul.
          </p>
        </div>
        <button
          onClick={() => setShowInputForm(true)}
          className="btn btn-primary"
        >
          <Plus size={14} /> Input mood hari ini
        </button>
      </div>

      {/* Success toast */}
      {saved && (
        <div className="toast toast-success animate-fadein" style={{ marginBottom: 20 }}>
          <Check size={18} color="var(--teal)" style={{ marginTop: 2 }} />
          <div>
            <p style={{ fontWeight: 700, fontSize: 14, margin: '0 0 2px', color: 'var(--teal)' }}>Mood tersimpan!</p>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: 0 }}>Makasih udah jujur sama diri sendiri hari ini.</p>
          </div>
        </div>
      )}

      {/* Today summary + avg stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
        <div className="card" style={{ padding: 20, borderLeft: `3px solid ${getMoodColor(todayEntry.mood)}` }}>
          <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: '0 0 8px', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>Mood Hari Ini</p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 12, height: 12, borderRadius: '50%', background: getMoodColor(todayEntry.mood) }} />
            <span style={{ fontSize: 18, fontWeight: 800, color: 'var(--text-primary)', textTransform: 'capitalize' }}>
              {MOOD_LABEL_MAP[todayEntry.mood] || todayEntry.mood}
            </span>
          </div>
        </div>
        <div className="card" style={{ padding: 20 }}>
          <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: '0 0 8px', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>Energi Hari Ini</p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 18, fontWeight: 800, color: 'var(--brand-blue)' }}>{todayEntry.energy}/10</span>
            <div className="progress-bar" style={{ flex: 1 }}>
              <div className="progress-fill" style={{ width: `${todayEntry.energy * 10}%` }} />
            </div>
          </div>
        </div>
        <div className="card" style={{ padding: 20 }}>
          <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: '0 0 8px', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>Level Stres</p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 18, fontWeight: 800, color: todayEntry.stress >= 7 ? 'var(--error)' : todayEntry.stress >= 5 ? 'var(--warning)' : 'var(--teal)' }}>{todayEntry.stress}/10</span>
            <div className="progress-bar" style={{ flex: 1 }}>
              <div className="progress-fill" style={{ width: `${todayEntry.stress * 10}%`, background: todayEntry.stress >= 7 ? 'var(--error)' : todayEntry.stress >= 5 ? 'var(--warning)' : 'var(--teal)' }} />
            </div>
          </div>
        </div>
        <div className="card" style={{ padding: 20, borderLeft: '3px solid var(--teal)' }}>
          <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: '0 0 4px', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>Rata-rata</p>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <div style={{ textAlign: 'center' }}>
              <p style={{ fontSize: 15, fontWeight: 800, color: 'var(--brand-blue)', margin: 0 }}>{avgMood}</p>
              <p style={{ fontSize: 10, color: 'var(--text-muted)', margin: 0 }}>Mood</p>
            </div>
            <div style={{ textAlign: 'center' }}>
              <p style={{ fontSize: 15, fontWeight: 800, color: 'var(--teal)', margin: 0 }}>{avgEnergy}</p>
              <p style={{ fontSize: 10, color: 'var(--text-muted)', margin: 0 }}>Energi</p>
            </div>
            <div style={{ textAlign: 'center' }}>
              <p style={{ fontSize: 15, fontWeight: 800, color: 'var(--warning)', margin: 0 }}>{avgStress}</p>
              <p style={{ fontSize: 10, color: 'var(--text-muted)', margin: 0 }}>Stres</p>
            </div>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 16 }}>
        {/* Chart */}
        <div>
          <div className="card" style={{ padding: 24, marginBottom: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
              <div>
                <h3 style={{ fontSize: 15, margin: '0 0 2px' }}>Tren Mood, Energi & Stres</h3>
                <p style={{ fontSize: 12, color: 'var(--text-secondary)', margin: 0 }}>Klik titik di grafik untuk lihat detail hari itu</p>
              </div>
              <div className="pill-tab">
                <button className={`pill-tab-item ${activeView === 'day' ? 'active' : ''}`} onClick={() => setActiveView('day')}>Hari Ini</button>
                <button className={`pill-tab-item ${activeView === 'week' ? 'active' : ''}`} onClick={() => setActiveView('week')}>7 Hari</button>
                <button className={`pill-tab-item ${activeView === 'month' ? 'active' : ''}`} onClick={() => setActiveView('month')}>30 Hari</button>
              </div>
            </div>

            {chartData.length === 0 ? (
              <div style={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 8, background: 'var(--bg)', borderRadius: 8, border: '1px dashed var(--border)' }}>
                <Activity size={28} color="var(--text-muted)" />
                <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: 0 }}>
                  {activeView === 'day' ? 'Belum ada mood hari ini. Input sekarang!' : 'Belum ada data mood. Input mood pertamamu!'}
                </p>
                <button onClick={() => setShowInputForm(true)} className="btn btn-primary btn-sm" style={{ marginTop: 4, fontSize: 12, padding: '6px 14px' }}>
                  Input Mood
                </button>
              </div>
            ) : activeView === 'day' && chartData.length === 1 ? (
              /* Mode Hari Ini - tampilan ringkasan visual */
              <div style={{ height: 220, display: 'flex', flexDirection: 'column', gap: 12, justifyContent: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                  <div style={{
                    width: 80, height: 80, borderRadius: '50%', flexShrink: 0,
                    background: `${getMoodColor(chartData[0].rawEntry.mood)}15`,
                    border: `3px solid ${getMoodColor(chartData[0].rawEntry.mood)}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column',
                  }}>
                    <span style={{ fontSize: 22, fontWeight: 800, color: getMoodColor(chartData[0].rawEntry.mood) }}>
                      {moodToNum(chartData[0].rawEntry.mood)}
                    </span>
                    <span style={{ fontSize: 9, color: getMoodColor(chartData[0].rawEntry.mood), fontWeight: 600 }}>/10</span>
                  </div>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: 18, fontWeight: 800, color: 'var(--text-primary)', margin: '0 0 4px', textTransform: 'capitalize' }}>
                      {MOOD_LABEL_MAP[chartData[0].rawEntry.mood] || chartData[0].rawEntry.mood}
                    </p>
                    <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: '0 0 12px' }}>
                      Mood kamu hari ini, {chartData[0].rawEntry.date}
                    </p>
                    <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                      <div>
                        <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: '0 0 3px', fontWeight: 600 }}>ENERGI</p>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <div style={{ width: 80, height: 6, borderRadius: 3, background: 'var(--border-subtle)', overflow: 'hidden' }}>
                            <div style={{ height: '100%', width: `${chartData[0].rawEntry.energy * 10}%`, background: 'var(--brand-blue)', borderRadius: 3 }} />
                          </div>
                          <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--brand-blue)' }}>{chartData[0].rawEntry.energy}/10</span>
                        </div>
                      </div>
                      <div>
                        <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: '0 0 3px', fontWeight: 600 }}>STRES</p>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <div style={{ width: 80, height: 6, borderRadius: 3, background: 'var(--border-subtle)', overflow: 'hidden' }}>
                            <div style={{ height: '100%', width: `${chartData[0].rawEntry.stress * 10}%`, background: chartData[0].rawEntry.stress >= 7 ? 'var(--error)' : 'var(--warning)', borderRadius: 3 }} />
                          </div>
                          <span style={{ fontSize: 12, fontWeight: 700, color: chartData[0].rawEntry.stress >= 7 ? 'var(--error)' : 'var(--warning)' }}>{chartData[0].rawEntry.stress}/10</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                {chartData[0].rawEntry.note && (
                  <div style={{ padding: '10px 14px', borderRadius: 8, background: 'var(--bg)', border: '1px solid var(--border-subtle)' }}>
                    <p style={{ fontSize: 13, color: 'var(--text-primary)', margin: 0, lineHeight: 1.5, fontStyle: 'italic' }}>
                      "{chartData[0].rawEntry.note}"
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={chartData} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}
                  onClick={(e: any) => {
                    if (e && e.activePayload && e.activePayload.length > 0) {
                      const entry = e.activePayload[0].payload.rawEntry
                      if (entry) setSelectedEntry(entry)
                    }
                  }}
                  style={{ cursor: 'pointer' }}
                >
                  <defs>
                    <linearGradient id="moodFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#0286C3" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#0286C3" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="energyFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#17B897" stopOpacity={0.18} />
                      <stop offset="95%" stopColor="#17B897" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" vertical={false} />
                  <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#8DA4BE' }} axisLine={false} tickLine={false} />
                  <YAxis domain={[0, 10]} tick={{ fontSize: 11, fill: '#8DA4BE' }} axisLine={false} tickLine={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Area type="monotone" dataKey="mood" name="Mood" stroke="#0286C3" strokeWidth={2.5} fill="url(#moodFill)" dot={{ fill: '#0286C3', r: 5, strokeWidth: 0, cursor: 'pointer' }} activeDot={{ r: 7, stroke: '#0286C3', strokeWidth: 2, fill: '#fff' }} />
                  <Area type="monotone" dataKey="energy" name="Energi" stroke="#17B897" strokeWidth={2} fill="url(#energyFill)" dot={{ fill: '#17B897', r: 4, strokeWidth: 0 }} activeDot={{ r: 6 }} />
                  <Line type="monotone" dataKey="stress" name="Stres" stroke="#F5A623" strokeWidth={2} strokeDasharray="4 2" dot={{ fill: '#F5A623', r: 4, strokeWidth: 0 }} activeDot={{ r: 6 }} />
                </AreaChart>
              </ResponsiveContainer>
            )}


            <div style={{ display: 'flex', gap: 16, marginTop: 12, flexWrap: 'wrap' }}>
              {[{ color: '#0286C3', label: 'Mood' }, { color: '#17B897', label: 'Energi' }, { color: '#F5A623', label: 'Stres' }].map(l => (
                <div key={l.label} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <div style={{ width: 12, height: 3, borderRadius: 2, background: l.color }} />
                  <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{l.label}</span>
                </div>
              ))}
              <span style={{ fontSize: 11, color: 'var(--text-muted)', marginLeft: 'auto' }}>Klik titik grafik untuk detail</span>
            </div>
          </div>

          {/* Pattern insight */}
          <div className="card" style={{ padding: 20 }}>
            <h3 style={{ fontSize: 15, marginBottom: 16 }}>Pola yang Terdeteksi</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {dbMoods.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {[
                  avgMood < 5 ? { type: 'warning', text: `Rata-rata mood kamu ${avgMood}/10. Ini sinyal penting untuk lebih perhatiin diri sendiri.` } : { type: 'success', text: `Rata-rata mood kamu ${avgMood}/10. Kamu lagi dalam kondisi yang cukup baik!` },
                  avgStress >= 7 ? { type: 'warning', text: `Level stres rata-rata ${avgStress}/10 — cukup tinggi. Coba ambil waktu untuk istirahat yang berkualitas.` } : { type: 'info', text: `Level stres rata-rata ${avgStress}/10. Masih dalam batas yang bisa dikelola.` },
                  avgEnergy < 5 ? { type: 'info', text: `Energi rata-rata ${avgEnergy}/10. Pertimbangkan untuk review pola tidur dan aktivitas fisik.` } : { type: 'success', text: `Energi rata-rata ${avgEnergy}/10. Level energi kamu lumayan stabil!` },
                ].map((p, i) => (
                  <div key={i} style={{
                    padding: '12px 14px', borderRadius: 8, fontSize: 13, lineHeight: 1.6,
                    background: p.type === 'warning' ? 'rgba(245,166,35,0.08)' : p.type === 'info' ? 'rgba(2,134,195,0.06)' : 'rgba(23,184,151,0.08)',
                    borderLeft: `3px solid ${p.type === 'warning' ? 'var(--warning)' : p.type === 'info' ? 'var(--brand-blue)' : 'var(--teal)'}`,
                    color: 'var(--text-primary)',
                  }}>
                    {p.text}
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {[
                  { type: 'info', text: 'Mulai input mood harianmu untuk melihat pola yang muncul.' },
                  { type: 'info', text: 'Konsistensi adalah kunci — cukup 30 detik per hari untuk input mood.' },
                ].map((p, i) => (
                  <div key={i} style={{
                    padding: '12px 14px', borderRadius: 8, fontSize: 13, lineHeight: 1.6,
                    background: 'rgba(2,134,195,0.06)',
                    borderLeft: '3px solid var(--brand-blue)',
                    color: 'var(--text-primary)',
                  }}>
                    {p.text}
                  </div>
                ))}
              </div>
            )}
            </div>
          </div>
        </div>

        {/* Mood history - CLICKABLE */}
        <div className="card" style={{ padding: 20 }}>
          <h3 style={{ fontSize: 15, marginBottom: 4 }}>Riwayat Mood</h3>
          <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: '0 0 16px' }}>Klik untuk lihat detail</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, maxHeight: 520, overflowY: 'auto' }}>
            {dbMoods.slice().reverse().map((entry, i) => (
              <div
                key={i}
                onClick={() => setSelectedEntry(entry)}
                style={{
                  padding: '12px 14px', borderRadius: 8, border: '1px solid var(--border-subtle)',
                  display: 'flex', alignItems: 'flex-start', gap: 12,
                  cursor: 'pointer', transition: 'all 150ms ease',
                }}
                onMouseOver={e => {
                  e.currentTarget.style.borderColor = getMoodColor(entry.mood)
                  e.currentTarget.style.background = `${getMoodColor(entry.mood)}08`
                }}
                onMouseOut={e => {
                  e.currentTarget.style.borderColor = 'var(--border-subtle)'
                  e.currentTarget.style.background = 'transparent'
                }}
              >
                <div style={{
                  width: 36, height: 36, borderRadius: '50%', flexShrink: 0,
                  background: `${getMoodColor(entry.mood)}15`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <div style={{ width: 12, height: 12, borderRadius: '50%', background: getMoodColor(entry.mood) }} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', textTransform: 'capitalize' }}>
                      {MOOD_LABEL_MAP[entry.mood] || entry.mood}
                    </span>
                    <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{entry.date?.slice(5)}</span>
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>Energi: {entry.energy}</span>
                    <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>Stres: {entry.stress}</span>
                  </div>
                  {entry.note && (
                    <p style={{ fontSize: 12, color: 'var(--text-secondary)', margin: '4px 0 0', lineHeight: 1.4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={entry.note}>
                      {entry.note}
                    </p>
                  )}
                </div>
                <ChevronRight size={14} color="var(--text-muted)" style={{ flexShrink: 0, marginTop: 4 }} />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Modal detail riwayat */}
      <Modal isOpen={!!selectedEntry && !showInputForm} onClose={() => setSelectedEntry(null)} maxWidth={480}>
        {selectedEntry && (
          <div>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{
                  width: 48, height: 48, borderRadius: '50%',
                  background: `${getMoodColor(selectedEntry.mood)}20`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <div style={{ width: 18, height: 18, borderRadius: '50%', background: getMoodColor(selectedEntry.mood) }} />
                </div>
                <div>
                  <h3 style={{ margin: '0 0 2px', fontSize: 18, textTransform: 'capitalize' }}>
                    {MOOD_LABEL_MAP[selectedEntry.mood] || selectedEntry.mood}
                  </h3>
                  <p style={{ margin: 0, fontSize: 13, color: 'var(--text-muted)' }}>{selectedEntry.date}</p>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-muted)' }}>
                <Activity size={16} />
              </div>
            </div>

            {/* Stats grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 20 }}>
              <div style={{ padding: '14px 12px', borderRadius: 10, background: 'var(--bg)', border: '1px solid var(--border-subtle)', textAlign: 'center' }}>
                <p style={{ fontSize: 22, fontWeight: 800, color: getMoodColor(selectedEntry.mood), margin: '0 0 2px' }}>
                  {moodToNum(selectedEntry.mood)}
                </p>
                <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: 0 }}>Mood Score</p>
              </div>
              <div style={{ padding: '14px 12px', borderRadius: 10, background: 'var(--bg)', border: '1px solid var(--border-subtle)', textAlign: 'center' }}>
                <p style={{ fontSize: 22, fontWeight: 800, color: 'var(--brand-blue)', margin: '0 0 2px' }}>{selectedEntry.energy}</p>
                <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: 0 }}>Energi /10</p>
              </div>
              <div style={{ padding: '14px 12px', borderRadius: 10, background: 'var(--bg)', border: '1px solid var(--border-subtle)', textAlign: 'center' }}>
                <p style={{ fontSize: 22, fontWeight: 800, color: selectedEntry.stress >= 7 ? 'var(--error)' : selectedEntry.stress >= 5 ? 'var(--warning)' : 'var(--teal)', margin: '0 0 2px' }}>
                  {selectedEntry.stress}
                </p>
                <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: 0 }}>Stres /10</p>
              </div>
            </div>

            {/* Energy bar */}
            <div style={{ marginBottom: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                <span style={{ fontSize: 12, color: 'var(--text-secondary)', fontWeight: 600 }}>Level Energi</span>
                <span style={{ fontSize: 12, color: 'var(--brand-blue)', fontWeight: 700 }}>{selectedEntry.energy}/10</span>
              </div>
              <div style={{ height: 8, borderRadius: 4, background: 'var(--border-subtle)', overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${selectedEntry.energy * 10}%`, background: 'var(--brand-blue)', borderRadius: 4, transition: 'width 0.5s ease' }} />
              </div>
            </div>

            {/* Stress bar */}
            <div style={{ marginBottom: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                <span style={{ fontSize: 12, color: 'var(--text-secondary)', fontWeight: 600 }}>Level Stres</span>
                <span style={{ fontSize: 12, fontWeight: 700, color: selectedEntry.stress >= 7 ? 'var(--error)' : selectedEntry.stress >= 5 ? 'var(--warning)' : 'var(--teal)' }}>{selectedEntry.stress}/10</span>
              </div>
              <div style={{ height: 8, borderRadius: 4, background: 'var(--border-subtle)', overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${selectedEntry.stress * 10}%`, background: selectedEntry.stress >= 7 ? 'var(--error)' : selectedEntry.stress >= 5 ? 'var(--warning)' : 'var(--teal)', borderRadius: 4, transition: 'width 0.5s ease' }} />
              </div>
            </div>

            {/* Note */}
            {selectedEntry.note && (
              <div style={{ padding: '14px 16px', borderRadius: 10, background: 'var(--bg)', border: '1px solid var(--border-subtle)', marginBottom: 20 }}>
                <p style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', margin: '0 0 6px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Catatan</p>
                <p style={{ fontSize: 14, color: 'var(--text-primary)', margin: 0, lineHeight: 1.6 }}>{selectedEntry.note}</p>
              </div>
            )}

            {/* Mood status */}
            <div style={{
              padding: '12px 14px', borderRadius: 10,
              background: moodToNum(selectedEntry.mood) >= 7 ? 'rgba(23,184,151,0.08)' : moodToNum(selectedEntry.mood) >= 5 ? 'rgba(2,134,195,0.06)' : 'rgba(245,166,35,0.08)',
              borderLeft: `3px solid ${moodToNum(selectedEntry.mood) >= 7 ? 'var(--teal)' : moodToNum(selectedEntry.mood) >= 5 ? 'var(--brand-blue)' : 'var(--warning)'}`,
            }}>
              <p style={{ fontSize: 13, color: 'var(--text-primary)', margin: 0, lineHeight: 1.5 }}>
                {moodToNum(selectedEntry.mood) >= 7
                  ? 'Hari yang baik! Mood kamu sedang dalam kondisi positif.'
                  : moodToNum(selectedEntry.mood) >= 5
                  ? 'Hari yang lumayan. Kamu lagi di zona netral — normal aja.'
                  : 'Kamu lagi di titik yang berat. Oke untuk nggak baik-baik aja, ini validasi perasaanmu.'}
              </p>
            </div>

            <button onClick={() => setSelectedEntry(null)} className="btn btn-primary" style={{ width: '100%', marginTop: 20, justifyContent: 'center' }}>
              Tutup
            </button>
          </div>
        )}
      </Modal>

      {/* Modal input mood */}
      <Modal isOpen={showInputForm} onClose={() => setShowInputForm(false)} maxWidth={520} title="Gimana kamu hari ini?">
        <div>
          {/* Mood selection */}
          <div style={{ marginBottom: 24 }}>
            <label className="label">Pilih yang paling ngena sekarang</label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 8 }}>
              {MOODS.map(mood => (
                <button
                  key={mood.id}
                  onClick={() => setSelectedMood(mood.id)}
                  style={{
                    padding: '10px 8px', borderRadius: 8, border: `2px solid ${selectedMood === mood.id ? mood.color : 'var(--border-subtle)'}`,
                    background: selectedMood === mood.id ? `${mood.color}10` : 'var(--surface)',
                    cursor: 'pointer', transition: 'all 150ms ease',
                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
                  }}
                >
                  <div style={{ width: 20, height: 20, borderRadius: '50%', background: mood.color, margin: '0 auto' }} />
                  <span style={{ fontSize: 10, fontWeight: selectedMood === mood.id ? 700 : 500, color: selectedMood === mood.id ? mood.color : 'var(--text-secondary)' }}>
                    {mood.label}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Energy */}
          <div style={{ marginBottom: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
              <label className="label" style={{ margin: 0 }}>Level energi kamu</label>
              <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--brand-blue)' }}>{energy}/10</span>
            </div>
            <input
              type="range"
              min="1"
              max="10"
              value={energy}
              onChange={e => setEnergy(parseInt(e.target.value))}
              style={{ width: '100%', accentColor: 'var(--brand-blue)', height: 6, borderRadius: 3, background: 'var(--border)' }}
            />
          </div>

          {/* Stress */}
          <div style={{ marginBottom: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
              <label className="label" style={{ margin: 0 }}>Level stres kamu</label>
              <span style={{ fontSize: 13, fontWeight: 700, color: stress >= 7 ? 'var(--error)' : stress >= 5 ? 'var(--warning)' : 'var(--teal)' }}>
                {stress}/10
              </span>
            </div>
            <input
              type="range"
              min="1"
              max="10"
              value={stress}
              onChange={e => setStress(parseInt(e.target.value))}
              style={{
                width: '100%',
                accentColor: stress >= 7 ? 'var(--error)' : stress >= 5 ? 'var(--warning)' : 'var(--teal)',
                height: 6, borderRadius: 3, background: 'var(--border)'
              }}
            />
          </div>

          {/* Triggers */}
          <div style={{ marginBottom: 24 }}>
            <label className="label">Faktor pemicu mood (opsional)</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {TRIGGERS.map(trig => {
                const isSelected = selectedTriggers.includes(trig)
                return (
                  <button
                    key={trig}
                    onClick={() => {
                      if (isSelected) {
                        setSelectedTriggers(prev => prev.filter(t => t !== trig))
                      } else {
                        setSelectedTriggers(prev => [...prev, trig])
                      }
                    }}
                    style={{
                      padding: '6px 12px', borderRadius: 20, fontSize: 12,
                      border: `1px solid ${isSelected ? 'var(--brand-blue)' : 'var(--border)'}`,
                      background: isSelected ? 'rgba(2,134,195,0.06)' : 'var(--surface)',
                      color: isSelected ? 'var(--brand-blue)' : 'var(--text-secondary)',
                      cursor: 'pointer', transition: 'all 150ms ease',
                    }}
                  >
                    {trig}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Note */}
          <div style={{ marginBottom: 24 }}>
            <label className="label" htmlFor="mood-note">Catatan (opsional)</label>
            <textarea
              id="mood-note"
              className="input"
              placeholder="Cerita dikit soal hari ini..."
              value={note}
              onChange={e => setNote(e.target.value)}
              rows={3}
              style={{ resize: 'vertical', lineHeight: 1.6 }}
            />
          </div>

          <div style={{ display: 'flex', gap: 12 }}>
            <button onClick={() => setShowInputForm(false)} className="btn btn-secondary" style={{ flex: 1, justifyContent: 'center' }}>
              Batal
            </button>
            <button
              onClick={handleSave}
              disabled={!selectedMood}
              className="btn btn-primary"
              style={{ flex: 1, justifyContent: 'center', opacity: selectedMood ? 1 : 0.5 }}
            >
              Simpan mood
            </button>
          </div>
        </div>
      </Modal>

      <style jsx>{`
        @media (max-width: 1023px) {
          div > div > div:first-child { grid-template-columns: 1fr !important; }
          div > div { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  )
}
