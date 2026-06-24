'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import {
  ChevronLeft, ChevronRight, CheckCircle, AlertCircle,
  Clock, BarChart2, Info, ArrowRight, Play, RefreshCw, Send, Check
} from 'lucide-react'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, Cell, ResponsiveContainer
} from 'recharts'

type QuizState = 'intro' | 'generating' | 'quiz' | 'analyzing' | 'result'

export default function AssessmentDetailPage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string

  const [state, setState] = useState<QuizState>('intro')
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [currentQ, setCurrentQ] = useState(0)
  const [totalQuestions, setTotalQuestions] = useState(15)
  const [assessmentTitle, setAssessmentTitle] = useState('')
  const [dimensions, setDimensions] = useState<any[]>([])

  // Quiz active question state
  const [question, setQuestion] = useState<any>(null)
  const [loadingQuestion, setLoadingQuestion] = useState(false)

  // Question answers state
  const [selectedOption, setSelectedOption] = useState<string | null>(null) // single choice
  const [selectedOptions, setSelectedOptions] = useState<string[]>([]) // multi-select
  const [scaleVal, setScaleVal] = useState<number>(3) // scale / slider
  const [textVal, setTextVal] = useState<string>('') // text inputs
  const [rankingOrder, setRankingOrder] = useState<string[]>([]) // ranking order of option IDs

  // Final analysis results
  const [analysisResult, setAnalysisResult] = useState<any>(null)
  const [loadingAction, setLoadingAction] = useState(false)

  // Custom Error Modal state
  const [errorModal, setErrorModal] = useState<{
    isOpen: boolean
    title: string
    message: string
    details?: string
  }>({
    isOpen: false,
    title: '',
    message: '',
    details: ''
  })

  // Parse & display friendly errors
  const showError = (rawMessage: string, defaultTitle: string = 'Terjadi Kesalahan') => {
    let title = defaultTitle
    let friendlyMessage = 'Maaf, terjadi kesalahan teknis saat memuat data. Silakan coba lagi beberapa saat lagi.'

    const msgLower = rawMessage.toLowerCase()
    if (
      rawMessage.includes('429') ||
      msgLower.includes('quota') ||
      msgLower.includes('rate limit') ||
      msgLower.includes('exceeded')
    ) {
      title = 'Batas Kuota Terlampaui'
      friendlyMessage = 'Sistem kami sedang mengalami lalu lintas yang tinggi atau batas kuota layanan telah habis. Harap tunggu beberapa menit sebelum mencoba lagi.'
    } else if (
      rawMessage.includes('500') ||
      msgLower.includes('database') ||
      msgLower.includes('mysql') ||
      msgLower.includes('xampp')
    ) {
      title = 'Kendala Koneksi Server'
      friendlyMessage = 'Sistem gagal memproses atau menyimpan data kuis. Pastikan koneksi server lokal Anda berjalan dengan benar.'
    } else if (
      msgLower.includes('fetch') ||
      msgLower.includes('koneksi') ||
      msgLower.includes('network') ||
      msgLower.includes('failed to fetch')
    ) {
      title = 'Koneksi Bermasalah'
      friendlyMessage = 'Gagal terhubung ke server. Silakan periksa koneksi internet Anda dan coba lagi.'
    }

    setErrorModal({
      isOpen: true,
      title,
      message: friendlyMessage
    })
  }

  // 1. Check for existing active session or completed result on page mount
  useEffect(() => {
    const checkActiveSession = async () => {
      try {
        const res = await fetch(`/api/assessment/resume?assessmentType=${id}`)
        const data = await res.json()
        if (data.success && data.hasSession) {
          setSessionId(data.sessionId)
          setCurrentQ(data.currentQuestionIndex)
          setTotalQuestions(data.totalQuestions)
          // Fetch assessment metadata to display correct title
          const listRes = await fetch('/api/assessment/list')
          const listData = await listRes.json()
          if (listData.success) {
            const currentItem = listData.assessments.find((a: any) => a.id === id)
            if (currentItem) {
              setAssessmentTitle(currentItem.title)
            }
          }
        } else {
          // No active session, check if there is a completed result
          const resultRes = await fetch(`/api/assessment/result?assessmentType=${id}`)
          const resultData = await resultRes.json()
          if (resultData.success && resultData.result) {
            setSessionId(resultData.result.sessionId)
            setAnalysisResult(resultData.result)
            setAssessmentTitle(resultData.result.dominant ? `Hasil ${id}` : 'Hasil Assessment')
            setState('result')
          }
          
          // Fetch assessment title from list in any case
          const listRes = await fetch('/api/assessment/list')
          const listData = await listRes.json()
          if (listData.success) {
            const currentItem = listData.assessments.find((a: any) => a.id === id)
            if (currentItem) {
              setAssessmentTitle(currentItem.title)
            }
          }
        }
      } catch (err) {
        console.error('Error checking active session or result:', err)
      }
    }
    checkActiveSession()
  }, [id])

  // 2. Start a fresh session
  const startSession = async () => {
    setState('generating')
    try {
      const res = await fetch('/api/assessment/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ assessmentType: id })
      })
      const data = await res.json()
      if (data.success) {
        setSessionId(data.sessionId)
        setTotalQuestions(data.totalQuestions)
        setAssessmentTitle(data.title)
        setDimensions(data.dimensions)
        setCurrentQ(0)
        setState('quiz')
      } else {
        setState('intro')
        showError(data.message || 'Gagal memulai assessment.', 'Gagal Memulai Assessment')
      }
    } catch (err: any) {
      console.error(err)
      setState('intro')
      showError(err?.message || 'Koneksi bermasalah.', 'Koneksi Bermasalah')
    }
  }

  // 3. Resume the detected session
  const resumeSession = () => {
    setState('quiz')
  }

  // 4. Fetch question on index change
  useEffect(() => {
    if (state !== 'quiz' || !sessionId) return

    const loadQuestion = async () => {
      setLoadingQuestion(true)
      // Reset active values
      setSelectedOption(null)
      setSelectedOptions([])
      setScaleVal(3)
      setTextVal('')
      setRankingOrder([])

      try {
        const res = await fetch(`/api/assessment/generate-question?sessionId=${sessionId}&questionIndex=${currentQ}`)
        const data = await res.json()
        if (data.success && data.question) {
          setQuestion(data.question)
          
          // Prepopulate if previously answered
          if (data.question.savedAnswer) {
            const saved = data.question.savedAnswer
            if (data.question.question_type === 'multiple_choice_multi') {
              // Extract all checked options in answers array
              // Since we delete & re-insert multiple rows, let's fetch them
              // We'll set the options from optionId
              setSelectedOptions([saved.optionId])
            } else if (data.question.question_type.startsWith('scale_') || data.question.question_type === 'slider') {
              setScaleVal(Number(saved.textAnswer || 3))
            } else if (data.question.question_type.startsWith('text_')) {
              setTextVal(saved.textAnswer || '')
            } else if (data.question.question_type === 'ranking') {
              try {
                setRankingOrder(JSON.parse(saved.textAnswer || '[]'))
              } catch {
                setRankingOrder([])
              }
            } else {
              setSelectedOption(saved.optionId)
            }
          }
        }
      } catch (err) {
        console.error(err)
      } finally {
        setLoadingQuestion(false)
      }
    }
    loadQuestion()
  }, [currentQ, sessionId, state])

  // 5. Handle answer inputs
  const handleSaveAndNext = async () => {
    if (!sessionId || !question) return
    setLoadingAction(true)

    try {
      let payload: any = {
        sessionId,
        questionId: question.id
      }

      if (question.question_type === 'multiple_choice_multi') {
        payload.optionIds = selectedOptions
      } else if (question.question_type.startsWith('scale_') || question.question_type === 'slider') {
        payload.textAnswer = String(scaleVal)
      } else if (question.question_type.startsWith('text_')) {
        payload.textAnswer = textVal
      } else if (question.question_type === 'ranking') {
        payload.textAnswer = JSON.stringify(rankingOrder)
      } else {
        payload.optionId = selectedOption
      }

      // Save answer API
      const saveRes = await fetch('/api/assessment/save-answer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      if (!saveRes.ok) throw new Error('Gagal menyimpan jawaban')

      if (currentQ < totalQuestions - 1) {
        // Navigate index forward
        const navRes = await fetch('/api/assessment/next-question', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sessionId, direction: 'next' })
        })
        const navData = await navRes.json()
        if (navData.success) {
          setCurrentQ(navData.currentQuestionIndex)
        }
      } else {
        // Last question answered - call finish and start analysis
        setState('analyzing')
        const finishRes = await fetch('/api/assessment/finish', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sessionId })
        })

        if (!finishRes.ok) throw new Error('Gagal menyelesaikan assessment')

        // Trigger AI analysis
        const analyzeRes = await fetch('/api/assessment/analyze', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sessionId })
        })
        const analyzeData = await analyzeRes.json()
        if (analyzeData.success) {
          setAnalysisResult(analyzeData.result)
          setState('result')
        } else {
          throw new Error(analyzeData.message || 'Analisis gagal')
        }
      }
    } catch (err: any) {
      console.error(err)
      showError(err.message || 'Terjadi kesalahan sistem pengerjaan.', 'Sistem Pengerjaan Bermasalah')
      setState('quiz')
    } finally {
      setLoadingAction(false)
    }
  }

  const handlePrev = async () => {
    if (currentQ === 0 || !sessionId) return
    try {
      const navRes = await fetch('/api/assessment/next-question', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, direction: 'prev' })
      })
      const navData = await navRes.json()
      if (navData.success) {
        setCurrentQ(navData.currentQuestionIndex)
      }
    } catch (err) {
      console.error(err)
    }
  }

  // Helper validation to see if "Lanjut" should be active
  const isAnswerValid = () => {
    if (!question) return false
    if (question.question_type === 'multiple_choice_multi') {
      return selectedOptions.length > 0
    }
    if (question.question_type.startsWith('text_')) {
      return textVal.trim().length > 2
    }
    if (question.question_type === 'ranking') {
      return rankingOrder.length === question.options.length
    }
    if (question.question_type.startsWith('scale_') || question.question_type === 'slider') {
      return true
    }
    return selectedOption !== null
  }

  // Dynamic ranking toggle
  const toggleRank = (optId: string) => {
    if (rankingOrder.includes(optId)) {
      setRankingOrder(prev => prev.filter(id => id !== optId))
    } else {
      setRankingOrder(prev => [...prev, optId])
    }
  }

  // ==========================================
  // VIEW RENDERER
  // ==========================================
  const renderMainContent = () => {
    // ==========================================
    // VIEW: INTRO STATE
    // ==========================================
    if (state === 'intro') {
      return (
        <div className="animate-fadein" style={{ maxWidth: 640, margin: '0 auto' }}>
          <Link href="/assessment" className="btn btn-ghost btn-sm" style={{ marginBottom: 24 }}>
            <ChevronLeft size={14} /> Balik ke Assessment Center
          </Link>

          <div className="card" style={{ padding: 40, textAlign: 'center' }}>
            <div style={{
              width: 72, height: 72, borderRadius: 16,
              background: 'rgba(2,134,195,0.08)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 24px',
              fontSize: 28, fontWeight: 800, color: 'var(--brand-blue)',
            }}>
              <BarChart2 size={32} />
            </div>

            <h1 style={{ fontSize: 24, marginBottom: 12 }}>{assessmentTitle || 'Dynamic AI Assessment'}</h1>
            <p style={{ color: 'var(--text-secondary)', marginBottom: 32, lineHeight: 1.7, maxWidth: 480, margin: '0 auto 32px' }}>
              Rangkaian tes dirancang dinamis oleh mesin analisis kepribadian untuk memetakan karakter, pola komunikasi, dan kecenderungan relasi Anda.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 32 }}>
              {[
                { icon: Clock, label: '6-8 menit', sublabel: 'Estimasi pengerjaan' },
                { icon: BarChart2, label: '15 pertanyaan', sublabel: 'Variasi jenis soal' },
                { icon: CheckCircle, label: 'Kalkulasi AI', sublabel: 'Hasil personal' },
              ].map(({ icon: Icon, label, sublabel }) => (
                <div key={sublabel} style={{
                  padding: 16, borderRadius: 8, background: 'var(--bg)',
                  border: '1px solid var(--border-subtle)', textAlign: 'center',
                }}>
                  <Icon size={18} color="var(--brand-blue)" style={{ marginBottom: 8 }} />
                  <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 2px' }}>{label}</p>
                  <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: 0 }}>{sublabel}</p>
                </div>
              ))}
            </div>

            {sessionId ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <button
                  onClick={resumeSession}
                  className="btn btn-primary"
                  style={{ width: '100%', justifyContent: 'center', padding: '14px 24px', fontSize: 16, fontWeight: 700 }}
                >
                  Lanjutkan pengerjaan ({Math.round((currentQ / totalQuestions) * 100)}%)
                  <ChevronRight size={18} />
                </button>
                <button
                  onClick={startSession}
                  className="btn btn-ghost"
                  style={{ color: 'var(--text-muted)' }}
                >
                  Ulangi dari awal
                </button>
              </div>
            ) : (
              <button
                onClick={startSession}
                className="btn btn-primary"
                style={{ width: '100%', justifyContent: 'center', padding: '14px 24px', fontSize: 16, fontWeight: 700 }}
              >
                Mulai sekarang
                <ChevronRight size={18} />
              </button>
            )}
          </div>
        </div>
      )
    }

    // ==========================================
    // VIEW: GENERATING QUESTIONS STATE
    // ==========================================
    if (state === 'generating') {
      return (
        <div className="animate-fadein" style={{ maxWidth: 480, margin: '80px auto', textAlign: 'center' }}>
          <div style={{
            width: 80, height: 80, borderRadius: '50%',
            background: 'rgba(2,134,195,0.08)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 24px', animation: 'pulse-soft 1.5s ease infinite',
          }}>
            <RefreshCw size={32} className="animate-spin-slow" color="var(--brand-blue)" />
          </div>
          <h2 style={{ marginBottom: 12 }}>Merancang Soal AI...</h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: 32, lineHeight: 1.6 }}>
            Harap tunggu, mesin analisis sedang merangkai 15 pertanyaan unik dan khusus untuk Anda. Ini memakan waktu 5-8 detik.
          </p>
          <div className="progress-bar" style={{ maxWidth: 300, margin: '0 auto' }}>
            <div className="progress-fill animate-pulse-soft" style={{ width: '80%', background: 'var(--brand-blue)' }} />
          </div>
        </div>
      )
    }

    // ==========================================
    // VIEW: ANALYZING RESULTS STATE
    // ==========================================
    if (state === 'analyzing') {
      return (
        <div className="animate-fadein" style={{ maxWidth: 480, margin: '80px auto', textAlign: 'center' }}>
          <div style={{
            width: 80, height: 80, borderRadius: '50%',
            background: 'rgba(23,184,151,0.08)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 24px', animation: 'pulse-soft 1.5s ease infinite',
          }}>
            <BarChart2 size={32} color="var(--teal)" />
          </div>
          <h2 style={{ marginBottom: 12 }}>Membaca Pola Karakter...</h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: 32, lineHeight: 1.6 }}>
            Mesin analisis sedang menghitung kecenderungan dimensi, mendeteksi konsistensi tanggapan, dan merumuskan saran personal khusus.
          </p>
          <div className="progress-bar" style={{ maxWidth: 300, margin: '0 auto' }}>
            <div className="progress-fill animate-pulse-soft" style={{ width: '90%', background: 'var(--teal)' }} />
          </div>
        </div>
      )
    }

    // ==========================================
    // VIEW: RESULT STATE
    // ==========================================
    if (state === 'result' && analysisResult) {
      const scoresData = Object.entries(analysisResult.scores).map(([name, score]: [string, any]) => {
        // Format key name to start uppercase or split camelCase
        const formattedName = name.replace(/([A-Z])/g, ' $1').replace(/^./, (str: string) => str.toUpperCase())
        return {
          name: formattedName,
          score: score
        }
      }).sort((a, b) => b.score - a.score)

      return (
        <div className="animate-fadein" style={{ maxWidth: 720, margin: '0 auto' }}>
          {/* Header result */}
          <div className="card" style={{ padding: 32, marginBottom: 20, position: 'relative', overflow: 'hidden' }}>
            <div style={{
              position: 'absolute', top: 0, right: 0, width: 200, height: 200,
              borderRadius: '50%', background: 'rgba(2,134,195,0.03)',
              transform: 'translate(40%, -40%)',
            }} />

            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 20, position: 'relative' }}>
              <div style={{
                width: 64, height: 64, borderRadius: 14,
                background: 'rgba(2,134,195,0.08)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 24, fontWeight: 800, color: 'var(--brand-blue)',
                flexShrink: 0,
              }}>
                <CheckCircle size={28} color="var(--brand-blue)" />
              </div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                  <CheckCircle size={16} color="var(--teal)" />
                  <span style={{ fontSize: 12, color: 'var(--teal)', fontWeight: 600 }}>Analisis AI Selesai</span>
                </div>
                <h2 style={{ fontSize: 22, marginBottom: 4 }}>Hasil {assessmentTitle}</h2>
                <p style={{ color: 'var(--text-secondary)', margin: 0, fontSize: 14 }}>
                  Karakter Dominan: <strong style={{ color: 'var(--brand-blue)' }}>{analysisResult.dominant}</strong>
                </p>
              </div>
            </div>

            {/* Confidence & Data Quality */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 24 }}>
              <div style={{ padding: '12px 16px', borderRadius: 8, background: 'var(--bg)', border: '1px solid var(--border-subtle)' }}>
                <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: '0 0 4px', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>Confidence Score</p>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 22, fontWeight: 800, color: 'var(--teal)' }}>{analysisResult.confidenceScore}%</span>
                  <div className="progress-bar" style={{ flex: 1 }}>
                    <div className="progress-fill progress-fill-teal" style={{ width: `${analysisResult.confidenceScore}%` }} />
                  </div>
                </div>
              </div>
              <div style={{ padding: '12px 16px', borderRadius: 8, background: 'var(--bg)', border: '1px solid var(--border-subtle)' }}>
                <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: '0 0 4px', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>Data Quality</p>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 22, fontWeight: 800, color: 'var(--brand-blue)' }}>{analysisResult.dataQuality}%</span>
                  <div className="progress-bar" style={{ flex: 1 }}>
                    <div className="progress-fill" style={{ width: `${analysisResult.dataQuality}%` }} />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Summary Description */}
          <div className="card" style={{ padding: 24, marginBottom: 20 }}>
            <h3 style={{ fontSize: 15, marginBottom: 12 }}>Ringkasan Hasil</h3>
            <p style={{ color: 'var(--text-primary)', fontSize: 14, lineHeight: 1.7, margin: 0 }}>
              {analysisResult.summary}
            </p>
          </div>

          {/* Chart */}
          <div className="card" style={{ padding: 24, marginBottom: 20 }}>
            <h3 style={{ fontSize: 15, marginBottom: 16 }}>Breakdown Kategori</h3>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={scoresData} layout="vertical" margin={{ left: 100, right: 20 }}>
                <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 11, fill: '#8DA4BE' }} axisLine={false} tickLine={false} />
                <YAxis dataKey="name" type="category" tick={{ fontSize: 12, fill: '#536171' }} axisLine={false} tickLine={false} width={100} />
                <Tooltip
                  contentStyle={{ background: 'var(--surface)', border: '1px solid var(--border-subtle)', borderRadius: 6, fontSize: 12 }}
                  formatter={(v: any) => [`${v}%`, 'Skor']}
                />
                <Bar dataKey="score" radius={[0, 4, 4, 0]}>
                  {scoresData.map((entry, i) => (
                    <Cell key={i} fill={i === 0 ? 'var(--brand-blue)' : 'var(--text-muted)'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Insight Details */}
          <div className="card" style={{ padding: 24, marginBottom: 20 }}>
            <h3 style={{ fontSize: 15, marginBottom: 16 }}>Penjelasan Dimensi</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {analysisResult.insights.map((insight: any, i: number) => (
                <div key={i} style={{ padding: '14px 16px', borderRadius: 8, border: '1px solid var(--border-subtle)' }}>
                  <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', display: 'block', marginBottom: 6 }}>
                    {insight.title}
                  </span>
                  <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: 0, lineHeight: 1.6 }}>
                    {insight.description}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Saran Praktis */}
          <div className="card" style={{ padding: 24, marginBottom: 20 }}>
            <h3 style={{ fontSize: 15, marginBottom: 16 }}>Saran Praktis Buat Kamu</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {analysisResult.saran_praktis.map((tip: string, i: number) => (
                <div key={i} style={{ display: 'flex', gap: 12, padding: '12px 14px', borderRadius: 8, background: 'var(--bg)', border: '1px solid var(--border-subtle)' }}>
                  <div style={{ width: 22, height: 22, borderRadius: '50%', background: 'rgba(2,134,195,0.08)', color: 'var(--brand-blue)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 800, flexShrink: 0 }}>
                    {i + 1}
                  </div>
                  <p style={{ fontSize: 13, color: 'var(--text-primary)', margin: 0, lineHeight: 1.6 }}>{tip}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Rekomendasi Lanjutan */}
          <div className="card" style={{ padding: 24, marginBottom: 20 }}>
            <h3 style={{ fontSize: 15, marginBottom: 16 }}>Rekomendasi Langkah Selanjutnya</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {analysisResult.rekomendasi_lanjutan.map((rec: string, i: number) => (
                <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                  <ArrowRight size={14} color="var(--brand-blue)" />
                  <p style={{ fontSize: 13, color: 'var(--text-primary)', margin: 0 }}>{rec}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Disclaimer */}
          <div style={{
            padding: '14px 16px', borderRadius: 8, background: 'var(--bg)',
            border: '1px solid var(--border-subtle)', marginBottom: 24,
            display: 'flex', gap: 10,
          }}>
            <Info size={15} color="var(--text-muted)" style={{ flexShrink: 0, marginTop: 1 }} />
            <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: 0, lineHeight: 1.6 }}>
              Hasil ini didasarkan dari pengolahan data jawaban kamu secara terenkripsi. Ingatlah bahwa dinamika relasi dan kepribadian bersifat dinamis dan bisa berkembang seiring kedewasaan dirimu.
            </p>
          </div>

          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 40 }}>
            <Link href="/insights" className="btn btn-primary">Lihat Insight Personal</Link>
            <Link href="/assessment" className="btn btn-secondary">Kembali ke Assessment Center</Link>
            <button onClick={startSession} className="btn btn-ghost">
              Ulangi Assessment
            </button>
          </div>
        </div>
      )
    }

    // ==========================================
    // VIEW: QUIZ ACTIVE STATE
    // ==========================================
    const progress = Math.round((currentQ / totalQuestions) * 100)

    return (
      <div className="animate-fadein" style={{ maxWidth: 640, margin: '0 auto' }}>
        {/* Progress header */}
        <div className="card" style={{ padding: 20, marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <button
                onClick={handlePrev}
                disabled={currentQ === 0 || loadingAction}
                className="btn btn-ghost btn-sm"
                style={{ padding: 8 }}
              >
                <ChevronLeft size={14} />
              </button>
              <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>
                Soal {currentQ + 1} dari {totalQuestions}
              </span>
            </div>
            <span style={{ fontSize: 13, color: 'var(--text-secondary)', fontWeight: 500 }}>{progress}% selesai</span>
          </div>
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: `${progress}%`, background: 'var(--brand-blue)', transition: 'width 400ms ease' }} />
          </div>
        </div>

        {/* Main Question Card */}
        <div className="card" style={{ padding: 32 }}>
          {loadingQuestion || !question ? (
            <div style={{ padding: '40px 0', textAlign: 'center' }}>
              <div className="spinner" style={{ borderColor: 'rgba(2,134,195,0.2)', borderTopColor: 'var(--brand-blue)', width: 32, height: 32, margin: '0 auto 12px' }} />
              <p style={{ color: 'var(--text-secondary)', fontSize: 13 }}>Memuat pertanyaan...</p>
            </div>
          ) : (
            <div>
              {/* Format type label */}
              <div style={{
                display: 'inline-block',
                fontSize: 10,
                fontWeight: 800,
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                background: 'var(--border-subtle)',
                padding: '2px 8px',
                borderRadius: 4,
                color: 'var(--text-muted)',
                marginBottom: 16
              }}>
                {question.question_type === 'multiple_choice_single' && 'Pilihan Ganda'}
                {question.question_type === 'multiple_choice_multi' && 'Pilihan Ganda (Bisa pilih lebih dari satu)'}
                {question.question_type.startsWith('scale_') && 'Skor Penilaian'}
                {question.question_type === 'slider' && 'Gunakan Slider'}
                {question.question_type === 'text_free' && 'Refleksi Diri (Tulis jawaban bebas)'}
                {question.question_type === 'text_short' && 'Isian Pendek'}
                {question.question_type === 'situational' && 'Pertanyaan Situasional'}
                {question.question_type === 'ranking' && 'Urutkan Prioritas (Klik sesuai urutan)'}
                {question.question_type === 'boolean' && 'Ya / Tidak'}
              </div>

              <h2 style={{ fontSize: 17, marginBottom: 28, lineHeight: 1.6, fontWeight: 700 }}>
                {question.question_text}
              </h2>

              {/* DYNAMIC ANSWER CONTROLS */}

              {/* 1. Choice Inputs (multiple_choice_single, situational, boolean) */}
              {(question.question_type === 'multiple_choice_single' || question.question_type === 'situational' || question.question_type === 'boolean') && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 32 }}>
                  {question.options.map((option: any) => (
                    <button
                      key={option.id}
                      onClick={() => setSelectedOption(option.id)}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 14,
                        padding: '16px 18px', borderRadius: 10, textAlign: 'left',
                        border: `2px solid ${selectedOption === option.id ? 'var(--brand-blue)' : 'var(--border-subtle)'}`,
                        background: selectedOption === option.id ? 'rgba(2,134,195,0.04)' : 'var(--surface)',
                        cursor: 'pointer', transition: 'all 150ms ease',
                        width: '100%',
                      }}
                    >
                      <div style={{
                        width: 20, height: 20, borderRadius: '50%',
                        border: `2px solid ${selectedOption === option.id ? 'var(--brand-blue)' : 'var(--border)'}`,
                        background: selectedOption === option.id ? 'var(--brand-blue)' : 'transparent',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        flexShrink: 0, transition: 'all 150ms ease',
                      }}>
                        {selectedOption === option.id && (
                          <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'white' }} />
                        )}
                      </div>
                      <span style={{
                        fontSize: 14, color: selectedOption === option.id ? 'var(--brand-blue)' : 'var(--text-primary)',
                        fontWeight: selectedOption === option.id ? 600 : 400, lineHeight: 1.5,
                      }}>
                        {option.option_text}
                      </span>
                    </button>
                  ))}
                </div>
              )}

              {/* 2. Checkbox Inputs (multiple_choice_multi) */}
              {question.question_type === 'multiple_choice_multi' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 32 }}>
                  {question.options.map((option: any) => {
                    const isChecked = selectedOptions.includes(option.id)
                    return (
                      <button
                        key={option.id}
                        onClick={() => {
                          if (isChecked) {
                            setSelectedOptions(prev => prev.filter(id => id !== option.id))
                          } else {
                            setSelectedOptions(prev => [...prev, option.id])
                          }
                        }}
                        style={{
                          display: 'flex', alignItems: 'center', gap: 14,
                          padding: '16px 18px', borderRadius: 10, textAlign: 'left',
                          border: `2px solid ${isChecked ? 'var(--brand-blue)' : 'var(--border-subtle)'}`,
                          background: isChecked ? 'rgba(2,134,195,0.04)' : 'var(--surface)',
                          cursor: 'pointer', transition: 'all 150ms ease',
                          width: '100%',
                        }}
                      >
                        <div style={{
                          width: 20, height: 20, borderRadius: 4,
                          border: `2px solid ${isChecked ? 'var(--brand-blue)' : 'var(--border)'}`,
                          background: isChecked ? 'var(--brand-blue)' : 'transparent',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          flexShrink: 0, transition: 'all 150ms ease',
                        }}>
                          {isChecked && (
                            <Check size={12} color="white" strokeWidth={3} />
                          )}
                        </div>
                        <span style={{
                          fontSize: 14, color: isChecked ? 'var(--brand-blue)' : 'var(--text-primary)',
                          fontWeight: isChecked ? 600 : 400, lineHeight: 1.5,
                        }}>
                          {option.option_text}
                        </span>
                      </button>
                    )
                  })}
                </div>
              )}

              {/* 3. Scale inputs (scale_1_5) */}
              {question.question_type === 'scale_1_5' && (
                <div style={{ marginBottom: 32 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, marginBottom: 12 }}>
                    {[1, 2, 3, 4, 5].map(val => (
                      <button
                        key={val}
                        onClick={() => setScaleVal(val)}
                        style={{
                          width: 50, height: 50, borderRadius: '50%',
                          border: `2px solid ${scaleVal === val ? 'var(--brand-blue)' : 'var(--border-subtle)'}`,
                          background: scaleVal === val ? 'var(--brand-blue)' : 'var(--surface)',
                          color: scaleVal === val ? 'white' : 'var(--text-primary)',
                          fontWeight: 700, fontSize: 16, cursor: 'pointer',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          transition: 'all 150ms ease'
                        }}
                      >
                        {val}
                      </button>
                    ))}
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--text-muted)' }}>
                    <span>Sangat Tidak Setuju</span>
                    <span>Sangat Setuju</span>
                  </div>
                </div>
              )}

              {/* 4. Scale inputs (scale_1_10) */}
              {question.question_type === 'scale_1_10' && (
                <div style={{ marginBottom: 32 }}>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, justifyContent: 'space-between', marginBottom: 12 }}>
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(val => (
                      <button
                        key={val}
                        onClick={() => setScaleVal(val)}
                        style={{
                          width: 42, height: 42, borderRadius: '50%',
                          border: `2px solid ${scaleVal === val ? 'var(--brand-blue)' : 'var(--border-subtle)'}`,
                          background: scaleVal === val ? 'var(--brand-blue)' : 'var(--surface)',
                          color: scaleVal === val ? 'white' : 'var(--text-primary)',
                          fontWeight: 700, fontSize: 14, cursor: 'pointer',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          transition: 'all 150ms ease'
                        }}
                      >
                        {val}
                      </button>
                    ))}
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--text-muted)' }}>
                    <span>Sangat Rendah / Tidak Pernah</span>
                    <span>Sangat Tinggi / Selalu</span>
                  </div>
                </div>
              )}

              {/* 5. Slider inputs */}
              {question.question_type === 'slider' && (
                <div style={{ marginBottom: 32 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                    <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Intensitas</span>
                    <span style={{ fontSize: 24, fontWeight: 800, color: 'var(--brand-blue)' }}>{scaleVal}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={scaleVal}
                    onChange={e => setScaleVal(Number(e.target.value))}
                    style={{
                      width: '100%',
                      accentColor: 'var(--brand-blue)',
                      cursor: 'pointer',
                      height: 6,
                      borderRadius: 3,
                      background: 'var(--border)'
                    }}
                  />
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--text-muted)', marginTop: 8 }}>
                    <span>0% (Sama sekali tidak)</span>
                    <span>50% (Sedang)</span>
                    <span>100% (Sangat kuat)</span>
                  </div>
                </div>
              )}

              {/* 6. Text inputs (text_free, text_short) */}
              {question.question_type === 'text_free' && (
                <div style={{ marginBottom: 32 }}>
                  <textarea
                    className="input"
                    rows={5}
                    value={textVal}
                    onChange={e => setTextVal(e.target.value)}
                    placeholder="Ketik refleksi diri kamu secara jujur di sini (minimal 3 karakter)..."
                    style={{ width: '100%', padding: '14px', resize: 'vertical', minHeight: 120 }}
                  />
                </div>
              )}

              {question.question_type === 'text_short' && (
                <div style={{ marginBottom: 32 }}>
                  <input
                    className="input"
                    type="text"
                    value={textVal}
                    onChange={e => setTextVal(e.target.value)}
                    placeholder="Ketik jawaban singkat kamu..."
                    style={{ width: '100%' }}
                  />
                </div>
              )}

              {/* 7. Ranking inputs */}
              {question.question_type === 'ranking' && (
                <div style={{ marginBottom: 32 }}>
                  <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 14 }}>
                    Pilih opsi di bawah ini sesuai urutan kecocokan (teratas = paling menggambarkan diri Anda).
                  </p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {question.options.map((option: any) => {
                      const idx = rankingOrder.indexOf(option.id)
                      const isRanked = idx !== -1
                      return (
                        <button
                          key={option.id}
                          onClick={() => toggleRank(option.id)}
                          style={{
                            display: 'flex', alignItems: 'center', gap: 14,
                            padding: '14px 16px', borderRadius: 10, textAlign: 'left',
                            border: `2px solid ${isRanked ? 'var(--brand-blue)' : 'var(--border-subtle)'}`,
                            background: isRanked ? 'rgba(2,134,195,0.03)' : 'var(--surface)',
                            cursor: 'pointer', transition: 'all 150ms ease',
                            width: '100%',
                          }}
                        >
                          <div style={{
                            width: 24, height: 24, borderRadius: '50%',
                            background: isRanked ? 'var(--brand-blue)' : 'var(--border-subtle)',
                            color: isRanked ? 'white' : 'var(--text-muted)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: 12, fontWeight: 800, flexShrink: 0
                          }}>
                            {isRanked ? (idx + 1) : '-'}
                          </div>
                          <span style={{
                            fontSize: 14, color: isRanked ? 'var(--text-primary)' : 'var(--text-secondary)',
                            fontWeight: isRanked ? 600 : 400, flex: 1
                          }}>
                            {option.option_text}
                          </span>
                        </button>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Navigations buttons */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border-subtle)', paddingTop: 20 }}>
                <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                  Progress: {currentQ + 1} / {totalQuestions}
                </span>
                
                <button
                  onClick={handleSaveAndNext}
                  disabled={!isAnswerValid() || loadingAction}
                  className="btn btn-primary"
                  style={{ padding: '12px 24px' }}
                >
                  {loadingAction ? (
                    <RefreshCw size={16} className="animate-spin" />
                  ) : (
                    <>
                      {currentQ < totalQuestions - 1 ? 'Lanjut Soal Berikutnya' : 'Selesaikan & Analisis'}
                      <ChevronRight size={16} />
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <>
      {renderMainContent()}

      {/* Premium Alert/Error Modal */}
      {errorModal.isOpen && (
        <div
          onClick={() => setErrorModal(prev => ({ ...prev, isOpen: false }))}
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(9, 11, 16, 0.8)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            zIndex: 999999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
            animation: 'fadeIn 0.25s cubic-bezier(0.16, 1, 0.3, 1) both',
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: 'var(--surface)',
              borderRadius: '20px',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.05)',
              border: '1px solid var(--border-subtle)',
              maxWidth: '480px',
              width: '100%',
              padding: '32px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              textAlign: 'center',
              position: 'relative',
              animation: 'fadeInScale 0.3s cubic-bezier(0.34, 1.56, 0.64, 1) both',
            }}
          >
            <div style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              background: 'rgba(239, 68, 68, 0.1)',
              color: '#EF4444',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '20px',
              boxShadow: '0 0 20px rgba(239, 68, 68, 0.15)',
            }}>
              <AlertCircle size={28} />
            </div>
            <h3 style={{
              fontSize: '20px',
              fontWeight: 700,
              color: 'var(--text-primary)',
              margin: '0 0 10px 0',
              letterSpacing: '-0.01em',
            }}>{errorModal.title}</h3>
            <p style={{
              fontSize: '14px',
              color: 'var(--text-secondary)',
              lineHeight: 1.6,
              margin: '0 0 24px 0',
            }}>{errorModal.message}</p>
            
            <button 
              className="btn btn-primary"
              onClick={() => setErrorModal(prev => ({ ...prev, isOpen: false }))}
              style={{
                width: '100%',
                justifyContent: 'center',
                padding: '14px',
                fontSize: '15px',
                fontWeight: 700,
                borderRadius: '12px',
                background: 'linear-gradient(135deg, var(--brand-blue), #1D4ED8)',
                border: 'none',
                color: 'white',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                boxShadow: '0 4px 12px rgba(2, 134, 195, 0.25)',
              }}
            >
              Tutup
            </button>
          </div>
        </div>
      )}
    </>
  )
}
