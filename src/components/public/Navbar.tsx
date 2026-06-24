'use client'

import Link from 'next/link'
import { useState } from 'react'
import { Menu, X, ChevronDown } from 'lucide-react'

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

export default function PublicNavbar() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [dropdownOpen, setDropdownOpen] = useState<string | null>(null)

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

        {/* CTA Buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }} className="hidden-mobile">
          <Link href="/masuk" className="btn btn-secondary btn-sm">Masuk</Link>
          <Link href="/daftar" className="btn btn-primary btn-sm">Coba Gratis</Link>
        </div>

        {/* Mobile Hamburger */}
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

      {/* Mobile Menu */}
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
                {link.children && link.children.map(child => (
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
              </div>
            ))}
          </div>

          <div style={{ borderTop: '1px solid var(--border-subtle)', marginTop: 24, paddingTop: 24, display: 'flex', flexDirection: 'column', gap: 12 }}>
            <Link href="/masuk" className="btn btn-secondary" style={{ width: '100%', justifyContent: 'center' }}>Masuk</Link>
            <Link href="/daftar" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }}>Coba Gratis</Link>
          </div>
        </div>
      )}

      <style jsx>{`
        @media (max-width: 767px) {
          .hidden-mobile { display: none !important; }
          .mobile-menu-btn { display: block !important; }
        }
      `}</style>
    </header>
  )
}
