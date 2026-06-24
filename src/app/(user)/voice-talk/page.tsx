'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  Mic, Square, Play, Pause, Trash2, Save, AlertTriangle, 
  Plus, MessageSquare, Send, Upload, Info, Lock, ChevronRight,
  Loader2, Volume2, RefreshCw, Flag, Heart, X
} from 'lucide-react'

interface Session {
  id: string
  title: string
  metadata?: string
  date: string
}

interface Message {
  id: string
  sender: 'user' | 'ai'
  message_type: 'text' | 'voice' | 'image' | 'multimodal' | 'both'
  content?: string | null
  transcript_text?: string | null
  audio_url?: string | null
  image_url?: string | null
  ai_text_reply?: string | null
  ai_audio_url?: string | null
  status: string
  metadata?: string
  time: string
}

interface DialogConfig {
  isOpen: boolean
  type: 'confirm' | 'prompt' | 'alert'
  title: string
  message: string
  placeholder?: string
  onConfirm: (inputValue?: string) => void
  onCancel?: () => void
}

export default function VoiceTalkPage() {
  const router = useRouter()
  const [sessions, setSessions] = useState<Session[]>([])
  const [currentSession, setCurrentSession] = useState<Session | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [loadingSessions, setLoadingSessions] = useState(true)
  const [loadingMessages, setLoadingMessages] = useState(false)
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  
  // Subscription check states
  const [activePlan, setActivePlan] = useState('free')
  const [planLoading, setPlanLoading] = useState(true)
  const [showLockModal, setShowLockModal] = useState(false)
  
  // Text Input State
  const [typedText, setTypedText] = useState('')
  
  // Processing State
  const [isProcessing, setIsProcessing] = useState(false)
  const [progressStatus, setProgressStatus] = useState('') // 'Thinking...', 'Generating Voice...'
  const [errorMsg, setErrorMsg] = useState('')
  const [infoMsg, setInfoMsg] = useState('') // Gentle info notice (e.g. fallback mode)
  const [dismissedError, setDismissedError] = useState(false)
  const [selectedVoice, setSelectedVoice] = useState('eve')
 
  // Saving Session State
  const [savingSession, setSavingSession] = useState(false)
 
  // Audio Playback states for voices
  const [playingAudioId, setPlayingAudioId] = useState<string | null>(null)
  const [audioPlaybackUrl, setAudioPlaybackUrl] = useState<string | null>(null)

  // View State for Onboarding & Landing Overhaul
  const [viewState, setViewState] = useState<'LANDING' | 'ONBOARDING' | 'CHAT'>('LANDING')
  const [onboardingForm, setOnboardingForm] = useState({
    name: '',
    status: '',
    age: '',
    gender: '',
    goal: '',
    topic: '',
    emotionLevel: '',
    aiResponsePreference: 'santai'
  })
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})

  const validateForm = () => {
    const errors: Record<string, string> = {}
    if (!onboardingForm.name.trim()) errors.name = 'Nama panggilan wajib diisi'
    if (!onboardingForm.status) errors.status = 'Status hubungan wajib diisi'
    if (!onboardingForm.goal) errors.goal = 'Tujuan curhat wajib diisi'
    if (!onboardingForm.topic) errors.topic = 'Topik utama wajib diisi'
    if (!onboardingForm.emotionLevel) errors.emotionLevel = 'Tingkat emosi wajib diisi'
    if (!onboardingForm.aiResponsePreference) errors.aiResponsePreference = 'Preferensi respon wajib diisi'
    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleStartOnboarding = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validateForm()) return

    setIsProcessing(true)
    setErrorMsg('')
    try {
      const res = await fetch('/api/voice/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: `Curhat ${onboardingForm.topic} - ${onboardingForm.name}`,
          onboarding: onboardingForm
        })
      })
      const data = await res.json()
      if (data.success) {
        setSessions(prev => [data.session, ...prev])
        setCurrentSession(data.session)
        sessionStorage.setItem('active-curhat-session-id', data.session.id)
        await fetchMessages(data.session.id)
        setViewState('CHAT')
        
        // Reset form
        setOnboardingForm({
          name: '',
          status: '',
          age: '',
          gender: '',
          goal: '',
          topic: '',
          emotionLevel: '',
          aiResponsePreference: 'santai'
        })
      } else {
        setErrorMsg(data.message || 'Gagal memulai sesi curhat baru.')
      }
    } catch (err) {
      setErrorMsg('Gagal menyambung ke server. Coba beberapa saat lagi.')
    } finally {
      setIsProcessing(false)
    }
  }

  useEffect(() => {
    const saved = localStorage.getItem('insight-hub-voice-id')
    if (saved) {
      setSelectedVoice(saved)
    }
  }, [])

  const handleVoiceChange = (voice: string) => {
    setSelectedVoice(voice)
    localStorage.setItem('insight-hub-voice-id', voice)
  }

  const [dialog, setDialog] = useState<DialogConfig>({
    isOpen: false,
    type: 'alert',
    title: '',
    message: '',
    onConfirm: () => {}
  })
  const [dialogInput, setDialogInput] = useState('')

  const showConfirm = (title: string, message: string, onConfirm: () => void, onCancel?: () => void) => {
    setDialog({
      isOpen: true,
      type: 'confirm',
      title,
      message,
      onConfirm: () => {
        onConfirm()
        closeDialog()
      },
      onCancel: () => {
        if (onCancel) onCancel()
        closeDialog()
      }
    })
  }

  const showPrompt = (title: string, message: string, placeholder: string, onConfirm: (val: string) => void) => {
    setDialogInput('')
    setDialog({
      isOpen: true,
      type: 'prompt',
      title,
      message,
      placeholder,
      onConfirm: (val) => {
        onConfirm(val || '')
        closeDialog()
      },
      onCancel: () => {
        closeDialog()
      }
    })
  }

  const showAlert = (title: string, message: string, onConfirm?: () => void) => {
    setDialog({
      isOpen: true,
      type: 'alert',
      title,
      message,
      onConfirm: () => {
        if (onConfirm) onConfirm()
        closeDialog()
      }
    })
  }

  const closeDialog = () => {
    setDialog(prev => ({ ...prev, isOpen: false }))
  }
  
  // Refs
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const currentAudioRef = useRef<HTMLAudioElement | null>(null)

  // Fetch all sessions on mount
  useEffect(() => {
    // Check active plan
    fetch('/api/user/billing')
      .then(res => res.json())
      .then(data => {
        if (data.success && data.activeSubscription) {
          setActivePlan(data.activeSubscription.planId)
        }
        setPlanLoading(false)
      })
      .catch(() => setPlanLoading(false))

    fetchSessions()
    return () => {
      if (currentAudioRef.current) {
        currentAudioRef.current.pause()
      }
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        window.speechSynthesis.cancel()
      }
    }
  }, [])

  // Auto scroll to bottom of chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isProcessing, errorMsg])

  // Reset dismissed error state on session change
  useEffect(() => {
    setDismissedError(false)
  }, [currentSession])



  const fetchSessions = async (selectId?: string) => {
    setLoadingSessions(true)
    try {
      const res = await fetch('/api/voice/session')
      const data = await res.json()
      if (data.success) {
        setSessions(data.sessions)
        
        // Cek sessionStorage untuk sesi yang aktif
        const activeId = selectId || sessionStorage.getItem('active-curhat-session-id')
        if (activeId) {
          const activeSess = data.sessions.find((s: Session) => s.id === activeId)
          if (activeSess) {
            setCurrentSession(activeSess)
            fetchMessages(activeSess.id)
            
            // Cek apakah metadata onboarding lengkap
            let hasOnboarding = false
            if (activeSess.metadata) {
              try {
                const parsed = JSON.parse(activeSess.metadata)
                if (parsed.onboarding && parsed.onboarding.name) {
                  hasOnboarding = true
                }
              } catch (e) {}
            }
            
            if (hasOnboarding) {
              setViewState('CHAT')
            } else {
              setViewState('ONBOARDING')
            }
          } else {
            setViewState('LANDING')
          }
        } else {
          setViewState('LANDING')
        }
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoadingSessions(false)
    }
  }

  const fetchMessages = async (sessionId: string) => {
    setLoadingMessages(true)
    setErrorMsg('')
    try {
      const res = await fetch(`/api/voice/chat?sessionId=${sessionId}`)
      const data = await res.json()
      if (data.success) {
        setMessages(data.messages)
      } else {
        setErrorMsg(data.message || 'Gagal memuat pesan.')
      }
    } catch (err) {
      setErrorMsg('Koneksi bermasalah saat memuat pesan.')
    } finally {
      setLoadingMessages(false)
    }
  }

  const handleCreateSession = () => {
    setCurrentSession(null)
    setViewState('ONBOARDING')
  }

  const handleDeleteSession = (sessionId: string) => {
    showConfirm(
      'Hapus Sesi Curhat',
      'Yakin ingin menghapus seluruh riwayat curhat sesi ini? Tindakan ini tidak bisa dibatalkan.',
      async () => {
        try {
          const res = await fetch(`/api/voice/chat?sessionId=${sessionId}`, {
            method: 'DELETE'
          })
          const data = await res.json()
          if (data.success) {
            const remaining = sessions.filter(s => s.id !== sessionId)
            setSessions(remaining)
            if (remaining.length > 0) {
              setCurrentSession(remaining[0])
              fetchMessages(remaining[0].id)
            } else {
              setCurrentSession(null)
              setMessages([])
            }
          }
        } catch (err) {
          setErrorMsg('Gagal menghapus sesi.')
        }
      }
    )
  }

  const sendTextMessage = async () => {
    if (!currentSession || !typedText.trim()) return

    setIsProcessing(true)
    setProgressStatus('Sedang memproses curhatmu...')
    setErrorMsg('')

    const capturedText = typedText.trim()
    const tempId = `temp-${Date.now()}`
    const tempUserMsg: Message = {
      id: tempId,
      sender: 'user',
      message_type: 'text',
      content: capturedText,
      transcript_text: null,
      audio_url: null,
      image_url: null,
      ai_text_reply: null,
      ai_audio_url: null,
      status: 'pending',
      time: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
    }
    setMessages(prev => [...prev, tempUserMsg])
    setTypedText('')

    const formData = new FormData()
    formData.append('sessionId', currentSession.id)
    formData.append('voiceId', selectedVoice)
    formData.append('message', capturedText)

    try {
      const statuses = [
        'Sedang menganalisis input kamu...',
        'Insight Hub sedang memahami curhatmu...',
        'Merumuskan tanggapan hangat...',
        'Mengonversi balasan ke suara...'
      ]
      let statusIdx = 0
      const statusInterval = setInterval(() => {
        if (statusIdx < statuses.length - 1) {
          statusIdx++
          setProgressStatus(statuses[statusIdx])
        }
      }, 3000)

      const res = await fetch('/api/voice/chat', {
        method: 'POST',
        body: formData
      })
      
      clearInterval(statusInterval)
      const data = await res.json()

      if (res.ok && data.success) {
        setMessages(prev => [
          ...prev.filter(m => m.id !== tempId),
          data.userMessage,
          data.aiMessage
        ])
        
        if (data.aiMessage.ai_audio_url) {
          playAudio(data.aiMessage.id, data.aiMessage.ai_audio_url)
        }

        if (messages.length === 0) {
          fetchSessions(currentSession.id)
        }
      } else {
        setMessages(prev => prev.map(m => m.id === tempId ? { ...m, status: 'failed' } : m))
        setErrorMsg(data.message || 'Waduh, gagal memproses curhat kamu.')
      }
    } catch (err) {
      setMessages(prev => prev.map(m => m.id === tempId ? { ...m, status: 'failed' } : m))
      setErrorMsg('Gagal menyambung ke server. Pastikan jaringan aktif.')
    } finally {
      setIsProcessing(false)
      setProgressStatus('')
    }
  }

  const playLocalSpeech = (messageId: string, text: string) => {
    if (typeof window === 'undefined' || !window.speechSynthesis) {
      setErrorMsg('Pencarian suara lokal tidak didukung di peramban ini.')
      return
    }

    if (playingAudioId === messageId) {
      window.speechSynthesis.cancel()
      setPlayingAudioId(null)
      return
    }

    // Hentikan suara yang sedang berbunyi
    window.speechSynthesis.cancel()
    if (currentAudioRef.current) {
      currentAudioRef.current.pause()
    }

    // Pemetaan karakteristik suara lokal untuk menyimulasikan model suara Grok
    const voiceSettings: Record<string, { pitch: number, rate: number, isMale: boolean }> = {
      eve: { pitch: 1.15, rate: 0.95, isMale: false },
      ara: { pitch: 1.25, rate: 1.05, isMale: false },
      rex: { pitch: 0.85, rate: 1.0, isMale: true },
      sal: { pitch: 0.95, rate: 0.9, isMale: true },
      leo: { pitch: 1.05, rate: 1.1, isMale: true }
    }

    const currentConfig = voiceSettings[selectedVoice] || voiceSettings.eve

    const utterance = new SpeechSynthesisUtterance(text)
    utterance.lang = 'id-ID' // Set bahasa ke Bahasa Indonesia
    utterance.pitch = currentConfig.pitch
    utterance.rate = currentConfig.rate
    
    // Cari suara Indonesia terbaik di sistem (mendukung pilihan Laki-laki / Perempuan)
    const voices = window.speechSynthesis.getVoices()
    const idVoices = voices.filter(v => v.lang.startsWith('id') || v.name.toLowerCase().includes('indonesia') || v.name.toLowerCase().includes('id-id'))
    
    if (idVoices.length > 0) {
      let selectedVoiceObj = null
      
      if (currentConfig.isMale) {
        // Cari suara laki-laki lokal (seperti Microsoft Ardi)
        selectedVoiceObj = idVoices.find(v => v.name.toLowerCase().includes('ardi') || v.name.toLowerCase().includes('male') || v.name.toLowerCase().includes('laki') || v.name.toLowerCase().includes('david') || v.name.toLowerCase().includes('wira'))
      } else {
        // Cari suara perempuan lokal (seperti Microsoft Gadis)
        selectedVoiceObj = idVoices.find(v => v.name.toLowerCase().includes('gadis') || v.name.toLowerCase().includes('female') || v.name.toLowerCase().includes('perempuan') || v.name.toLowerCase().includes('zira') || v.name.toLowerCase().includes('gita'))
      }
      
      // Fallback ke suara Indonesia pertama jika gender spesifik tidak ditemukan
      if (!selectedVoiceObj) {
        selectedVoiceObj = idVoices[0]
      }
      
      utterance.voice = selectedVoiceObj
      console.log(`[SpeechSynthesis] Menggunakan suara: ${selectedVoiceObj.name} (Pitch: ${currentConfig.pitch}, Speed: ${currentConfig.rate})`)
    }

    utterance.onend = () => {
      setPlayingAudioId(null)
    }

    utterance.onerror = (e) => {
      console.error('[SpeechSynthesis] Error:', e)
      setPlayingAudioId(null)
    }

    setPlayingAudioId(messageId)
    window.speechSynthesis.speak(utterance)
  }

  const playAudio = (messageId: string, url: string) => {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel()
    }

    if (currentAudioRef.current) {
      currentAudioRef.current.pause()
    }

    if (playingAudioId === messageId) {
      // Pause jika tombol yang sama diklik ulang
      setPlayingAudioId(null)
      return
    }

    const audio = new Audio(url)
    currentAudioRef.current = audio
    setPlayingAudioId(messageId)
    setAudioPlaybackUrl(url)

    audio.play().catch(() => {
      setPlayingAudioId(null)
      setErrorMsg('Gagal memutar audio. Coba klik play lagi.')
    })

    audio.onended = () => {
      setPlayingAudioId(null)
    }
  }

  // Aksi: Simpan / Bookmark Sesi Curhat
  const handleSaveSession = async () => {
    if (!currentSession) return
    setSavingSession(true)
    setErrorMsg('')
    try {
      const res = await fetch('/api/voice/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'save',
          sessionId: currentSession.id
        })
      })
      const data = await res.json()
      if (data.success) {
        const updatedMeta = JSON.stringify({ saved: data.saved });
        const updatedSessions = sessions.map(s => {
          if (s.id === currentSession.id) {
            return { ...s, metadata: updatedMeta };
          }
          return s;
        });
        setSessions(updatedSessions);
        setCurrentSession(prev => prev ? { ...prev, metadata: updatedMeta } : null);
      } else {
        setErrorMsg(data.message || 'Gagal menyimpan curhat.')
      }
    } catch (e) {
      setErrorMsg('Terjadi kesalahan saat menyimpan curhat.')
    } finally {
      setSavingSession(false)
    }
  }

  // Aksi: Laporkan Balasan
  const handleReportMessage = (messageId: string) => {
    showPrompt(
      'Laporkan Balasan',
      'Masukkan alasan kenapa balasan ini kurang relevan atau tidak sesuai:',
      'Contoh: Jawaban kurang berempati / keluar konteks',
      async (reason) => {
        if (!reason || !reason.trim()) return
        try {
          const res = await fetch('/api/voice/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              action: 'report',
              messageId,
              reportReason: reason || 'user_reported'
            })
          })
          const data = await res.json()
          if (data.success) {
            showAlert('Laporan Terkirim', 'Laporan berhasil dikirim. Terima kasih atas masukan kamu!')
            setMessages(prev => prev.map(m => {
              if (m.id === messageId) {
                const existingMeta = JSON.parse(m.metadata || '{}')
                return { ...m, metadata: JSON.stringify({ ...existingMeta, reported: true, reportReason: reason }) }
              }
              return m
            }))
          } else {
            setErrorMsg(data.message || 'Gagal mengirim laporan.')
          }
        } catch (e) {
          setErrorMsg('Terjadi kesalahan saat mengirim laporan.')
        }
      }
    )
  }

  // Aksi: Retry Pemrosesan Ulang Audio Terakhir
  const handleRetry = async () => {
    if (!currentSession) return

    setIsProcessing(true)
    setProgressStatus('Memproses ulang curhat terakhir kamu...')
    setErrorMsg('')

    try {
      const res = await fetch('/api/voice/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'retry',
          sessionId: currentSession.id,
          voiceId: selectedVoice
        })
      })
      const data = await res.json()
      if (res.ok && data.success) {
        // Tarik ulang pesan agar sinkron
        fetchMessages(currentSession.id)
        
        setErrorMsg('')
        
        // Auto play audio balasan baru jika ada
        if (data.aiMessage.ai_audio_url) {
          playAudio(data.aiMessage.id, data.aiMessage.ai_audio_url)
        }
      } else {
        setErrorMsg(data.message || 'Waduh, gagal memproses ulang curhat kamu.')
        fetchMessages(currentSession.id)
      }
    } catch (err) {
      setErrorMsg('Gagal menyambung ke server. Silakan coba lagi.')
      fetchMessages(currentSession.id)
    } finally {
      setIsProcessing(false)
      setProgressStatus('')
    }
  }


  const formatTimer = (seconds: number) => {
    const min = Math.floor(seconds / 60)
    const sec = seconds % 60
    return `${min.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`
  }

  // Cek apakah ada pesan terakhir yang gagal
  const hasFailedMessage = messages.length > 0 && messages[messages.length - 1].status === 'failed'
  const displayError = errorMsg || (!dismissedError && hasFailedMessage ? 'Gagal memproses curhat kamu. Silakan klik tombol "Retry" di bawah ini.' : '')

  // Cek apakah sesi aktif tersimpan
  let isSessionSaved = false
  if (currentSession?.metadata) {
    try {
      const parsed = JSON.parse(currentSession.metadata)
      isSessionSaved = !!parsed.saved
    } catch (e) {}
  }

  if (planLoading) {
    return (
      <div style={{ minHeight: '60vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
        <Loader2 className="animate-spin" size={32} color="var(--brand-blue)" />
        <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Memuat status paket kamu...</p>
      </div>
    )
  }

  const isPremium = activePlan === 'premium' || activePlan === 'couple' || activePlan === 'admin'

  if (!isPremium) {
    return (
      <div className="card animate-fadein" style={{ padding: 48, textAlign: 'center', maxWidth: 540, margin: '40px auto' }}>
        <div style={{
          width: 64, height: 64, borderRadius: '50%',
          background: 'rgba(2,134,195,0.1)', color: 'var(--brand-blue)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px',
          boxShadow: '0 0 20px rgba(2,134,195,0.15)'
        }}>
          <Lock size={32} />
        </div>
        <h2 style={{ fontSize: 20, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 12 }}>Teman Curhat Terkunci</h2>
        <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: 28 }}>
          Fitur Teman Curhat (Voice curhat dan AI partner) ini eksklusif banget buat pengguna paket <strong>Premium</strong> atau <strong>Couple Plan</strong>. Upgrade paket kamu biar bisa ngobrol langsung lewat voice sepuasnya!
        </p>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
          <button onClick={() => setShowLockModal(true)} className="btn btn-primary" style={{ padding: '12px 24px' }}>
            Upgrade ke Premium
          </button>
          <Link href="/dashboard" className="btn btn-secondary" style={{ padding: '12px 24px' }}>
            Kembali
          </Link>
        </div>

        {/* Lock Warning Upgrade Modal */}
        {showLockModal && (
          <div
            onClick={() => setShowLockModal(false)}
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
                maxWidth: '440px',
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
              {/* Close Button */}
              <button
                onClick={() => setShowLockModal(false)}
                style={{
                  position: 'absolute', top: 16, right: 16,
                  border: 'none', background: 'none', color: 'var(--text-muted)',
                  cursor: 'pointer', padding: 4
                }}
              >
                <X size={18} />
              </button>

              <div style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                background: 'rgba(2, 134, 195, 0.1)',
                color: 'var(--brand-blue)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '20px',
                boxShadow: '0 0 20px rgba(2, 134, 195, 0.15)',
              }}>
                <Lock size={28} />
              </div>

              <h3 style={{
                fontSize: '20px',
                fontWeight: 700,
                color: 'var(--text-primary)',
                margin: '0 0 10px 0',
                letterSpacing: '-0.01em',
              }}>Fitur ini belum kebuka</h3>

              <p style={{
                fontSize: '14px',
                color: 'var(--text-secondary)',
                lineHeight: 1.6,
                margin: '0 0 24px 0',
              }}>Tenang, fitur ini cuma bisa dipakai di paket yang lebih tinggi. Upgrade dulu biar aksesnya langsung kebuka semua.</p>

              <div style={{ display: 'flex', gap: 12, width: '100%' }}>
                <button
                  className="btn btn-secondary"
                  onClick={() => setShowLockModal(false)}
                  style={{
                    flex: 1,
                    justifyContent: 'center',
                    padding: '12px',
                    fontSize: '14px',
                    fontWeight: 600,
                    borderRadius: '10px',
                    cursor: 'pointer',
                  }}
                >
                  Nanti dulu
                </button>
                <button
                  className="btn btn-primary"
                  onClick={() => {
                    setShowLockModal(false)
                    router.push('/langganan')
                  }}
                  style={{
                    flex: 1,
                    justifyContent: 'center',
                    padding: '12px',
                    fontSize: '14px',
                    fontWeight: 700,
                    borderRadius: '10px',
                    background: 'linear-gradient(135deg, var(--brand-blue), #1D4ED8)',
                    border: 'none',
                    color: 'white',
                    cursor: 'pointer',
                    boxShadow: '0 4px 12px rgba(2, 134, 195, 0.25)',
                  }}
                >
                  Upgrade sekarang
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    )
  }

  return (
    <>
      {isSidebarOpen && (
        <div 
          onClick={() => setIsSidebarOpen(false)}
          className="sidebar-overlay"
        />
      )}

      <div className="animate-fadein voice-talk-layout">
        
        {/* Left column: Session History Sidebar */}
        <div className={`card glass voice-talk-sidebar ${isSidebarOpen ? 'open' : ''}`}>
          <div className="sidebar-mobile-header" style={{ display: 'none', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>Menu Curhat</span>
            <button 
              onClick={() => setIsSidebarOpen(false)}
              style={{ border: 'none', background: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 4 }}
            >
              ✕
            </button>
          </div>

          <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 8 }}>
            <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)', margin: '8px 0 4px' }}>
              Riwayat Curhat
            </p>
            {loadingSessions ? (
              <div style={{ display: 'flex', justifyContent: 'center', padding: 20 }}>
                <Loader2 className="spinner" size={20} />
              </div>
            ) : sessions.length === 0 ? (
              <p style={{ fontSize: 12, color: 'var(--text-muted)', textAlign: 'center', padding: 20 }}>
                Belum ada sesi curhat.
              </p>
            ) : (
              sessions.map(s => {
                let isSaved = false
                if (s.metadata) {
                  try {
                    const parsed = JSON.parse(s.metadata)
                    isSaved = !!parsed.saved
                  } catch (e) {}
                }
                return (
                  <div 
                    key={s.id}
                    onClick={() => {
                      setCurrentSession(s)
                      fetchMessages(s.id)
                      setIsSidebarOpen(false)
                      sessionStorage.setItem('active-curhat-session-id', s.id)
                      
                      let hasOnboarding = false
                      if (s.metadata) {
                        try {
                          const parsed = JSON.parse(s.metadata)
                          if (parsed.onboarding && parsed.onboarding.name) {
                            hasOnboarding = true
                          }
                        } catch (e) {}
                      }
                      
                      if (hasOnboarding) {
                        setViewState('CHAT')
                      } else {
                        setViewState('ONBOARDING')
                      }
                    }}
                    style={{
                      padding: '10px 12px',
                      borderRadius: 8,
                      cursor: 'pointer',
                      background: currentSession?.id === s.id ? 'rgba(2, 134, 195, 0.1)' : 'transparent',
                      border: '1px solid',
                      borderColor: currentSession?.id === s.id ? 'rgba(2, 134, 195, 0.2)' : 'transparent',
                      transition: 'all 200ms ease',
                      position: 'relative'
                    }}
                    className="card-hover"
                  >
                    <p style={{ 
                      fontSize: 13, 
                      fontWeight: 600, 
                      color: currentSession?.id === s.id ? 'var(--brand-blue)' : 'var(--text-primary)', 
                      margin: '0 0 4px',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      paddingRight: 20
                    }}>
                      {s.title}
                    </p>
                    <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                      <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: 0 }}>
                        {s.date || 'Baru saja'}
                      </p>
                      {isSaved && (
                        <span style={{
                          fontSize: 9,
                          color: 'var(--brand-blue)',
                          background: 'rgba(2, 134, 195, 0.1)',
                          padding: '1px 4px',
                          borderRadius: 4,
                          fontWeight: 700
                        }}>
                          Tersimpan
                        </span>
                      )}
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleDeleteSession(s.id)
                      }}
                      style={{
                        position: 'absolute',
                        right: 8,
                        top: '50%',
                        transform: 'translateY(-50%)',
                        border: 'none',
                        background: 'none',
                        color: 'var(--text-muted)',
                        cursor: 'pointer',
                        padding: 4,
                        opacity: currentSession?.id === s.id ? 1 : 0
                      }}
                      className="hover-show"
                      title="Hapus sesi"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                )
              })
            )}
          </div>
 
          <div style={{ padding: 12, background: 'rgba(2, 134, 195, 0.05)', borderRadius: 8, border: '1px solid rgba(2, 134, 195, 0.1)' }}>
            <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginBottom: 4, color: 'var(--brand-blue)' }}>
              <Lock size={12} />
              <span style={{ fontSize: 11, fontWeight: 700 }}>Aman & Privat</span>
            </div>
            <p style={{ fontSize: 10, color: 'var(--text-secondary)', margin: 0, lineHeight: 1.4 }}>
              Seluruh percakapan curhat dan hasil analisis dilindungi enkripsi. Data tidak akan dibagikan ke pihak luar.
            </p>
          </div>
        </div>
        {/* Right column: Chat Arena */}
        <div className="card glass voice-talk-chat-arena" style={{ padding: 0, display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
          
          {viewState === 'CHAT' && (
            <>
              {/* Header */}
              <div className="voice-talk-header">
                <div className="voice-talk-header-info">
                  <h2>
                    {currentSession ? currentSession.title : 'Teman Curhat'}
                  </h2>
                  <p style={{ fontSize: 12, color: 'var(--text-secondary)', margin: '2px 0 0' }}>
                    Teman curhat privat yang siap mendengarkan dan mendukungmu secara emosional dengan hangat.
                  </p>
                </div>
                
                <div className="voice-talk-header-controls">
                  <button
                    onClick={() => setIsSidebarOpen(true)}
                    className="btn btn-secondary btn-sm mobile-sidebar-toggle"
                    style={{ gap: 4 }}
                  >
                    <MessageSquare size={12} />
                    Riwayat
                  </button>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)' }} className="suara-label">Suara:</span>
                    <select
                      value={selectedVoice}
                      onChange={(e) => handleVoiceChange(e.target.value)}
                      style={{
                        padding: '6px 10px',
                        borderRadius: 6,
                        border: '1px solid var(--border)',
                        background: 'var(--bg)',
                        fontSize: 12,
                        fontWeight: 600,
                        color: 'var(--text-primary)',
                        cursor: 'pointer',
                        outline: 'none'
                      }}
                    >
                      <option value="eve">Eve (Perempuan - Lembut)</option>
                      <option value="ara">Ara (Perempuan - Ekspresif)</option>
                      <option value="rex">Rex (Laki-laki - Tegas)</option>
                      <option value="sal">Sal (Laki-laki - Hangat)</option>
                      <option value="leo">Leo (Laki-laki - Bersahabat)</option>
                    </select>
                  </div>

                  <button 
                    className="btn btn-primary btn-sm" 
                    onClick={handleCreateSession}
                    style={{ gap: 6 }}
                  >
                    <Plus size={12} />
                    Mulai Curhat Baru
                  </button>

                  {currentSession && (
                    <>
                      <button
                        className={`btn ${isSessionSaved ? 'btn-primary' : 'btn-secondary'} btn-sm`}
                        onClick={handleSaveSession}
                        style={{ gap: 4 }}
                        disabled={savingSession}
                        title={isSessionSaved ? 'Curhat Tersimpan' : 'Simpan Curhat'}
                      >
                        <Save size={12} fill={isSessionSaved ? 'white' : 'none'} />
                        {isSessionSaved ? 'Tersimpan' : 'Simpan'}
                      </button>

                      <button
                        className="btn btn-secondary btn-sm"
                        onClick={() => fetchMessages(currentSession.id)}
                        style={{ gap: 4 }}
                        title="Segarkan chat"
                      >
                        <RefreshCw size={12} />
                        Refresh
                      </button>
                    </>
                  )}
                </div>
              </div>
      
              {/* Messages Area */}
              <div className="voice-talk-messages-area">
                {loadingMessages ? (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 8 }}>
                    <Loader2 className="spinner" size={32} />
                    <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>Memuat obrolan...</p>
                  </div>
                ) : messages.length === 0 && !isProcessing ? (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', textAlign: 'center', padding: 40 }}>
                    <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'rgba(239, 68, 68, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#EF4444', marginBottom: 16 }}>
                      <Heart size={28} fill="#EF4444" />
                    </div>
                    <h3 style={{ fontSize: 16, fontWeight: 800, color: 'var(--text-primary)', margin: '0 0 8px' }}>
                      Halo! Aku siap mendengarkan keluh kesahmu
                    </h3>
                    <p style={{ fontSize: 13, color: 'var(--text-secondary)', maxWidth: 360, margin: 0, lineHeight: 1.6 }}>
                      Tuliskan apa saja yang sedang membebani pikiran atau perasaanmu di kolom bawah. Bagikan ceritamu secara privat, dan aku akan merespons dengan kehangatan dan penuh empati.
                    </p>
                  </div>
                ) : (
                  <>
                    {messages.map((msg) => {
                      const isUser = msg.sender === 'user'
                      
                      let isReported = false
                      if (msg.metadata) {
                        try {
                          const parsed = JSON.parse(msg.metadata)
                          isReported = !!parsed.reported
                        } catch (e) {}
                      }

                      return (
                        <div 
                          key={msg.id}
                          style={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: isUser ? 'flex-end' : 'flex-start',
                            width: '100%'
                          }}
                          className="animate-fadein-scale"
                        >
                          {/* Bubble */}
                          <div 
                            style={{
                              maxWidth: '75%',
                              padding: '12px 18px',
                              borderRadius: 16,
                              background: isUser ? '#1E293B' : 'rgba(255, 255, 255, 0.75)',
                              border: '1px solid',
                              borderColor: isUser ? 'transparent' : 'rgba(255, 255, 255, 0.4)',
                              boxShadow: 'var(--shadow-raised)',
                              color: isUser ? '#ffffff' : 'var(--text-primary)',
                              backdropFilter: isUser ? 'none' : 'blur(10px)'
                            }}
                          >
                            {isUser ? (
                              // User Message: Teks + Voice Player + Image + Transcript
                              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                {/* Render User Uploaded Image if exists */}
                                {msg.image_url && (
                                  <div style={{ marginBottom: 4 }}>
                                    <img 
                                      src={msg.image_url} 
                                      alt="Curhat Visual" 
                                      style={{ maxWidth: '100%', maxHeight: 220, borderRadius: 12, objectFit: 'cover', border: '1px solid rgba(255,255,255,0.2)' }} 
                                    />
                                  </div>
                                )}
                                
                                {/* Render User Audio if exists */}
                                {msg.audio_url && (
                                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'rgba(255,255,255,0.15)', padding: '8px 12px', borderRadius: 10 }}>
                                    <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'rgba(255,255,255,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                      <Volume2 size={16} />
                                    </div>
                                    <audio src={msg.audio_url} controls style={{ height: 32, flex: 1, minWidth: 0 }} />
                                  </div>
                                )}

                                {/* Render User Typed Text if exists */}
                                {msg.content && msg.content !== '[Input Multimodal]' && !msg.content.startsWith('[Pesan Teks]') && !msg.content.startsWith('[Transkripsi') && !msg.content.startsWith('[Konteks') && (
                                  <p style={{ fontSize: 13.5, margin: 0, lineHeight: 1.55, wordBreak: 'break-word', color: '#ffffff' }}>
                                    {msg.content}
                                  </p>
                                )}

                                {/* Jika content berformat gabungan [Pesan Teks]: ... */}
                                {msg.content && msg.content.startsWith('[Pesan Teks]:') && (
                                  <p style={{ fontSize: 13.5, margin: 0, lineHeight: 1.55, wordBreak: 'break-word', color: '#ffffff' }}>
                                    {msg.content.replace(/\[Pesan Teks\]:\s*/, '').split('\n')[0].trim()}
                                  </p>
                                )}

                                {/* Tampilkan status atau transkrip */}
                                {(msg.status === 'failed' || msg.status === 'pending' || msg.transcript_text) && (
                                  <p style={{ fontSize: 11.5, color: 'rgba(255, 255, 255, 0.80)', margin: 0, fontStyle: 'italic', borderTop: (msg.audio_url || msg.image_url || msg.content) ? '1px solid rgba(255,255,255,0.15)' : 'none', paddingTop: (msg.audio_url || msg.image_url || msg.content) ? 6 : 0 }}>
                                    {msg.status === 'failed' ? (
                                      <span style={{ color: '#ffcbd1', display: 'inline-flex', alignItems: 'center', gap: 4, fontWeight: 600 }}>
                                        <AlertTriangle size={12} /> Gagal diproses. Silakan klik tombol "Retry" di sebelah kanan bawah.
                                      </span>
                                    ) : msg.status === 'pending' ? (
                                      <span style={{ color: '#e0f2fe', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                                        <Loader2 size={12} className="spinner" /> Sedang memproses curhatmu...
                                      </span>
                                    ) : msg.transcript_text && msg.audio_url ? (
                                      `Transkrip: "${msg.transcript_text}"`
                                    ) : null}
                                  </p>
                                )}
                              </div>

                            ) : (
                              // Reply Message: Text Reply + Voice Player & Report Action
                              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                                <p style={{ fontSize: 13.5, margin: 0, lineHeight: 1.5 }}>
                                  {msg.ai_text_reply}
                                </p>
                                
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8, marginTop: 4 }}>
                                  {msg.ai_audio_url ? (
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(2,134,195,0.05)', padding: '6px 12px', borderRadius: 8, border: '1px solid rgba(2,134,195,0.1)' }}>
                                      <button
                                        onClick={() => playAudio(msg.id, msg.ai_audio_url!)}
                                        style={{
                                          width: 28, height: 28, borderRadius: '50%',
                                          background: 'var(--brand-blue)', color: 'white',
                                          border: 'none', cursor: 'pointer',
                                          display: 'flex', alignItems: 'center', justifyContent: 'center'
                                        }}
                                      >
                                        {playingAudioId === msg.id ? <Pause size={12} /> : <Play size={12} fill="white" />}
                                      </button>
                                      <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--brand-blue)' }}>
                                        {playingAudioId === msg.id ? 'Memutar suara...' : 'Putar suara'}
                                      </span>
                                    </div>
                                  ) : msg.ai_text_reply ? (
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(2, 134, 195, 0.05)', padding: '6px 12px', borderRadius: 8, border: '1px solid rgba(2, 134, 195, 0.1)' }}>
                                      <button
                                        onClick={() => playLocalSpeech(msg.id, msg.ai_text_reply!)}
                                        style={{
                                          width: 28, height: 28, borderRadius: '50%',
                                          background: 'var(--brand-blue)', color: 'white',
                                          border: 'none', cursor: 'pointer',
                                          display: 'flex', alignItems: 'center', justifyContent: 'center'
                                        }}
                                      >
                                        {playingAudioId === msg.id ? <Pause size={12} /> : <Play size={12} fill="white" />}
                                      </button>
                                      <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--brand-blue)' }}>
                                        {playingAudioId === msg.id ? 'Memutar suara...' : 'Putar suara'}
                                      </span>
                                    </div>
                                  ) : null}

                                  <button
                                    onClick={() => handleReportMessage(msg.id)}
                                    style={{
                                      background: 'none',
                                      border: 'none',
                                      color: isReported ? 'var(--error)' : 'var(--text-muted)',
                                      cursor: isReported ? 'default' : 'pointer',
                                      display: 'flex',
                                      alignItems: 'center',
                                      gap: 4,
                                      fontSize: 11,
                                      fontWeight: 600,
                                      padding: '4px 8px',
                                      borderRadius: 4
                                    }}
                                    disabled={isReported}
                                    title={isReported ? 'Sudah Dilaporkan' : 'Laporkan balasan tidak relevan'}
                                  >
                                    <Flag size={11} fill={isReported ? 'currentColor' : 'none'} />
                                    {isReported ? 'Dilaporkan' : 'Laporkan'}
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
     
                          {/* Info & Metadata */}
                          <span style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 4, padding: '0 4px' }}>
                            {msg.time}
                          </span>
                        </div>
                      )
                    })}
     
                    {/* Processing State Animasi */}
                    {isProcessing && (
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', width: '100%' }}>
                        <div style={{
                          maxWidth: '75%',
                          padding: '14px 20px',
                          borderRadius: 16,
                          background: 'rgba(255,255,255,0.5)',
                          border: '1px solid rgba(255,255,255,0.3)',
                          backdropFilter: 'blur(10px)',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 12
                        }}>
                          <div className="spinner spinner-sm" style={{ borderColor: 'rgba(2,134,195,0.2)', borderTopColor: 'var(--brand-blue)' }} />
                          <span style={{ fontSize: 13, color: 'var(--text-secondary)', fontWeight: 500 }}>
                            {progressStatus}
                          </span>
                        </div>
                      </div>
                    )}
                  </>
                )}
                <div ref={messagesEndRef} />
              </div>
     
              {/* Error Message Box + Retry Button */}
              {displayError && (
                <div style={{
                  margin: '0 24px 12px',
                  padding: '10px 16px',
                  background: 'rgba(211,47,47,0.08)',
                  border: '1px solid var(--error)',
                  borderRadius: 8,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 12,
                  color: 'var(--error)',
                  fontSize: 13
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1 }}>
                    <AlertTriangle size={16} style={{ flexShrink: 0 }} />
                    <div>{displayError}</div>
                  </div>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexShrink: 0 }}>
                    {currentSession && (
                      <button 
                        onClick={handleRetry}
                        className="btn btn-secondary btn-sm"
                        style={{ 
                          color: 'var(--brand-blue)', 
                          borderColor: 'rgba(2,134,195,0.2)', 
                          padding: '4px 8px', 
                          height: 'auto', 
                          fontSize: 11, 
                          gap: 4,
                          display: 'flex',
                          alignItems: 'center'
                        }}
                        disabled={isProcessing}
                      >
                        <RefreshCw size={10} className={isProcessing ? 'spinner' : ''} />
                        Retry
                      </button>
                    )}
                    <button 
                      onClick={() => {
                        setErrorMsg('')
                        setDismissedError(true)
                      }} 
                      style={{ border: 'none', background: 'none', color: 'var(--error)', cursor: 'pointer', fontWeight: 700, fontSize: 12 }}
                    >
                      Tutup
                    </button>
                  </div>
                </div>
              )}
                 {/* Interactive Controller / Input Area */}
              <div style={{ padding: 20, borderTop: '1px solid var(--border-subtle)', background: 'rgba(255,255,255,0.4)', backdropFilter: 'blur(10px)' }}>
                
                {/* Input Bar */}
                <div style={{ display: 'flex', gap: 10, alignItems: 'center', width: '100%' }}>
                  {/* Text Input */}
                  <input
                    type="text"
                    value={typedText}
                    onChange={(e) => setTypedText(e.target.value)}
                    placeholder="Ceritakan apa yang sedang kamu rasakan..."
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !isProcessing) {
                        sendTextMessage()
                      }
                    }}
                    disabled={isProcessing}
                    style={{
                      flex: 1,
                      padding: '10px 16px',
                      borderRadius: 10,
                      border: '1px solid var(--border)',
                      background: 'var(--bg)',
                      fontSize: 13.5,
                      color: 'var(--text-primary)',
                      outline: 'none',
                      height: 44
                    }}
                  />

                  {/* Send Button */}
                  <button
                    onClick={sendTextMessage}
                    disabled={isProcessing || !typedText.trim()}
                    className="btn btn-primary"
                    style={{ height: 44, padding: '0 16px', borderRadius: 10, display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}
                  >
                    {isProcessing ? <Loader2 size={16} className="spinner" /> : <Send size={16} />}
                    <span style={{ fontSize: 13, fontWeight: 700 }}>Kirim</span>
                  </button>
                </div>
              </div>
            </>
          )}

          {viewState === 'ONBOARDING' && (
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              flex: 1,
              padding: '30px 24px',
              overflowY: 'auto',
              background: 'rgba(255, 255, 255, 0.25)',
              backdropFilter: 'blur(20px)',
              borderRadius: 16
            }}>
              <div style={{ maxWidth: 540, width: '100%', margin: '0 auto' }}>
                <h2 style={{ fontSize: 20, fontWeight: 900, color: 'var(--text-primary)', marginBottom: 4, letterSpacing: '-0.02em' }}>
                  Yuk, Kenalan Dulu Sebelum Curhat!
                </h2>
                <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 24, lineHeight: 1.5 }}>
                  Data ini membantu Teman Curhat agar bisa merespons dengan gaya sapaan, nada, dan empati yang paling cocok buat situasi kamu saat ini.
                </p>

                <form onSubmit={handleStartOnboarding} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  
                  {/* Row 1: Nama Panggilan & Usia */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 120px', gap: 12 }}>
                    <div>
                      <label style={{ display: 'block', fontSize: 12, fontWeight: 700, marginBottom: 6, color: 'var(--text-primary)' }}>
                        Nama Panggilan <span style={{ color: 'var(--error)' }}>*</span>
                      </label>
                      <input
                        type="text"
                        placeholder="Contoh: Budi, Angel, Rian"
                        value={onboardingForm.name}
                        onChange={(e) => setOnboardingForm(prev => ({ ...prev, name: e.target.value }))}
                        style={{
                          width: '100%',
                          padding: '10px 14px',
                          borderRadius: 8,
                          border: '1px solid',
                          borderColor: formErrors.name ? 'var(--error)' : 'var(--border)',
                          background: 'var(--bg)',
                          fontSize: 13,
                          color: 'var(--text-primary)',
                          outline: 'none'
                        }}
                      />
                      {formErrors.name && <span style={{ fontSize: 11, color: 'var(--error)', marginTop: 4, display: 'block' }}>{formErrors.name}</span>}
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: 12, fontWeight: 700, marginBottom: 6, color: 'var(--text-primary)' }}>
                        Usia (Opsional)
                      </label>
                      <input
                        type="number"
                        placeholder="Contoh: 22"
                        value={onboardingForm.age}
                        onChange={(e) => setOnboardingForm(prev => ({ ...prev, age: e.target.value }))}
                        style={{
                          width: '100%',
                          padding: '10px 14px',
                          borderRadius: 8,
                          border: '1px solid var(--border)',
                          background: 'var(--bg)',
                          fontSize: 13,
                          color: 'var(--text-primary)',
                          outline: 'none'
                        }}
                      />
                    </div>
                  </div>

                  {/* Row 2: Status Hubungan & Gender */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    <div>
                      <label style={{ display: 'block', fontSize: 12, fontWeight: 700, marginBottom: 6, color: 'var(--text-primary)' }}>
                        Status Hubungan <span style={{ color: 'var(--error)' }}>*</span>
                      </label>
                      <select
                        value={onboardingForm.status}
                        onChange={(e) => setOnboardingForm(prev => ({ ...prev, status: e.target.value }))}
                        style={{
                          width: '100%',
                          padding: '10px 14px',
                          borderRadius: 8,
                          border: '1px solid',
                          borderColor: formErrors.status ? 'var(--error)' : 'var(--border)',
                          background: 'var(--bg)',
                          fontSize: 13,
                          color: 'var(--text-primary)',
                          outline: 'none',
                          cursor: 'pointer'
                        }}
                      >
                        <option value="">-- Pilih Status --</option>
                        <option value="jomblo">Jomblo</option>
                        <option value="pacaran">Pacaran</option>
                        <option value="pdkt">Pendekatan / PDKT</option>
                        <option value="menikah">Menikah</option>
                        <option value="putus">Baru Putus / Putus</option>
                      </select>
                      {formErrors.status && <span style={{ fontSize: 11, color: 'var(--error)', marginTop: 4, display: 'block' }}>{formErrors.status}</span>}
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: 12, fontWeight: 700, marginBottom: 6, color: 'var(--text-primary)' }}>
                        Sapaan / Panggilan (Opsional)
                      </label>
                      <select
                        value={onboardingForm.gender}
                        onChange={(e) => setOnboardingForm(prev => ({ ...prev, gender: e.target.value }))}
                        style={{
                          width: '100%',
                          padding: '10px 14px',
                          borderRadius: 8,
                          border: '1px solid var(--border)',
                          background: 'var(--bg)',
                          fontSize: 13,
                          color: 'var(--text-primary)',
                          outline: 'none',
                          cursor: 'pointer'
                        }}
                      >
                        <option value="">-- Pilih Panggilan --</option>
                        <option value="Kamu">Kamu (Netral)</option>
                        <option value="Bro">Bro</option>
                        <option value="Sis">Sis</option>
                        <option value="Kak">Kak</option>
                      </select>
                    </div>
                  </div>

                  {/* Row 3: Topik Utama & Tujuan Curhat */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    <div>
                      <label style={{ display: 'block', fontSize: 12, fontWeight: 700, marginBottom: 6, color: 'var(--text-primary)' }}>
                        Topik Curhat <span style={{ color: 'var(--error)' }}>*</span>
                      </label>
                      <select
                        value={onboardingForm.topic}
                        onChange={(e) => setOnboardingForm(prev => ({ ...prev, topic: e.target.value }))}
                        style={{
                          width: '100%',
                          padding: '10px 14px',
                          borderRadius: 8,
                          border: '1px solid',
                          borderColor: formErrors.topic ? 'var(--error)' : 'var(--border)',
                          background: 'var(--bg)',
                          fontSize: 13,
                          color: 'var(--text-primary)',
                          outline: 'none',
                          cursor: 'pointer'
                        }}
                      >
                        <option value="">-- Pilih Topik --</option>
                        <option value="Asmara">Asmara / Cinta</option>
                        <option value="Karir/Pekerjaan">Karir / Pekerjaan</option>
                        <option value="Keluarga">Keluarga</option>
                        <option value="Pertemanan">Pertemanan</option>
                        <option value="Kesehatan Mental">Kesehatan Mental</option>
                        <option value="Lainnya">Lainnya</option>
                      </select>
                      {formErrors.topic && <span style={{ fontSize: 11, color: 'var(--error)', marginTop: 4, display: 'block' }}>{formErrors.topic}</span>}
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: 12, fontWeight: 700, marginBottom: 6, color: 'var(--text-primary)' }}>
                        Tujuan Curhat <span style={{ color: 'var(--error)' }}>*</span>
                      </label>
                      <select
                        value={onboardingForm.goal}
                        onChange={(e) => setOnboardingForm(prev => ({ ...prev, goal: e.target.value }))}
                        style={{
                          width: '100%',
                          padding: '10px 14px',
                          borderRadius: 8,
                          border: '1px solid',
                          borderColor: formErrors.goal ? 'var(--error)' : 'var(--border)',
                          background: 'var(--bg)',
                          fontSize: 13,
                          color: 'var(--text-primary)',
                          outline: 'none',
                          cursor: 'pointer'
                        }}
                      >
                        <option value="">-- Pilih Tujuan --</option>
                        <option value="Hanya Ingin Didengar">Hanya Ingin Didengar / Venting</option>
                        <option value="Butuh Solusi">Butuh Solusi / Saran Konkrit</option>
                        <option value="Butuh Motivasi">Butuh Motivasi / Semangat</option>
                        <option value="Pengen Validasi Emosi">Pengen Validasi Emosi / Penenang</option>
                      </select>
                      {formErrors.goal && <span style={{ fontSize: 11, color: 'var(--error)', marginTop: 4, display: 'block' }}>{formErrors.goal}</span>}
                    </div>
                  </div>

                  {/* Row 4: Tingkat Emosi & Preferensi Respon */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    <div>
                      <label style={{ display: 'block', fontSize: 12, fontWeight: 700, marginBottom: 6, color: 'var(--text-primary)' }}>
                        Kondisi Emosi Saat Ini <span style={{ color: 'var(--error)' }}>*</span>
                      </label>
                      <select
                        value={onboardingForm.emotionLevel}
                        onChange={(e) => setOnboardingForm(prev => ({ ...prev, emotionLevel: e.target.value }))}
                        style={{
                          width: '100%',
                          padding: '10px 14px',
                          borderRadius: 8,
                          border: '1px solid',
                          borderColor: formErrors.emotionLevel ? 'var(--error)' : 'var(--border)',
                          background: 'var(--bg)',
                          fontSize: 13,
                          color: 'var(--text-primary)',
                          outline: 'none',
                          cursor: 'pointer'
                        }}
                      >
                        <option value="">-- Pilih Kondisi --</option>
                        <option value="Sangat Sedih / Kecewa">Sangat Sedih / Kecewa</option>
                        <option value="Cemas / Khawatir / Overthinking">Cemas / Khawatir / Overthinking</option>
                        <option value="Marah / Kesal">Marah / Kesal</option>
                        <option value="Biasa Saja / Flat">Biasa Saja / Flat</option>
                        <option value="Bingung / Kebingungan">Bingung / Kebingungan</option>
                      </select>
                      {formErrors.emotionLevel && <span style={{ fontSize: 11, color: 'var(--error)', marginTop: 4, display: 'block' }}>{formErrors.emotionLevel}</span>}
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: 12, fontWeight: 700, marginBottom: 6, color: 'var(--text-primary)' }}>
                        Preferensi Gaya Respon <span style={{ color: 'var(--error)' }}>*</span>
                      </label>
                      <div style={{ display: 'flex', gap: 16, marginTop: 8 }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, cursor: 'pointer', color: 'var(--text-primary)' }}>
                          <input
                            type="radio"
                            name="aiResponsePreference"
                            value="santai"
                            checked={onboardingForm.aiResponsePreference === 'santai'}
                            onChange={() => setOnboardingForm(prev => ({ ...prev, aiResponsePreference: 'santai' }))}
                            style={{ cursor: 'pointer' }}
                          />
                          Santai (Gen Z)
                        </label>
                        <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, cursor: 'pointer', color: 'var(--text-primary)' }}>
                          <input
                            type="radio"
                            name="aiResponsePreference"
                            value="serius"
                            checked={onboardingForm.aiResponsePreference === 'serius'}
                            onChange={() => setOnboardingForm(prev => ({ ...prev, aiResponsePreference: 'serius' }))}
                            style={{ cursor: 'pointer' }}
                          />
                          Lebih Serius
                        </label>
                      </div>
                    </div>
                  </div>

                  {/* Submit Button */}
                  <div style={{ display: 'flex', gap: 12, marginTop: 12, justifyContent: 'flex-end' }}>
                    <button
                      type="button"
                      onClick={() => setViewState('LANDING')}
                      className="btn btn-secondary"
                      style={{ borderRadius: 8, padding: '10px 18px', fontSize: 13 }}
                    >
                      Batal
                    </button>
                    <button
                      type="submit"
                      className="btn btn-primary"
                      disabled={isProcessing}
                      style={{ borderRadius: 8, padding: '10px 24px', fontSize: 13, display: 'flex', alignItems: 'center', gap: 6 }}
                    >
                      {isProcessing ? <Loader2 size={14} className="spinner" /> : <ChevronRight size={14} />}
                      Mulai Curhat
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {viewState === 'LANDING' && (
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              flex: 1,
              padding: '40px 24px',
              overflowY: 'auto',
              textAlign: 'center',
              background: 'rgba(255, 255, 255, 0.25)',
              backdropFilter: 'blur(20px)',
              borderRadius: 16
            }}>
              {/* Hero Intro */}
              <div style={{ maxWidth: 640, margin: '0 auto' }}>
                <div style={{ width: 80, height: 80, borderRadius: '50%', background: 'rgba(239, 68, 68, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#EF4444', margin: '0 auto 24px', boxShadow: '0 8px 30px rgba(239, 68, 68, 0.2)' }} className="animate-pulse-soft">
                  <Heart size={36} fill="#EF4444" />
                </div>
                <h1 style={{ fontSize: '2.5rem', fontWeight: 900, color: 'var(--text-primary)', marginBottom: 12, letterSpacing: '-0.03em', lineHeight: 1.15 }}>
                  Teman Curhat
                </h1>
                <p style={{ fontSize: '1.1rem', color: 'var(--text-secondary)', marginBottom: 32, lineHeight: 1.6 }}>
                  Ruang aman, privat, dan bebas penghakiman untuk menuangkan keluh kesahmu. Ceritakan apa saja dengan santai, kami siap mendengarkan dan mendukungmu secara emosional dengan hangat.
                </p>
                
                {/* CTA Button */}
                <button
                  className="btn btn-primary"
                  onClick={() => setViewState('ONBOARDING')}
                  style={{
                    padding: '14px 32px',
                    fontSize: '1rem',
                    fontWeight: 700,
                    borderRadius: 12,
                    gap: 8,
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 10px 25px rgba(2, 134, 195, 0.35)',
                    border: 'none',
                    cursor: 'pointer',
                    transition: 'transform 0.2s ease, box-shadow 0.2s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-2px)'
                    e.currentTarget.style.boxShadow = '0 12px 30px rgba(2, 134, 195, 0.45)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)'
                    e.currentTarget.style.boxShadow = '0 10px 25px rgba(2, 134, 195, 0.35)'
                  }}
                >
                  <MessageSquare size={18} />
                  Mulai Curhat Baru
                </button>
              </div>

              {/* Features Preview */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: 20,
                width: '100%',
                maxWidth: 760,
                marginTop: 48,
                marginBottom: 40
              }}>
                <div style={{ padding: 20, background: 'rgba(255, 255, 255, 0.65)', borderRadius: 12, border: '1px solid rgba(255, 255, 255, 0.4)', textAlign: 'left', boxShadow: 'var(--shadow-raised)' }}>
                  <div style={{ color: 'var(--brand-blue)', fontWeight: 800, fontSize: 14, marginBottom: 6 }}>Validasi Emosi</div>
                  <p style={{ fontSize: 12.5, color: 'var(--text-secondary)', margin: 0, lineHeight: 1.5 }}>
                    Sistem memahami kesedihan, kemarahan, atau kecemasanmu dan memvalidasinya secara hangat.
                  </p>
                </div>
                <div style={{ padding: 20, background: 'rgba(255, 255, 255, 0.65)', borderRadius: 12, border: '1px solid rgba(255, 255, 255, 0.4)', textAlign: 'left', boxShadow: 'var(--shadow-raised)' }}>
                  <div style={{ color: 'var(--brand-blue)', fontWeight: 800, fontSize: 14, marginBottom: 6 }}>Gaya Gen Z Santai</div>
                  <p style={{ fontSize: 12.5, color: 'var(--text-secondary)', margin: 0, lineHeight: 1.5 }}>
                    Obrolan yang mengalir kasual, serasa curhat dengan teman dekat atau sahabat sendiri.
                  </p>
                </div>
                <div style={{ padding: 20, background: 'rgba(255, 255, 255, 0.65)', borderRadius: 12, border: '1px solid rgba(255, 255, 255, 0.4)', textAlign: 'left', boxShadow: 'var(--shadow-raised)' }}>
                  <div style={{ color: 'var(--brand-blue)', fontWeight: 800, fontSize: 14, marginBottom: 6 }}>100% Aman & Privat</div>
                  <p style={{ fontSize: 12.5, color: 'var(--text-secondary)', margin: 0, lineHeight: 1.5 }}>
                    Seluruh obrolan dilindungi enkripsi. Curhatanmu tidak akan dibagikan ke siapa pun.
                  </p>
                </div>
              </div>

              {/* Security & Privacy details */}
              <div style={{
                fontSize: 12,
                color: 'var(--text-muted)',
                maxWidth: 480,
                lineHeight: 1.5,
                borderTop: '1px solid var(--border-subtle)',
                paddingTop: 16,
                width: '100%'
              }}>
                Semua data curhat disimpan dengan privasi penuh di sistem terenkripsi kami. Sesi chat dapat Anda hapus secara permanen kapan saja melalui tombol hapus di menu riwayat.
              </div>
            </div>
          )}
        </div>
 
      </div>
 
      {/* CSS untuk hover-show, waveform-bar, dan transisi */}
      <style jsx global>{`
        .hover-show {
          opacity: 0;
          transition: opacity 150ms ease;
        }
        .card-hover:hover .hover-show {
          opacity: 1;
        }
        @keyframes pulse-soft {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.7; }
        }
        .animate-pulse-soft {
          animation: pulse-soft 2s infinite ease-in-out;
        }
        .waveform-bar {
          display: inline-block;
          width: 3px;
          background-color: var(--error);
          border-radius: 3px;
          animation: bounce-wave 0.8s ease-in-out infinite alternate;
          transform-origin: bottom;
        }
        @keyframes bounce-wave {
          0% { transform: scaleY(0.25); }
          100% { transform: scaleY(1.2); }
        }

        /* Responsive Layout Voice Talk */
        .voice-talk-layout {
          display: grid;
          grid-template-columns: 260px 1fr;
          gap: 24px;
          min-height: calc(100vh - 120px);
        }

        .voice-talk-sidebar {
          padding: 16px;
          display: flex;
          flex-direction: column;
          gap: 16px;
          height: 100%;
        }

        .voice-talk-header {
          padding: 16px 24px;
          border-bottom: 1px solid var(--border-subtle);
          display: flex;
          align-items: center;
          justify-content: space-between;
          background: rgba(255,255,255,0.2);
          gap: 16px;
          flex-wrap: wrap;
        }

        .voice-talk-header-info {
          flex: 1;
          min-width: 320px;
        }

        .voice-talk-header-info h2 {
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .voice-talk-header-controls {
          display: flex;
          gap: 8px;
          align-items: center;
          flex-wrap: wrap;
        }

        .mobile-sidebar-toggle {
          display: none !important;
        }

        .voice-talk-messages-area {
          flex: 1;
          padding: 24px;
          overflow-y: auto;
          display: flex;
          flex-direction: column;
          gap: 20px;
          min-height: 320px;
        }

        .voice-talk-bubble {
          max-width: 75%;
          padding: 12px 18px;
          border-radius: 16px;
        }

        .voice-talk-input-area {
          padding: 20px;
          border-top: 1px solid var(--border-subtle);
          background: rgba(255,255,255,0.4);
          backdrop-filter: blur(10px);
        }

        .sidebar-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(15, 23, 42, 0.3);
          backdrop-filter: blur(4px);
          z-index: 999;
        }

        @media (max-width: 991px) {
          .voice-talk-layout {
            grid-template-columns: 1fr;
            gap: 0;
            min-height: calc(100vh - 90px);
            position: relative;
          }

          .voice-talk-sidebar {
            position: fixed;
            top: 0;
            left: 0;
            width: 280px;
            height: 100vh;
            z-index: 1000;
            background: rgba(255, 255, 255, 0.95);
            backdrop-filter: blur(20px);
            border-right: 1px solid var(--border-subtle);
            box-shadow: 10px 0 30px rgba(0, 0, 0, 0.15);
            padding: 24px 16px;
            transform: translateX(-100%);
            transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            display: flex !important;
          }

          .voice-talk-sidebar.open {
            transform: translateX(0);
          }

          .mobile-sidebar-toggle {
            display: flex !important;
          }
        }

        @media (max-width: 768px) {
          .voice-talk-header {
            padding: 12px 16px;
            flex-direction: column;
            align-items: stretch;
            gap: 12px;
          }

          .voice-talk-header-info h2 {
            white-space: normal;
          }

          .voice-talk-header-controls {
            justify-content: flex-start;
            width: 100%;
            gap: 8px;
          }
          
          .suara-label {
            display: none !important;
          }

          .voice-talk-messages-area {
            padding: 16px 12px;
            gap: 16px;
          }

          .voice-talk-bubble {
            max-width: 88%;
            padding: 10px 14px;
          }

          .voice-talk-input-area {
            padding: 12px;
          }
        }

        @media (max-width: 500px) {
          .waveform-container {
            display: none !important;
          }
        }
      `}</style>

      {/* Custom Premium Modal Dialog */}
      {dialog.isOpen && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(15, 23, 42, 0.4)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: 20
        }} className="animate-fadein">
          <div style={{
            background: 'rgba(255, 255, 255, 0.85)',
            border: '1px solid rgba(255, 255, 255, 0.5)',
            boxShadow: '0 20px 40px -10px rgba(15, 23, 42, 0.25), 0 0 1px 1px rgba(255, 255, 255, 0.8) inset',
            borderRadius: 16,
            width: '100%',
            maxWidth: 440,
            padding: 24,
            display: 'flex',
            flexDirection: 'column',
            gap: 16,
            backdropFilter: 'blur(20px)',
            transform: 'scale(1)',
            transition: 'all 200ms cubic-bezier(0.34, 1.56, 0.64, 1)'
          }} className="animate-scale-up">
            
            {/* Header */}
            <div>
              <h3 style={{
                fontSize: 16,
                fontWeight: 800,
                color: 'var(--text-primary)',
                margin: 0
              }}>
                {dialog.title}
              </h3>
              <p style={{
                fontSize: 13.5,
                color: 'var(--text-secondary)',
                marginTop: 6,
                lineHeight: 1.5,
                margin: '6px 0 0'
              }}>
                {dialog.message}
              </p>
            </div>

            {/* Input for Prompt */}
            {dialog.type === 'prompt' && (
              <input
                type="text"
                placeholder={dialog.placeholder}
                value={dialogInput}
                onChange={e => setDialogInput(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  borderRadius: 8,
                  border: '1px solid var(--border)',
                  background: 'var(--bg)',
                  fontSize: 13.5,
                  color: 'var(--text-primary)',
                  outline: 'none',
                  boxShadow: 'var(--shadow-inner)'
                }}
                autoFocus
                onKeyDown={e => {
                  if (e.key === 'Enter') {
                    dialog.onConfirm(dialogInput)
                  }
                }}
              />
            )}

            {/* Buttons */}
            <div style={{
              display: 'flex',
              justifyContent: 'flex-end',
              gap: 10,
              marginTop: 4
            }}>
              {dialog.type !== 'alert' && (
                <button
                  onClick={() => {
                    if (dialog.onCancel) dialog.onCancel()
                    else closeDialog()
                  }}
                  className="btn btn-secondary"
                  style={{
                    fontSize: 13,
                    padding: '8px 16px',
                    height: 'auto',
                    borderRadius: 8
                  }}
                >
                  Batal
                </button>
              )}
              <button
                onClick={() => {
                  dialog.onConfirm(dialogInput)
                }}
                className="btn btn-primary"
                style={{
                  fontSize: 13,
                  padding: '8px 16px',
                  height: 'auto',
                  borderRadius: 8,
                  background: dialog.type === 'confirm' && dialog.title.toLowerCase().includes('hapus') ? 'var(--error)' : 'var(--brand-blue)'
                }}
              >
                {dialog.type === 'confirm' && dialog.title.toLowerCase().includes('hapus') ? 'Hapus' : 'Oke'}
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Global CSS for dialog fade-in and scale-up animations */}
      <style jsx global>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes scaleUp {
          from { transform: scale(0.95); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
        .animate-fadein {
          animation: fadeIn 200ms ease-out forwards;
        }
        .animate-scale-up {
          animation: scaleUp 250ms cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
        }
      `}</style>
    </>
  )
}
