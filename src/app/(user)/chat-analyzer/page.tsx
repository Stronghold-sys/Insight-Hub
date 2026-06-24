'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  MessageSquare, ChevronRight, AlertTriangle,
  Copy, Check, RefreshCw, Shield, Info, Lock, X
} from 'lucide-react'

type AnalysisState = 'idle' | 'analyzing' | 'result'

interface ChatAnalysis {
  urgency: 'low' | 'medium' | 'high'
  tone: string
  intensity: number
  tension?: number
  passiveAggression?: number
  defensiveness?: number
  avoidance?: number
  needValidation?: number
  suggestedReply: string
  bestReply?: string
  rewrittenReply: string
}

export default function ChatAnalyzerPage() {
  const router = useRouter()
  const [chatInput, setChatInput] = useState('')
  const [analysisState, setAnalysisState] = useState<AnalysisState>('idle')
  const [copied, setCopied] = useState(false)
  const [analysisResult, setAnalysisResult] = useState<ChatAnalysis | null>(null)
  const [activeRewrite, setActiveRewrite] = useState<string | null>('lebihLembut')
  const [error, setError] = useState('')
  
  // Subscription States
  const [activePlan, setActivePlan] = useState('free')
  const [totalChats, setTotalChats] = useState(0)
  const [loadingPlan, setLoadingPlan] = useState(true)
  const [showUpgradeModal, setShowUpgradeModal] = useState(false)
  const [upgradeModalConfig, setUpgradeModalConfig] = useState({ title: '', message: '' })

  useEffect(() => {
    const initData = async () => {
      try {
        const billRes = await fetch('/api/user/billing')
        const billData = await billRes.json()
        if (billData.success && billData.activeSubscription) {
          setActivePlan(billData.activeSubscription.planId)
        }

        const dashRes = await fetch('/api/user/dashboard')
        const dashData = await dashRes.json()
        if (dashData.success && dashData.chatStats) {
          setTotalChats(dashData.chatStats.totalChats)
        }
      } catch (err) {
        console.error(err)
      } finally {
        setLoadingPlan(false)
      }
    }
    initData()
  }, [analysisState])

  const handleAnalyze = async () => {
    if (!chatInput.trim()) return

    // 1. Enforce Free Plan lock
    if (activePlan === 'free') {
      setUpgradeModalConfig({
        title: 'Fitur ini belum kebuka',
        message: 'Tenang, fitur ini cuma bisa dipakai di paket yang lebih tinggi. Upgrade dulu biar aksesnya langsung kebuka semua.'
      })
      setShowUpgradeModal(true)
      return
    }

    // 2. Enforce Basic Plan 10x limit
    if (activePlan === 'basic' && totalChats >= 10) {
      setUpgradeModalConfig({
        title: 'Batas Kuota Basic Tercapai!',
        message: 'Akses ditolak! Batas kuota analisis chat (10x) untuk paket Basic kamu sudah habis nih. Upgrade ke Premium biar bisa tanpa batas!'
      })
      setShowUpgradeModal(true)
      return
    }

    setAnalysisState('analyzing')
    setError('')
    
    try {
      const res = await fetch('/api/chat-analyzer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chatText: chatInput })
      })
      const data = await res.json()
      if (res.ok && data.success) {
        setAnalysisResult(data.analysis)
        setAnalysisState('result')
      } else {
        setAnalysisState('idle')
        setError(data.message || 'Gagal menganalisis chat.')
      }
    } catch (err) {
      console.error(err)
      setAnalysisState('idle')
      setError('Gagal menyambung ke server.')
    }
  }

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const getRiskColor = (risk: string) => {
    if (risk === 'high') return 'var(--error)'
    if (risk === 'medium') return 'var(--warning)'
    return 'var(--teal)'
  }

  const REWRITE_OPTIONS = [
    { id: 'lebihLembut', label: 'Lebih Lembut' },
    { id: 'lebihTegas', label: 'Lebih Tegas' },
    { id: 'lebihSingkat', label: 'Lebih Singkat' },
    { id: 'lebihHangat', label: 'Lebih Hangat' },
    { id: 'lebihDewasa', label: 'Lebih Dewasa' },
    { id: 'lebihNetral', label: 'Lebih Netral' },
    { id: 'lebihPercayaDiri', label: 'Lebih Percaya Diri' },
  ]

  const getRewriteContent = (type: string) => {
    if (!analysisResult) return ''
    try {
      const parsed = JSON.parse(analysisResult.rewrittenReply)
      return parsed[type] || parsed.lebihLembut || ''
    } catch (e) {
      if (type === 'lebihLembut') return analysisResult.rewrittenReply
      if (type === 'lebihTegas') return 'Gue ngerasa kita lagi kurang nyambung. Bisa kita bahas ini langsung nanti malam saja?'
      if (type === 'lebihSingkat') return 'Kita pause dulu ya, nanti lanjut kalau udah tenang.'
      if (type === 'lebihHangat') return 'Sayang, aku dengerin kamu kok. Kita obrolin pelan-pelan ya.'
      return analysisResult.rewrittenReply
    }
  }

  const isBasic = activePlan === 'basic'
  const isFree = activePlan === 'free'

  return (
    <div className="animate-fadein">
      <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 22, marginBottom: 4 }}>Chat Analyzer</h1>
          <p style={{ color: 'var(--text-secondary)', margin: 0 }}>
            Paste percakapan yang bikin kamu galau atau bingung. Kita baca polanya bareng.
          </p>
        </div>

        {/* Plan status indicator */}
        {!loadingPlan && (
          <div style={{
            background: isFree ? 'rgba(255,255,255,0.05)' : isBasic ? 'rgba(2,134,195,0.08)' : 'rgba(23,184,151,0.08)',
            border: `1px solid ${isFree ? 'var(--border)' : isBasic ? 'rgba(2,134,195,0.2)' : 'rgba(23,184,151,0.2)'}`,
            borderRadius: 8, padding: '6px 12px', fontSize: 12.5, display: 'flex', alignItems: 'center', gap: 8
          }}>
            <span style={{ fontWeight: 700, color: isFree ? 'var(--text-secondary)' : isBasic ? 'var(--brand-blue)' : 'var(--teal)' }}>
              Plan: {activePlan === 'admin' ? 'Admin' : activePlan.toUpperCase()}
            </span>
            {isBasic && (
              <span style={{ color: 'var(--text-muted)' }}>
                ({totalChats}/10 Kueri)
              </span>
            )}
            {!isFree && isBasic && totalChats >= 8 && (
              <Link href="/langganan" style={{ color: 'var(--warning)', fontWeight: 700, textDecoration: 'none', marginLeft: 4 }}>
                Upgrade
              </Link>
            )}
          </div>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: analysisState === 'result' ? '1fr 1fr' : '1fr', gap: 20 }}>
        {/* Input Panel */}
        <div>
          <div className="card" style={{ padding: 20, position: 'relative' }}>
            {isFree && (
              <div 
                onClick={() => {
                  setUpgradeModalConfig({
                    title: 'Fitur ini belum kebuka',
                    message: 'Tenang, fitur ini cuma bisa dipakai di paket yang lebih tinggi. Upgrade dulu biar aksesnya langsung kebuka semua.'
                  })
                  setShowUpgradeModal(true)
                }}
                style={{
                  position: 'absolute', inset: 0, background: 'rgba(9, 11, 16, 0.45)', backdropFilter: 'blur(4px)',
                  borderRadius: 16, zIndex: 10, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: 24,
                  cursor: 'pointer'
                }}
              >
                <Lock size={32} color="white" style={{ marginBottom: 12 }} />
                <h3 style={{ color: 'white', marginBottom: 4 }}>Fitur Terkunci</h3>
                <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: 13.5, maxWidth: 300, marginBottom: 16 }}>
                  Ketuk di sini atau upgrade paket kamu untuk mulai menggunakan AI Chat Analyzer.
                </p>
                <button className="btn btn-primary btn-sm">Upgrade Paket</button>
              </div>
            )}

            <h3 style={{ fontSize: 15, marginBottom: 4 }}>Paste chat di sini</h3>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 16 }}>
              Bisa dari WA, LINE, DM Instagram, iMessage, atau platform apa aja. Privacy kamu aman.
            </p>

            <textarea
              className="input"
              disabled={isFree}
              placeholder={`Contoh format:
Kamu: Hei, kita perlu ngobrol soal kemarin.
Dia: Soal apa? Udah selesai kan?
Kamu: Ya selesai sih, tapi gue masih...
Dia: Oke fine.
Kamu: Maksudnya?
Dia: Nggak papa. Terserah.`}
              value={chatInput}
              onChange={e => setChatInput(e.target.value)}
              rows={14}
              style={{ resize: 'vertical', lineHeight: 1.7, fontFamily: 'var(--font-mono)', fontSize: 13 }}
            />

            {error && (
              <div style={{
                background: 'rgba(211,47,47,0.08)',
                border: '1px solid var(--error)',
                borderRadius: 8,
                padding: '12px 16px',
                marginTop: 16,
                marginBottom: 16,
                color: 'var(--error)',
                fontSize: 13,
                display: 'flex',
                alignItems: 'center',
                gap: 8
              }}>
                <AlertTriangle size={16} />
                <span>{error}</span>
              </div>
            )}

            <div style={{ display: 'flex', gap: 12, marginTop: 16 }}>
              {analysisState === 'result' && (
                <button
                  onClick={() => { setAnalysisState('idle'); setChatInput(''); setAnalysisResult(null); setError('') }}
                  className="btn btn-secondary"
                >
                  <RefreshCw size={14} /> Analisis baru
                </button>
              )}
              <button
                onClick={handleAnalyze}
                disabled={!chatInput.trim() || analysisState === 'analyzing' || isFree}
                className="btn btn-primary"
                style={{ flex: 1, justifyContent: 'center', opacity: chatInput.trim() && !isFree ? 1 : 0.5 }}
              >
                {analysisState === 'analyzing' ? (
                  <>
                    <div className="spinner spinner-sm" style={{ borderColor: 'rgba(255,255,255,0.3)', borderTopColor: 'white' }} />
                    Lagi dianalisis...
                  </>
                ) : (
                  <>
                    <MessageSquare size={14} />
                    Analisis Chat
                  </>
                )}
              </button>
            </div>

            {/* Privacy notice */}
            <div style={{ display: 'flex', gap: 8, marginTop: 12, padding: '10px 12px', borderRadius: 6, background: 'var(--bg)', border: '1px solid var(--border-subtle)' }}>
              <Shield size={14} color="var(--teal)" style={{ flexShrink: 0, marginTop: 1 }} />
              <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: 0, lineHeight: 1.5 }}>
                Percakapan yang kamu masukkan diproses secara privat dan disimpan aman secara lokal di perangkatmu.
              </p>
            </div>
          </div>

          {/* Loading animation */}
          {analysisState === 'analyzing' && (
            <div className="card animate-fadein" style={{ padding: 32, marginTop: 16, textAlign: 'center' }}>
              <div style={{
                width: 64, height: 64, borderRadius: '50%',
                background: 'rgba(2,134,195,0.1)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                margin: '0 auto 20px', animation: 'pulse-soft 1.5s ease infinite',
              }}>
                <MessageSquare size={28} color="var(--brand-blue)" />
              </div>
              <h3 style={{ marginBottom: 8 }}>Kita lagi baca polanya...</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: 13 }}>
                Deteksi tone, emosi, sinyal tersembunyi, dan risiko konflik.
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 20, maxWidth: 280, margin: '20px auto 0' }}>
                {['Membaca tone percakapan', 'Deteksi emosi dominan', 'Analisis passive aggression', 'Generate rekomendasi'].map((step, i) => (
                  <div key={step} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--brand-blue)', animation: `pulse-soft ${1 + i * 0.3}s ease infinite` }} />
                    <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{step}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Result Panel */}
        {analysisState === 'result' && analysisResult && (
          <div className="animate-slide-right" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Risk level banner */}
            <div style={{
              padding: '16px 20px', borderRadius: 8,
              background: analysisResult.urgency === 'high' ? 'rgba(211,47,47,0.08)' : 'rgba(245,166,35,0.08)',
              border: `1px solid ${getRiskColor(analysisResult.urgency)}`,
              display: 'flex', gap: 12, alignItems: 'flex-start',
            }}>
              <AlertTriangle size={18} color={getRiskColor(analysisResult.urgency)} style={{ flexShrink: 0, marginTop: 1 }} />
              <div>
                <p style={{ fontWeight: 700, fontSize: 14, color: getRiskColor(analysisResult.urgency), margin: '0 0 4px' }}>
                  Risiko: {analysisResult.urgency === 'high' ? 'Tinggi' : analysisResult.urgency === 'medium' ? 'Sedang' : 'Rendah'}
                </p>
                <p style={{ fontSize: 13, color: 'var(--text-primary)', margin: 0, lineHeight: 1.5 }}>
                  Tone terdeteksi: <strong>{analysisResult.tone}</strong>. Intensitas konflik bernilai {analysisResult.intensity}/10.
                </p>
              </div>
            </div>

            {/* Indicators */}
            <div className="card" style={{ padding: 20 }}>
              <h3 style={{ fontSize: 14, marginBottom: 16 }}>Indikator Percakapan</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {[
                  { label: 'Ketegangan', value: analysisResult.tension ?? (analysisResult.intensity * 10), color: 'var(--error)' },
                  { label: 'Pasif-agresif', value: analysisResult.passiveAggression ?? 10, color: 'var(--warning)' },
                  { label: 'Defensif', value: analysisResult.defensiveness ?? 15, color: 'var(--warning)' },
                  { label: 'Menghindar', value: analysisResult.avoidance ?? 20, color: 'var(--brand-blue)' },
                  { label: 'Butuh validasi', value: analysisResult.needValidation ?? 30, color: '#9B59B6' },
                ].map(indicator => (
                  <div key={indicator.label}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                      <span style={{ fontSize: 13, color: 'var(--text-primary)', fontWeight: 500 }}>{indicator.label}</span>
                      <span style={{ fontSize: 13, fontWeight: 700, color: indicator.color }}>{indicator.value}%</span>
                    </div>
                    <div className="progress-bar">
                      <div className="progress-fill" style={{ width: `${indicator.value}%`, background: indicator.color, transition: 'width 600ms ease' }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Suggestions */}
            <div className="card" style={{ padding: 20 }}>
              <h3 style={{ fontSize: 14, marginBottom: 12 }}>Saran Langkah Selanjutnya</h3>
              <div style={{ display: 'flex', gap: 10, padding: '10px 12px', borderRadius: 8, background: 'var(--bg)', border: '1px solid var(--border-subtle)' }}>
                <div style={{ width: 20, height: 20, borderRadius: '50%', background: 'rgba(2,134,195,0.15)', color: 'var(--brand-blue)', fontSize: 11, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  1
                </div>
                <p style={{ fontSize: 13, color: 'var(--text-primary)', margin: 0, lineHeight: 1.6 }}>
                  {analysisResult.suggestedReply}
                </p>
              </div>
            </div>

            {/* Rekomendasi Balasan Terbaik */}
            {analysisResult.bestReply && (
              <div className="card" style={{ padding: 20 }}>
                <h3 style={{ fontSize: 14, marginBottom: 12 }}>Rekomendasi Balasan</h3>
                <div style={{
                  padding: '14px 16px',
                  borderRadius: 8,
                  background: 'rgba(23,184,151,0.04)',
                  border: '1px solid rgba(23,184,151,0.2)',
                  position: 'relative'
                }}>
                  <p style={{ fontSize: 14, color: 'var(--text-primary)', margin: '0 0 12px', lineHeight: 1.7, paddingRight: 40 }}>
                    {analysisResult.bestReply}
                  </p>
                  <button
                    onClick={() => handleCopy(analysisResult.bestReply || '')}
                    style={{
                      position: 'absolute', top: 12, right: 12,
                      padding: 6, borderRadius: 6, border: '1px solid var(--border-subtle)',
                      background: 'var(--surface)', cursor: 'pointer',
                      color: copied ? 'var(--teal)' : 'var(--text-muted)',
                      display: 'flex', alignItems: 'center',
                    }}
                    title="Salin Balasan"
                  >
                    {copied ? <Check size={14} /> : <Copy size={14} />}
                  </button>
                </div>
              </div>
            )}

            {/* Rewrite section */}
            <div className="card" style={{ padding: 20 }}>
              <h3 style={{ fontSize: 14, marginBottom: 4 }}>Versi Rewrite Balasan</h3>
              <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 16 }}>Pilih tone yang mau kamu coba:</p>

              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
                {REWRITE_OPTIONS.map(opt => (
                  <button
                    key={opt.id}
                    onClick={() => setActiveRewrite(opt.id)}
                    className="btn btn-sm"
                    style={{
                      background: activeRewrite === opt.id ? 'var(--brand-blue)' : 'var(--surface)',
                      color: activeRewrite === opt.id ? 'white' : 'var(--text-secondary)',
                      borderColor: activeRewrite === opt.id ? 'var(--brand-blue)' : 'var(--border)',
                    }}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>

              {activeRewrite && (
                <div className="animate-fadein" style={{ padding: '14px 16px', borderRadius: 8, background: 'var(--bg)', border: '1px solid var(--border)', position: 'relative' }}>
                  <p style={{ fontSize: 14, color: 'var(--text-primary)', margin: '0 0 12px', lineHeight: 1.7, paddingRight: 40 }}>
                    {getRewriteContent(activeRewrite)}
                  </p>
                  <button
                    onClick={() => handleCopy(getRewriteContent(activeRewrite))}
                    style={{
                      position: 'absolute', top: 12, right: 12,
                      padding: 6, borderRadius: 6, border: '1px solid var(--border-subtle)',
                      background: 'var(--surface)', cursor: 'pointer',
                      color: copied ? 'var(--teal)' : 'var(--text-muted)',
                      display: 'flex', alignItems: 'center',
                    }}
                    title="Copy"
                  >
                    {copied ? <Check size={14} /> : <Copy size={14} />}
                  </button>
                </div>
              )}
            </div>

            {/* Disclaimer */}
            <div style={{ display: 'flex', gap: 8, padding: '12px 14px', borderRadius: 8, background: 'var(--bg)', border: '1px solid var(--border-subtle)' }}>
              <Info size={14} color="var(--text-muted)" style={{ flexShrink: 0, marginTop: 1 }} />
              <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: 0, lineHeight: 1.6 }}>
                Analisis ini diproses oleh mesin analisis lokal kamu secara instan dan aman.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Upgrade warning modal */}
      {showUpgradeModal && (
        <div
          onClick={() => setShowUpgradeModal(false)}
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
              onClick={() => setShowUpgradeModal(false)}
              style={{ position: 'absolute', top: 16, right: 16, border: 'none', background: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 4 }}
              title="Tutup"
              aria-label="Tutup"
            >
              <X size={18} />
            </button>
            <div style={{
              width: '64px', height: '64px', borderRadius: '50%', background: 'rgba(2, 134, 195, 0.1)',
              color: 'var(--brand-blue)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '20px'
            }}>
              <Lock size={28} />
            </div>
            <h3 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 10px 0' }}>
              {upgradeModalConfig.title}
            </h3>
            <p style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: 1.6, margin: '0 0 24px 0' }}>
              {upgradeModalConfig.message}
            </p>
            <div style={{ display: 'flex', gap: 12, width: '100%' }}>
              <button
                className="btn btn-secondary"
                onClick={() => setShowUpgradeModal(false)}
                style={{ flex: 1, justifyContent: 'center', padding: '12px', fontSize: '14px', fontWeight: 600, borderRadius: '10px' }}
              >
                Nanti dulu
              </button>
              <button
                className="btn btn-primary"
                onClick={() => {
                  setShowUpgradeModal(false)
                  router.push('/langganan')
                }}
                style={{
                  flex: 1, justifyContent: 'center', padding: '12px', fontSize: '14px', fontWeight: 700, borderRadius: '10px',
                  background: 'linear-gradient(135deg, var(--brand-blue), #1D4ED8)', border: 'none', color: 'white',
                  boxShadow: '0 4px 12px rgba(2, 134, 195, 0.25)'
                }}
              >
                Upgrade sekarang
              </button>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        @media (max-width: 1023px) {
          div { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  )
}
