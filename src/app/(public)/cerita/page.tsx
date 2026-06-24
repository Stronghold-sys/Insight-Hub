'use client'

import Link from 'next/link'
import Image from 'next/image'
import { Award, ArrowRight, Quote, Shield } from 'lucide-react'
import { CASE_STUDIES } from '@/lib/data'

export default function CeritaPage() {
  return (
    <div style={{ background: 'transparent', minHeight: 'calc(100vh - 64px)', paddingTop: 48, paddingBottom: 80 }}>
      <div className="container" style={{ maxWidth: 900 }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 48 }}>
          <span style={{
            fontSize: 12, fontWeight: 700, color: 'var(--brand-blue)',
            textTransform: 'uppercase', letterSpacing: '0.1em',
            background: 'rgba(2,134,195,0.08)', padding: '6px 12px', borderRadius: 999
          }}>
            Cerita Nyata & Growth
          </span>
          <h1 style={{ fontSize: 36, fontWeight: 800, color: 'var(--text-primary)', marginTop: 16, marginBottom: 12, letterSpacing: '-0.02em' }}>
            Sebelum vs Sesudah Pakai Insight Hub
          </h1>
          <p style={{ fontSize: 16, color: 'var(--text-secondary)', lineHeight: 1.6, maxWidth: 550, margin: '0 auto' }}>
            Kumpulan cerita dari mereka yang berhasil membangun komunikasi lebih asertif dan melepas pola-pola toksik.
          </p>
        </div>

        {/* Case Studies */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 32, marginBottom: 48 }}>
          {CASE_STUDIES.map((study) => (
            <div key={study.id} className="card grid-md-2-columns" style={{ padding: 0, overflow: 'hidden', display: 'grid', gridTemplateColumns: '1fr' }}>
              <div style={{ position: 'relative', minHeight: 240, width: '100%' }}>
                <Image src={study.coverImage} alt={study.title} fill style={{ objectFit: 'cover' }} />
              </div>
              <div style={{ padding: 32, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                <span style={{
                  fontSize: 10, fontWeight: 800, color: 'var(--brand-blue)',
                  background: 'rgba(2,134,195,0.08)', padding: '3px 8px', borderRadius: 4,
                  textTransform: 'uppercase', alignSelf: 'flex-start', marginBottom: 12
                }}>
                  {study.duration} Program
                </span>
                
                <h3 style={{ fontSize: 20, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 16 }}>
                  {study.title} ({study.name})
                </h3>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
                  <div style={{ background: 'rgba(211,47,47,0.04)', padding: 12, borderRadius: 6, borderLeft: '3px solid var(--error)' }}>
                    <h5 style={{ fontSize: 11, fontWeight: 800, color: 'var(--error)', margin: '0 0 4px', textTransform: 'uppercase' }}>Sebelum:</h5>
                    <p style={{ fontSize: 12, color: 'var(--text-secondary)', margin: 0, lineHeight: 1.4 }}>{study.before}</p>
                  </div>
                  <div style={{ background: 'rgba(23,184,151,0.04)', padding: 12, borderRadius: 6, borderLeft: '3px solid var(--teal)' }}>
                    <h5 style={{ fontSize: 11, fontWeight: 800, color: 'var(--teal)', margin: '0 0 4px', textTransform: 'uppercase' }}>Sesudah:</h5>
                    <p style={{ fontSize: 12, color: 'var(--text-secondary)', margin: 0, lineHeight: 1.4 }}>{study.after}</p>
                  </div>
                </div>

                <div style={{ position: 'relative', background: 'var(--bg)', padding: '16px 20px', borderRadius: 8, fontStyle: 'italic', fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: 16 }}>
                  <span style={{ position: 'absolute', top: 4, left: 6, opacity: 0.1, color: 'var(--text-primary)' }}>
                    <Quote size={24} />
                  </span>
                  &ldquo;{study.quote}&rdquo;
                </div>

                <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                  {study.features.map((feat, idx) => (
                    <span key={idx} style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-secondary)', background: 'var(--border-subtle)', padding: '2px 8px', borderRadius: 4 }}>
                      {feat}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="card" style={{ padding: 32, textAlign: 'center', background: 'linear-gradient(135deg, #0286C3, #17B897)', color: 'white' }}>
          <h3 style={{ fontSize: 18, fontWeight: 800, color: 'white', marginBottom: 8 }}>Mulai Cerita Perubahan Hubungan Kamu Sendiri</h3>
          <p style={{ fontSize: 13.5, color: 'rgba(255,255,255,0.85)', lineHeight: 1.6, maxWidth: 500, margin: '0 auto 24px' }}>
            Kenali diri kamu lebih dalam, lacak pemicu konflik, dan perbaiki pola komunikasimu bareng platform Insight Hub.
          </p>
          <Link href="/daftar" className="btn btn-primary" style={{ background: 'white', color: 'var(--brand-blue)', display: 'inline-flex', alignItems: 'center', gap: 8 }}>
            Coba Gratis Sekarang
            <ArrowRight size={14} />
          </Link>
        </div>
      </div>

      <style jsx>{`
        @media (min-width: 768px) {
          .grid-md-2-columns {
            grid-template-columns: 1fr 1.2fr !important;
          }
        }
      `}</style>
    </div>
  )
}
