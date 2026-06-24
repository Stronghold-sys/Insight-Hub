'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Search as SearchIcon, ArrowRight, HelpCircle, FileText, Settings } from 'lucide-react'
import { BLOG_POSTS, FAQS, FEATURES_HIGHLIGHT } from '@/lib/data'

export default function SearchPage() {
  const [query, setQuery] = useState('')

  // Search logic across three datasets
  const matchedArticles = query ? BLOG_POSTS.filter(post =>
    post.title.toLowerCase().includes(query.toLowerCase()) ||
    post.excerpt.toLowerCase().includes(query.toLowerCase())
  ) : []

  const matchedFaqs = query ? FAQS.filter(faq =>
    faq.question.toLowerCase().includes(query.toLowerCase()) ||
    faq.answer.toLowerCase().includes(query.toLowerCase())
  ) : []

  const matchedFeatures = query ? FEATURES_HIGHLIGHT.filter(feat =>
    feat.title.toLowerCase().includes(query.toLowerCase()) ||
    feat.description.toLowerCase().includes(query.toLowerCase())
  ) : []

  const totalResults = matchedArticles.length + matchedFaqs.length + matchedFeatures.length

  return (
    <div style={{ background: 'transparent', minHeight: 'calc(100vh - 64px)', paddingTop: 48, paddingBottom: 80 }}>
      <div className="container" style={{ maxWidth: 800 }}>
        {/* Header / Search bar */}
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <h1 style={{ fontSize: 28, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 20 }}>
            Pencarian Global Platform
          </h1>
          <div style={{ position: 'relative', width: '100%', maxWidth: 550, margin: '0 auto' }}>
            <span style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}>
              <SearchIcon size={20} />
            </span>
            <input
              type="text"
              placeholder="Ketik apa aja (contoh: kuis, cemas, love language)..."
              value={query}
              onChange={e => setQuery(e.target.value)}
              style={{
                width: '100%', padding: '14px 16px 14px 48px', borderRadius: 8,
                border: '1px solid var(--border)', background: 'var(--surface)',
                fontSize: 14.5, outline: 'none', transition: 'border-color 150ms ease',
                boxShadow: 'var(--shadow-raised)'
              }}
              onFocus={e => e.target.style.borderColor = 'var(--brand-blue)'}
              onBlur={e => e.target.style.borderColor = 'var(--border)'}
            />
          </div>
        </div>

        {/* Results */}
        {!query ? (
          <div className="card" style={{ padding: 40, textAlign: 'center' }}>
            <p style={{ fontSize: 14.5, color: 'var(--text-secondary)', margin: 0 }}>
              Ketik kata kunci di atas untuk mencari artikel, penjelasan fitur, atau FAQ secara instan.
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
            <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-secondary)', margin: 0 }}>
              Ditemukan {totalResults} hasil untuk kata kunci &ldquo;{query}&rdquo;
            </p>

            {totalResults === 0 && (
              <div className="card" style={{ padding: 40, textAlign: 'center' }}>
                <p style={{ fontSize: 14.5, color: 'var(--text-secondary)', margin: '0 0 4px' }}>Duh, pencarian kamu nihil hasil.</p>
                <p style={{ fontSize: 12.5, color: 'var(--text-muted)', margin: 0 }}>Coba pakai sinonim lain atau ketik kata kunci yang lebih pendek.</p>
              </div>
            )}

            {/* Features matches */}
            {matchedFeatures.length > 0 && (
              <div>
                <h3 style={{ fontSize: 14, fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 12 }}>Modul & Fitur ({matchedFeatures.length})</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {matchedFeatures.map(feat => (
                    <div key={feat.id} className="card" style={{ padding: 20, display: 'flex', alignItems: 'flex-start', gap: 16 }}>
                      <div style={{ width: 36, height: 36, borderRadius: 6, background: 'rgba(2,134,195,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--brand-blue)', flexShrink: 0 }}>
                        <Settings size={18} />
                      </div>
                      <div style={{ flex: 1 }}>
                        <h4 style={{ fontSize: 14.5, fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 4px' }}>{feat.title}</h4>
                        <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: '0 0 8px', lineHeight: 1.5 }}>{feat.description}</p>
                        <Link href="/daftar" style={{ fontSize: 12, fontWeight: 700, color: 'var(--brand-blue)', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                          Mulai Coba Fitur <ArrowRight size={12} />
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Articles matches */}
            {matchedArticles.length > 0 && (
              <div>
                <h3 style={{ fontSize: 14, fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 12 }}>Artikel Edukasi ({matchedArticles.length})</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {matchedArticles.map(post => (
                    <div key={post.id} className="card" style={{ padding: 20, display: 'flex', alignItems: 'flex-start', gap: 16 }}>
                      <div style={{ width: 36, height: 36, borderRadius: 6, background: 'rgba(23,184,151,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--teal)', flexShrink: 0 }}>
                        <FileText size={18} />
                      </div>
                      <div style={{ flex: 1 }}>
                        <h4 style={{ fontSize: 14.5, fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 4px' }}>{post.title}</h4>
                        <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: '0 0 8px', lineHeight: 1.5 }}>{post.excerpt}</p>
                        <Link href={`/blog/${post.slug}`} style={{ fontSize: 12, fontWeight: 700, color: 'var(--brand-blue)', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                          Baca Artikel <ArrowRight size={12} />
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* FAQ matches */}
            {matchedFaqs.length > 0 && (
              <div>
                <h3 style={{ fontSize: 14, fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 12 }}>Pertanyaan FAQ ({matchedFaqs.length})</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {matchedFaqs.map(faq => (
                    <div key={faq.id} className="card" style={{ padding: 20, display: 'flex', alignItems: 'flex-start', gap: 16 }}>
                      <div style={{ width: 36, height: 36, borderRadius: 6, background: 'rgba(245,166,35,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#F5A623', flexShrink: 0 }}>
                        <HelpCircle size={18} />
                      </div>
                      <div style={{ flex: 1 }}>
                        <h4 style={{ fontSize: 14.5, fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 4px' }}>Q: {faq.question}</h4>
                        <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: 0, lineHeight: 1.5 }}>A: {faq.answer}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
