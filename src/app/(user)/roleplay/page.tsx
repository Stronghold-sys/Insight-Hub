'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import {
  MessageCircle, Zap, ChevronRight, Send, RotateCcw,
  Star, CheckCircle, AlertCircle, ArrowLeft, User, Loader2,
  Sprout, Flame, Smile, Handshake, Lightbulb, Clock,
  BookOpen, X, Trash2, ChevronDown, ChevronUp, Play,
  StopCircle, Plus, History, Compass
} from 'lucide-react'

// ─────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────
type AppState = 'intro' | 'setup' | 'simulating' | 'result' | 'history' | 'history-detail'
type Level = 'Pemula' | 'Menengah' | 'Lanjutan'
type Gender = 'pria' | 'wanita'

interface ChatMessage {
  role: 'user' | 'ai'
  text: string
  feedback?: { score: number; note: string; alternatives?: string[] }
}

interface GeneratedScenario {
  title: string
  description: string
  context: string
  goal: string
  aiPersona: string
  openingMessage: string
  partnerName: string
}

interface HistorySession {
  id: string
  title: string
  level: string
  user_gender: string
  lang_style: string
  scenario_context?: string
  scenario_goal?: string
  ai_persona?: string
  partner_name?: string
  messages?: ChatMessage[]
  analysis?: any
  turn_count: number
  avg_score: number
  status: string
  created_at_formatted: string
}

// ─────────────────────────────────────────────
// LEVEL CONFIG
// ─────────────────────────────────────────────
const LEVEL_CONFIG: Record<Level, { color: string; bg: string; border: string; icon: any; badge: string; desc: string; hint: string }> = {
  Pemula: {
    color: '#17B897', bg: 'rgba(23,184,151,0.08)', border: 'rgba(23,184,151,0.25)',
    icon: Sprout, badge: 'Santai & Ringan',
    desc: 'Skenario sederhana dan sehari-hari. Cocok buat kamu yang baru mulai belajar komunikasi yang lebih baik.',
    hint: 'Lawan bicara akan kooperatif, ramah, dan gampang diajak ngobrol.'
  },
  Menengah: {
    color: '#0286C3', bg: 'rgba(2,134,195,0.08)', border: 'rgba(2,134,195,0.25)',
    icon: Zap, badge: 'Realistis & Dinamis',
    desc: 'Situasi yang lebih dalam dan sedikit tricky. Ada momen emosional atau butuh asertivitas lebih.',
    hint: 'Lawan bicara bisa lebih emosional dan ambigu, mirip ngobrol beneran.'
  },
  Lanjutan: {
    color: '#9B59B6', bg: 'rgba(155,89,182,0.08)', border: 'rgba(155,89,182,0.25)',
    icon: Flame, badge: 'Challenging & Kompleks',
    desc: 'Skenario penuh tekanan atau konflik yang butuh penanganan matang. Untuk yang sudah siap ditantang.',
    hint: 'Lawan bicara bisa defensif atau tajam. Tetap tenang dan fokus!'
  }
}

const SCORE_FEEDBACK = [
  { min: 80, label: 'Komunikasi Sangat Baik', color: '#17B897' },
  { min: 60, label: 'Komunikasi Cukup Baik', color: '#0286C3' },
  { min: 40, label: 'Bisa Ditingkatkan', color: '#F5A623' },
  { min: 0,  label: 'Perlu Banyak Latihan', color: '#D32F2F' },
]

function getScoreLabel(score: number) {
  return SCORE_FEEDBACK.find(f => score >= f.min) ?? SCORE_FEEDBACK[SCORE_FEEDBACK.length - 1]
}

// ─────────────────────────────────────────────
// MAIN PAGE
// ─────────────────────────────────────────────
export default function RoleplayPage() {
  const [appState, setAppState] = useState<AppState>('intro')

  // Setup form
  const [selectedLevel, setSelectedLevel] = useState<Level | null>(null)
  const [selectedGender, setSelectedGender] = useState<Gender | null>(null)
  const [userName, setUserName] = useState('')
  const [langStyle, setLangStyle] = useState<'santai' | 'formal'>('santai')

  // Scenario
  const [scenario, setScenario] = useState<GeneratedScenario | null>(null)
  const [scenarioLoading, setScenarioLoading] = useState(false)
  const [scenarioError, setScenarioError] = useState('')

  // Chat
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [inputText, setInputText] = useState('')
  const [apiLoading, setApiLoading] = useState(false)
  const [apiError, setApiError] = useState('')
  const [turnCount, setTurnCount] = useState(0)
  const [totalScore, setTotalScore] = useState(0)
  const MAX_TURNS = 6

  // End chat modal
  const [showEndModal, setShowEndModal] = useState(false)

  // Analysis state
  const [sessionAnalysis, setSessionAnalysis] = useState<any>(null)
  const [analysisLoading, setAnalysisLoading] = useState(false)

  // History
  const [historyList, setHistoryList] = useState<HistorySession[]>([])
  const [historyLoading, setHistoryLoading] = useState(false)
  const [historyDetail, setHistoryDetail] = useState<HistorySession | null>(null)
  const [historyDetailLoading, setHistoryDetailLoading] = useState(false)

  const chatEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // ── FETCH HISTORY ──
  const fetchHistory = useCallback(async () => {
    setHistoryLoading(true)
    try {
      const res = await fetch('/api/roleplay/history')
      const data = await res.json()
      if (data.success) setHistoryList(data.sessions || [])
    } catch { /* ignore */ }
    finally { setHistoryLoading(false) }
  }, [])

  const fetchHistoryDetail = async (id: string) => {
    setHistoryDetailLoading(true)
    try {
      const res = await fetch(`/api/roleplay/history/${id}`)
      const data = await res.json()
      if (data.success) {
        setHistoryDetail(data.session)
        setAppState('history-detail')
      }
    } catch { /* ignore */ }
    finally { setHistoryDetailLoading(false) }
  }

  const deleteHistorySession = async (id: string) => {
    try {
      await fetch(`/api/roleplay/history/${id}`, { method: 'DELETE' })
      setHistoryList(prev => prev.filter(s => s.id !== id))
    } catch { /* ignore */ }
  }

  // ── SAVE SESSION ──
  const saveSession = async (finalMessages: ChatMessage[], finalTurn: number, finalAvg: number) => {
    if (!scenario || !selectedLevel || !selectedGender) return
    setAnalysisLoading(true)
    try {
      const res = await fetch('/api/roleplay/history', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: scenario.title,
          level: selectedLevel,
          userGender: selectedGender,
          langStyle,
          scenarioContext: scenario.context,
          scenarioGoal: scenario.goal,
          aiPersona: scenario.aiPersona,
          partnerName: scenario.partnerName,
          messages: finalMessages,
          turnCount: finalTurn,
          avgScore: finalAvg
        })
      })
      const data = await res.json()
      if (data.success && data.analysis) {
        setSessionAnalysis(data.analysis)
      }
    } catch { /* ignore */ }
    finally {
      setAnalysisLoading(false)
    }
  }

  // ── START SIMULATION ──
  const canStart = selectedLevel && selectedGender && userName.trim().length >= 2 && !scenarioLoading

  const startSimulation = async () => {
    if (!canStart || !selectedLevel || !selectedGender) return
    setScenarioLoading(true)
    setScenarioError('')
    setScenario(null)

    try {
      const res = await fetch('/api/roleplay/scenario', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ level: selectedLevel, userGender: selectedGender, langStyle })
      })
      const data = await res.json()

      if (data.success && data.scenario) {
        const sc = data.scenario as GeneratedScenario
        setScenario(sc)
        setMessages([{ role: 'ai', text: sc.openingMessage }])
        setTurnCount(0)
        setTotalScore(0)
        setApiError('')
        setAppState('simulating')
      } else {
        setScenarioError(data.error || 'Gagal menyiapkan skenario. Coba lagi ya!')
      }
    } catch {
      setScenarioError('Koneksi bermasalah saat menyiapkan simulasi.')
    } finally {
      setScenarioLoading(false)
    }
  }

  // ── SEND MESSAGE ──
  const sendMessage = async () => {
    if (!inputText.trim() || apiLoading || !scenario || !selectedLevel || !selectedGender) return
    const userText = inputText.trim()
    setInputText('')
    setApiError('')

    const tempMsg: ChatMessage = { role: 'user', text: userText }
    const updatedMessages = [...messages, tempMsg]
    setMessages(updatedMessages)
    setApiLoading(true)

    const nextTurn = turnCount + 1

    try {
      const res = await fetch('/api/roleplay/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scenarioTitle: scenario.title,
          scenarioDescription: scenario.description,
          scenarioContext: scenario.context,
          scenarioGoal: scenario.goal,
          aiPersona: scenario.aiPersona,
          partnerName: scenario.partnerName,
          difficultyLevel: selectedLevel,
          userGender: selectedGender,
          userName: userName.trim(),
          langStyle,
          messages: updatedMessages,
          currentTurn: nextTurn,
          maxTurns: MAX_TURNS
        })
      })
      const data = await res.json()

      if (data.success) {
        const finalMessages = [...updatedMessages]
        const lastIdx = finalMessages.findLastIndex(m => m.role === 'user')
        if (lastIdx !== -1) finalMessages[lastIdx] = { ...finalMessages[lastIdx], feedback: data.feedback }
        const withReply = [...finalMessages, { role: 'ai' as const, text: data.opponentReply }]
        setMessages(withReply)
        const newScore = totalScore + (data.feedback?.score || 0)
        setTotalScore(newScore)
        setTurnCount(nextTurn)
        if (nextTurn >= MAX_TURNS) {
          const avg = Math.round(newScore / nextTurn)
          setAppState('result')
          await saveSession(withReply, nextTurn, avg)
        }
      } else {
        setApiError(data.error || 'Lawan bicara lagi nggak bisa dihubungi. Coba kirim ulang ya.')
        setMessages(prev => prev.slice(0, -1))
        setInputText(userText)
      }
    } catch {
      setApiError('Koneksi terputus. Cek internet kamu ya.')
      setMessages(prev => prev.slice(0, -1))
      setInputText(userText)
    } finally {
      setApiLoading(false)
    }
  }

  // ── END CHAT NOW ──
  const endChatNow = async () => {
    setShowEndModal(false)
    setAppState('result')
    const finalTurn = turnCount > 0 ? turnCount : 1
    const avg = turnCount > 0 ? Math.round(totalScore / turnCount) : 0
    await saveSession(messages, finalTurn, avg)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage() }
  }

  const avgScore = turnCount > 0 ? Math.round(totalScore / turnCount) : 0

  // ── RESET TO SETUP (Buat Simulasi Baru) ──
  const resetToSetup = () => {
    setAppState('setup')
    setMessages([])
    setTurnCount(0)
    setTotalScore(0)
    setScenario(null)
    setSelectedLevel(null)
    setSelectedGender(null)
    setUserName('')
    setLangStyle('santai')
    setApiError('')
    setScenarioError('')
    setShowEndModal(false)
    setSessionAnalysis(null)
  }

  // ── RENDER FEEDBACK ANALYSIS CARDS ──
  const renderAnalysisCards = (analysis: any) => {
    if (!analysis) return null
    const scores = analysis.scores || {}
    
    const scoreMetrics = [
      { key: 'kejelasan', label: 'Kejelasan Jawaban', val: scores.kejelasan || 0, icon: MessageCircle, color: '#0286C3' },
      { key: 'ketenang', label: 'Ketenangan Merespons', val: scores.ketenang || 0, icon: Clock, color: '#9B59B6' },
      { key: 'pemahaman', label: 'Kemampuan Memahami', val: scores.pemahaman || 0, icon: Handshake, color: '#17B897' },
      { key: 'emosi', label: 'Ketepatan Emosi', val: scores.emosi || 0, icon: Smile, color: '#E11D48' },
      { key: 'arah', label: 'Menjaga Arah Chat', val: scores.arah || 0, icon: Compass, color: '#F5A623' },
      { key: 'keaslian', label: 'Keaslian Gaya Bicara', val: scores.keaslian || 0, icon: User, color: '#0EA5E9' }
    ]

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20, marginBottom: 24 }} className="animate-fadein">
        {/* Card 1: Ringkasan Hasil */}
        <div className="card" style={{ padding: 24, borderLeft: '4px solid var(--brand-blue)', background: 'var(--surface)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
            <MessageCircle size={18} color="var(--brand-blue)" />
            <h3 style={{ fontSize: 15, fontWeight: 900, margin: 0, color: 'var(--text-primary)' }}>Ringkasan Hasil & Suasana Percakapan</h3>
          </div>
          <p style={{ fontSize: 13.5, color: 'var(--text-primary)', margin: 0, lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>
            {analysis.summary}
          </p>
        </div>

        {/* Card 2: Skor Simulasi */}
        <div className="card" style={{ padding: 24 }}>
          <h3 style={{ fontSize: 15, fontWeight: 900, margin: '0 0 16px', color: 'var(--text-primary)' }}>Skor Simulasi</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }} className="grid-feedback-blocks">
            {scoreMetrics.map(m => {
              const Icon = m.icon
              return (
                <div key={m.key} style={{ padding: '12px 14px', borderRadius: 12, background: 'var(--bg)', border: '1px solid var(--border-subtle)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <Icon size={16} color={m.color} />
                      <span style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--text-primary)' }}>{m.label}</span>
                    </div>
                    <span style={{ fontSize: 13.5, fontWeight: 900, color: m.color }}>{m.val}/100</span>
                  </div>
                  <div style={{ width: '100%', height: 6, borderRadius: 3, background: 'var(--border-subtle)', overflow: 'hidden' }}>
                    <div style={{ width: `${m.val}%`, height: '100%', borderRadius: 3, background: m.color, transition: 'width 0.6s ease' }} />
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Cards 3 & 4: Kelebihan & Yang Perlu Dibenerin */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }} className="grid-feedback-blocks">
          <div className="card" style={{ padding: 24, borderColor: 'rgba(23,184,151,0.25)', background: 'rgba(23,184,151,0.03)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12, color: 'var(--teal)' }}>
              <CheckCircle size={18} color="var(--teal)" />
              <h3 style={{ fontSize: 14.5, fontWeight: 800, margin: 0 }}>Kelebihan Kamu</h3>
            </div>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: 0, lineHeight: 1.65, whiteSpace: 'pre-wrap' }}>
              {analysis.advantages}
            </p>
          </div>

          <div className="card" style={{ padding: 24, borderColor: 'rgba(245,166,35,0.25)', background: 'rgba(245,166,35,0.03)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12, color: 'var(--warning)' }}>
              <AlertCircle size={18} color="var(--warning)" />
              <h3 style={{ fontSize: 14.5, fontWeight: 800, margin: 0 }}>Yang Perlu Dibenerin</h3>
            </div>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: 0, lineHeight: 1.65, whiteSpace: 'pre-wrap' }}>
              {analysis.improvements}
            </p>
          </div>
        </div>

        {/* Card 5: Saran Next Step */}
        <div className="card" style={{ padding: 24, borderColor: 'rgba(155,89,182,0.25)', background: 'rgba(155,89,182,0.03)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12, color: '#9B59B6' }}>
            <Lightbulb size={18} color="#9B59B6" />
            <h3 style={{ fontSize: 14.5, fontWeight: 800, margin: 0 }}>Saran Next Step</h3>
          </div>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: 0, lineHeight: 1.65, whiteSpace: 'pre-wrap' }}>
            {analysis.nextSteps}
          </p>
        </div>

        {/* Card 6: Contoh Balasan Lebih Oke */}
        <div className="card" style={{ padding: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
            <BookOpen size={18} color="var(--brand-blue)" />
            <h3 style={{ fontSize: 14.5, fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>Contoh Balasan yang Lebih Oke</h3>
          </div>
          <div style={{ padding: 16, borderRadius: 12, background: 'var(--bg)', border: '1px solid var(--border-subtle)', fontStyle: 'italic' }}>
            <p style={{ fontSize: 13, color: 'var(--text-primary)', margin: 0, lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>
              {analysis.betterResponse}
            </p>
          </div>
        </div>

        {/* Card 7: Kesimpulan Akhir */}
        <div className="card" style={{ padding: 24, background: 'linear-gradient(135deg, rgba(2,134,195,0.04), rgba(23,184,151,0.04))', textAlign: 'center' }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 10 }}>
            <Star size={22} color="var(--brand-blue)" />
          </div>
          <h3 style={{ fontSize: 14.5, fontWeight: 800, margin: '0 0 8px', color: 'var(--text-primary)' }}>Kesimpulan Akhir</h3>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: 0, lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
            {analysis.finalConclusion}
          </p>
        </div>
      </div>
    )
  }

  // ─────────────────────────────────────────────
  // RENDER: HISTORY DETAIL
  // ─────────────────────────────────────────────
  if (appState === 'history-detail' && historyDetail) {
    const sd = historyDetail
    const scoreLvl = getScoreLabel(sd.avg_score)

    return (
      <div className="animate-fadein" style={{ maxWidth: 680, margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
          <button onClick={() => setAppState('history')} className="btn btn-ghost btn-sm" style={{ padding: '6px 10px', borderRadius: 8, gap: 6, display: 'flex', alignItems: 'center' }}>
            <ArrowLeft size={16} /> Kembali ke Riwayat
          </button>
        </div>

        <div className="card" style={{ padding: 24, marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, marginBottom: 16 }}>
            <div>
              <h2 style={{ fontSize: 18, fontWeight: 900, margin: '0 0 6px' }}>{sd.title}</h2>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <span style={{ fontSize: 11, padding: '3px 10px', borderRadius: 999, background: `${LEVEL_CONFIG[sd.level as Level]?.color ?? '#666'}15`, color: LEVEL_CONFIG[sd.level as Level]?.color ?? '#666', fontWeight: 700 }}>{sd.level}</span>
                <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{sd.created_at_formatted}</span>
                <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{sd.turn_count} giliran</span>
              </div>
            </div>
            <div style={{ textAlign: 'center', flexShrink: 0 }}>
              <div style={{ fontSize: 28, fontWeight: 900, color: scoreLvl.color }}>{sd.avg_score}</div>
              <div style={{ fontSize: 10, color: scoreLvl.color, fontWeight: 700 }}>{scoreLvl.label}</div>
            </div>
          </div>
          {sd.scenario_context && (
            <div style={{ padding: '10px 14px', borderRadius: 10, background: 'var(--bg)', border: '1px solid var(--border-subtle)', marginBottom: 12 }}>
              <p style={{ fontSize: 12.5, color: 'var(--text-secondary)', margin: 0, lineHeight: 1.5 }}>
                <strong style={{ color: 'var(--text-primary)' }}>Konteks:</strong> {sd.scenario_context}
              </p>
            </div>
          )}
          {sd.scenario_goal && (
            <p style={{ fontSize: 12.5, color: 'var(--text-secondary)', margin: 0 }}>
              <strong>Tujuan:</strong> {sd.scenario_goal}
            </p>
          )}
        </div>

        {/* Detail Analisis Hasil Sesi Riwayat */}
        {sd.analysis && (
          <div style={{ marginBottom: 20 }}>
            <h3 style={{ fontSize: 15, fontWeight: 800, margin: '0 0 12px', color: 'var(--text-primary)' }}>Laporan Analisis Simulasi</h3>
            {renderAnalysisCards(sd.analysis)}
          </div>
        )}

        <div className="card" style={{ padding: 24, marginBottom: 20 }}>
          <h3 style={{ fontSize: 14, fontWeight: 800, margin: '0 0 16px' }}>Isi Percakapan</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {(sd.messages || []).map((msg, i) => {
              const isUser = msg.role === 'user'
              return (
                <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: isUser ? 'flex-end' : 'flex-start', gap: 4 }}>
                  <span style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600 }}>
                    {isUser ? (sd.user_gender === 'pria' ? 'Kamu (pria)' : 'Kamu (wanita)') : (sd.partner_name || (sd.user_gender === 'pria' ? 'Sarah' : 'Raka'))}
                  </span>
                  <div style={{
                    maxWidth: '80%', padding: '10px 14px', borderRadius: isUser ? '14px 14px 4px 14px' : '14px 14px 14px 4px',
                    background: isUser ? 'var(--brand-blue)' : 'var(--surface)',
                    color: isUser ? 'white' : 'var(--text-primary)',
                    border: isUser ? 'none' : '1px solid var(--border-subtle)',
                    fontSize: 13.5, lineHeight: 1.6
                  }}>{msg.text}</div>
                  {isUser && msg.feedback && (
                    <div style={{ maxWidth: '80%', fontSize: 12, color: 'var(--text-secondary)', padding: '6px 10px', borderRadius: 8, background: 'var(--bg)', border: '1px solid var(--border-subtle)' }}>
                      <strong style={{ color: getScoreLabel(msg.feedback.score).color }}>Skor {msg.feedback.score}</strong> — {msg.feedback.note}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        <div style={{ display: 'flex', gap: 12, marginBottom: 40 }}>
          <button onClick={resetToSetup} className="btn btn-primary" style={{ flex: 1, justifyContent: 'center', gap: 8 }}>
            <Plus size={16} /> Buat Simulasi Baru
          </button>
          <button onClick={() => setAppState('history')} className="btn btn-secondary" style={{ flex: 1, justifyContent: 'center', gap: 8, border: '1px solid var(--border)' }}>
            <History size={16} /> Kembali ke Riwayat
          </button>
        </div>
      </div>
    )
  }

  // ─────────────────────────────────────────────
  // RENDER: HISTORY LIST
  // ─────────────────────────────────────────────
  if (appState === 'history') {
    return (
      <div className="animate-fadein" style={{ maxWidth: 680, margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button onClick={() => setAppState('intro')} className="btn btn-ghost btn-sm" style={{ padding: '6px 10px', borderRadius: 8, gap: 6, display: 'flex', alignItems: 'center' }}>
              <ArrowLeft size={16} /> Kembali
            </button>
            <h2 style={{ fontSize: 20, fontWeight: 900, margin: 0 }}>Riwayat Simulasi</h2>
          </div>
          <button onClick={resetToSetup} className="btn btn-primary btn-sm" style={{ gap: 6 }}>
            <Plus size={14} /> Simulasi Baru
          </button>
        </div>

        {historyLoading ? (
          <div style={{ textAlign: 'center', padding: 48 }}>
            <Loader2 size={28} color="var(--brand-blue)" style={{ animation: 'spin 1s linear infinite' }} />
            <p style={{ marginTop: 12, color: 'var(--text-secondary)' }}>Lagi ngambil riwayat kamu...</p>
          </div>
        ) : historyList.length === 0 ? (
          <div className="card" style={{ padding: 48, textAlign: 'center' }}>
            <History size={40} color="var(--text-muted)" style={{ marginBottom: 16 }} />
            <p style={{ fontSize: 15, fontWeight: 700, margin: '0 0 8px', color: 'var(--text-secondary)' }}>Belum ada riwayat simulasi</p>
            <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: '0 0 24px' }}>Mulai simulasi pertamamu dan hasilnya bakal tersimpan di sini otomatis.</p>
            <button onClick={resetToSetup} className="btn btn-primary" style={{ gap: 8 }}>
              <Play size={16} /> Mulai Simulasi
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 40 }}>
            {historyList.map(s => {
              const scoreLvl = getScoreLabel(s.avg_score)
              const levelCfg = LEVEL_CONFIG[s.level as Level]
              return (
                <div key={s.id} className="card" style={{ padding: '16px 20px', cursor: 'pointer', transition: 'all 0.2s ease' }}
                  onClick={() => fetchHistoryDetail(s.id)}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, flexWrap: 'wrap' }}>
                        <span style={{ fontSize: 14, fontWeight: 800, color: 'var(--text-primary)' }}>{s.title}</span>
                        {levelCfg && (
                          <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 999, background: `${levelCfg.color}15`, color: levelCfg.color, fontWeight: 700 }}>{s.level}</span>
                        )}
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)', display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                        <span>{s.created_at_formatted}</span>
                        <span>{s.turn_count} giliran</span>
                        <span>Lawan bicara: {s.partner_name || (s.user_gender === 'pria' ? 'Sarah' : 'Raka')}</span>
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
                      <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: 20, fontWeight: 900, color: scoreLvl.color }}>{s.avg_score}</div>
                        <div style={{ fontSize: 10, color: scoreLvl.color, fontWeight: 700, whiteSpace: 'nowrap' }}>{scoreLvl.label}</div>
                      </div>
                      <button
                        onClick={e => { e.stopPropagation(); deleteHistorySession(s.id) }}
                        style={{ padding: 6, borderRadius: 8, border: 'none', background: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
                        title="Hapus"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
        <style jsx>{`
          @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        `}</style>
      </div>
    )
  }

  // ─────────────────────────────────────────────
  // RENDER: RESULT
  // ─────────────────────────────────────────────
  if (appState === 'result') {
    const scoreLvl = getScoreLabel(avgScore)
    return (
      <div className="animate-fadein" style={{ maxWidth: 680, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 32, padding: '40px 24px 0' }}>
          <div style={{ width: 72, height: 72, borderRadius: '50%', margin: '0 auto 16px', background: `${scoreLvl.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', border: `2px solid ${scoreLvl.color}30` }}>
            <Star size={32} color={scoreLvl.color} />
          </div>
          <h1 style={{ fontSize: 24, fontWeight: 900, margin: '0 0 8px' }}>Simulasi Selesai</h1>
          <p style={{ fontSize: 14, color: 'var(--text-secondary)' }}>
            {turnCount > 0 ? `Kamu udah selesaikan ${turnCount} giliran percakapan.` : 'Chat sudah diakhiri.'} Ini hasilnya:
          </p>
        </div>

        <div className="card" style={{ padding: 32, textAlign: 'center', marginBottom: 20, background: `linear-gradient(135deg, ${scoreLvl.color}08, ${scoreLvl.color}04)`, borderColor: `${scoreLvl.color}20` }}>
          <p style={{ fontSize: 12, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', color: scoreLvl.color, margin: '0 0 12px' }}>Skor Komunikasi</p>
          <div style={{ fontSize: 72, fontWeight: 900, color: scoreLvl.color, lineHeight: 1, margin: '0 0 8px' }}>{avgScore}</div>
          <p style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 6px' }}>{scoreLvl.label}</p>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: 0 }}>
            {turnCount} giliran percakapan · Level {selectedLevel}
          </p>
        </div>

        {analysisLoading ? (
          <div className="card" style={{ padding: 48, textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
            <Loader2 size={36} color="var(--brand-blue)" style={{ animation: 'spin 1s linear infinite' }} />
            <h3 style={{ fontSize: 16, fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>Menganalisis komunikasimu...</h3>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: 0, maxWidth: 360, lineHeight: 1.6 }}>
              Sistem sedang memproses seluruh percakapan dan menyusun laporan evaluasi mendalam untukmu. Tunggu sebentar ya!
            </p>
          </div>
        ) : sessionAnalysis ? (
          renderAnalysisCards(sessionAnalysis)
        ) : (
          <>

            {messages.filter(m => m.role === 'user' && m.feedback).length > 0 && (
              <div className="card" style={{ padding: 24, marginBottom: 20 }}>
                <h3 style={{ fontSize: 14, fontWeight: 800, margin: '0 0 16px' }}>Catatan per Giliran</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {messages.filter(m => m.role === 'user' && m.feedback).map((m, i) => {
                    const fb = m.feedback!
                    const fl = getScoreLabel(fb.score)
                    return (
                      <div key={i} style={{ padding: '12px 16px', borderRadius: 10, background: 'var(--bg)', border: '1px solid var(--border-subtle)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                          <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Giliran {i + 1}</span>
                          <span style={{ fontSize: 12, fontWeight: 800, color: fl.color }}>+{fb.score}</span>
                        </div>
                        <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: '0 0 6px', fontStyle: 'italic', lineHeight: 1.5 }}>
                          "{m.text.slice(0, 90)}{m.text.length > 90 ? '...' : ''}"
                        </p>
                        {fb.note && <p style={{ fontSize: 12, color: 'var(--text-primary)', margin: 0 }}>{fb.note}</p>}
                        {fb.alternatives && fb.alternatives.length > 0 && (
                          <div style={{ marginTop: 8, borderTop: '1px solid var(--border-subtle)', paddingTop: 8 }}>
                            <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', margin: '0 0 4px' }}>Alternatif Kalimat:</p>
                            {fb.alternatives.map((alt, idx) => (
                              <p key={idx} style={{ margin: '3px 0', fontSize: 12, color: 'var(--text-secondary)' }}>- {alt}</p>
                            ))}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </>
        )}

        <div className="card" style={{ padding: 16, marginBottom: 16, background: 'rgba(23,184,151,0.04)', borderColor: 'rgba(23,184,151,0.2)' }}>
          <p style={{ fontSize: 12.5, color: 'var(--text-secondary)', margin: 0, display: 'flex', alignItems: 'center', gap: 6 }}>
            <CheckCircle size={13} color="var(--teal)" />
            Hasil simulasi ini sudah otomatis tersimpan ke riwayat chat kamu.
          </p>
        </div>

        <div style={{ display: 'flex', gap: 12, marginBottom: 40 }}>
          <button onClick={resetToSetup} className="btn btn-primary" style={{ flex: 1, justifyContent: 'center', gap: 8 }}>
            <Plus size={16} /> Buat Simulasi Baru
          </button>
          <button
            onClick={() => {
              if (!scenario) return
              setTurnCount(0); setTotalScore(0)
              setMessages([{ role: 'ai', text: scenario.openingMessage }])
              setAppState('simulating')
            }}
            className="btn btn-secondary"
            style={{ flex: 1, justifyContent: 'center', gap: 8, border: '1px solid var(--border)' }}
          >
            <RotateCcw size={16} /> Ulang Skenario Ini
          </button>
        </div>
      </div>
    )
  }

  // ─────────────────────────────────────────────
  // RENDER: SIMULATING
  // ─────────────────────────────────────────────
  if (appState === 'simulating') {
    const levelCfg = LEVEL_CONFIG[selectedLevel!]
    const progressPct = Math.round((turnCount / MAX_TURNS) * 100)

    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 120px)', maxWidth: 720, margin: '0 auto' }}>
        {/* Header */}
        <div className="card" style={{ padding: '12px 16px', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
          <button onClick={() => setShowEndModal(true)} className="btn btn-ghost btn-sm" style={{ padding: 6, borderRadius: 8 }}>
            <ArrowLeft size={16} />
          </button>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
              <div style={{ width: 7, height: 7, borderRadius: '50%', background: levelCfg.color, boxShadow: `0 0 5px ${levelCfg.color}` }} />
              <span style={{ fontSize: 13, fontWeight: 800, textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                {scenario?.title || 'Simulasi Percakapan'}
              </span>
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
              Level {selectedLevel} · {scenario?.partnerName || 'Lawan Bicara'} · {turnCount}/{MAX_TURNS} giliran
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexShrink: 0 }}>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 11, color: levelCfg.color, fontWeight: 700 }}>{progressPct}%</div>
              <div style={{ width: 56, height: 4, borderRadius: 2, background: 'var(--border-subtle)', overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${progressPct}%`, background: levelCfg.color, borderRadius: 2, transition: 'width 0.4s ease' }} />
              </div>
            </div>
            <button
              onClick={() => setShowEndModal(true)}
              style={{ padding: '6px 12px', borderRadius: 8, border: '1px solid var(--error)', background: 'rgba(211,47,47,0.06)', color: 'var(--error)', fontSize: 12, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}
            >
              <StopCircle size={13} /> Akhiri
            </button>
          </div>
        </div>

        {/* Context bar */}
        {scenario && (
          <div style={{ padding: '8px 14px', borderRadius: 10, background: levelCfg.bg, border: `1px solid ${levelCfg.border}`, marginBottom: 10, flexShrink: 0 }}>
            <p style={{ fontSize: 12, color: 'var(--text-secondary)', margin: 0, lineHeight: 1.5 }}>
              <strong style={{ color: levelCfg.color }}>Konteks:</strong> {scenario.context}
            </p>
          </div>
        )}

        {/* Messages */}
        <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 14, paddingRight: 2 }}>
          {messages.map((msg, i) => {
            const isUser = msg.role === 'user'
            const fb = msg.feedback
            return (
              <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: isUser ? 'flex-end' : 'flex-start', gap: 5 }}>
                <span style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, padding: '0 4px' }}>
                  {isUser ? userName || 'Kamu' : (scenario?.partnerName || 'Lawan Bicara')}
                </span>
                <div style={{
                  maxWidth: '78%', padding: '11px 15px',
                  borderRadius: isUser ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                  background: isUser ? 'var(--brand-blue)' : 'var(--surface)',
                  color: isUser ? 'white' : 'var(--text-primary)',
                  border: isUser ? 'none' : '1px solid var(--border-subtle)',
                  fontSize: 14, lineHeight: 1.65, boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
                }}>
                  {msg.text}
                </div>
                {isUser && fb && fb.score > 0 && (
                  <div style={{ maxWidth: '78%', padding: '9px 13px', borderRadius: 10, background: 'var(--bg)', border: '1px solid var(--border-subtle)', fontSize: 12.5, lineHeight: 1.5 }}>
                    <div style={{ fontSize: 11, fontWeight: 800, color: getScoreLabel(fb.score).color, background: `${getScoreLabel(fb.score).color}15`, padding: '2px 8px', borderRadius: 999, display: 'inline-block', marginBottom: fb.note ? 6 : 0 }}>
                      Skor: {fb.score}
                    </div>
                    {fb.note && <p style={{ color: 'var(--text-secondary)', margin: '0 0 4px' }}>{fb.note}</p>}
                    {fb.alternatives && fb.alternatives.length > 0 && (
                      <div>
                        <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', margin: '4px 0 3px' }}>Alternatif:</p>
                        {fb.alternatives.map((alt, idx) => (
                          <p key={idx} style={{ margin: '2px 0', color: 'var(--text-secondary)' }}>- {alt}</p>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })}
          {apiLoading && (
            <div style={{ display: 'flex', alignItems: 'flex-start' }}>
              <div style={{ padding: '10px 16px', borderRadius: '16px 16px 16px 4px', background: 'var(--surface)', border: '1px solid var(--border-subtle)' }}>
                <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                  {[0, 1, 2].map(d => (
                    <div key={d} style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--text-muted)', animation: `bounce 1.2s ${d * 0.2}s ease-in-out infinite` }} />
                  ))}
                </div>
              </div>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>

        {/* Error */}
        {apiError && (
          <div style={{ padding: '9px 13px', borderRadius: 8, background: 'rgba(211,47,47,0.07)', border: '1px solid rgba(211,47,47,0.15)', display: 'flex', gap: 8, alignItems: 'center', marginTop: 8, flexShrink: 0 }}>
            <AlertCircle size={13} color="var(--error)" />
            <span style={{ fontSize: 12, color: 'var(--error)', flex: 1 }}>{apiError}</span>
            <button onClick={() => setApiError('')} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 2 }}><X size={13} color="var(--error)" /></button>
          </div>
        )}

        {/* Input */}
        <div style={{ marginTop: 10, display: 'flex', gap: 10, flexShrink: 0 }}>
          <textarea
            value={inputText}
            onChange={e => setInputText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Tulis balasan kamu di sini... (Enter untuk kirim)"
            disabled={apiLoading || turnCount >= MAX_TURNS}
            rows={2}
            style={{ flex: 1, padding: '11px 15px', borderRadius: 12, border: '1px solid var(--border)', background: 'var(--surface)', fontSize: 14, resize: 'none', lineHeight: 1.5, color: 'var(--text-primary)', outline: 'none', transition: 'border-color 0.2s', fontFamily: 'inherit' }}
          />
          <button
            onClick={sendMessage}
            disabled={!inputText.trim() || apiLoading || turnCount >= MAX_TURNS}
            style={{ width: 46, height: 46, borderRadius: 12, flexShrink: 0, alignSelf: 'flex-end', background: !inputText.trim() || apiLoading ? 'var(--border)' : 'var(--brand-blue)', color: 'white', border: 'none', cursor: !inputText.trim() || apiLoading ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background 0.2s' }}
          >
            <Send size={17} />
          </button>
        </div>
        <p style={{ fontSize: 11, color: 'var(--text-muted)', textAlign: 'center', marginTop: 6, flexShrink: 0 }}>
          Tekan Enter untuk kirim · Shift+Enter untuk baris baru
        </p>

        {/* END CHAT MODAL */}
        {showEndModal && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 24 }}>
            <div className="card" style={{ maxWidth: 420, width: '100%', padding: 32 }}>
              <h3 style={{ fontSize: 18, fontWeight: 900, margin: '0 0 14px' }}>Yakin mau akhiri chat?</h3>
              <p style={{ fontSize: 14, color: 'var(--text-secondary)', margin: '0 0 24px', lineHeight: 1.6 }}>
                Kalau kamu lanjut, simulasi ini bakal langsung diselesain dan hasilnya bakal muncul sekarang juga. Jadi pastiin dulu kamu udah mau selesai, karena setelah ini chat bakal ditutup dan hasilnya langsung tersimpan ke riwayat.
              </p>
              <div style={{ display: 'flex', gap: 10 }}>
                <button
                  onClick={() => setShowEndModal(false)}
                  className="btn btn-secondary"
                  style={{ flex: 1, justifyContent: 'center', border: '1px solid var(--border)' }}
                >
                  Batal
                </button>
                <button
                  onClick={endChatNow}
                  style={{ flex: 1, padding: '12px 20px', borderRadius: 12, background: 'var(--error)', color: 'white', border: 'none', cursor: 'pointer', fontSize: 14, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
                >
                  <StopCircle size={16} /> Akhiri Sekarang
                </button>
              </div>
            </div>
          </div>
        )}

        <style jsx>{`
          @keyframes bounce { 0%, 100% { transform: translateY(0); opacity: 0.4; } 50% { transform: translateY(-4px); opacity: 1; } }
          @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        `}</style>
      </div>
    )
  }

  // ─────────────────────────────────────────────
  // RENDER: SETUP (form data)
  // ─────────────────────────────────────────────
  if (appState === 'setup') {
    return (
      <div className="animate-fadein" style={{ maxWidth: 680, margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 24 }}>
          <button onClick={() => setAppState('intro')} className="btn btn-ghost btn-sm" style={{ padding: '6px 10px', borderRadius: 8, gap: 6, display: 'flex', alignItems: 'center' }}>
            <ArrowLeft size={16} /> Kembali
          </button>
          <h2 style={{ fontSize: 20, fontWeight: 900, margin: 0 }}>Siapkan Simulasi</h2>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 20, marginBottom: 32 }}>

          {/* Step 1: Gender */}
          <div className="card" style={{ padding: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
              <div style={{ width: 25, height: 25, borderRadius: '50%', background: 'var(--brand-blue)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 800, flexShrink: 0 }}>1</div>
              <h3 style={{ fontSize: 15, fontWeight: 800, margin: 0 }}>Pilih Gender Kamu</h3>
            </div>
            <p style={{ fontSize: 12.5, color: 'var(--text-secondary)', marginBottom: 14, lineHeight: 1.5 }}>
              Menentukan karakter lawan bicara yang akan dipasangkan sama kamu.
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              {([{ value: 'pria', label: 'Pria', partnerLabel: 'Lawan bicara wanita' }, { value: 'wanita', label: 'Wanita', partnerLabel: 'Lawan bicara pria' }] as { value: Gender; label: string; partnerLabel: string }[]).map(g => {
                const isSelected = selectedGender === g.value
                return (
                  <button key={g.value} onClick={() => setSelectedGender(g.value)}
                    style={{ padding: '15px 14px', borderRadius: 12, cursor: 'pointer', textAlign: 'center', background: isSelected ? 'rgba(2,134,195,0.08)' : 'var(--surface)', border: `2px solid ${isSelected ? 'var(--brand-blue)' : 'var(--border-subtle)'}`, transition: 'all 0.2s' }}>
                    <User size={22} color={isSelected ? 'var(--brand-blue)' : 'var(--text-muted)'} style={{ marginBottom: 6 }} />
                    <div style={{ fontSize: 14, fontWeight: 800, color: isSelected ? 'var(--brand-blue)' : 'var(--text-primary)', marginBottom: 3 }}>{g.label}</div>
                    <div style={{ fontSize: 11, color: isSelected ? 'var(--brand-blue)' : 'var(--text-muted)' }}>{g.partnerLabel}</div>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Step 2: Nama */}
          <div className="card" style={{ padding: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
              <div style={{ width: 25, height: 25, borderRadius: '50%', background: 'var(--brand-blue)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 800, flexShrink: 0 }}>2</div>
              <h3 style={{ fontSize: 15, fontWeight: 800, margin: 0 }}>Nama Panggilanmu</h3>
            </div>
            <p style={{ fontSize: 12.5, color: 'var(--text-secondary)', marginBottom: 14, lineHeight: 1.5 }}>
              Dipakai partner buat manggil kamu biar percakapannya lebih personal.
            </p>
            <div style={{ position: 'relative' }}>
              <User size={14} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input
                type="text"
                placeholder="Contoh: Raka, Sinta, Dio..."
                value={userName}
                onChange={e => setUserName(e.target.value)}
                maxLength={30}
                style={{ width: '100%', padding: '11px 12px 11px 36px', borderRadius: 10, border: `1px solid ${userName.trim().length >= 2 ? 'var(--brand-blue)' : 'var(--border)'}`, background: 'var(--surface)', fontSize: 14, color: 'var(--text-primary)', outline: 'none', boxSizing: 'border-box', transition: 'border-color 0.2s' }}
              />
            </div>
          </div>

          {/* Step 3: Gaya Bahasa */}
          <div className="card" style={{ padding: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
              <div style={{ width: 25, height: 25, borderRadius: '50%', background: 'var(--brand-blue)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 800, flexShrink: 0 }}>3</div>
              <h3 style={{ fontSize: 15, fontWeight: 800, margin: 0 }}>Gaya Bahasa</h3>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              {([{ value: 'santai', label: 'Santai & Gaul', icon: Smile, desc: 'Pakai "gue/lo", bahasa santai sehari-hari' }, { value: 'formal', label: 'Lebih Formal', icon: Handshake, desc: 'Pakai "aku/kamu", bahasa lebih sopan' }] as { value: 'santai' | 'formal'; label: string; icon: any; desc: string }[]).map(opt => {
                const isSelected = langStyle === opt.value
                return (
                  <button key={opt.value} onClick={() => setLangStyle(opt.value)}
                    style={{ padding: '13px 12px', borderRadius: 12, cursor: 'pointer', textAlign: 'left', background: isSelected ? 'rgba(2,134,195,0.08)' : 'var(--surface)', border: `2px solid ${isSelected ? 'var(--brand-blue)' : 'var(--border-subtle)'}`, transition: 'all 0.2s' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 7 }}>
                      <opt.icon size={19} color={isSelected ? 'var(--brand-blue)' : 'var(--text-muted)'} />
                      {isSelected && <CheckCircle size={13} color="var(--brand-blue)" />}
                    </div>
                    <div style={{ fontSize: 13, fontWeight: 800, color: isSelected ? 'var(--brand-blue)' : 'var(--text-primary)', marginBottom: 2 }}>{opt.label}</div>
                    <div style={{ fontSize: 11.5, color: 'var(--text-muted)', lineHeight: 1.4 }}>{opt.desc}</div>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Step 4: Level */}
          <div className="card" style={{ padding: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
              <div style={{ width: 25, height: 25, borderRadius: '50%', background: 'var(--brand-blue)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 800, flexShrink: 0 }}>4</div>
              <h3 style={{ fontSize: 15, fontWeight: 800, margin: 0 }}>Level Simulasi</h3>
            </div>
            <p style={{ fontSize: 12.5, color: 'var(--text-secondary)', marginBottom: 14, lineHeight: 1.5 }}>
              Skenario percakapan bakal dibuat otomatis setelah kamu pilih level.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {(['Pemula', 'Menengah', 'Lanjutan'] as Level[]).map(level => {
                const cfg = LEVEL_CONFIG[level]
                const isSelected = selectedLevel === level
                return (
                  <button key={level} onClick={() => setSelectedLevel(level)}
                    style={{ width: '100%', textAlign: 'left', padding: '15px 17px', borderRadius: 12, cursor: 'pointer', background: isSelected ? cfg.bg : 'var(--surface)', border: `2px solid ${isSelected ? cfg.color : 'var(--border-subtle)'}`, transition: 'all 0.2s', boxShadow: isSelected ? `0 0 0 3px ${cfg.color}12` : 'none' }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                      <div style={{ flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', width: 34, height: 34, borderRadius: 9, background: isSelected ? 'white' : cfg.bg, border: `1px solid ${cfg.border}`, marginTop: 2 }}>
                        <cfg.icon size={16} color={cfg.color} />
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
                          <span style={{ fontSize: 14, fontWeight: 800, color: isSelected ? cfg.color : 'var(--text-primary)' }}>{level}</span>
                          <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 999, background: `${cfg.color}15`, color: cfg.color }}>{cfg.badge}</span>
                        </div>
                        <p style={{ fontSize: 12.5, color: 'var(--text-secondary)', margin: '0 0 3px', lineHeight: 1.5 }}>{cfg.desc}</p>
                        {isSelected && <p style={{ fontSize: 11.5, color: cfg.color, margin: 0, fontStyle: 'italic', display: 'flex', alignItems: 'center', gap: 4 }}><Lightbulb size={11} color={cfg.color} /><span>{cfg.hint}</span></p>}
                      </div>
                      <div style={{ flexShrink: 0, marginTop: 2 }}>
                        {isSelected ? <CheckCircle size={15} color={cfg.color} /> : <div style={{ width: 15, height: 15, borderRadius: '50%', border: '2px solid var(--border)' }} />}
                      </div>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>
        </div>

        {/* Start Section */}
        <div className="card" style={{ padding: 24, marginBottom: 48 }}>
          {scenarioLoading ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, padding: '12px 0' }}>
              <Loader2 size={30} color="var(--brand-blue)" style={{ animation: 'spin 1s linear infinite' }} />
              <p style={{ fontSize: 13.5, color: 'var(--text-secondary)', fontWeight: 700, margin: 0 }}>
                Sistem lagi menyusun skenario percakapan untukmu...
              </p>
            </div>
          ) : (
            <>
              {scenarioError && (
                <div style={{ padding: '11px 15px', borderRadius: 10, background: 'rgba(211,47,47,0.06)', border: '1px solid rgba(211,47,47,0.15)', marginBottom: 16, display: 'flex', gap: 8, alignItems: 'center' }}>
                  <AlertCircle size={15} color="var(--error)" style={{ flexShrink: 0 }} />
                  <span style={{ fontSize: 12.5, color: 'var(--error)' }}>{scenarioError}</span>
                </div>
              )}
              <button onClick={startSimulation} disabled={!canStart}
                style={{ width: '100%', padding: '15px 24px', borderRadius: 14, background: canStart ? 'linear-gradient(135deg, var(--brand-blue), #0066aa)' : 'var(--border)', color: canStart ? 'white' : 'var(--text-muted)', border: 'none', cursor: canStart ? 'pointer' : 'not-allowed', fontSize: 15, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, transition: 'all 0.2s', boxShadow: canStart ? '0 4px 16px rgba(2,134,195,0.3)' : 'none' }}>
                <Zap size={17} />
                {canStart ? 'Mulai Simulasi' : 'Lengkapi data langkah 1-4 dulu ya'}
                {canStart && <ChevronRight size={17} />}
              </button>
              <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 5, borderTop: '1px solid var(--border-subtle)', paddingTop: 14 }}>
                {[
                  { done: !!selectedGender, label: 'Langkah 1: Pilih gender' },
                  { done: userName.trim().length >= 2, label: 'Langkah 2: Isi nama panggilan (min. 2 karakter)' },
                  { done: !!langStyle, label: 'Langkah 3: Pilih gaya bahasa' },
                  { done: !!selectedLevel, label: 'Langkah 4: Pilih level simulasi' }
                ].map(v => (
                  <div key={v.label} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    {v.done ? <CheckCircle size={12} color="var(--teal)" /> : <div style={{ width: 12, height: 12, borderRadius: '50%', border: '2px solid var(--border)', flexShrink: 0 }} />}
                    <span style={{ fontSize: 11.5, color: v.done ? 'var(--teal)' : 'var(--text-muted)' }}>{v.label}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
        <style jsx>{`
          @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        `}</style>
      </div>
    )
  }

  // ─────────────────────────────────────────────
  // RENDER: INTRO (default)
  // ─────────────────────────────────────────────
  return (
    <div className="animate-fadein" style={{ maxWidth: 680, margin: '0 auto' }}>

      {/* Top action bar */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginBottom: 24 }}>
        <button
          onClick={() => { fetchHistory(); setAppState('history') }}
          className="btn btn-secondary btn-sm"
          style={{ gap: 6, border: '1px solid var(--border)' }}
        >
          <History size={14} /> Riwayat Chat
        </button>
      </div>

      {/* Hero */}
      <div className="card" style={{ padding: '36px 32px', marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 }}>
          <div style={{ width: 52, height: 52, borderRadius: 14, background: 'linear-gradient(135deg, rgba(2,134,195,0.15), rgba(155,89,182,0.15))', border: '1px solid rgba(2,134,195,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <MessageCircle size={26} color="var(--brand-blue)" />
          </div>
          <div>
            <h1 style={{ fontSize: 24, fontWeight: 900, margin: 0, letterSpacing: '-0.02em' }}>Simulasi Percakapan</h1>
            <p style={{ fontSize: 13.5, color: 'var(--brand-blue)', margin: 0, fontWeight: 700 }}>Ruang Latihan Komunikasi Hubungan</p>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <p style={{ fontSize: 14, color: 'var(--text-secondary)', margin: 0, lineHeight: 1.75 }}>
            Pernah nggak sih kamu lagi debat atau bahas sesuatu sama pasangan, terus ujung-ujungnya malah nggak ketemu titik tengahnya karena salah satu pihak udah keburu emosi duluan? Atau kamu ngerasa mau bilang sesuatu yang penting, tapi bingung mulai dari mana biar nggak salah ucap? Nah, fitur <strong style={{ color: 'var(--text-primary)' }}>Simulasi Percakapan</strong> ini hadir buat bantu kamu latihan dulu sebelum kamu hadapi situasi aslinya.
          </p>

          <p style={{ fontSize: 14, color: 'var(--text-secondary)', margin: 0, lineHeight: 1.75 }}>
            Di sini, kamu bakal ngobrol sama partner virtual yang berperan sebagai lawan bicara dengan karakter yang realistis. Kalau kamu pilih jadi pria, partner kamu bakal jadi wanita, dan sebaliknya. Karakternya juga disesuaikan, mulai dari gaya bicara yang lebih ekspresif dan emosional kalau partner kamu wanita, sampai yang lebih kalem dan logis kalau partner kamu pria. Tujuannya biar skenario terasa natural, kayak ngobrol beneran, bukan kayak lagi ngisi soal ulangan.
          </p>

          <p style={{ fontSize: 14, color: 'var(--text-secondary)', margin: 0, lineHeight: 1.75 }}>
            Setiap kali kamu kirim pesan, sistem bakal langsung kasih penilaian. Kamu bakal tahu kalimat yang kamu pakai sudah seberapa asertif, empatik, dan dewasa, plus dikasih alternatif kalimat yang mungkin lebih pas untuk situasi itu. Jadi kamu nggak cuma asal jawab, tapi beneran belajar cara komunikasi yang lebih sehat dan konstruktif setiap giliran.
          </p>

          <p style={{ fontSize: 14, color: 'var(--text-secondary)', margin: 0, lineHeight: 1.75 }}>
            Kamu juga bisa pilih level kesulitan simulasi. Level Pemula buat situasi yang ringan dan sehari-hari. Level Menengah mulai ada dinamika emosi yang lebih rumit. Level Lanjutan untuk kamu yang udah siap menghadapi situasi konflik yang butuh kesabaran dan ketegasan ekstra. Skenario percakapannya dibuat otomatis oleh sistem berdasarkan level yang kamu pilih, jadi setiap sesi selalu beda dan relevan.
          </p>

          <p style={{ fontSize: 14, color: 'var(--text-secondary)', margin: 0, lineHeight: 1.75 }}>
            Semua hasil simulasi kamu tersimpan otomatis di riwayat chat. Kamu bisa buka lagi kapan aja buat lihat detail percakapan, skor yang kamu dapet, dan catatan per giliran. Kalau kamu ngerasa udah cukup sebelum sesi selesai, kamu juga bisa langsung akhiri chat kapan aja dan hasilnya tetap bakal tersimpan. Fleksibel, praktis, dan bisa diulang kapan pun kamu mau.
          </p>
        </div>
      </div>

      {/* Feature cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 14, marginBottom: 28 }} className="feature-grid">
        {[
          { icon: Sprout, color: '#17B897', bg: 'rgba(23,184,151,0.1)', title: 'Skenario Otomatis', desc: 'Sistem menyusun skenario unik tiap sesi berdasarkan level dan data kamu.' },
          { icon: MessageCircle, color: '#0286C3', bg: 'rgba(2,134,195,0.1)', title: 'Partner yang Realistis', desc: 'Lawan bicara punya karakter dan gaya bicara yang disesuaikan berdasarkan gender.' },
          { icon: Star, color: '#9B59B6', bg: 'rgba(155,89,182,0.1)', title: 'Penilaian Real-time', desc: 'Setiap pesan langsung dinilai dengan skor, catatan, dan alternatif kalimat yang lebih oke.' },
        ].map(f => (
          <div key={f.title} className="card" style={{ padding: 18 }}>
            <div style={{ width: 34, height: 34, borderRadius: 9, background: f.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 11 }}>
              <f.icon size={17} color={f.color} />
            </div>
            <h3 style={{ fontSize: 13, fontWeight: 800, margin: '0 0 5px', color: 'var(--text-primary)' }}>{f.title}</h3>
            <p style={{ fontSize: 12, color: 'var(--text-secondary)', margin: 0, lineHeight: 1.55 }}>{f.desc}</p>
          </div>
        ))}
      </div>

      {/* CTA */}
      <div className="card" style={{ padding: 28, textAlign: 'center', marginBottom: 48 }}>
        <p style={{ fontSize: 14, color: 'var(--text-secondary)', margin: '0 0 20px', lineHeight: 1.6 }}>
          Kalau kamu udah paham tujuannya dan siap latihan, klik tombol di bawah buat lanjut ke langkah pengisian data simulasi.
        </p>
        <button
          onClick={() => setAppState('setup')}
          style={{ padding: '15px 36px', borderRadius: 14, background: 'linear-gradient(135deg, var(--brand-blue), #0066aa)', color: 'white', border: 'none', cursor: 'pointer', fontSize: 16, fontWeight: 800, display: 'inline-flex', alignItems: 'center', gap: 10, boxShadow: '0 4px 20px rgba(2,134,195,0.35)', transition: 'all 0.2s' }}
        >
          <Play size={18} />
          Mulai
          <ChevronRight size={18} />
        </button>
        <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: '14px 0 0' }}>
          Kamu bisa akhiri simulasi kapan aja dan hasilnya tetap tersimpan di riwayat.
        </p>
      </div>

      <style jsx>{`
        @media (max-width: 600px) { .feature-grid { grid-template-columns: 1fr !important; } }
        @media (max-width: 640px) {
          .grid-feedback-blocks {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  )
}
