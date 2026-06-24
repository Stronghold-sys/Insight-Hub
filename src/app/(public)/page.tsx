'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useState, useEffect } from 'react'
import {
  ArrowRight, CheckCircle, Star, TrendingUp, MessageSquare,
  BookOpen, Activity, ClipboardList, Users, Shield,
  ChevronDown, Play, BarChart2, Zap, Heart, Lock
} from 'lucide-react'
import {
  TESTIMONIALS, PRICING_PLANS, FAQS, HOW_IT_WORKS,
  FEATURES_HIGHLIGHT, BLOG_POSTS
} from '@/lib/data'

// ========================
// HERO SECTION
// ========================
function HeroSection() {
  const [activeWord, setActiveWord] = useState(0)
  const words = ['attachment style', 'love language', 'pola konflik', 'kebutuhan emosional', 'gaya komunikasi']

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveWord(prev => (prev + 1) % words.length)
    }, 2500)
    return () => clearInterval(interval)
  }, [])

  return (
    <section className="hero-gradient" style={{ paddingTop: 80, paddingBottom: 96, overflow: 'hidden', position: 'relative' }}>
      {/* Decorative blobs */}
      <div style={{
        position: 'absolute', top: -80, right: -80, width: 400, height: 400,
        borderRadius: '50%', background: 'rgba(2,134,195,0.06)', pointerEvents: 'none',
      }} />
      <div style={{
        position: 'absolute', bottom: -60, left: -60, width: 320, height: 320,
        borderRadius: '50%', background: 'rgba(23,184,151,0.06)', pointerEvents: 'none',
      }} />

      <div className="container">
        <div style={{ maxWidth: 720, margin: '0 auto', textAlign: 'center' }}>
          {/* Pill badge */}
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, marginBottom: 24 }}>
            <span className="badge badge-blue">
              <Star size={10} fill="currentColor" />
              Platform #1 untuk Self-Awareness Relasi
            </span>
          </div>

          <h1 style={{
            fontSize: 'clamp(28px, 5vw, 52px)',
            fontWeight: 800,
            lineHeight: 1.15,
            letterSpacing: '-0.02em',
            marginBottom: 16,
            color: 'var(--text-primary)',
          }}>
            Akhirnya ngerti kenapa{' '}
            <br className="hidden-mobile" />
            <span style={{
              background: 'linear-gradient(135deg, #0286C3, #17B897)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              display: 'inline-block',
              minWidth: 280,
            }}>
              {words[activeWord]}
            </span>
            {' '}kamu kayak gini
          </h1>

          <p style={{
            fontSize: 18, lineHeight: 1.7,
            color: 'var(--text-secondary)',
            maxWidth: 560, margin: '0 auto 40px',
          }}>
            Platform self-awareness berbasis sains yang bantu kamu baca pola diri sendiri —
            bukan buat nge-judge, tapi buat ngerti dan tumbuh bareng.
          </p>

          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 48 }}>
            <Link href="/daftar" className="btn btn-primary btn-xl">
              Gas mulai dari sini
              <ArrowRight size={18} />
            </Link>
            <Link href="/demo" className="btn btn-secondary btn-xl" style={{ gap: 8 }}>
              <div style={{
                width: 28, height: 28, borderRadius: '50%',
                background: 'rgba(2,134,195,0.1)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <Play size={12} fill="var(--brand-blue)" color="var(--brand-blue)" style={{ marginLeft: 2 }} />
              </div>
              Lihat demo dulu
            </Link>
          </div>

          {/* Social proof strip */}
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 24, flexWrap: 'wrap',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ display: 'flex' }}>
                {TESTIMONIALS.slice(0, 4).map((t, i) => (
                  <div key={t.id} style={{
                    width: 28, height: 28, borderRadius: '50%', overflow: 'hidden',
                    border: '2px solid white', marginLeft: i > 0 ? -8 : 0,
                    position: 'relative',
                  }}>
                    <Image src={t.avatar} alt={t.name} fill style={{ objectFit: 'cover' }} />
                  </div>
                ))}
              </div>
              <span style={{ fontSize: 13, color: 'var(--text-secondary)', fontWeight: 500 }}>
                Dipercaya <strong style={{ color: 'var(--text-primary)' }}>10.000+</strong> user
              </span>
            </div>
            <div style={{ width: 1, height: 20, background: 'var(--border)' }} />
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              {[1,2,3,4,5].map(s => (
                <Star key={s} size={14} fill="#F5A623" color="#F5A623" />
              ))}
              <span style={{ fontSize: 13, color: 'var(--text-secondary)', fontWeight: 500 }}>
                <strong style={{ color: 'var(--text-primary)' }}>4.9/5</strong> rating
              </span>
            </div>
            <div style={{ width: 1, height: 20, background: 'var(--border)' }} />
            <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
              <strong style={{ color: 'var(--teal)' }}>Gratis</strong> untuk mulai
            </span>
          </div>
        </div>

        {/* Dashboard preview */}
        <div style={{
          marginTop: 64, borderRadius: 12, overflow: 'hidden',
          boxShadow: '0 24px 80px rgba(0,0,0,0.12)',
          border: '1px solid var(--border-subtle)',
          maxWidth: 960, margin: '64px auto 0',
          position: 'relative',
        }}>
          {/* Fake browser bar */}
          <div style={{
            background: '#F0F2F4', padding: '10px 16px',
            display: 'flex', alignItems: 'center', gap: 8,
            borderBottom: '1px solid var(--border-subtle)',
          }}>
            <div style={{ display: 'flex', gap: 6 }}>
              {['#FF6058', '#FFBD2E', '#27C93F'].map(c => (
                <div key={c} style={{ width: 10, height: 10, borderRadius: '50%', background: c }} />
              ))}
            </div>
            <div style={{
              flex: 1, background: 'white', borderRadius: 6, padding: '4px 12px',
              fontSize: 12, color: 'var(--text-muted)', maxWidth: 300, margin: '0 auto',
              border: '1px solid var(--border-subtle)',
            }}>
              app.insighthub.id/dashboard
            </div>
          </div>

          {/* Dashboard mockup */}
          <div style={{
            background: '#F7F9FA', padding: 24, minHeight: 400,
            display: 'grid', gridTemplateColumns: '200px 1fr', gap: 16,
          }}>
            {/* Sidebar mockup */}
            <div style={{ background: '#1B1E28', borderRadius: 8, padding: 16 }}>
              <div style={{ marginBottom: 24 }}>
                <div className="skeleton" style={{ height: 32, width: 140, marginBottom: 8, background: 'rgba(255,255,255,0.1)' }} />
              </div>
              {['Dashboard', 'Assessment', 'Mood Tracker', 'Journal', 'Chat Analyzer', 'Insight'].map((item, i) => (
                <div key={item} style={{
                  display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px',
                  borderRadius: 6, marginBottom: 4,
                  background: i === 0 ? 'rgba(2,134,195,0.2)' : 'transparent',
                }}>
                  <div style={{ width: 14, height: 14, borderRadius: 3, background: i === 0 ? 'var(--brand-blue)' : 'rgba(255,255,255,0.2)' }} />
                  <div style={{ width: 80, height: 10, borderRadius: 4, background: i === 0 ? 'var(--brand-blue)' : 'rgba(255,255,255,0.15)' }} />
                </div>
              ))}
            </div>

            {/* Main content mockup */}
            <div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 16 }}>
                {[
                  { label: 'Streak', value: '12 hari', color: 'var(--teal)' },
                  { label: 'Assessment', value: '8/19', color: 'var(--brand-blue)' },
                  { label: 'Mood hari ini', value: 'Calm', color: 'var(--warning)' },
                ].map(stat => (
                  <div key={stat.label} className="card" style={{ padding: 16 }}>
                    <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: '0 0 4px', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>{stat.label}</p>
                    <p style={{ fontSize: 22, fontWeight: 700, color: stat.color, margin: 0 }}>{stat.value}</p>
                  </div>
                ))}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div className="card" style={{ padding: 16 }}>
                  <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 12 }}>Mood 7 Hari Terakhir</p>
                  <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, height: 60 }}>
                    {[60, 30, 90, 70, 20, 80, 65].map((h, i) => (
                      <div key={i} style={{ flex: 1, borderRadius: '3px 3px 0 0', height: `${h}%`, background: `linear-gradient(to top, #0286C3, #17B897)`, opacity: 0.7 + i * 0.04 }} />
                    ))}
                  </div>
                </div>
                <div className="card" style={{ padding: 16 }}>
                  <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 12 }}>Insight Terbaru</p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {['Attachment style: Anxious (72%)', 'Love language dominan: Quality Time', 'Komunikasi: Direct tapi rawan defensif'].map(item => (
                      <div key={item} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--brand-blue)', flexShrink: 0 }} />
                        <span style={{ fontSize: 11, color: 'var(--text-secondary)', lineHeight: 1.3 }}>{item}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

// ========================
// STATS SECTION
// ========================
function StatsSection() {
  const stats = [
    { value: '10.000+', label: 'User aktif', icon: Users },
    { value: '19', label: 'Assessment tersedia', icon: ClipboardList },
    { value: '94%', label: 'User ngerasa lebih paham diri sendiri', icon: TrendingUp },
    { value: '4.9', label: 'Rating rata-rata', icon: Star },
  ]

  return (
    <section style={{ padding: '48px 0', borderBottom: '1px solid var(--border-subtle)' }}>
      <div className="container">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 24 }}>
          {stats.map(({ value, label, icon: Icon }) => (
            <div key={label} style={{ textAlign: 'center', padding: '24px 16px' }}>
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 8 }}>
                <div className="feature-icon-box">
                  <Icon size={20} />
                </div>
              </div>
              <p style={{ fontSize: 32, fontWeight: 800, color: 'var(--text-primary)', margin: '0 0 4px', letterSpacing: '-0.02em' }}>{value}</p>
              <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: 0 }}>{label}</p>
            </div>
          ))}
        </div>
      </div>

      <style jsx>{`
        @media (min-width: 768px) {
          div > div {
            grid-template-columns: repeat(4, 1fr) !important;
          }
        }
      `}</style>
    </section>
  )
}

// ========================
// FEATURES SECTION
// ========================
function FeaturesSection() {
  const [active, setActive] = useState(0)
  const feature = FEATURES_HIGHLIGHT[active]

  return (
    <section className="section">
      <div className="container">
        <div style={{ textAlign: 'center', marginBottom: 48 }}>
          <span className="badge badge-blue" style={{ marginBottom: 12 }}>Fitur</span>
          <h2>Semua yang kamu butuhkan buat ngerti diri sendiri</h2>
          <p style={{ maxWidth: 480, margin: '12px auto 0' }}>
            Bukan sekadar quiz. Ini ekosistem lengkap buat self-awareness yang beneran bisa kamu pakai.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 48, alignItems: 'center' }}>
          {/* Feature tabs */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {FEATURES_HIGHLIGHT.map((f, i) => (
              <button
                key={f.id}
                onClick={() => setActive(i)}
                style={{
                  display: 'flex', alignItems: 'flex-start', gap: 16,
                  padding: '16px', borderRadius: 8, border: 'none', textAlign: 'left',
                  background: active === i ? 'var(--surface)' : 'transparent',
                  cursor: 'pointer',
                  boxShadow: active === i ? 'var(--shadow-raised)' : 'none',
                  borderLeft: active === i ? `3px solid ${f.color}` : '3px solid transparent',
                  transition: 'all 200ms ease',
                }}
              >
                <div style={{
                  width: 40, height: 40, borderRadius: 8, flexShrink: 0,
                  background: active === i ? `${f.color}15` : 'var(--bg)',
                  color: active === i ? f.color : 'var(--text-muted)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  transition: 'all 200ms ease',
                }}>
                  {f.id === 'assessment' && <ClipboardList size={18} />}
                  {f.id === 'chat-analyzer' && <MessageSquare size={18} />}
                  {f.id === 'mood-tracker' && <Activity size={18} />}
                  {f.id === 'journal' && <BookOpen size={18} />}
                  {f.id === 'roleplay' && <Users size={18} />}
                  {f.id === 'insights' && <TrendingUp size={18} />}
                </div>
                <div>
                  <p style={{ fontWeight: 600, fontSize: 14, color: 'var(--text-primary)', margin: '0 0 4px' }}>{f.title}</p>
                  <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: 0, lineHeight: 1.5 }}>{f.description}</p>
                </div>
              </button>
            ))}
          </div>

          {/* Feature image */}
          <div style={{ position: 'relative' }}>
            <div style={{
              borderRadius: 12, overflow: 'hidden',
              boxShadow: '0 16px 64px rgba(0,0,0,0.12)',
              aspectRatio: '4/3', position: 'relative',
              border: '1px solid var(--border-subtle)',
            }}>
              <Image
                src={feature.image}
                alt={feature.title}
                fill
                style={{ objectFit: 'cover', transition: 'opacity 300ms ease' }}
                key={feature.id}
              />
              <div style={{
                position: 'absolute', inset: 0,
                background: `linear-gradient(to top, ${feature.color}40, transparent)`,
              }} />
              <div style={{
                position: 'absolute', bottom: 16, left: 16, right: 16,
                background: 'rgba(255,255,255,0.92)', backdropFilter: 'blur(12px)',
                borderRadius: 8, padding: '12px 16px',
                boxShadow: 'var(--shadow-raised)',
              }}>
                <p style={{ fontWeight: 700, fontSize: 14, color: 'var(--text-primary)', margin: '0 0 2px' }}>{feature.title}</p>
                <p style={{ fontSize: 12, color: 'var(--text-secondary)', margin: 0 }}>{feature.description}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        @media (max-width: 767px) {
          div > div > div:first-child { grid-column: 1 / -1 !important; }
          .container > div > div { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </section>
  )
}

// ========================
// HOW IT WORKS
// ========================
function HowItWorksSection() {
  return (
    <section className="section" style={{ background: 'transparent' }}>
      <div className="container">
        <div style={{ textAlign: 'center', marginBottom: 48 }}>
          <span className="badge badge-teal" style={{ marginBottom: 12 }}>Cara Kerja</span>
          <h2>Dari nggak tau apa-apa ke ngerti pola diri sendiri</h2>
          <p style={{ maxWidth: 480, margin: '12px auto 0' }}>
            Prosesnya simple dan nggak bikin overwhelmed. Kamu yang pegang kendali penuh.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 24, position: 'relative' }}>
          {/* Connector line */}
          <div style={{
            position: 'absolute', top: 32, left: '12.5%', right: '12.5%',
            height: 2, background: 'linear-gradient(to right, #0286C3, #17B897)',
            zIndex: 0,
          }} />

          {HOW_IT_WORKS.map((step, i) => (
            <div key={step.step} className="animate-fadein" style={{
              position: 'relative', zIndex: 1,
              animationDelay: `${i * 150}ms`,
              textAlign: 'center',
              padding: '0 8px',
            }}>
              <div style={{
                width: 64, height: 64, borderRadius: '50%',
                background: `${step.color}15`,
                border: `2px solid ${step.color}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                margin: '0 auto 20px',
                position: 'relative',
              }}>
                <span style={{ fontSize: '10px', fontWeight: 800, position: 'absolute', top: -10, right: -4, background: step.color, color: 'white', borderRadius: '50%', width: 20, height: 20, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {step.step}
                </span>
                {step.icon === 'ClipboardList' && <ClipboardList size={24} color={step.color} />}
                {step.icon === 'BarChart2' && <BarChart2 size={24} color={step.color} />}
                {step.icon === 'BookOpen' && <BookOpen size={24} color={step.color} />}
                {step.icon === 'TrendingUp' && <TrendingUp size={24} color={step.color} />}
              </div>
              <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 8 }}>{step.title}</h3>
              <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6 }}>{step.description}</p>
            </div>
          ))}
        </div>

        <div style={{ textAlign: 'center', marginTop: 48 }}>
          <Link href="/daftar" className="btn btn-primary">Mulai sekarang — gratis</Link>
        </div>
      </div>

      <style jsx>{`
        @media (max-width: 767px) {
          div > div > div:nth-child(2) { grid-template-columns: repeat(2, 1fr) !important; }
          div > div > div:nth-child(2) > div:nth-child(1) { display: none; }
        }
      `}</style>
    </section>
  )
}

// ========================
// SOCIAL PROOF / TESTIMONIALS
// ========================
function TestimonialsSection() {
  return (
    <section className="section">
      <div className="container">
        <div style={{ textAlign: 'center', marginBottom: 48 }}>
          <span className="badge badge-blue" style={{ marginBottom: 12 }}>Testimoni</span>
          <h2>Kata mereka yang udah nyoba</h2>
          <p style={{ maxWidth: 480, margin: '12px auto 0' }}>
            Bukan endorsement berbayar. Ini cerita nyata dari orang-orang yang beneran pakai Insight Hub.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20 }}>
          {TESTIMONIALS.map((t, i) => (
            <div key={t.id} className="card card-hover animate-fadein" style={{
              padding: 24, display: 'flex', flexDirection: 'column', gap: 16,
              animationDelay: `${i * 100}ms`,
            }}>
              {/* Stars */}
              <div style={{ display: 'flex', gap: 2 }}>
                {Array(t.rating).fill(0).map((_, s) => (
                  <Star key={s} size={14} fill="#F5A623" color="#F5A623" />
                ))}
              </div>

              <p style={{ fontSize: 14, lineHeight: 1.7, color: 'var(--text-primary)', margin: 0, flex: 1 }}>
                "{t.quote}"
              </p>

              <div style={{ display: 'flex', alignItems: 'center', gap: 12, paddingTop: 12, borderTop: '1px solid var(--border-subtle)' }}>
                <div style={{ width: 40, height: 40, borderRadius: '50%', overflow: 'hidden', position: 'relative', flexShrink: 0 }}>
                  <Image src={t.avatar} alt={t.name} fill style={{ objectFit: 'cover' }} />
                </div>
                <div>
                  <p style={{ fontWeight: 700, fontSize: 14, color: 'var(--text-primary)', margin: 0 }}>{t.name}</p>
                  <p style={{ fontSize: 12, color: 'var(--text-secondary)', margin: 0 }}>{t.role} · {t.plan}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <style jsx>{`
        @media (max-width: 767px) {
          div > div > div { grid-template-columns: 1fr !important; }
        }
        @media (min-width: 768px) and (max-width: 1023px) {
          div > div > div { grid-template-columns: repeat(2, 1fr) !important; }
        }
      `}</style>
    </section>
  )
}

// ========================
// PRICING SECTION
// ========================
function PricingSection() {
  return (
    <section className="section" style={{ background: 'transparent' }} id="harga">
      <div className="container">
        <div style={{ textAlign: 'center', marginBottom: 48 }}>
          <span className="badge badge-blue" style={{ marginBottom: 12 }}>Harga</span>
          <h2>Pilih yang paling sesuai sama kamu</h2>
          <p style={{ maxWidth: 480, margin: '12px auto 0' }}>
            Mulai gratis, upgrade kapan aja. Nggak ada kontrak yang bikin terjebak.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 20, maxWidth: 1100, margin: '0 auto' }}>
          {PRICING_PLANS.map(plan => (
            <div key={plan.id} className={`pricing-card ${plan.popular ? 'pricing-card-popular' : ''}`}>
              {plan.popular && <div className="pricing-popular-badge">Paling Populer</div>}

              <div style={{ marginBottom: 20 }}>
                <p style={{ fontWeight: 800, fontSize: 18, color: plan.popular ? 'var(--brand-blue)' : 'var(--text-primary)', margin: '0 0 4px' }}>
                  {plan.name}
                </p>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, margin: '12px 0 8px' }}>
                  {plan.price === 0 ? (
                    <span style={{ fontSize: 32, fontWeight: 800, color: 'var(--text-primary)' }}>Gratis</span>
                  ) : (
                    <>
                      <span style={{ fontSize: 28, fontWeight: 800, color: 'var(--text-primary)' }}>
                        Rp{(plan.price / 1000).toFixed(0)}rb
                      </span>
                      <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{plan.billing}</span>
                    </>
                  )}
                </div>
                <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: 0, lineHeight: 1.5 }}>{plan.description}</p>
              </div>

              <Link
                href={
                  plan.id === 'basic' || plan.id === 'premium'
                    ? `/langganan?trialPlanId=${plan.id}`
                    : '/daftar'
                }
                onClick={() => {
                  if (plan.id === 'basic' || plan.id === 'premium') {
                    if (typeof window !== 'undefined') {
                      sessionStorage.setItem('pendingTrialPlanId', plan.id);
                    }
                  }
                }}
                className={`btn ${plan.popular ? 'btn-primary' : 'btn-secondary'}`}
                style={{ width: '100%', justifyContent: 'center', marginBottom: 20 }}
              >
                {plan.cta}
              </Link>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {plan.features.map(f => (
                  <div key={f} style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                    <CheckCircle size={14} color="var(--teal)" style={{ marginTop: 2, flexShrink: 0 }} />
                    <span style={{ fontSize: 13, color: 'var(--text-primary)', lineHeight: 1.4 }}>{f}</span>
                  </div>
                ))}
                {plan.notIncluded.map(f => (
                  <div key={f} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, opacity: 0.4 }}>
                    <div style={{ width: 14, height: 14, borderRadius: '50%', border: '1.5px solid var(--border)', marginTop: 2, flexShrink: 0 }} />
                    <span style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.4 }}>{f}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <p style={{ textAlign: 'center', fontSize: 13, color: 'var(--text-secondary)', marginTop: 32 }}>
          Butuh untuk organisasi atau perusahaan?{' '}
          <Link href="/kontak" style={{ color: 'var(--brand-blue)', fontWeight: 600, textDecoration: 'none' }}>
            Hubungi kami untuk Enterprise plan
          </Link>
        </p>
      </div>

      <style jsx>{`
        @media (max-width: 767px) {
          div > div { grid-template-columns: 1fr !important; }
        }
        @media (min-width: 768px) and (max-width: 1023px) {
          div > div { grid-template-columns: repeat(2, 1fr) !important; }
        }
      `}</style>
    </section>
  )
}

// ========================
// SECURITY SECTION
// ========================
function SecuritySection() {
  return (
    <section className="section">
      <div className="container">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 64, alignItems: 'center' }}>
          <div>
            <span className="badge badge-teal" style={{ marginBottom: 16 }}>Keamanan Data</span>
            <h2 style={{ marginBottom: 16 }}>Data kamu aman, kita nggak main-main</h2>
            <p style={{ marginBottom: 32, lineHeight: 1.8 }}>
              Semua informasi yang kamu input dienkripsi dan nggak pernah kita jual ke pihak ketiga.
              Kamu punya kontrol penuh atas data kamu.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              {[
                { icon: Lock, title: 'Enkripsi End-to-End', desc: 'Semua data dienkripsi, baik di perjalanan maupun saat tersimpan.' },
                { icon: Shield, title: 'Zero Data Selling', desc: 'Data kamu nggak pernah dijual, disewain, atau dibagikan ke siapapun.' },
                { icon: Zap, title: 'Hapus Kapan Aja', desc: 'Kamu bisa hapus semua data kamu kapan aja, tanpa proses ribet.' },
              ].map(({ icon: Icon, title, desc }) => (
                <div key={title} style={{ display: 'flex', gap: 16 }}>
                  <div className="feature-icon-box feature-icon-box-teal" style={{ flexShrink: 0 }}>
                    <Icon size={20} />
                  </div>
                  <div>
                    <p style={{ fontWeight: 700, fontSize: 15, color: 'var(--text-primary)', margin: '0 0 4px' }}>{title}</p>
                    <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: 0, lineHeight: 1.6 }}>{desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div style={{
            background: 'linear-gradient(135deg, #EEF6FC 0%, #F0FBF8 100%)',
            borderRadius: 16, padding: 40, textAlign: 'center',
            border: '1px solid var(--border-subtle)',
          }}>
            <div style={{
              width: 80, height: 80, borderRadius: '50%',
              background: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 24px', boxShadow: 'var(--shadow-raised)',
            }}>
              <Shield size={36} color="var(--teal)" />
            </div>
            <h3 style={{ marginBottom: 12 }}>Komitmen Privasi Kami</h3>
            <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.7, marginBottom: 24 }}>
              Platform ini dibuat dengan prinsip privacy-first. Kamu yang pegang kendali,
              bukan kita. Data kamu adalah milik kamu — bukan aset bisnis kami.
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              {['GDPR Compliant', 'ISO 27001', 'SSL/TLS', 'SOC 2 Ready'].map(cert => (
                <div key={cert} style={{
                  background: 'white', borderRadius: 6, padding: '10px 12px',
                  fontSize: 13, fontWeight: 600, color: 'var(--text-primary)',
                  border: '1px solid var(--border-subtle)',
                }}>
                  {cert}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        @media (max-width: 767px) {
          div > div > div { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </section>
  )
}

// ========================
// FAQ SECTION
// ========================
function FAQSection() {
  const [openId, setOpenId] = useState<string | null>('1')

  return (
    <section className="section" style={{ background: 'transparent' }}>
      <div className="container">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 64, alignItems: 'start' }}>
          <div>
            <span className="badge badge-blue" style={{ marginBottom: 16 }}>FAQ</span>
            <h2>Yang paling sering ditanyain</h2>
            <p style={{ marginTop: 12, lineHeight: 1.7 }}>
              Masih ada pertanyaan? Langsung kontak kita, kita balas cepet.
            </p>
            <Link href="/kontak" className="btn btn-secondary" style={{ marginTop: 24 }}>Tanya sesuatu</Link>
          </div>

          <div>
            {FAQS.map((faq) => (
              <div key={faq.id} className="accordion-item">
                <button
                  className="accordion-trigger"
                  onClick={() => setOpenId(openId === faq.id ? null : faq.id)}
                >
                  {faq.question}
                  <ChevronDown
                    size={16}
                    style={{
                      flexShrink: 0,
                      transition: 'transform 200ms ease',
                      transform: openId === faq.id ? 'rotate(180deg)' : 'rotate(0deg)',
                    }}
                  />
                </button>
                {openId === faq.id && (
                  <div className="accordion-content animate-fadein">
                    {faq.answer}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      <style jsx>{`
        @media (max-width: 767px) {
          div > div > div { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </section>
  )
}

// ========================
// BLOG PREVIEW SECTION
// ========================
function BlogPreviewSection() {
  return (
    <section className="section">
      <div className="container">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 32, flexWrap: 'wrap', gap: 16 }}>
          <div>
            <span className="badge badge-blue" style={{ marginBottom: 8 }}>Blog</span>
            <h2 style={{ margin: 0 }}>Insight terbaru buat kamu</h2>
          </div>
          <Link href="/blog" className="btn btn-secondary btn-sm">Lihat semua artikel</Link>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20 }}>
          {BLOG_POSTS.slice(0, 3).map((post, i) => (
            <Link key={post.id} href={`/blog/${post.slug}`} style={{ textDecoration: 'none' }}>
              <div className="card card-hover" style={{ overflow: 'hidden', padding: 0 }}>
                <div style={{ aspectRatio: '16/9', position: 'relative', overflow: 'hidden' }}>
                  <Image
                    src={post.coverImage}
                    alt={post.title}
                    fill
                    style={{ objectFit: 'cover', transition: 'transform 400ms ease' }}
                    onMouseOver={e => (e.currentTarget.style.transform = 'scale(1.05)')}
                    onMouseOut={e => (e.currentTarget.style.transform = 'scale(1)')}
                  />
                  {post.trending && (
                    <div style={{
                      position: 'absolute', top: 12, left: 12,
                      background: 'var(--brand-blue)', color: 'white',
                      fontSize: 10, fontWeight: 700, padding: '2px 8px',
                      borderRadius: 4, textTransform: 'uppercase', letterSpacing: '0.05em',
                    }}>
                      Trending
                    </div>
                  )}
                </div>
                <div style={{ padding: 20 }}>
                  <span className="badge badge-neutral" style={{ marginBottom: 10 }}>{post.category}</span>
                  <h3 style={{ fontSize: 15, fontWeight: 700, lineHeight: 1.4, margin: '0 0 8px', color: 'var(--text-primary)' }}>
                    {post.title}
                  </h3>
                  <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: '0 0 16px', lineHeight: 1.6 }}>
                    {post.excerpt}
                  </p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ width: 24, height: 24, borderRadius: '50%', overflow: 'hidden', position: 'relative' }}>
                      <Image src={post.author.avatar} alt={post.author.name} fill style={{ objectFit: 'cover' }} />
                    </div>
                    <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                      {post.author.name} · {post.readTime}
                    </span>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>

      <style jsx>{`
        @media (max-width: 767px) {
          div > div { grid-template-columns: 1fr !important; }
        }
        @media (min-width: 768px) and (max-width: 1023px) {
          div > div { grid-template-columns: repeat(2, 1fr) !important; }
        }
      `}</style>
    </section>
  )
}

// ========================
// CTA FINAL SECTION
// ========================
function FinalCTASection() {
  return (
    <section style={{
      background: 'linear-gradient(135deg, #0286C3 0%, #17B897 100%)',
      padding: '80px 24px', textAlign: 'center',
    }}>
      <div style={{ maxWidth: 600, margin: '0 auto' }}>
        <h2 style={{ fontSize: 32, fontWeight: 800, color: 'white', marginBottom: 16, letterSpacing: '-0.01em' }}>
          Siap mulai ngerti diri sendiri?
        </h2>
        <p style={{ fontSize: 16, color: 'rgba(255,255,255,0.85)', marginBottom: 40, lineHeight: 1.7 }}>
          Butuh cuma beberapa menit buat mulai. Gratis, nggak perlu kartu kredit,
          dan kamu bisa berhenti kapan aja.
        </p>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link href="/daftar" style={{
            background: 'white', color: 'var(--brand-blue)',
            padding: '14px 32px', borderRadius: 6, fontWeight: 700, fontSize: 16,
            textDecoration: 'none', transition: 'all 150ms ease', display: 'inline-flex', alignItems: 'center', gap: 8,
          }}>
            Gas mulai gratis
            <ArrowRight size={18} />
          </Link>
          <Link href="/demo" style={{
            background: 'rgba(255,255,255,0.15)', color: 'white',
            padding: '14px 32px', borderRadius: 6, fontWeight: 600, fontSize: 16,
            textDecoration: 'none', border: '1.5px solid rgba(255,255,255,0.4)',
            transition: 'all 150ms ease', display: 'inline-flex', alignItems: 'center', gap: 8,
          }}>
            Lihat demo dulu
          </Link>
        </div>
        <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', marginTop: 24 }}>
          Bergabung dengan 10.000+ user yang udah mulai perjalanan mereka
        </p>
      </div>
    </section>
  )
}

// ========================
// DISCLAIMER STRIP
// ========================
function DisclaimerStrip() {
  return (
    <div style={{
      background: 'var(--bg)', padding: '12px 24px', textAlign: 'center',
      borderTop: '1px solid var(--border-subtle)',
    }}>
      <p style={{ fontSize: 12, color: 'var(--text-muted)', maxWidth: 800, margin: '0 auto' }}>
        Insight Hub adalah alat bantu self-reflection dan awareness — bukan pengganti profesional kesehatan mental.
        Semua hasil adalah insight, bukan vonis. Kalau kamu butuh bantuan lebih, silakan konsultasi ke psikolog atau konselor.
      </p>
    </div>
  )
}

// ========================
// MAIN PAGE
// ========================
export default function LandingPage() {
  return (
    <>
      <HeroSection />
      <StatsSection />
      <FeaturesSection />
      <HowItWorksSection />
      <TestimonialsSection />
      <SecuritySection />
      <PricingSection />
      <FAQSection />
      <BlogPreviewSection />
      <FinalCTASection />
      <DisclaimerStrip />
    </>
  )
}
