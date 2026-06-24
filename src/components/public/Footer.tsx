'use client'

import Link from 'next/link'

const TwitterIcon = ({ size = 16 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z" />
  </svg>
)

const InstagramIcon = ({ size = 16 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
  </svg>
)

const LinkedinIcon = ({ size = 16 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
    <rect x="2" y="9" width="4" height="12" />
    <circle cx="4" cy="4" r="2" />
  </svg>
)

const MailIcon = ({ size = 16 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
    <polyline points="22,6 12,13 2,6" />
  </svg>
)

const HeartIcon = ({ size = 16, style }: { size?: number; style?: React.CSSProperties }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={style}>
    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
  </svg>
)

const FOOTER_LINKS = {
  Produk: [
    { label: 'Fitur', href: '/fitur' },
    { label: 'Harga', href: '/harga' },
    { label: 'Demo Gratis', href: '/demo' },
    { label: 'Roadmap', href: '#' },
    { label: 'Changelog', href: '#' },
  ],
  Konten: [
    { label: 'Blog', href: '/blog' },
    { label: 'FAQ', href: '/faq' },
    { label: 'Success Story', href: '/cerita' },
    { label: 'Komunitas', href: '/komunitas' },
    { label: 'Newsletter', href: '/newsletter' },
  ],
  Perusahaan: [
    { label: 'Tentang Kami', href: '/tentang' },
    { label: 'Kontak', href: '/kontak' },
    { label: 'Karir', href: '#' },
    { label: 'Pers & Media', href: '#' },
  ],
  Legal: [
    { label: 'Syarat & Ketentuan', href: '/terms' },
    { label: 'Kebijakan Privasi', href: '/privacy' },
    { label: 'Kebijakan Cookie', href: '/cookies' },
    { label: 'Consent', href: '/consent' },
  ],
}

const SOCIALS = [
  { icon: TwitterIcon, href: '#', label: 'Twitter' },
  { icon: InstagramIcon, href: '#', label: 'Instagram' },
  { icon: LinkedinIcon, href: '#', label: 'LinkedIn' },
  { icon: MailIcon, href: 'mailto:halo@insighthub.id', label: 'Email' },
]

export default function PublicFooter() {
  return (
    <footer style={{
      background: 'var(--text-primary)',
      color: 'rgba(255,255,255,0.7)',
      paddingTop: 64,
    }}>
      <div className="container">
        {/* Top section */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr',
          gap: 48,
          paddingBottom: 48,
          borderBottom: '1px solid rgba(255,255,255,0.1)',
        }}>
          {/* Brand */}
          <div style={{ maxWidth: 300 }}>
            <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none', marginBottom: 16 }}>
              <div style={{
                width: 36, height: 36, borderRadius: 8,
                background: 'linear-gradient(135deg, #0286C3, #17B897)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                </svg>
              </div>
              <span style={{ fontWeight: 800, fontSize: 20, color: 'white', letterSpacing: '-0.02em' }}>Insight Hub</span>
            </Link>
            <p style={{ fontSize: 14, lineHeight: 1.7, color: 'rgba(255,255,255,0.55)', marginBottom: 24 }}>
              Platform self-awareness berbasis sains buat kamu yang mau ngerti pola komunikasi dan dinamika relasi dengan lebih waras.
            </p>
            <div style={{ display: 'flex', gap: 8 }}>
              {SOCIALS.map(({ icon: Icon, href, label }) => (
                <a
                  key={label}
                  href={href}
                  aria-label={label}
                  style={{
                    width: 36, height: 36, borderRadius: 6,
                    background: 'rgba(255,255,255,0.08)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: 'rgba(255,255,255,0.7)', textDecoration: 'none',
                    transition: 'background 150ms ease, color 150ms ease',
                  }}
                  onMouseOver={e => {
                    e.currentTarget.style.background = 'rgba(255,255,255,0.15)'
                    e.currentTarget.style.color = 'white'
                  }}
                  onMouseOut={e => {
                    e.currentTarget.style.background = 'rgba(255,255,255,0.08)'
                    e.currentTarget.style.color = 'rgba(255,255,255,0.7)'
                  }}
                >
                  <Icon size={16} />
                </a>
              ))}
            </div>
          </div>

          {/* Links Grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: 32,
          }}>
            {Object.entries(FOOTER_LINKS).map(([category, links]) => (
              <div key={category}>
                <h4 style={{
                  fontSize: 12, fontWeight: 700, color: 'white',
                  textTransform: 'uppercase', letterSpacing: '0.08em',
                  marginBottom: 16,
                }}>
                  {category}
                </h4>
                <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {links.map(link => (
                    <li key={link.label}>
                      <Link
                        href={link.href}
                        style={{
                          fontSize: 14, color: 'rgba(255,255,255,0.55)',
                          textDecoration: 'none', transition: 'color 150ms ease',
                        }}
                        onMouseOver={e => (e.currentTarget.style.color = 'white')}
                        onMouseOut={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.55)')}
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom bar */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '20px 0', flexWrap: 'wrap', gap: 16,
        }}>
          <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', margin: 0 }}>
            &copy; {new Date().getFullYear()} Insight Hub. Dibuat dengan{' '}
            <HeartIcon size={12} style={{ display: 'inline', color: '#E91E63', verticalAlign: 'middle' }} />{' '}
            di Indonesia.
          </p>
          <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)', margin: 0, textAlign: 'right', maxWidth: 400 }}>
            Insight Hub adalah alat bantu self-reflection — bukan pengganti profesional kesehatan mental.
            Kalau kamu butuh bantuan lebih, silakan konsultasi ke psikolog atau konselor.
          </p>
        </div>
      </div>

      <style jsx>{`
        @media (min-width: 768px) {
          footer > div > div:first-child {
            grid-template-columns: 300px 1fr !important;
          }
          footer > div > div:first-child > div:last-child {
            grid-template-columns: repeat(4, 1fr) !important;
          }
        }
      `}</style>
    </footer>
  )
}
