'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import {
  Home, ClipboardList, Activity, BookOpen, MessageSquare,
  Users, TrendingUp, Library, Bookmark, CreditCard,
  Bell, Settings, ChevronRight, Menu, X, LogOut,
  Shield, User, Mic, Heart
} from 'lucide-react'
import { MOCK_USER } from '@/lib/data'
import { getInitials } from '@/lib/utils'
import { LoadingState } from '@/components/ui/FeedbackStates'

const NAV_ITEMS = [
  { id: 'dashboard', label: 'Dashboard', icon: Home, href: '/dashboard' },
  { id: 'assessment', label: 'Assessment', icon: ClipboardList, href: '/assessment' },
  { id: 'mood', label: 'Mood Tracker', icon: Activity, href: '/mood' },
  { id: 'journal', label: 'Journal', icon: BookOpen, href: '/journal' },
  { id: 'chat-analyzer', label: 'Chat Analyzer', icon: MessageSquare, href: '/chat-analyzer' },
  { id: 'voice-talk', label: 'Teman Curhat', icon: Heart, href: '/voice-talk' },
  { id: 'roleplay', label: 'Simulasi', icon: Users, href: '/roleplay' },
  { id: 'insights', label: 'Insight', icon: TrendingUp, href: '/insights' },
  { id: 'library', label: 'Library', icon: Library, href: '/library' },
  { id: 'bookmarks', label: 'Simpanan', icon: Bookmark, href: '/bookmarks' },
]

const BOTTOM_NAV = [
  { id: 'notifications', label: 'Notifikasi', icon: Bell, href: '/notifikasi' },
  { id: 'subscription', label: 'Langganan', icon: CreditCard, href: '/langganan' },
  { id: 'settings', label: 'Pengaturan', icon: Settings, href: '/pengaturan' },
]

interface UserLayoutProps {
  children: React.ReactNode
  activeNav?: string
}

export default function UserLayout({ children, activeNav }: UserLayoutProps) {
  const pathname = usePathname()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [notifCount, setNotifCount] = useState(0)
  const [user, setUser] = useState<any>(null)
  const [activePlan, setActivePlan] = useState('free')
  const [loading, setLoading] = useState(true)

  // Compute active item from pathname if activeNav is not explicitly provided
  let computedActiveNav = activeNav
  if (!computedActiveNav && pathname) {
    if (pathname === '/dashboard') computedActiveNav = 'dashboard'
    else if (pathname.startsWith('/assessment')) computedActiveNav = 'assessment'
    else if (pathname.startsWith('/mood')) computedActiveNav = 'mood'
    else if (pathname.startsWith('/journal')) computedActiveNav = 'journal'
    else if (pathname.startsWith('/chat-analyzer')) computedActiveNav = 'chat-analyzer'
    else if (pathname.startsWith('/voice-talk')) computedActiveNav = 'voice-talk'
    else if (pathname.startsWith('/roleplay')) computedActiveNav = 'roleplay'
    else if (pathname.startsWith('/insights')) computedActiveNav = 'insights'
    else if (pathname.startsWith('/library')) computedActiveNav = 'library'
    else if (pathname.startsWith('/bookmarks')) computedActiveNav = 'bookmarks'
    else if (pathname.startsWith('/notifikasi')) computedActiveNav = 'notifications'
    else if (pathname.startsWith('/langganan') || pathname.startsWith('/checkout') || pathname.startsWith('/payment')) computedActiveNav = 'subscription'
    else if (pathname.startsWith('/pengaturan')) computedActiveNav = 'settings'
    else if (pathname.startsWith('/profil')) computedActiveNav = 'settings'
    else if (pathname.startsWith('/admin')) computedActiveNav = 'admin'
  }

  useEffect(() => {
    fetch('/api/auth/me')
      .then(res => res.json())
      .then(data => {
        if (data.authenticated) {
          setUser(data.user)
          // Fetch active plan
          fetch('/api/user/billing')
            .then(res => res.json())
            .then(bData => {
              if (bData.success && bData.activeSubscription) {
                setActivePlan(bData.activeSubscription.planId)
              }
            })
            .catch(err => console.error('Error fetching active plan:', err))

          // Fetch notifications count
          fetch('/api/user/notifications')
            .then(res => res.json())
            .then(nData => {
              if (nData.success && nData.notifications) {
                const unread = nData.notifications.filter((n: any) => !n.isRead).length
                setNotifCount(unread)
              }
            })
            .catch(err => console.error('Error fetching notifications:', err))
        } else {
          const currentPath = window.location.pathname + window.location.search;
          window.location.href = `/masuk?redirect=${encodeURIComponent(currentPath)}`;
        }
        setLoading(false);
      })
      .catch(() => {
        const currentPath = window.location.pathname + window.location.search;
        window.location.href = `/masuk?redirect=${encodeURIComponent(currentPath)}`;
        setLoading(false);
      });
  }, [])

  const handleLogout = async (e: React.MouseEvent) => {
    e.preventDefault();
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch (err) {
      console.error('Logout error:', err);
    }
    window.location.href = '/masuk';
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)' }}>
        <LoadingState message="Lagi disiapin dulu nih..." />
      </div>
    );
  }

  return (
    <div className="app-layout">
      {/* Sidebar */}
      <aside className={`app-sidebar ${sidebarOpen ? 'open' : ''}`}>
        {/* Logo */}
        <div style={{ padding: '20px 16px', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
          <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none' }}>
            <div style={{
              width: 30, height: 30, borderRadius: 6,
              background: 'linear-gradient(135deg, #0286C3, #17B897)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0,
            }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
              </svg>
            </div>
            <span style={{ fontWeight: 800, fontSize: 16, color: 'white', letterSpacing: '-0.01em' }}>Insight Hub</span>
          </Link>
        </div>

        {/* Nav items */}
        <nav style={{ padding: '12px 8px', flex: 1, overflowY: 'auto' }}>
          <p style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.45)', textTransform: 'uppercase', letterSpacing: '0.1em', padding: '8px 8px 4px' }}>Menu</p>
          {NAV_ITEMS.map(item => (
            <Link
              key={item.id}
              href={item.href}
              className={`nav-item ${computedActiveNav === item.id ? 'active' : ''}`}
              style={{ marginBottom: 2 }}
            >
              <item.icon size={16} />
              {item.label}
            </Link>
          ))}

          {user?.role === 'admin' && (
            <>
              <p style={{ fontSize: 10, fontWeight: 700, color: '#38BDF8', textTransform: 'uppercase', letterSpacing: '0.1em', padding: '16px 8px 4px', marginTop: 8 }}>Admin</p>
              <Link
                href="/admin"
                className={`nav-item ${computedActiveNav === 'admin' ? 'active' : ''}`}
                style={{ marginBottom: 2 }}
              >
                <Shield size={16} color="#38BDF8" />
                Admin Panel
              </Link>
            </>
          )}

          <p style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.45)', textTransform: 'uppercase', letterSpacing: '0.1em', padding: '16px 8px 4px', marginTop: 8 }}>Akun</p>
          {BOTTOM_NAV.map(item => (
            <Link
              key={item.id}
              href={item.href}
              className={`nav-item ${computedActiveNav === item.id ? 'active' : ''}`}
              style={{ marginBottom: 2, position: 'relative' }}
            >
              <item.icon size={16} />
              {item.label}
              {item.id === 'notifications' && notifCount > 0 && (
                <span style={{
                  marginLeft: 'auto', background: 'var(--error)', color: 'white',
                  fontSize: 10, fontWeight: 700, borderRadius: 999,
                  minWidth: 18, height: 18, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  padding: '0 5px',
                }}>
                  {notifCount}
                </span>
              )}
            </Link>
          ))}
        </nav>

        {/* User profile at bottom */}
        <div style={{ padding: '12px 8px', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
          {/* Plan badge */}
          <div style={{
            padding: '10px 12px', borderRadius: 8, marginBottom: 8,
            background: 'linear-gradient(135deg, rgba(2,134,195,0.2), rgba(23,184,151,0.2))',
            border: '1px solid rgba(2,134,195,0.3)',
          }}>
            <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)', margin: '0 0 2px' }}>Paket aktif</p>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: '#38BDF8', textTransform: 'uppercase' }}>
                {user?.role === 'admin' ? 'Admin' : (activePlan === 'free' ? 'Gratis' : activePlan === 'couple' ? 'Couple Plan' : activePlan.toUpperCase())}
              </span>
              {user?.role !== 'admin' && activePlan !== 'couple' && (
                <Link href="/langganan" style={{ fontSize: 11, color: 'var(--teal)', textDecoration: 'none', fontWeight: 600 }}>
                  Upgrade
                </Link>
              )}
            </div>
          </div>

          {/* User info */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px', borderRadius: 8 }}>
            <div style={{
              width: 32, height: 32, borderRadius: '50%', overflow: 'hidden',
              background: 'rgba(2,134,195,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0, fontSize: 12, fontWeight: 700, color: '#38BDF8',
              position: 'relative',
            }}>
              <Image src={user?.avatarUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=80&h=80&fit=crop&crop=face'} alt={user?.nickname || 'Kamu'} fill style={{ objectFit: 'cover' }} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontSize: 13, fontWeight: 700, color: 'white', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {user?.nickname || 'Kamu'}
              </p>
              <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {user?.email || ''}
              </p>
            </div>
            <button
              onClick={handleLogout}
              style={{
                color: 'rgba(255,255,255,0.6)', padding: 4,
                borderRadius: 4, display: 'flex',
                background: 'none', border: 'none', cursor: 'pointer',
                transition: 'color 150ms ease',
              }}
              title="Keluar"
              onMouseOver={e => (e.currentTarget.style.color = 'var(--error)')}
              onMouseOut={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.6)')}
            >
              <LogOut size={14} />
            </button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="app-main">
        {/* Topbar */}
        <div className="app-topbar">
          {/* Mobile menu button */}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            style={{
              padding: 8, border: 'none', background: 'transparent',
              cursor: 'pointer', color: 'var(--text-secondary)',
              marginRight: 8, display: 'none', borderRadius: 6,
            }}
            className="mobile-menu-btn"
            aria-label="Toggle sidebar"
          >
            {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>

          <div style={{ flex: 1 }} />

          {/* Topbar actions */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Link
              href="/notifikasi"
              style={{
                width: 36, height: 36, borderRadius: 6, background: 'var(--bg)',
                border: '1px solid var(--border-subtle)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: 'var(--text-secondary)', textDecoration: 'none', position: 'relative',
              }}
            >
              <Bell size={16} />
              {notifCount > 0 && (
                <span style={{
                  position: 'absolute', top: -4, right: -4,
                  background: 'var(--error)', color: 'white',
                  fontSize: 9, fontWeight: 700, borderRadius: 999,
                  minWidth: 16, height: 16, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  padding: '0 4px',
                }}>
                  {notifCount}
                </span>
              )}
            </Link>

            <Link
              href="/profil"
              style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '6px 10px', borderRadius: 6,
                border: '1px solid var(--border-subtle)',
                textDecoration: 'none',
                background: 'var(--bg)',
                transition: 'border-color 150ms ease',
              }}
              onMouseOver={e => (e.currentTarget.style.borderColor = 'var(--brand-blue)')}
              onMouseOut={e => (e.currentTarget.style.borderColor = 'var(--border-subtle)')}
            >
              <div style={{ width: 24, height: 24, borderRadius: '50%', overflow: 'hidden', position: 'relative' }}>
                <Image src={user?.avatarUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=80&h=80&fit=crop&crop=face'} alt={user?.nickname || 'Kamu'} fill style={{ objectFit: 'cover' }} />
              </div>
              <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{user?.fullName || 'Kamu'}</span>
            </Link>
          </div>
        </div>

        {/* Page content */}
        <div className="app-content">
          {children}
        </div>
      </div>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
            zIndex: 49,
          }}
        />
      )}

      <style jsx global>{`
        @media (max-width: 1023px) {
          .mobile-menu-btn { display: flex !important; }
        }
        .modal-overlay,
        [class*="modal-overlay"],
        [class*="backdrop-blur"] {
          background: transparent !important;
          backdrop-filter: none !important;
          -webkit-backdrop-filter: none !important;
          filter: none !important;
        }
        .app-sidebar .nav-item {
          color: rgba(255, 255, 255, 0.9) !important;
        }
        .app-sidebar .nav-item svg {
          color: rgba(255, 255, 255, 0.75) !important;
        }
        .app-sidebar .nav-item:hover {
          background: rgba(255, 255, 255, 0.12) !important;
          color: #FFFFFF !important;
        }
        .app-sidebar .nav-item:hover svg {
          color: #FFFFFF !important;
        }
        .app-sidebar .nav-item.active {
          background: rgba(2, 134, 195, 0.3) !important;
          color: #FFFFFF !important;
        }
        .app-sidebar .nav-item.active svg {
          color: #38BDF8 !important;
        }
      `}</style>
    </div>
  )
}
