'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Search, Clock, ChevronRight, CheckCircle, Play, RefreshCw, Lock, AlertTriangle, X } from 'lucide-react'
import * as Icons from 'lucide-react'

interface AssessmentItem {
  id: string
  title: string
  description: string
  duration: string
  icon: string
  color: string
  completed: boolean
  dominant: string | null
  completedAt: string | null
  hasProgress: boolean
  progressSessionId: string | null
  progressPercent: number
  category?: string
}

export default function AssessmentPage() {
  const router = useRouter()
  const [search, setSearch] = useState('')
  const [activeCategory, setActiveCategory] = useState('semua')
  const [assessments, setAssessments] = useState<AssessmentItem[]>([])
  const [loading, setLoading] = useState(true)
  const [activePlan, setActivePlan] = useState('free')

  // Lock Warning Modal State
  const [lockModal, setLockModal] = useState({
    isOpen: false,
    title: '',
    message: '',
    requiredPlan: ''
  })

  const categories = [
    { id: 'semua', label: 'Semua' },
    { id: 'core', label: 'Dasar' },
    { id: 'communication', label: 'Komunikasi' },
    { id: 'emotion', label: 'Emosi & Regulasi' },
    { id: 'conflict', label: 'Konflik' },
  ]

  // Plan-based Quiz Access Logic (client side validation)
  const checkQuizAccess = (plan: string, categoryId: string) => {
    if (plan === 'admin') return true;
    const freeCategories = ['love-language', 'communication-style', 'attachment-style'];
    const basicCategories = [
      ...freeCategories,
      'boundaries', 'emotion-regulation', 'stress-reaction', 'self-awareness', 'trust', 'trust-style', 'validation-needs'
    ];
    const premiumCategories = [
      ...basicCategories,
      'relationship-patterns', 'relationship-readiness', 'emotional-needs', 'intimacy'
    ];
    const coupleCategories = [
      ...premiumCategories,
      'conflict-response' // Kuis Pasangan (Couple Plan only)
    ];

    if (plan === 'free') return freeCategories.includes(categoryId);
    if (plan === 'basic') return basicCategories.includes(categoryId);
    if (plan === 'premium') return premiumCategories.includes(categoryId);
    if (plan === 'couple') return coupleCategories.includes(categoryId);
    return false;
  }

  // Get required plan for warning message
  const getRequiredPlan = (categoryId: string): { key: string; name: string } => {
    const freeCategories = ['love-language', 'communication-style', 'attachment-style'];
    if (freeCategories.includes(categoryId)) return { key: 'free', name: 'Gratis' };

    const basicCategories = ['boundaries', 'emotion-regulation', 'stress-reaction', 'self-awareness', 'trust', 'trust-style', 'validation-needs'];
    if (basicCategories.includes(categoryId)) return { key: 'basic', name: 'Basic' };

    const coupleCategories = ['conflict-response'];
    if (coupleCategories.includes(categoryId)) return { key: 'couple', name: 'Couple Plan' };

    return { key: 'premium', name: 'Premium' };
  }

  useEffect(() => {
    const fetchAssessments = async () => {
      try {
        // 1. Get active plan
        const billRes = await fetch('/api/user/billing')
        const billData = await billRes.json()
        let currentPlan = 'free'
        if (billData.success && billData.activeSubscription) {
          currentPlan = billData.activeSubscription.planId
        }
        setActivePlan(currentPlan)

        // 2. Get assessments
        const res = await fetch('/api/assessment/list')
        const data = await res.json() as { success: boolean; assessments: AssessmentItem[] }
        if (data.success) {
          setAssessments(data.assessments)
        }
      } catch (e) {
        console.error('Failed to fetch assessments:', e)
      } finally {
        setLoading(false)
      }
    }
    fetchAssessments()
  }, [])

  const filtered = assessments.filter(a => {
    const matchSearch = a.title.toLowerCase().includes(search.toLowerCase()) ||
      a.description.toLowerCase().includes(search.toLowerCase())
    const matchCat = activeCategory === 'semua' || a.category === activeCategory
    return matchSearch && matchCat
  })

  const completedCount = assessments.filter(a => a.completed).length
  const totalCount = assessments.length || 1

  // Dynamic Lucide Icon Resolver
  const renderIcon = (iconName: string, color: string, isLocked: boolean) => {
    const IconComponent = (Icons as unknown as Record<string, React.ComponentType<{ size?: number }>>)[iconName] || Icons.ClipboardList
    return (
      <div style={{
        width: 44, height: 44, borderRadius: 10,
        background: isLocked ? 'rgba(255, 255, 255, 0.04)' : `${color}15`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        marginBottom: 14,
        color: isLocked ? 'var(--text-muted)' : color,
      }}>
        <IconComponent size={20} />
      </div>
    )
  }

  const handleLockedClick = (categoryId: string) => {
    const req = getRequiredPlan(categoryId)
    setLockModal({
      isOpen: true,
      title: 'Fitur ini belum kebuka',
      message: 'Tenang, fitur ini cuma bisa dipakai di paket yang lebih tinggi. Upgrade dulu biar aksesnya langsung kebuka semua.',
      requiredPlan: req.key
    })
  }

  return (
    <div className="animate-fadein">
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, marginBottom: 4 }}>Assessment Center</h1>
        <p style={{ color: 'var(--text-secondary)', margin: '0 0 20px' }}>
          {completedCount} dari {totalCount} selesai — temukan pola dirimu dengan rangkaian tes berbasis AI.
        </p>

        {/* Overall progress */}
        <div className="card" style={{ padding: '16px 20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>
              Progress keseluruhan
            </span>
            <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--brand-blue)' }}>
              {Math.round((completedCount / totalCount) * 100)}%
            </span>
          </div>
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: `${(completedCount / totalCount) * 100}%` }} />
          </div>
          <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 8, margin: '8px 0 0' }}>
            Setiap assessment dirancang unik untuk membantu kamu melihat pola relasi dan kepribadian yang sesungguhnya.
          </p>
        </div>
      </div>

      {/* Search & Filter */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
          <Search size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input
            className="input"
            placeholder="Cari assessment..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ paddingLeft: 38 }}
          />
        </div>
      </div>

      {/* Category pills */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 24, overflowX: 'auto', paddingBottom: 4 }}>
        {categories.map(cat => (
          <button
            key={cat.id}
            onClick={() => setActiveCategory(cat.id)}
            className="btn btn-sm"
            style={{
              flexShrink: 0,
              background: activeCategory === cat.id ? 'var(--brand-blue)' : 'var(--surface)',
              color: activeCategory === cat.id ? 'white' : 'var(--text-secondary)',
              borderColor: activeCategory === cat.id ? 'var(--brand-blue)' : 'var(--border)',
            }}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Assessment grid */}
      {loading ? (
        <div style={{ padding: 40, textAlign: 'center' }}>
          <div className="spinner" style={{ borderColor: 'rgba(2,134,195,0.2)', borderTopColor: 'var(--brand-blue)', width: 32, height: 32, margin: '0 auto 12px' }} />
          <p style={{ color: 'var(--text-secondary)', fontSize: 13 }}>Memuat assessment...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="empty-state">
          <Search size={36} color="var(--text-muted)" />
          <h3>Nggak ketemu</h3>
          <p>Coba kata kunci lain atau ganti filter kategori.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
          {filtered.map((assessment, i) => {
            const isCompleted = assessment.completed
            const color = assessment.color || '#0286C3'
            const hasProgress = assessment.hasProgress
            const hasAccess = checkQuizAccess(activePlan, assessment.id)

            const cardContent = (
              <div
                className="card card-hover"
                style={{
                  padding: 20, height: '100%',
                  position: 'relative',
                  border: isCompleted ? '1px solid rgba(23,184,151,0.3)' : hasProgress ? '1px solid rgba(2,134,195,0.3)' : '1px solid var(--border-subtle)',
                  animationDelay: `${i * 40}ms`,
                  display: 'flex',
                  flexDirection: 'column',
                  opacity: hasAccess ? 1 : 0.65,
                  background: hasAccess ? 'var(--surface)' : 'rgba(255,255,255,0.02)',
                }}
              >
                {!hasAccess ? (
                  <div style={{ position: 'absolute', top: 12, right: 12, color: 'var(--text-muted)' }}>
                    <Lock size={16} />
                  </div>
                ) : isCompleted ? (
                  <div style={{ position: 'absolute', top: 12, right: 12 }}>
                    <CheckCircle size={18} color="var(--teal)" />
                  </div>
                ) : null}

                {renderIcon(assessment.icon, color, !hasAccess)}

                <h3 style={{ fontSize: 15, marginBottom: 6, paddingRight: isCompleted || !hasAccess ? 24 : 0, color: hasAccess ? 'var(--text-primary)' : 'var(--text-secondary)' }}>
                  {assessment.title}
                </h3>
                <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: '0 0 14px', lineHeight: 1.5 }}>
                  {assessment.description}
                </p>

                {hasProgress && hasAccess && (
                  <div style={{ marginBottom: 14 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--brand-blue)', marginBottom: 4, fontWeight: 600 }}>
                      <span>Lanjut pengerjaan</span>
                      <span>{assessment.progressPercent}%</span>
                    </div>
                    <div className="progress-bar" style={{ height: 4 }}>
                      <div className="progress-fill" style={{ width: `${assessment.progressPercent}%`, background: 'var(--brand-blue)' }} />
                    </div>
                  </div>
                )}

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 14, borderTop: '1px solid var(--border-subtle)', marginTop: 'auto' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--text-muted)' }}>
                    <Clock size={12} />
                    {assessment.duration}
                  </div>

                  {!hasAccess ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600 }}>Terkunci</span>
                      <Lock size={10} color="var(--text-muted)" />
                    </div>
                  ) : isCompleted ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ fontSize: 12, color: 'var(--teal)', fontWeight: 600 }}>
                        {assessment.dominant || 'Lihat Hasil'}
                      </span>
                      <ChevronRight size={12} color="var(--teal)" style={{ marginTop: 1 }} />
                    </div>
                  ) : hasProgress ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ fontSize: 12, color: 'var(--brand-blue)', fontWeight: 600 }}>Lanjutkan</span>
                      <RefreshCw size={12} className="animate-spin-slow" color="var(--brand-blue)" />
                    </div>
                  ) : (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ fontSize: 12, color: 'var(--brand-blue)', fontWeight: 600 }}>Mulai</span>
                      <Play size={10} fill="var(--brand-blue)" color="var(--brand-blue)" />
                    </div>
                  )}
                </div>
              </div>
            )

            if (hasAccess) {
              return (
                <Link
                  key={assessment.id}
                  href={`/assessment/${assessment.id}`}
                  style={{ textDecoration: 'none' }}
                  className="animate-fadein"
                >
                  {cardContent}
                </Link>
              )
            } else {
              return (
                <div
                  key={assessment.id}
                  onClick={() => handleLockedClick(assessment.id)}
                  style={{ cursor: 'pointer' }}
                  className="animate-fadein"
                >
                  {cardContent}
                </div>
              )
            }
          })}
        </div>
      )}

      {/* Lock Warning Upgrade Modal */}
      {lockModal.isOpen && (
        <div
          onClick={() => setLockModal(prev => ({ ...prev, isOpen: false }))}
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
              onClick={() => setLockModal(prev => ({ ...prev, isOpen: false }))}
              style={{
                position: 'absolute', top: 16, right: 16,
                border: 'none', background: 'none', color: 'var(--text-muted)',
                cursor: 'pointer', padding: 4
              }}
              title="Tutup"
              aria-label="Tutup"
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
            }}>{lockModal.title}</h3>

            <p style={{
              fontSize: '14px',
              color: 'var(--text-secondary)',
              lineHeight: 1.6,
              margin: '0 0 24px 0',
            }}>{lockModal.message}</p>

            <div style={{ display: 'flex', gap: 12, width: '100%' }}>
              <button
                className="btn btn-secondary"
                onClick={() => setLockModal(prev => ({ ...prev, isOpen: false }))}
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
                  setLockModal(prev => ({ ...prev, isOpen: false }))
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

      <style jsx>{`
        @media (max-width: 767px) {
          div { grid-template-columns: 1fr !important; }
        }
        @media (min-width: 768px) and (max-width: 1023px) {
          div { grid-template-columns: repeat(2, 1fr) !important; }
        }
      `}</style>
    </div>
  )
}
