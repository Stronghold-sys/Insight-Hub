'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useState, useEffect } from 'react'
import {
  ArrowRight, CheckCircle, Star, TrendingUp, MessageSquare,
  BookOpen, Activity, ClipboardList, Users, Shield,
  ChevronDown, Play, BarChart2, Zap, Lock, Menu, X,
  Bell, Calendar, Download, Eye, Heart, Sparkles,
  Mail, Award, ChevronRight
} from 'lucide-react'
import {
  TESTIMONIALS, PRICING_PLANS, FAQS, HOW_IT_WORKS,
  FEATURES_HIGHLIGHT, BLOG_POSTS, CASE_STUDIES
} from '@/lib/data'

// ========================
// NAVBAR
// ========================
function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <header className="navbar" style={{ boxShadow: scrolled ? '0 2px 20px rgba(0,0,0,0.08)' : undefined }}>
      <div className="container" style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none' }}>
          <div style={{ width: 32, height: 32, borderRadius: 8, background: 'linear-gradient(135deg, #0286C3, #17B897)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
            </svg>
          </div>
          <span style={{ fontWeight: 800, fontSize: 18, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>Insight Hub</span>
        </Link>

        <nav style={{ display: 'flex', alignItems: 'center', gap: 4 }} className="hidden-mobile">
          {[
            { label: 'Fitur', href: '/fitur' },
            { label: 'Harga', href: '/harga' },
            { label: 'Blog', href: '/blog' },
            { label: 'Tentang', href: '/tentang' },
          ].map(item => (
            <Link key={item.label} href={item.href} style={{ padding: '8px 12px', fontSize: 14, fontWeight: 500, color: 'var(--text-secondary)', textDecoration: 'none', borderRadius: 6, transition: 'color 150ms ease' }}>
              {item.label}
            </Link>
          ))}
        </nav>

        <div style={{ display: 'flex', gap: 8 }} className="hidden-mobile">
          <Link href="/masuk" className="btn btn-secondary btn-sm">Masuk</Link>
          <Link href="/daftar" className="btn btn-primary btn-sm">Coba Gratis</Link>
        </div>

        <button onClick={() => setMobileOpen(!mobileOpen)} style={{ padding: 8, border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--text-primary)', display: 'none' }} className="mobile-menu-btn">
          {mobileOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {mobileOpen && (
        <div style={{ position: 'fixed', top: 64, left: 0, right: 0, bottom: 0, background: 'var(--surface)', zIndex: 99, padding: '24px 16px', overflowY: 'auto' }}>
          {[
            { label: 'Fitur', href: '/fitur' },
            { label: 'Harga', href: '/harga' },
            { label: 'Blog', href: '/blog' },
            { label: 'Tentang', href: '/tentang' },
          ].map(item => (
            <Link key={item.label} href={item.href} onClick={() => setMobileOpen(false)} style={{ display: 'block', padding: '12px 16px', fontSize: 16, fontWeight: 600, color: 'var(--text-primary)', textDecoration: 'none' }}>
              {item.label}
            </Link>
          ))}
          <div style={{ borderTop: '1px solid var(--border-subtle)', marginTop: 24, paddingTop: 24, display: 'flex', flexDirection: 'column', gap: 12 }}>
            <Link href="/masuk" className="btn btn-secondary" style={{ width: '100%', justifyContent: 'center' }}>Masuk</Link>
            <Link href="/daftar" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }}>Coba Gratis</Link>
          </div>
        </div>
      )}

      <style>{`
        @media (max-width: 767px) {
          .hidden-mobile { display: none !important; }
          .mobile-menu-btn { display: block !important; }
        }
      `}</style>
    </header>
  )
}

// ========================
// FOOTER
// ========================
function Footer() {
  return (
    <footer style={{ background: 'var(--text-primary)', color: 'rgba(255,255,255,0.7)', paddingTop: 64 }}>
      <div className="container">
        <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: 48, paddingBottom: 48, borderBottom: '1px solid rgba(255,255,255,0.1)' }} className="footer-grid">
          <div>
            <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none', marginBottom: 16 }}>
              <div style={{ width: 30, height: 30, borderRadius: 6, background: 'linear-gradient(135deg, #0286C3, #17B897)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
              </div>
              <span style={{ fontWeight: 800, fontSize: 16, color: 'white' }}>Insight Hub</span>
            </Link>
            <p style={{ fontSize: 13, lineHeight: 1.7, color: 'rgba(255,255,255,0.5)', marginBottom: 0 }}>
              Platform self-awareness berbasis sains buat kamu yang mau ngerti pola komunikasi dan dinamika relasi dengan lebih waras.
            </p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 24 }} className="footer-links-grid">
            {[
              { cat: 'Produk', links: ['Fitur', 'Harga', 'Demo', 'Changelog'] },
              { cat: 'Konten', links: ['Blog', 'FAQ', 'Success Story', 'Komunitas'] },
              { cat: 'Perusahaan', links: ['Tentang', 'Kontak', 'Karir'] },
              { cat: 'Legal', links: ['Privacy', 'Terms', 'Cookie'] },
            ].map(({ cat, links }) => (
              <div key={cat}>
                <h4 style={{ fontSize: 11, fontWeight: 700, color: 'white', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 14 }}>{cat}</h4>
                <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {links.map(l => (
                    <li key={l}>
                      <a href="#" style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', textDecoration: 'none' }}>{l}</a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 0', flexWrap: 'wrap', gap: 16 }}>
          <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', margin: 0 }}>
            &copy; {new Date().getFullYear()} Insight Hub. Dibuat dengan rasa di Indonesia.
          </p>
          <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)', margin: 0 }}>
            Alat bantu self-reflection — bukan pengganti profesional kesehatan mental.
          </p>
        </div>
      </div>
      <style>{`
        @media (max-width: 767px) {
          .footer-grid { grid-template-columns: 1fr !important; }
          .footer-links-grid { grid-template-columns: repeat(2, 1fr) !important; }
        }
      `}</style>
    </footer>
  )
}

// ========================
// HERO SECTION
// ========================
function HeroSection() {
  const [activeWord, setActiveWord] = useState(0)
  const words = ['attachment style', 'love language', 'pola konflik', 'kebutuhan emosional', 'gaya komunikasi']

  useEffect(() => {
    const interval = setInterval(() => setActiveWord(prev => (prev + 1) % words.length), 2500)
    return () => clearInterval(interval)
  }, [])

  return (
    <section className="hero-gradient" style={{ paddingTop: 80, paddingBottom: 96, position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', top: -80, right: -80, width: 400, height: 400, borderRadius: '50%', background: 'rgba(2,134,195,0.06)', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', bottom: -60, left: -60, width: 320, height: 320, borderRadius: '50%', background: 'rgba(23,184,151,0.06)', pointerEvents: 'none' }} />

      <div className="container">
        <div style={{ maxWidth: 720, margin: '0 auto', textAlign: 'center' }}>
          <div style={{ marginBottom: 24 }}>
            <span className="badge badge-blue"><Star size={10} fill="currentColor" /> Platform #1 untuk Self-Awareness Relasi</span>
          </div>

          <h1 style={{ fontSize: 'clamp(28px, 5vw, 52px)', fontWeight: 800, lineHeight: 1.15, letterSpacing: '-0.02em', marginBottom: 16 }}>
            Akhirnya ngerti kenapa{' '}
            <br className="hidden-mobile" />
            <span style={{ background: 'linear-gradient(135deg, #0286C3, #17B897)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text', display: 'inline-block', minWidth: 260 }}>
              {words[activeWord]}
            </span>
            {' '}kamu kayak gini
          </h1>

          <p style={{ fontSize: 18, lineHeight: 1.7, color: 'var(--text-secondary)', maxWidth: 560, margin: '0 auto 40px' }}>
            Platform self-awareness berbasis sains yang bantu kamu baca pola diri sendiri — bukan buat nge-judge, tapi buat ngerti dan tumbuh.
          </p>

          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 48 }}>
            <Link href="/daftar" className="btn btn-primary btn-xl">Gas mulai dari sini <ArrowRight size={18} /></Link>
            <Link href="/demo" className="btn btn-secondary btn-xl">
              <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'rgba(2,134,195,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Play size={12} fill="var(--brand-blue)" color="var(--brand-blue)" style={{ marginLeft: 2 }} />
              </div>
              Lihat demo dulu
            </Link>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 24, flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ display: 'flex' }}>
                {[1,2,3,4].map(i => (
                  <div key={i} style={{ width: 28, height: 28, borderRadius: '50%', background: `hsl(${i*40},70%,60%)`, border: '2px solid white', marginLeft: i > 1 ? -8 : 0 }} />
                ))}
              </div>
              <span style={{ fontSize: 13, color: 'var(--text-secondary)', fontWeight: 500 }}>Dipercaya <strong style={{ color: 'var(--text-primary)' }}>10.000+</strong> user</span>
            </div>
            <div style={{ width: 1, height: 20, background: 'var(--border)' }} />
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              {[1,2,3,4,5].map(s => <Star key={s} size={14} fill="#F5A623" color="#F5A623" />)}
              <span style={{ fontSize: 13, color: 'var(--text-secondary)', fontWeight: 500 }}><strong style={{ color: 'var(--text-primary)' }}>4.9/5</strong> rating</span>
            </div>
            <div style={{ width: 1, height: 20, background: 'var(--border)' }} />
            <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}><strong style={{ color: 'var(--teal)' }}>Gratis</strong> untuk mulai</span>
          </div>
        </div>

        {/* Dashboard preview mockup */}
        <div style={{ marginTop: 64, borderRadius: 12, overflow: 'hidden', boxShadow: '0 24px 80px rgba(0,0,0,0.12)', border: '1px solid var(--border-subtle)', maxWidth: 920, margin: '64px auto 0' }}>
          <div style={{ background: '#F0F2F4', padding: '10px 16px', display: 'flex', alignItems: 'center', gap: 8, borderBottom: '1px solid var(--border-subtle)' }}>
            <div style={{ display: 'flex', gap: 6 }}>
              {['#FF6058', '#FFBD2E', '#27C93F'].map(c => <div key={c} style={{ width: 10, height: 10, borderRadius: '50%', background: c }} />)}
            </div>
            <div style={{ flex: 1, background: 'white', borderRadius: 6, padding: '4px 12px', fontSize: 12, color: 'var(--text-muted)', maxWidth: 260, margin: '0 auto', border: '1px solid var(--border-subtle)' }}>
              app.insighthub.id/dashboard
            </div>
          </div>
          <div style={{ background: '#F7F9FA', padding: 24, minHeight: 380, display: 'grid', gridTemplateColumns: '180px 1fr', gap: 16 }} className="mockup-grid">
            {/* Sidebar */}
            <div style={{ background: '#1B1E28', borderRadius: 8, padding: 16 }}>
              <div style={{ height: 28, background: 'rgba(255,255,255,0.1)', borderRadius: 6, marginBottom: 20 }} />
              {['Dashboard', 'Assessment', 'Mood', 'Journal', 'Chat Analyzer'].map((item, i) => (
                <div key={item} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px', borderRadius: 6, marginBottom: 4, background: i === 0 ? 'rgba(2,134,195,0.2)' : 'transparent' }}>
                  <div style={{ width: 12, height: 12, borderRadius: 2, background: i === 0 ? 'var(--brand-blue)' : 'rgba(255,255,255,0.2)' }} />
                  <div style={{ height: 8, flex: 1, borderRadius: 3, background: i === 0 ? 'rgba(2,134,195,0.5)' : 'rgba(255,255,255,0.1)' }} />
                </div>
              ))}
            </div>
            {/* Content */}
            <div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 12 }}>
                {[
                  { l: 'Streak', v: '12 hari', c: 'var(--teal)' },
                  { l: 'Assessment', v: '8/19', c: 'var(--brand-blue)' },
                  { l: 'Mood Hari ini', v: 'Calm', c: 'var(--warning)' }
                ].map(s => (
                  <div key={s.l} className="card" style={{ padding: 14 }}>
                    <p style={{ fontSize: 10, color: 'var(--text-muted)', margin: '0 0 4px', textTransform: 'uppercase', fontWeight: 600 }}>{s.l}</p>
                    <p style={{ fontSize: 20, fontWeight: 700, color: s.c, margin: 0 }}>{s.v}</p>
                  </div>
                ))}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div className="card" style={{ padding: 14 }}>
                  <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 10 }}>Mood 7 Hari</p>
                  <div style={{ display: 'flex', alignItems: 'flex-end', gap: 5, height: 56 }}>
                    {[60, 30, 90, 70, 20, 80, 65].map((h, i) => (
                      <div key={i} style={{ flex: 1, borderRadius: '3px 3px 0 0', height: `${h}%`, background: `linear-gradient(to top, #0286C3, #17B897)`, opacity: 0.6 + i * 0.05 }} />
                    ))}
                  </div>
                </div>
                <div className="card" style={{ padding: 14 }}>
                  <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 10 }}>Insight Terbaru</p>
                  {['Attachment: Anxious (72%)', 'Love Language: Quality Time', 'Komunikasi: Direct tapi defensif'].map(item => (
                    <div key={item} style={{ display: 'flex', gap: 6, marginBottom: 6 }}>
                      <div style={{ width: 5, height: 5, borderRadius: '50%', background: 'var(--brand-blue)', flexShrink: 0, marginTop: 5 }} />
                      <span style={{ fontSize: 11, color: 'var(--text-secondary)', lineHeight: 1.3 }}>{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <style>{`
        @media (max-width: 767px) {
          .mockup-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </section>
  )
}

// ========================
// STATS SECTION
// ========================
function StatsSection() {
  return (
    <section style={{ padding: '56px 0', borderBottom: '1px solid var(--border-subtle)', borderTop: '1px solid var(--border-subtle)' }}>
      <div className="container">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 24 }} className="stats-grid">
          {[
            { value: '10.000+', label: 'User aktif', color: 'var(--brand-blue)' },
            { value: '19', label: 'Jenis assessment', color: 'var(--teal)' },
            { value: '94%', label: 'Ngerasa lebih paham diri', color: '#9B59B6' },
            { value: '4.9', label: 'Rating rata-rata', color: '#F5A623' },
          ].map(s => (
            <div key={s.label} style={{ textAlign: 'center', padding: '24px 16px' }}>
              <p style={{ fontSize: 36, fontWeight: 800, color: s.color, margin: '0 0 6px', letterSpacing: '-0.02em' }}>{s.value}</p>
              <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: 0 }}>{s.label}</p>
            </div>
          ))}
        </div>
      </div>
      <style>{`
        @media (max-width: 767px) {
          .stats-grid { grid-template-columns: repeat(2, 1fr) !important; }
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
  const icons = [ClipboardList, MessageSquare, Activity, BookOpen, Users, TrendingUp]

  return (
    <section className="section" id="fitur">
      <div className="container">
        <div style={{ textAlign: 'center', marginBottom: 56 }}>
          <span className="badge badge-blue" style={{ marginBottom: 12 }}>Fitur</span>
          <h2>Semua yang kamu butuhkan buat ngerti diri sendiri</h2>
          <p style={{ maxWidth: 480, margin: '12px auto 0' }}>Bukan sekadar quiz. Ini ekosistem lengkap buat self-awareness yang beneran bisa kamu pakai.</p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 48, alignItems: 'center' }} className="features-grid">
          <div>
            {FEATURES_HIGHLIGHT.map((f, i) => {
              const Icon = icons[i] || ClipboardList
              return (
                <button key={f.id} onClick={() => setActive(i)} style={{ display: 'flex', alignItems: 'flex-start', gap: 14, padding: 16, borderRadius: 10, border: 'none', textAlign: 'left', width: '100%', background: active === i ? 'var(--surface)' : 'transparent', cursor: 'pointer', borderLeft: active === i ? `3px solid ${f.color}` : '3px solid transparent', boxShadow: active === i ? 'var(--shadow-raised)' : 'none', transition: 'all 200ms ease', marginBottom: 4 }}>
                  <div style={{ width: 40, height: 40, borderRadius: 10, flexShrink: 0, background: active === i ? `${f.color}15` : 'var(--bg)', color: active === i ? f.color : 'var(--text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 200ms ease' }}>
                    <Icon size={18} />
                  </div>
                  <div>
                    <p style={{ fontWeight: 600, fontSize: 14, color: 'var(--text-primary)', margin: '0 0 4px' }}>{f.title}</p>
                    <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: 0, lineHeight: 1.5 }}>{f.description}</p>
                  </div>
                </button>
              )
            })}
          </div>

          <div style={{ borderRadius: 16, overflow: 'hidden', boxShadow: '0 16px 48px rgba(0,0,0,0.12)', aspectRatio: '4/3', position: 'relative', border: '1px solid var(--border-subtle)' }}>
            <div style={{ position: 'absolute', inset: 0, background: `linear-gradient(135deg, ${FEATURES_HIGHLIGHT[active].color}20, ${FEATURES_HIGHLIGHT[active].color}05)` }} />
            <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 32 }}>
              <div style={{ width: 80, height: 80, borderRadius: 20, background: `${FEATURES_HIGHLIGHT[active].color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 24, color: FEATURES_HIGHLIGHT[active].color }}>
                {(() => { const Icon = icons[active] || ClipboardList; return <Icon size={36} /> })()}
              </div>
              <h3 style={{ textAlign: 'center', marginBottom: 12, color: FEATURES_HIGHLIGHT[active].color }}>{FEATURES_HIGHLIGHT[active].title}</h3>
              <p style={{ textAlign: 'center', fontSize: 14, maxWidth: 280, lineHeight: 1.7, color: 'var(--text-secondary)' }}>{FEATURES_HIGHLIGHT[active].description}</p>
            </div>
          </div>
        </div>
      </div>
      <style>{`
        @media (max-width: 767px) {
          .features-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </section>
  )
}

// ========================
// HOW IT WORKS
// ========================
function HowItWorks() {
  return (
    <section className="section" style={{ background: 'transparent' }} id="cara-kerja">
      <div className="container">
        <div style={{ textAlign: 'center', marginBottom: 56 }}>
          <span className="badge badge-teal" style={{ marginBottom: 12 }}>Cara Kerja</span>
          <h2>Dari nggak tau apa-apa ke ngerti pola diri sendiri</h2>
          <p style={{ maxWidth: 480, margin: '12px auto 0' }}>Prosesnya simple dan nggak bikin overwhelmed. Kamu yang pegang kendali penuh.</p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 32 }} className="steps-grid">
          {HOW_IT_WORKS.map((step, i) => (
            <div key={step.step} className="animate-fadein" style={{ textAlign: 'center', animationDelay: `${i * 100}ms` }}>
              <div style={{ width: 64, height: 64, borderRadius: '50%', background: `${step.color}15`, border: `2px solid ${step.color}`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', position: 'relative' }}>
                <span style={{ fontSize: 22, fontWeight: 800, color: step.color }}>{step.step}</span>
                <span style={{ position: 'absolute', top: -10, right: -4, background: step.color, color: 'white', fontSize: '10px', fontWeight: 700, width: 20, height: 20, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{step.step}</span>
              </div>
              <h3 style={{ fontSize: 15, marginBottom: 8 }}>{step.title}</h3>
              <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6 }}>{step.description}</p>
            </div>
          ))}
        </div>

        <div style={{ textAlign: 'center', marginTop: 56 }}>
          <Link href="/daftar" className="btn btn-primary">Mulai sekarang — gratis <ArrowRight size={14} /></Link>
        </div>
      </div>
      <style>{`
        @media (max-width: 767px) {
          .steps-grid { grid-template-columns: repeat(2, 1fr) !important; }
        }
      `}</style>
    </section>
  )
}

// ========================
// BENEFITS SECTION
// ========================
function BenefitsSection() {
  const benefits = [
    {
      icon: Eye,
      title: 'Insight yang beneran relate',
      desc: 'Bukan hasil generik. Semua insight didasarkan dari pola unik kamu — bukan asumsi atau stereotip.',
      color: '#0286C3',
    },
    {
      icon: TrendingUp,
      title: 'Lacak perkembangan dari waktu ke waktu',
      desc: 'Lihat seberapa jauh kamu udah tumbuh. Summary mingguan dan bulanan biar nggak kehilangan progres.',
      color: '#17B897',
    },
    {
      icon: Shield,
      title: 'Nggak judgemental, nggak menggurui',
      desc: 'Bahasa yang kami pakai santai, empatik, dan nggak bikin kamu ngerasa dihakimi.',
      color: '#9B59B6',
    },
    {
      icon: Lock,
      title: 'Data kamu aman dan privat',
      desc: 'Enkripsi end-to-end. Nggak dijual ke siapapun. Kamu bisa hapus semua data kapan aja.',
      color: '#F5A623',
    },
    {
      icon: Sparkles,
      title: 'Rekomendasi yang bisa langsung dipakai',
      desc: 'Bukan saran ngambang. Semua rekomendasi praktis, singkat, dan relevan sama kondisi kamu sekarang.',
      color: '#E91E63',
    },
    {
      icon: Users,
      title: 'Bisa solo atau bareng pasangan',
      desc: 'Mode individu atau Couple Plan — buat kamu yang mau tumbuh sendiri atau tumbuh bersama.',
      color: '#00BCD4',
    },
  ]

  return (
    <section className="section" id="manfaat">
      <div className="container">
        <div style={{ textAlign: 'center', marginBottom: 56 }}>
          <span className="badge badge-blue" style={{ marginBottom: 12 }}>Kenapa Insight Hub</span>
          <h2>Beda dari yang lain, beneran nendang</h2>
          <p style={{ maxWidth: 480, margin: '12px auto 0' }}>Kita nggak bikin kamu cuma tau label diri — kita bantu kamu paham pola dan bisa ubah yang nggak sehat.</p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24 }} className="benefits-grid">
          {benefits.map((b, i) => {
            const Icon = b.icon
            return (
              <div key={i} className="card card-hover animate-fadein" style={{ padding: 28, animationDelay: `${i * 70}ms` }}>
                <div style={{ width: 48, height: 48, borderRadius: 12, background: `${b.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16, color: b.color }}>
                  <Icon size={22} />
                </div>
                <h3 style={{ fontSize: 15, marginBottom: 8, fontWeight: 700 }}>{b.title}</h3>
                <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6, margin: 0 }}>{b.desc}</p>
              </div>
            )
          })}
        </div>
      </div>
      <style>{`
        @media (max-width: 767px) {
          .benefits-grid { grid-template-columns: 1fr !important; }
        }
        @media (min-width: 768px) and (max-width: 1023px) {
          .benefits-grid { grid-template-columns: repeat(2, 1fr) !important; }
        }
      `}</style>
    </section>
  )
}

// ========================
// SECURITY SECTION
// ========================
function SecuritySection() {
  const items = [
    { icon: Lock, title: 'Enkripsi End-to-End', desc: 'Semua data kamu dienkripsi sebelum dikirim dan disimpan. Nggak ada yang bisa baca tanpa izin kamu.' },
    { icon: Shield, title: 'Nggak Dijual ke Siapapun', desc: 'Data kamu bukan produk kami. Kami nggak pernah, dan nggak akan pernah, jual data ke pihak ketiga.' },
    { icon: Download, title: 'Kamu Kontrol Penuh', desc: 'Download semua data kamu kapan aja. Atau hapus semuanya — langsung bersih, tanpa ribet.' },
    { icon: Eye, title: 'Transparansi Metode', desc: 'Semua insight punya confidence score yang transparan. Kami terbuka soal cara kerja algoritmanya.' },
    { icon: Bell, title: 'Notifikasi Aktivitas Mencurigakan', desc: 'Kalau ada login dari device baru atau lokasi asing, kamu langsung dikasih tau.' },
    { icon: Calendar, title: 'Kontrol Sesi & Device', desc: 'Lihat semua device yang aktif, dan logout dari mana aja kalau diperlukan.' },
  ]

  return (
    <section className="section" style={{ background: 'transparent' }} id="keamanan">
      <div className="container">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 64, alignItems: 'center' }} className="security-grid">
          <div>
            <span className="badge badge-teal" style={{ marginBottom: 16 }}>Keamanan Data</span>
            <h2>Data kamu serius, kami perlakukan serius</h2>
            <p style={{ lineHeight: 1.7, marginTop: 16, marginBottom: 32 }}>
              Self-reflection butuh kejujuran — dan kejujuran butuh rasa aman. Makanya kita jaga data kamu dengan standar keamanan yang nggak main-main.
            </p>
            <Link href="/privacy" className="btn btn-secondary">Baca kebijakan privasi <ChevronRight size={14} /></Link>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }} className="security-items-grid">
            {items.map((item, i) => {
              const Icon = item.icon
              return (
                <div key={i} className="card" style={{ padding: 20 }}>
                  <div style={{ width: 36, height: 36, borderRadius: 8, background: 'rgba(23,184,151,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12, color: 'var(--teal)' }}>
                    <Icon size={16} />
                  </div>
                  <p style={{ fontWeight: 700, fontSize: 13, color: 'var(--text-primary)', margin: '0 0 6px' }}>{item.title}</p>
                  <p style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5, margin: 0 }}>{item.desc}</p>
                </div>
              )
            })}
          </div>
        </div>
      </div>
      <style>{`
        @media (max-width: 767px) {
          .security-grid { grid-template-columns: 1fr !important; }
          .security-items-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </section>
  )
}

// ========================
// TESTIMONIALS
// ========================
function Testimonials() {
  return (
    <section className="section" id="testimoni">
      <div className="container">
        <div style={{ textAlign: 'center', marginBottom: 56 }}>
          <span className="badge badge-blue" style={{ marginBottom: 12 }}>Testimoni</span>
          <h2>Kata mereka yang udah nyoba</h2>
          <p style={{ maxWidth: 480, margin: '12px auto 0' }}>Bukan endorsement berbayar. Cerita nyata dari orang-orang yang beneran pakai Insight Hub.</p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20 }} className="testimonials-grid">
          {TESTIMONIALS.map((t, i) => (
            <div key={t.id} className="card card-hover animate-fadein" style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 16, animationDelay: `${i * 80}ms` }}>
              <div style={{ display: 'flex', gap: 2 }}>
                {Array(t.rating).fill(0).map((_, s) => <Star key={s} size={14} fill="#F5A623" color="#F5A623" />)}
              </div>
              <p style={{ fontSize: 14, lineHeight: 1.7, color: 'var(--text-primary)', margin: 0, flex: 1 }}>"{t.quote}"</p>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, paddingTop: 12, borderTop: '1px solid var(--border-subtle)' }}>
                <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'var(--border)', overflow: 'hidden', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 700, color: 'var(--brand-blue)' }}>
                  {t.name[0]}
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
      <style>{`
        @media (max-width: 767px) { .testimonials-grid { grid-template-columns: 1fr !important; } }
        @media (min-width: 768px) and (max-width: 1023px) { .testimonials-grid { grid-template-columns: repeat(2, 1fr) !important; } }
      `}</style>
    </section>
  )
}

// ========================
// SUCCESS STORIES (CASE STUDIES)
// ========================
function SuccessStories() {
  return (
    <section className="section" style={{ background: 'transparent' }} id="success-story">
      <div className="container">
        <div style={{ textAlign: 'center', marginBottom: 56 }}>
          <span className="badge badge-teal" style={{ marginBottom: 12 }}>Success Story</span>
          <h2>Perubahan nyata dari orang nyata</h2>
          <p style={{ maxWidth: 480, margin: '12px auto 0' }}>Bukan janji kosong. Ini cerita sebelum dan sesudah dari user yang udah pakai Insight Hub.</p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 24 }} className="success-grid">
          {CASE_STUDIES.map((cs, i) => (
            <div key={cs.id} className="card card-hover animate-fadein" style={{ padding: 0, overflow: 'hidden', animationDelay: `${i * 100}ms` }}>
              <div style={{ height: 160, background: `linear-gradient(135deg, #0286C320, #17B89710)`, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', borderBottom: '1px solid var(--border-subtle)' }}>
                <div style={{ position: 'absolute', top: 16, left: 16 }}>
                  <span style={{ background: 'var(--teal)', color: 'white', fontSize: 11, fontWeight: 700, padding: '4px 10px', borderRadius: 20 }}>
                    {cs.duration}
                  </span>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'linear-gradient(135deg, #0286C3, #17B897)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 10px', fontSize: 22, fontWeight: 800, color: 'white' }}>
                    {cs.name[0]}
                  </div>
                  <p style={{ fontWeight: 700, fontSize: 14, color: 'var(--text-primary)', margin: 0 }}>{cs.name}</p>
                </div>
              </div>
              <div style={{ padding: 24 }}>
                <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>{cs.title}</h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
                  <div style={{ background: 'rgba(213,55,55,0.06)', borderRadius: 8, padding: 14 }}>
                    <p style={{ fontSize: 10, fontWeight: 700, color: '#D53737', margin: '0 0 6px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Sebelum</p>
                    <p style={{ fontSize: 12, color: 'var(--text-secondary)', margin: 0, lineHeight: 1.5 }}>{cs.before}</p>
                  </div>
                  <div style={{ background: 'rgba(23,184,151,0.06)', borderRadius: 8, padding: 14 }}>
                    <p style={{ fontSize: 10, fontWeight: 700, color: 'var(--teal)', margin: '0 0 6px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Sesudah</p>
                    <p style={{ fontSize: 12, color: 'var(--text-secondary)', margin: 0, lineHeight: 1.5 }}>{cs.after}</p>
                  </div>
                </div>
                <blockquote style={{ borderLeft: '3px solid var(--brand-blue)', paddingLeft: 14, margin: '0 0 16px', fontSize: 13, color: 'var(--text-secondary)', fontStyle: 'italic', lineHeight: 1.6 }}>
                  "{cs.quote}"
                </blockquote>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {cs.features.map(f => (
                    <span key={f} style={{ fontSize: 11, fontWeight: 600, padding: '3px 8px', borderRadius: 20, background: 'var(--bg)', border: '1px solid var(--border-subtle)', color: 'var(--text-secondary)' }}>{f}</span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      <style>{`
        @media (max-width: 767px) {
          .success-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </section>
  )
}

// ========================
// PRICING
// ========================
function Pricing() {
  return (
    <section className="section" id="harga">
      <div className="container">
        <div style={{ textAlign: 'center', marginBottom: 56 }}>
          <span className="badge badge-blue" style={{ marginBottom: 12 }}>Harga</span>
          <h2>Pilih yang paling sesuai sama kamu</h2>
          <p style={{ maxWidth: 480, margin: '12px auto 0' }}>Mulai gratis, upgrade kapan aja. Nggak ada kontrak, nggak ada hidden fee.</p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 20, maxWidth: 1100, margin: '0 auto' }} className="pricing-grid">
          {PRICING_PLANS.map(plan => (
            <div key={plan.id} className={`pricing-card ${plan.popular ? 'pricing-card-popular' : ''}`}>
              {plan.popular && <div className="pricing-popular-badge">Paling Populer</div>}
              <div style={{ marginBottom: 20 }}>
                <p style={{ fontWeight: 800, fontSize: 18, color: plan.popular ? 'var(--brand-blue)' : 'var(--text-primary)', margin: '0 0 4px' }}>{plan.name}</p>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, margin: '12px 0 8px' }}>
                  {plan.price === 0 ? (
                    <span style={{ fontSize: 28, fontWeight: 800, color: 'var(--text-primary)' }}>Gratis</span>
                  ) : (
                    <>
                      <span style={{ fontSize: 24, fontWeight: 800, color: 'var(--text-primary)' }}>Rp{(plan.price / 1000).toFixed(0)}rb</span>
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
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {plan.features.map(f => (
                  <div key={f} style={{ display: 'flex', gap: 8 }}>
                    <CheckCircle size={13} color="var(--teal)" style={{ marginTop: 2, flexShrink: 0 }} />
                    <span style={{ fontSize: 13, color: 'var(--text-primary)', lineHeight: 1.4 }}>{f}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
      <style>{`
        @media (max-width: 767px) { .pricing-grid { grid-template-columns: 1fr !important; } }
        @media (min-width: 768px) and (max-width: 1199px) { .pricing-grid { grid-template-columns: repeat(2, 1fr) !important; } }
      `}</style>
    </section>
  )
}

// ========================
// BLOG SECTION
// ========================
function BlogSection() {
  return (
    <section className="section" style={{ background: 'transparent' }} id="blog">
      <div className="container">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 40, flexWrap: 'wrap', gap: 16 }}>
          <div>
            <span className="badge badge-blue" style={{ marginBottom: 12 }}>Blog</span>
            <h2 style={{ margin: 0 }}>Artikel terbaru buat kamu</h2>
            <p style={{ color: 'var(--text-secondary)', marginTop: 8, marginBottom: 0 }}>Konten edukasi soal relasi, komunikasi, dan self-awareness — ditulis dengan bahasa yang nggak ribet.</p>
          </div>
          <Link href="/blog" className="btn btn-secondary" style={{ flexShrink: 0 }}>Semua artikel <ChevronRight size={14} /></Link>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20 }} className="blog-grid">
          {BLOG_POSTS.slice(0, 3).map((post, i) => (
            <Link key={post.id} href={`/blog/${post.slug}`} style={{ textDecoration: 'none', animationDelay: `${i * 80}ms` }} className="animate-fadein">
              <div className="card card-hover" style={{ overflow: 'hidden', height: '100%', display: 'flex', flexDirection: 'column' }}>
                <div style={{ height: 160, borderBottom: '1px solid var(--border-subtle)', position: 'relative', overflow: 'hidden' }}>
                  <Image
                    src={post.coverImage}
                    alt={post.title}
                    fill
                    style={{ objectFit: 'cover' }}
                  />
                  {post.trending && (
                    <span style={{ position: 'absolute', top: 12, left: 12, background: '#F5A623', color: 'white', fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 20, zIndex: 1 }}>
                      Trending
                    </span>
                  )}
                </div>
                <div style={{ padding: 20, flex: 1, display: 'flex', flexDirection: 'column' }}>
                  <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
                    <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--brand-blue)', background: 'rgba(2,134,195,0.08)', padding: '3px 8px', borderRadius: 20 }}>{post.category}</span>
                    <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{post.readTime}</span>
                  </div>
                  <h3 style={{ fontSize: 15, fontWeight: 700, lineHeight: 1.4, marginBottom: 8, color: 'var(--text-primary)', flex: 1 }}>{post.title}</h3>
                  <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6, margin: 0 }}>{post.excerpt}</p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
      <style>{`
        @media (max-width: 767px) { .blog-grid { grid-template-columns: 1fr !important; } }
        @media (min-width: 768px) and (max-width: 1023px) { .blog-grid { grid-template-columns: repeat(2, 1fr) !important; } }
      `}</style>
    </section>
  )
}

// ========================
// FAQ
// ========================
function FAQ() {
  const [openId, setOpenId] = useState<string | null>('1')

  return (
    <section className="section" id="faq">
      <div className="container">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 64, alignItems: 'start' }} className="faq-grid">
          <div>
            <span className="badge badge-blue" style={{ marginBottom: 16 }}>FAQ</span>
            <h2>Yang paling sering ditanyain</h2>
            <p style={{ marginTop: 12, lineHeight: 1.7 }}>Masih ada pertanyaan lain? Langsung kontak kita.</p>
            <Link href="/kontak" className="btn btn-secondary" style={{ marginTop: 24 }}>Tanya sesuatu</Link>
          </div>
          <div>
            {FAQS.map(faq => (
              <div key={faq.id} className="accordion-item">
                <button className="accordion-trigger" onClick={() => setOpenId(openId === faq.id ? null : faq.id)}>
                  {faq.question}
                  <ChevronDown size={16} style={{ flexShrink: 0, transition: 'transform 200ms ease', transform: openId === faq.id ? 'rotate(180deg)' : 'rotate(0deg)' }} />
                </button>
                {openId === faq.id && <div className="accordion-content animate-fadein">{faq.answer}</div>}
              </div>
            ))}
          </div>
        </div>
      </div>
      <style>{`
        @media (max-width: 767px) { .faq-grid { grid-template-columns: 1fr !important; } }
      `}</style>
    </section>
  )
}

// ========================
// DEMO SECTION
// ========================
function DemoSection() {
  return (
    <section className="section" style={{ background: 'transparent' }} id="demo">
      <div className="container">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 64, alignItems: 'center' }} className="demo-grid">
          <div>
            <span className="badge badge-teal" style={{ marginBottom: 16 }}>Demo Gratis</span>
            <h2>Coba dulu sebelum daftar</h2>
            <p style={{ lineHeight: 1.7, marginTop: 16, marginBottom: 24 }}>
              Nggak perlu registrasi. Langsung coba lihat seperti apa insight-nya, bagaimana cara kerjanya, dan apa yang bisa kamu dapetin dari Insight Hub.
            </p>
            <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 32px', display: 'flex', flexDirection: 'column', gap: 12 }}>
              {[
                'Preview hasil assessment tanpa login',
                'Lihat contoh insight mendalam',
                'Coba antarmuka mood tracker',
                'Lihat sample weekly report',
              ].map(item => (
                <li key={item} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 14, color: 'var(--text-secondary)' }}>
                  <CheckCircle size={16} color="var(--teal)" style={{ flexShrink: 0 }} />
                  {item}
                </li>
              ))}
            </ul>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              <Link href="/demo" className="btn btn-primary">Coba demo gratis <ArrowRight size={14} /></Link>
              <Link href="/daftar" className="btn btn-secondary">Langsung daftar</Link>
            </div>
          </div>

          {/* Demo mockup */}
          <div style={{ borderRadius: 16, overflow: 'hidden', boxShadow: '0 20px 60px rgba(0,0,0,0.12)', border: '1px solid var(--border-subtle)' }}>
            <div style={{ background: '#1B1E28', padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ display: 'flex', gap: 6 }}>
                {['#FF6058', '#FFBD2E', '#27C93F'].map(c => <div key={c} style={{ width: 10, height: 10, borderRadius: '50%', background: c }} />)}
              </div>
              <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', flex: 1, textAlign: 'center' }}>Demo Mode</span>
            </div>
            <div style={{ background: 'var(--bg)', padding: 24 }}>
              <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 16 }}>Sample Insight</p>
              <div style={{ background: 'var(--surface)', borderRadius: 10, padding: 18, marginBottom: 16, border: '1px solid var(--border-subtle)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>Attachment Style</span>
                  <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--brand-blue)', background: 'rgba(2,134,195,0.1)', padding: '3px 8px', borderRadius: 20 }}>Anxious</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {[
                    { label: 'Secure', val: 48, color: '#17B897' },
                    { label: 'Anxious', val: 72, color: '#0286C3' },
                    { label: 'Avoidant', val: 35, color: '#F5A623' },
                  ].map(bar => (
                    <div key={bar.label}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                        <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{bar.label}</span>
                        <span style={{ fontSize: 11, fontWeight: 700, color: bar.color }}>{bar.val}%</span>
                      </div>
                      <div style={{ height: 6, borderRadius: 3, background: 'var(--border-subtle)', overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${bar.val}%`, background: bar.color, borderRadius: 3, transition: 'width 600ms ease' }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div style={{ background: 'rgba(2,134,195,0.06)', borderRadius: 10, padding: 16, border: '1px solid rgba(2,134,195,0.12)' }}>
                <p style={{ fontSize: 12, fontWeight: 700, color: 'var(--brand-blue)', margin: '0 0 8px' }}>Insight untukmu</p>
                <p style={{ fontSize: 12, color: 'var(--text-secondary)', margin: 0, lineHeight: 1.6 }}>
                  Pola anxious kamu muncul paling kuat pas ada ketidakpastian. Coba identifikasi triggernya — bukan salah siapa-siapa, ini pola yang bisa dikelola.
                </p>
              </div>
              <div style={{ textAlign: 'center', marginTop: 20 }}>
                <Link href="/daftar" style={{ fontSize: 13, color: 'var(--brand-blue)', fontWeight: 600, textDecoration: 'none' }}>
                  Daftar untuk lihat insight lengkapmu &rarr;
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
      <style>{`
        @media (max-width: 767px) {
          .demo-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </section>
  )
}

// ========================
// NEWSLETTER SECTION
// ========================
function NewsletterSection() {
  const [email, setEmail] = useState('')
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (email.trim()) {
      setSubmitted(true)
    }
  }

  return (
    <section style={{ background: 'linear-gradient(135deg, #0286C3 0%, #17B897 100%)', padding: '72px 24px' }} id="newsletter">
      <div style={{ maxWidth: 580, margin: '0 auto', textAlign: 'center' }}>
        <Mail size={32} color="rgba(255,255,255,0.8)" style={{ marginBottom: 20 }} />
        <h2 style={{ fontSize: 28, fontWeight: 800, color: 'white', marginBottom: 12, letterSpacing: '-0.01em' }}>
          Insight mingguan langsung ke inbox kamu
        </h2>
        <p style={{ fontSize: 16, color: 'rgba(255,255,255,0.8)', marginBottom: 36, lineHeight: 1.7 }}>
          Tips relasi, artikel terbaru, dan konten eksklusif soal self-awareness. Gratis, bisa unsubscribe kapan aja.
        </p>

        {submitted ? (
          <div style={{ background: 'rgba(255,255,255,0.15)', borderRadius: 12, padding: '20px 32px', border: '1px solid rgba(255,255,255,0.3)' }}>
            <CheckCircle size={24} color="white" style={{ marginBottom: 8 }} />
            <p style={{ color: 'white', fontWeight: 700, margin: '0 0 4px' }}>Berhasil daftar!</p>
            <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: 13, margin: 0 }}>Cek inbox kamu buat konfirmasi. Selamat datang di komunitas Insight Hub.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: 'flex', gap: 0, maxWidth: 440, margin: '0 auto', borderRadius: 8, overflow: 'hidden', boxShadow: '0 8px 24px rgba(0,0,0,0.15)' }}>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="email@kamu.com"
              required
              style={{ flex: 1, padding: '14px 20px', border: 'none', outline: 'none', fontSize: 14, background: 'white', color: 'var(--text-primary)' }}
            />
            <button type="submit" style={{ padding: '14px 24px', background: '#1B1E28', color: 'white', border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: 14, whiteSpace: 'nowrap', transition: 'background 150ms ease' }}>
              Daftar
            </button>
          </form>
        )}
        <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.55)', marginTop: 20 }}>
          Nggak akan spam. Unsubscribe kapan aja.
        </p>
      </div>
    </section>
  )
}

// ========================
// CTA FINAL
// ========================
function FinalCTA() {
  return (
    <section style={{ background: 'var(--text-primary)', padding: '80px 24px', textAlign: 'center' }}>
      <div style={{ maxWidth: 600, margin: '0 auto' }}>
        <h2 style={{ fontSize: 32, fontWeight: 800, color: 'white', marginBottom: 16, letterSpacing: '-0.01em' }}>
          Siap mulai ngerti diri sendiri?
        </h2>
        <p style={{ fontSize: 16, color: 'rgba(255,255,255,0.7)', marginBottom: 40, lineHeight: 1.7 }}>
          Butuh cuma beberapa menit buat mulai. Gratis, nggak perlu kartu kredit.
        </p>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link href="/daftar" style={{ background: 'linear-gradient(135deg, #0286C3, #17B897)', color: 'white', padding: '14px 32px', borderRadius: 8, fontWeight: 700, fontSize: 16, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 8, boxShadow: '0 4px 20px rgba(2,134,195,0.35)' }}>
            Gas mulai gratis <ArrowRight size={18} />
          </Link>
          <Link href="/demo" style={{ background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.85)', padding: '14px 32px', borderRadius: 8, fontWeight: 600, fontSize: 16, textDecoration: 'none', border: '1.5px solid rgba(255,255,255,0.2)' }}>
            Lihat demo dulu
          </Link>
        </div>
        <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', marginTop: 24 }}>Bergabung dengan 10.000+ user yang udah mulai perjalanan mereka</p>
      </div>
    </section>
  )
}

// ========================
// MAIN PAGE
// ========================
export default function LandingPage() {
  return (
    <>
      <Navbar />
      <main>
        <HeroSection />
        <StatsSection />
        <FeaturesSection />
        <HowItWorks />
        <BenefitsSection />
        <SecuritySection />
        <Testimonials />
        <SuccessStories />
        <Pricing />
        <BlogSection />
        <FAQ />
        <DemoSection />
        <NewsletterSection />
        <FinalCTA />
        <div style={{ background: 'var(--bg)', padding: '12px 24px', textAlign: 'center', borderTop: '1px solid var(--border-subtle)' }}>
          <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: '0 auto', maxWidth: 800 }}>
            Insight Hub adalah alat bantu self-reflection — bukan pengganti profesional kesehatan mental. Semua hasil adalah insight, bukan vonis.
          </p>
        </div>
      </main>
      <Footer />
    </>
  )
}
