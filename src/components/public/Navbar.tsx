'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Menu, X, ChevronDown } from 'lucide-react'
import { supabase, createSafeChannel } from '@/lib/supabaseClient'

const NAV_LINKS = [
  { label: 'Fitur', href: '/fitur' },
  { label: 'Harga', href: '/harga' },
  { label: 'Blog', href: '/blog' },
  { label: 'Tentang', href: '/tentang' },
  {
    label: 'Resources',
    href: '#',
    children: [
      { label: 'FAQ', href: '/faq' },
      { label: 'Demo Gratis', href: '/demo' },
      { label: 'Success Story', href: '/cerita' },
      { label: 'Komunitas', href: '/komunitas' },
    ],
  },
]

interface PublicNavbarProps {
  initialUser?: any
}

export default function PublicNavbar({ initialUser = null }: PublicNavbarProps) {
  const router = useRouter()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [dropdownOpen, setDropdownOpen] = useState<string | null>(null)
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false)
  
  const [user, setUser] = useState<any>(initialUser)
  const [loading, setLoading] = useState(initialUser === null)

  useEffect(() => {
    // 1. Listen to Supabase Auth State Changes in Realtime
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log(`[Navbar Auth] Auth Event: ${event}`)
      if (session?.user) {
        // Fetch database profile to keep roles and nicknames synchronized
        try {
          const res = await fetch('/api/auth/me')
          const data = await res.json()
          if (data.authenticated && data.user) {
            setUser(data.user)
          } else {
            setUser(null)
          }
        } catch (err) {
          console.error('[Navbar Auth] Failed to fetch profile details:', err)
        }
        setLoading(false)
      } else {
        setUser(null)
        setLoading(false)

        // Clear local Next.js session cookies if logged out
        if (event === 'SIGNED_OUT') {
          fetch('/api/auth/logout', { method: 'POST' }).catch(() => {})
        }
      }
    })

    // 2. Fetch client session on mount if server didn't supply user (fallback check)
    if (initialUser === null) {
      supabase.auth.getSession().then(async ({ data: { session } }) => {
        if (session?.user) {
          try {
            const res = await fetch('/api/auth/me')
            const data = await res.json()
            if (data.authenticated && data.user) {
              setUser(data.user)
            }
          } catch (err) {
            console.error('[Navbar Auth] Failed to fetch initial session:', err)
          }
        }
        setLoading(false)
      })
    }

    return () => {
      subscription.unsubscribe()
    }
  }, [initialUser])

  // Realtime subscription changes synchronization in Navbar
  useEffect(() => {
    if (!user?.id) return;

    const channel = createSafeChannel(`public:subscriptions:user:${user.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'subscriptions',
          filter: `user_id=eq.${user.id}`
        },
        async (payload) => {
          console.log('[Navbar] Realtime subscription change detected:', payload);
          try {
            const res = await fetch('/api/auth/me');
            const data = await res.json();
            if (data.authenticated && data.user) {
              setUser(data.user);
            }
          } catch (err) {
            console.error('[Navbar] Failed to re-fetch profile on realtime change:', err);
          }
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [user?.id]);

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' })
      await supabase.auth.signOut()
      setUser(null)
      setProfileDropdownOpen(false)
      setMobileOpen(false)
      router.push('/')
    } catch (err) {
      console.error('[Navbar] Logout error:', err)
    }
  }

  const getInitials = (name: string) => {
    if (!name) return 'U'
    const parts = name.trim().split(' ')
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase()
    }
    return name.slice(0, 2).toUpperCase()
  }

  const getAvatarColor = (name: string) => {
    const colors = ['#0286C3', '#17B897', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899']
    let hash = 0
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash)
    }
    const index = Math.abs(hash) % colors.length
    return colors[index]
  }

  const dropdownLinkStyle: React.CSSProperties = {
    display: 'block',
    padding: '8px 12px',
    borderRadius: 4,
    fontSize: 14,
    color: 'var(--text-primary)',
    textDecoration: 'none',
    fontFamily: 'var(--font-sans)',
    fontWeight: 500,
    transition: 'background 100ms ease',
  }

  const mobileLinkStyle: React.CSSProperties = {
    display: 'block',
    padding: '12px 16px',
    borderRadius: 6,
    fontSize: 16,
    fontWeight: 600,
    color: 'var(--text-primary)',
    textDecoration: 'none',
  }

  return (
    <header className="navbar">
      <div className="container" style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        {/* Logo */}
        <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none' }}>
          <div style={{
            width: 32, height: 32, borderRadius: 8,
            background: 'linear-gradient(135deg, #0286C3, #17B897)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
            </svg>
          </div>
          <span style={{ fontWeight: 800, fontSize: 18, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
            Insight Hub
          </span>
        </Link>

        {/* Desktop Nav */}
        <nav style={{ display: 'flex', alignItems: 'center', gap: 4 }} className="hidden-mobile">
          {NAV_LINKS.map(link => (
            <div key={link.label} style={{ position: 'relative' }}>
              {link.children ? (
                <button
                  onMouseEnter={() => setDropdownOpen(link.label)}
                  onMouseLeave={() => setDropdownOpen(null)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 4,
                    padding: '8px 12px', borderRadius: 6, border: 'none', background: 'transparent',
                    fontSize: 14, fontWeight: 500, color: 'var(--text-secondary)',
                    cursor: 'pointer', transition: 'color 150ms ease',
                    fontFamily: 'var(--font-sans)',
                  }}
                  onFocus={() => setDropdownOpen(link.label)}
                >
                  {link.label}
                  <ChevronDown size={14} />
                </button>
              ) : (
                <Link
                  href={link.href}
                  style={{
                    display: 'block', padding: '8px 12px', borderRadius: 6,
                    fontSize: 14, fontWeight: 500, color: 'var(--text-secondary)',
                    textDecoration: 'none', transition: 'color 150ms ease',
                  }}
                >
                  {link.label}
                </Link>
              )}

              {/* Dropdown */}
              {link.children && dropdownOpen === link.label && (
                <div
                  onMouseEnter={() => setDropdownOpen(link.label)}
                  onMouseLeave={() => setDropdownOpen(null)}
                  style={{
                    position: 'absolute', top: '100%', left: 0,
                    background: 'var(--surface)', border: '1px solid var(--border-subtle)',
                    borderRadius: 6, padding: 8, minWidth: 180,
                    boxShadow: 'var(--shadow-overlay)', zIndex: 200,
                    animation: 'fadeInScale 0.15s ease',
                  }}
                >
                  {link.children.map(child => (
                    <Link
                      key={child.label}
                      href={child.href}
                      style={{
                        display: 'block', padding: '8px 12px', borderRadius: 4,
                        fontSize: 14, color: 'var(--text-primary)', textDecoration: 'none',
                        transition: 'background 100ms ease',
                      }}
                      onMouseOver={e => (e.currentTarget.style.background = 'var(--bg)')}
                      onMouseOut={e => (e.currentTarget.style.background = 'transparent')}
                    >
                      {child.label}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          ))}
        </nav>

        {/* Auth CTA / Profile Area */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }} className="hidden-mobile">
          {loading ? (
            <div style={{ width: 120, height: 36, background: '#E2E8F0', borderRadius: 20, animation: 'pulse 1.5s infinite ease-in-out' }} />
          ) : user ? (
            <div style={{ position: 'relative' }}>
              <button
                onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '6px 12px', borderRadius: 20, border: '1px solid var(--border-subtle)',
                  background: 'var(--surface)', cursor: 'pointer', fontFamily: 'var(--font-sans)',
                }}
              >
                {user.avatarUrl ? (
                  <img
                    src={user.avatarUrl}
                    alt={user.nickname || user.fullName}
                    style={{ width: 28, height: 28, borderRadius: '50%', objectFit: 'cover' }}
                  />
                ) : (
                  <div style={{
                    width: 28, height: 28, borderRadius: '50%',
                    background: getAvatarColor(user.fullName || user.nickname || 'User'),
                    color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 12, fontWeight: 700,
                  }}>
                    {getInitials(user.fullName || user.nickname || 'User')}
                  </div>
                )}
                <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>
                  {user.nickname || user.fullName || 'Kamu'}
                </span>
                <ChevronDown size={14} style={{ color: 'var(--text-secondary)' }} />
              </button>

              {profileDropdownOpen && (
                <>
                  <div style={{ position: 'fixed', inset: 0, zIndex: 199 }} onClick={() => setProfileDropdownOpen(false)} />
                  <div style={{
                    position: 'absolute', top: '110%', right: 0,
                    background: 'var(--surface)', border: '1px solid var(--border-subtle)',
                    borderRadius: 8, padding: 8, minWidth: 220,
                    boxShadow: 'var(--shadow-overlay)', zIndex: 200,
                    display: 'flex', flexDirection: 'column', gap: 2,
                    animation: 'fadeInScale 0.15s ease',
                  }}>
                    {/* Profile Summary Header */}
                    <div style={{ padding: '8px 12px', borderBottom: '1px solid var(--border-subtle)', marginBottom: 6 }}>
                      <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                        {user.fullName || user.nickname}
                      </p>
                      <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: '2px 0 0 0', wordBreak: 'break-all' }}>
                        {user.email}
                      </p>
                      <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap', marginTop: 6 }}>
                        <span style={{
                          display: 'inline-block', fontSize: 10, fontWeight: 700,
                          padding: '2px 6px', borderRadius: 4, background: '#EFF6FF', color: '#1D4ED8',
                          textTransform: 'capitalize',
                        }}>
                          {user.role}
                        </span>
                        {user.plan && (
                          <span style={{
                            display: 'inline-block', fontSize: 10, fontWeight: 700,
                            padding: '2px 6px', borderRadius: 4,
                            background: user.plan === 'free' ? 'rgba(255,255,255,0.06)' : 'rgba(23,184,151,0.1)',
                            color: user.plan === 'free' ? 'var(--text-secondary)' : 'var(--teal)',
                            textTransform: 'uppercase',
                            border: user.plan === 'free' ? '1px solid var(--border)' : '1px solid rgba(23,184,151,0.2)'
                          }}>
                            {user.plan}
                          </span>
                        )}
                      </div>
                    </div>

                    <Link href="/dashboard" onClick={() => setProfileDropdownOpen(false)} style={dropdownLinkStyle} onMouseOver={e => (e.currentTarget.style.background = 'var(--bg)')} onMouseOut={e => (e.currentTarget.style.background = 'transparent')}>Dashboard</Link>
                    <Link href="/profil" onClick={() => setProfileDropdownOpen(false)} style={dropdownLinkStyle} onMouseOver={e => (e.currentTarget.style.background = 'var(--bg)')} onMouseOut={e => (e.currentTarget.style.background = 'transparent')}>Profil Saya</Link>
                    <Link href="/langganan" onClick={() => setProfileDropdownOpen(false)} style={dropdownLinkStyle} onMouseOver={e => (e.currentTarget.style.background = 'var(--bg)')} onMouseOut={e => (e.currentTarget.style.background = 'transparent')}>Subscription</Link>
                    <Link href="/assessment" onClick={() => setProfileDropdownOpen(false)} style={dropdownLinkStyle} onMouseOver={e => (e.currentTarget.style.background = 'var(--bg)')} onMouseOut={e => (e.currentTarget.style.background = 'transparent')}>Assessment</Link>
                    <Link href="/journal" onClick={() => setProfileDropdownOpen(false)} style={dropdownLinkStyle} onMouseOver={e => (e.currentTarget.style.background = 'var(--bg)')} onMouseOut={e => (e.currentTarget.style.background = 'transparent')}>Journal</Link>
                    <Link href="/library" onClick={() => setProfileDropdownOpen(false)} style={dropdownLinkStyle} onMouseOver={e => (e.currentTarget.style.background = 'var(--bg)')} onMouseOut={e => (e.currentTarget.style.background = 'transparent')}>Library</Link>
                    <Link href="/pengaturan" onClick={() => setProfileDropdownOpen(false)} style={dropdownLinkStyle} onMouseOver={e => (e.currentTarget.style.background = 'var(--bg)')} onMouseOut={e => (e.currentTarget.style.background = 'transparent')}>Pengaturan</Link>
                    <Link href="/langganan" onClick={() => setProfileDropdownOpen(false)} style={dropdownLinkStyle} onMouseOver={e => (e.currentTarget.style.background = 'var(--bg)')} onMouseOut={e => (e.currentTarget.style.background = 'transparent')}>Riwayat Pembayaran</Link>
                    <Link href="/langganan" onClick={() => setProfileDropdownOpen(false)} style={dropdownLinkStyle} onMouseOver={e => (e.currentTarget.style.background = 'var(--bg)')} onMouseOut={e => (e.currentTarget.style.background = 'transparent')}>Invoice</Link>
                    <Link href="/faq" onClick={() => setProfileDropdownOpen(false)} style={dropdownLinkStyle} onMouseOver={e => (e.currentTarget.style.background = 'var(--bg)')} onMouseOut={e => (e.currentTarget.style.background = 'transparent')}>Bantuan</Link>
                    
                    <button
                      onClick={handleLogout}
                      style={{
                        display: 'block', width: '100%', textAlign: 'left', padding: '8px 12px', borderRadius: 4,
                        fontSize: 14, color: '#DC2626', background: 'transparent', border: 'none',
                        cursor: 'pointer', fontFamily: 'var(--font-sans)', fontWeight: 600,
                        marginTop: 6, borderTop: '1px solid var(--border-subtle)', paddingTop: 8,
                      }}
                      onMouseOver={e => (e.currentTarget.style.background = '#FEF2F2')}
                      onMouseOut={e => (e.currentTarget.style.background = 'transparent')}
                    >
                      Keluar
                    </button>
                  </div>
                </>
              )}
            </div>
          ) : (
            <>
              <Link href="/masuk" className="btn btn-secondary btn-sm">Masuk</Link>
              <Link href="/daftar" className="btn btn-primary btn-sm">Coba Gratis</Link>
            </>
          )}
        </div>

        {/* Mobile Hamburger */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {/* Avatar on App Bar for Mobile */}
          {!loading && user && (
            <div style={{ display: 'none' }} className="mobile-only-avatar">
              {user.avatarUrl ? (
                <img
                  src={user.avatarUrl}
                  alt={user.nickname}
                  onClick={() => setMobileOpen(true)}
                  style={{ width: 32, height: 32, borderRadius: '50%', objectFit: 'cover', cursor: 'pointer' }}
                />
              ) : (
                <div
                  onClick={() => setMobileOpen(true)}
                  style={{
                    width: 32, height: 32, borderRadius: '50%',
                    background: getAvatarColor(user.fullName || user.nickname || 'User'),
                    color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 13, fontWeight: 700, cursor: 'pointer'
                  }}
                >
                  {getInitials(user.fullName || user.nickname || 'User')}
                </div>
              )}
            </div>
          )}

          <button
            className="mobile-menu-btn"
            onClick={() => setMobileOpen(!mobileOpen)}
            style={{
              padding: 8, border: 'none', background: 'transparent',
              cursor: 'pointer', color: 'var(--text-primary)',
              display: 'none',
            }}
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu / Drawer */}
      {mobileOpen && (
        <div style={{
          position: 'fixed', top: 64, left: 0, right: 0, bottom: 0,
          background: 'var(--surface)', zIndex: 99,
          padding: '24px 16px', overflowY: 'auto',
          animation: 'slideInRight 0.2s ease',
        }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {NAV_LINKS.map(link => (
              <div key={link.label}>
                {link.children ? (
                  <>
                    <div style={{ padding: '12px 16px', fontSize: 16, fontWeight: 600, color: 'var(--text-primary)' }}>
                      {link.label}
                    </div>
                    {link.children.map(child => (
                      <Link
                        key={child.label}
                        href={child.href}
                        onClick={() => setMobileOpen(false)}
                        style={{
                          display: 'block', padding: '10px 32px', borderRadius: 6,
                          fontSize: 14, color: 'var(--text-secondary)', textDecoration: 'none',
                        }}
                      >
                        {child.label}
                      </Link>
                    ))}
                  </>
                ) : (
                  <Link
                    href={link.href}
                    onClick={() => setMobileOpen(false)}
                    style={{
                      display: 'block', padding: '12px 16px', borderRadius: 6,
                      fontSize: 16, fontWeight: 600, color: 'var(--text-primary)',
                      textDecoration: 'none',
                    }}
                  >
                    {link.label}
                  </Link>
                )}
              </div>
            ))}
          </div>

          {loading ? (
            <div style={{ borderTop: '1px solid var(--border-subtle)', marginTop: 24, paddingTop: 24, display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ height: 40, background: '#E2E8F0', borderRadius: 6, animation: 'pulse 1.5s infinite ease-in-out' }} />
              <div style={{ height: 40, background: '#E2E8F0', borderRadius: 6, animation: 'pulse 1.5s infinite ease-in-out' }} />
            </div>
          ) : user ? (
            <div style={{ borderTop: '1px solid var(--border-subtle)', marginTop: 24, paddingTop: 24, display: 'flex', flexDirection: 'column', gap: 4 }}>
              {/* Profile Card Header */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '0 16px 16px 16px', borderBottom: '1px solid var(--border-subtle)', marginBottom: 12 }}>
                {user.avatarUrl ? (
                  <img src={user.avatarUrl} alt={user.nickname} style={{ width: 44, height: 44, borderRadius: '50%', objectFit: 'cover' }} />
                ) : (
                  <div style={{
                    width: 44, height: 44, borderRadius: '50%',
                    background: getAvatarColor(user.fullName || user.nickname || 'User'),
                    color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 16, fontWeight: 700
                  }}>
                    {getInitials(user.fullName || user.nickname || 'User')}
                  </div>
                )}
                <div>
                  <h4 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: 'var(--text-primary)' }}>{user.fullName || user.nickname}</h4>
                  <p style={{ margin: '2px 0 0 0', fontSize: 12, color: 'var(--text-muted)', wordBreak: 'break-all' }}>{user.email}</p>
                  {user.plan && (
                    <span style={{
                      display: 'inline-block', fontSize: 10, fontWeight: 700,
                      padding: '1px 5px', borderRadius: 4,
                      background: user.plan === 'free' ? 'rgba(255,255,255,0.06)' : 'rgba(23,184,151,0.1)',
                      color: user.plan === 'free' ? 'var(--text-secondary)' : 'var(--teal)',
                      textTransform: 'uppercase', marginTop: 4,
                      border: user.plan === 'free' ? '1px solid var(--border)' : '1px solid rgba(23,184,151,0.2)'
                    }}>
                      {user.plan}
                    </span>
                  )}
                </div>
              </div>

              <Link href="/dashboard" onClick={() => setMobileOpen(false)} style={mobileLinkStyle}>Dashboard</Link>
              <Link href="/profil" onClick={() => setMobileOpen(false)} style={mobileLinkStyle}>Profil Saya</Link>
              <Link href="/langganan" onClick={() => setMobileOpen(false)} style={mobileLinkStyle}>Subscription</Link>
              <Link href="/assessment" onClick={() => setMobileOpen(false)} style={mobileLinkStyle}>Assessment</Link>
              <Link href="/journal" onClick={() => setMobileOpen(false)} style={mobileLinkStyle}>Journal</Link>
              <Link href="/library" onClick={() => setMobileOpen(false)} style={mobileLinkStyle}>Library</Link>
              <Link href="/pengaturan" onClick={() => setMobileOpen(false)} style={mobileLinkStyle}>Pengaturan</Link>
              <Link href="/langganan" onClick={() => setMobileOpen(false)} style={mobileLinkStyle}>Riwayat Pembayaran</Link>
              <Link href="/langganan" onClick={() => setMobileOpen(false)} style={mobileLinkStyle}>Invoice</Link>
              <Link href="/faq" onClick={() => setMobileOpen(false)} style={mobileLinkStyle}>Bantuan</Link>

              <button
                onClick={handleLogout}
                style={{
                  display: 'flex', width: '100%', justifyContent: 'center', padding: '12px 24px', borderRadius: 6,
                  fontSize: 15, fontWeight: 700, color: 'white', background: '#DC2626', border: 'none',
                  cursor: 'pointer', marginTop: 16, fontFamily: 'var(--font-sans)'
                }}
              >
                Keluar
              </button>
            </div>
          ) : (
            <div style={{ borderTop: '1px solid var(--border-subtle)', marginTop: 24, paddingTop: 24, display: 'flex', flexDirection: 'column', gap: 12 }}>
              <Link href="/masuk" onClick={() => setMobileOpen(false)} className="btn btn-secondary" style={{ width: '100%', justifyContent: 'center' }}>Masuk</Link>
              <Link href="/daftar" onClick={() => setMobileOpen(false)} className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }}>Coba Gratis</Link>
            </div>
          )}
        </div>
      )}

      <style jsx>{`
        @keyframes pulse {
          0%, 100% { opacity: 0.6; }
          50% { opacity: 1; }
        }
        @media (max-width: 767px) {
          .hidden-mobile { display: none !important; }
          .mobile-menu-btn { display: block !important; }
          .mobile-only-avatar { display: block !important; }
        }
      `}</style>
    </header>
  )
}
