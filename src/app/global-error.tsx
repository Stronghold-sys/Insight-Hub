'use client'

import { useEffect } from 'react'

interface GlobalErrorProps {
  error: Error & { digest?: string }
  reset: () => void
}

export default function GlobalError({ error, reset }: GlobalErrorProps) {
  useEffect(() => {
    console.error('Captured by Global Error Boundary:', error)
  }, [error])

  return (
    <html lang="id">
      <body style={{ margin: 0 }}>
        <div style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'radial-gradient(circle at center, #0b1528 0%, #030712 100%)',
          color: '#ffffff',
          fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
          padding: '24px',
          textAlign: 'center'
        }}>
          <div style={{
            maxWidth: '480px',
            width: '100%',
            background: 'rgba(255, 255, 255, 0.03)',
            backdropFilter: 'blur(16px)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '24px',
            padding: '40px 32px',
            boxShadow: '0 20px 40px rgba(0, 0, 0, 0.3)'
          }}>
            <div style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              background: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 24px',
              color: '#ef4444'
            }}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
                <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/>
                <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/>
              </svg>
            </div>

            <h1 style={{
              fontSize: '24px',
              fontWeight: 800,
              marginBottom: '12px',
              letterSpacing: '-0.02em',
              background: 'linear-gradient(135deg, #ffffff, #94a3b8)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent'
            }}>
              Fatal Error Terdeteksi
            </h1>

            <p style={{
              fontSize: '14px',
              color: '#94a3b8',
              lineHeight: '1.6',
              marginBottom: '32px'
            }}>
              Terjadi kesalahan fatal pada aplikasi. Kami mohon maaf atas ketidaknyamanan ini. Silakan coba muat ulang aplikasi.
            </p>

            {error.message && (
              <div style={{
                background: 'rgba(0, 0, 0, 0.2)',
                border: '1px solid rgba(255, 255, 255, 0.05)',
                borderRadius: '12px',
                padding: '12px 16px',
                fontSize: '12px',
                fontFamily: 'monospace',
                color: '#ef4444',
                textAlign: 'left',
                overflowX: 'auto',
                marginBottom: '32px',
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-all'
              }}>
                {error.message}
              </div>
            )}

            <button
              onClick={() => reset()}
              style={{
                width: '100%',
                padding: '14px',
                fontSize: '14px',
                fontWeight: 600,
                color: '#030712',
                background: '#ffffff',
                border: 'none',
                borderRadius: '12px',
                cursor: 'pointer',
                transition: 'background-color 150ms ease'
              }}
              onMouseOver={(e) => e.currentTarget.style.background = '#e2e8f0'}
              onMouseOut={(e) => e.currentTarget.style.background = '#ffffff'}
            >
              Muat Ulang Aplikasi
            </button>
          </div>
        </div>
      </body>
    </html>
  )
}
