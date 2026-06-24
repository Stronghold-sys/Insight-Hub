'use client'

import Link from 'next/link'
import { Check, X, Shield, ArrowRight } from 'lucide-react'
import { PRICING_PLANS } from '@/lib/data'

export default function HargaPage() {
  return (
    <div style={{ background: 'transparent', minHeight: 'calc(100vh - 64px)', paddingTop: 48, paddingBottom: 80 }}>
      <div className="container" style={{ maxWidth: 1100 }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 56 }}>
          <span style={{
            fontSize: 12, fontWeight: 700, color: 'var(--brand-blue)',
            textTransform: 'uppercase', letterSpacing: '0.1em',
            background: 'rgba(2,134,195,0.08)', padding: '6px 12px', borderRadius: 999
          }}>
            Investasi Buat Peace of Mind
          </span>
          <h1 style={{ fontSize: 36, fontWeight: 800, color: 'var(--text-primary)', marginTop: 16, marginBottom: 16, letterSpacing: '-0.02em' }}>
            Pilih Paket yang Relate Sama Kamu
          </h1>
          <p style={{ fontSize: 16, color: 'var(--text-secondary)', lineHeight: 1.6, maxWidth: 600, margin: '0 auto' }}>
            Mulai dari gratis sampai paket komplit bareng pasangan. Upgrade gampang, cancel kapan aja tanpa ribet.
          </p>
        </div>

        {/* Pricing Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: 24,
          marginBottom: 64,
          alignItems: 'stretch'
        }}>
          {PRICING_PLANS.map((plan) => {
            const isFree = plan.price === 0
            const isPopular = plan.popular
            return (
              <div
                key={plan.id}
                className="card"
                style={{
                  padding: 32,
                  display: 'flex',
                  flexDirection: 'column',
                  border: isPopular ? '2px solid var(--brand-blue)' : '1px solid var(--border-subtle)',
                  position: 'relative',
                  transform: isPopular ? 'scale(1.02)' : 'none',
                  background: 'var(--surface)',
                }}
              >
                {isPopular && (
                  <span style={{
                    position: 'absolute', top: -12, left: '50%', transform: 'translateX(-50%)',
                    background: 'var(--brand-blue)', color: 'white', fontSize: 10, fontWeight: 800,
                    textTransform: 'uppercase', padding: '4px 12px', borderRadius: 999, letterSpacing: '0.05em'
                  }}>
                    Paling Rekomendasi
                  </span>
                )}
                <div style={{ marginBottom: 20 }}>
                  <h3 style={{ fontSize: 20, fontWeight: 800, color: 'var(--text-primary)', margin: '0 0 8px' }}>
                    {plan.name}
                  </h3>
                  <p style={{ fontSize: 12, color: 'var(--text-secondary)', minHeight: 36, margin: 0 }}>
                    {plan.description}
                  </p>
                </div>

                <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginBottom: 24 }}>
                  <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-secondary)' }}>
                    {isFree ? '' : 'Rp'}
                  </span>
                  <span style={{ fontSize: 32, fontWeight: 900, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
                    {isFree ? 'Gratis' : plan.price.toLocaleString('id-ID')}
                  </span>
                  <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                    {plan.billing}
                  </span>
                </div>

                {/* Features List */}
                <div style={{ flex: 1, marginBottom: 28 }}>
                  <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)', marginBottom: 12 }}>Fitur yang didapet:</p>
                  <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {plan.features.map((feat, idx) => (
                      <li key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: 13, color: 'var(--text-secondary)' }}>
                        <Check size={14} color="var(--teal)" style={{ flexShrink: 0, marginTop: 2 }} />
                        <span>{feat}</span>
                      </li>
                    ))}
                    {plan.notIncluded && plan.notIncluded.map((feat, idx) => (
                      <li key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: 13, color: 'var(--text-muted)', textDecoration: 'line-through' }}>
                        <X size={14} color="var(--text-muted)" style={{ flexShrink: 0, marginTop: 2 }} />
                        <span>{feat}</span>
                      </li>
                    ))}
                  </ul>
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
                  className={`btn ${isPopular ? 'btn-primary' : 'btn-secondary'}`}
                  style={{ width: '100%', justifyContent: 'center' }}
                >
                  {plan.cta}
                </Link>
              </div>
            )
          })}
        </div>

        {/* Security & FAQ Short Notice */}
        <div className="card" style={{ padding: 24, display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
          <div style={{
            width: 44, height: 44, borderRadius: 999, background: 'rgba(23,184,151,0.08)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--teal)', flexShrink: 0
          }}>
            <Shield size={20} />
          </div>
          <div style={{ flex: 1, minWidth: 260 }}>
            <h4 style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 4px' }}>Garansi Privasi 100% Terenkripsi</h4>
            <p style={{ fontSize: 12.5, color: 'var(--text-secondary)', margin: 0, lineHeight: 1.5 }}>
              Semua detail obrolan, entri jurnal, dan hasil kuis kamu disimpan secara aman. Kita gak pernah jual atau share data personal kamu ke pihak lain.
            </p>
          </div>
          <Link href="/faq" className="btn btn-secondary btn-sm" style={{ border: '1px solid var(--border)', textDecoration: 'none' }}>
            Lihat FAQ Harga
          </Link>
        </div>
      </div>
    </div>
  )
}
