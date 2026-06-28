'use client'

import { useEffect } from 'react'
import Link from 'next/link'

interface ErrorProps {
  error: Error & { digest?: string }
  reset: () => void
}

export default function Error({ error, reset }: ErrorProps) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error('Captured by App Router Boundary:', error)
  }, [error])

  return (
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
        {/* Animated Error Icon */}
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
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
            <line x1="12" y1="9" x2="12" y2="13"/>
            <line x1="12" y1="17" x2="12.01" y2="17"/>
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
          Terjadi Kesalahan Sistem
        </h1>

        <p style={{
          fontSize: '14px',
          color: '#94a3b8',
          lineHeight: '1.6',
          marginBottom: '32px'
        }}>
          Aplikasi mengalami kegagalan saat memuat halaman ini. Kami telah mencatat detail kendala ini untuk perbaikan.
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

        <div style={{
          display: 'flex',
          gap: '12px',
          justifyContent: 'center'
        }}>
          <button
            onClick={() => reset()}
            style={{
              padding: '12px 24px',
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
            Coba Lagi
          </button>
          
          <Link
            href="/"
            style={{
              padding: '12px 24px',
              fontSize: '14px',
              fontWeight: 600,
              color: '#ffffff',
              background: 'rgba(255, 255, 255, 0.08)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '12px',
              textDecoration: 'none',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 150ms ease'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.12)';
              e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.2)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)';
              e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)';
            }}
          >
            Kembali ke Beranda
          </Link>
        </div>
      </div>
    </div>
  )
}
