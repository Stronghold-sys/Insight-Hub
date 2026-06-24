'use client'

import { useState, useEffect } from 'react'
import { HelpCircle, ChevronDown, ChevronUp, MessageSquare, ArrowRight } from 'lucide-react'
import Link from 'next/link'
import { FAQS as STATIC_FAQS } from '@/lib/data'

export default function FAQPage() {
  const [faqs, setFaqs] = useState<any[]>(STATIC_FAQS)
  const [openId, setOpenId] = useState<string | number | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Ambil data FAQ dari database secara riil
    fetch('/api/admin/cms?module=faqs')
      .then(res => res.json())
      .then(data => {
        if (data.success && data.data && data.data.length > 0) {
          setFaqs(data.data)
        }
        setLoading(false)
      })
      .catch(() => {
        // Fallback ke data static jika API bermasalah
        setLoading(false)
      })
  }, [])

  const toggleFAQ = (id: string | number) => {
    setOpenId(openId === id ? null : id)
  }

  return (
    <div style={{ background: 'transparent', minHeight: 'calc(100vh - 64px)', paddingTop: 48, paddingBottom: 80 }}>
      <div className="container" style={{ maxWidth: 800 }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 48 }}>
          <span style={{
            fontSize: 12, fontWeight: 700, color: 'var(--brand-blue)',
            textTransform: 'uppercase', letterSpacing: '0.1em',
            background: 'rgba(2,134,195,0.08)', padding: '6px 12px', borderRadius: 999
          }}>
            Pusat Bantuan & FAQ
          </span>
          <h1 style={{ fontSize: 36, fontWeight: 800, color: 'var(--text-primary)', marginTop: 16, marginBottom: 12, letterSpacing: '-0.02em' }}>
            Ada yang Mau Ditanyain?
          </h1>
          <p style={{ fontSize: 16, color: 'var(--text-secondary)', lineHeight: 1.6, maxWidth: 500, margin: '0 auto' }}>
            Pertanyaan yang paling sering muncul seputar platform, privasi data, metode, dan sistem billing kita jawab di sini.
          </p>
        </div>

        {/* FAQ Accordion */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 48 }}>
          {faqs.map((faq, index) => {
            const id = faq.id || index
            const isOpen = openId === id
            return (
              <div
                key={id}
                className="card"
                style={{
                  padding: '20px 24px',
                  cursor: 'pointer',
                  border: isOpen ? '1px solid var(--brand-blue)' : '1px solid var(--border-subtle)',
                  transition: 'all 150ms ease',
                  background: 'var(--surface)'
                }}
                onClick={() => toggleFAQ(id)}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <HelpCircle size={18} color={isOpen ? 'var(--brand-blue)' : 'var(--text-secondary)'} style={{ flexShrink: 0 }} />
                    <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.4 }}>
                      {faq.question}
                    </span>
                  </div>
                  {isOpen ? <ChevronUp size={16} color="var(--text-secondary)" /> : <ChevronDown size={16} color="var(--text-secondary)" />}
                </div>

                {isOpen && (
                  <div style={{
                    marginTop: 16, paddingTop: 16, borderTop: '1px solid var(--border-subtle)',
                    fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.7,
                    animation: 'fadeIn 0.2s ease'
                  }}>
                    {faq.answer}
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {/* Belum Terjawab Section */}
        <div style={{
          background: 'var(--surface)', border: '1px solid var(--border-subtle)',
          borderRadius: 8, padding: 32, textAlign: 'center'
        }}>
          <div style={{
            width: 48, height: 48, borderRadius: 999, background: 'rgba(2,134,195,0.08)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--brand-blue)', margin: '0 auto 16px'
          }}>
            <MessageSquare size={22} />
          </div>
          <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 8 }}>Pertanyaanmu Belum Terjawab?</h3>
          <p style={{ fontSize: 13.5, color: 'var(--text-secondary)', lineHeight: 1.6, maxWidth: 500, margin: '0 auto 20px' }}>
            Tenang, tim kita siap bantu! Kirim pesan langsung lewat form kontak, atau laporkan bug/masalah teknis yang kamu hadapi.
          </p>
          <Link href="/kontak" className="btn btn-secondary" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, border: '1px solid var(--border)' }}>
            Hubungi Customer Support
            <ArrowRight size={14} />
          </Link>
        </div>
      </div>
    </div>
  )
}
