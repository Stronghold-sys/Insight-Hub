'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Search, Tag, BookOpen, Clock, ArrowRight } from 'lucide-react'
import { BLOG_POSTS } from '@/lib/data'

const CATEGORIES = ['Semua', 'Attachment Style', 'Love Language', 'Komunikasi', 'Konflik', 'Relasi', 'Emosi', 'Self-awareness']

export default function BlogPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('Semua')

  // Filter logic
  const filteredPosts = BLOG_POSTS.filter(post => {
    const matchesSearch = post.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          post.excerpt.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCategory = selectedCategory === 'Semua' || post.category === selectedCategory
    return matchesSearch && matchesCategory
  })

  const trendingPosts = BLOG_POSTS.filter(post => post.trending)

  return (
    <div style={{ background: 'transparent', minHeight: 'calc(100vh - 64px)', paddingTop: 48, paddingBottom: 80 }}>
      <div className="container" style={{ maxWidth: 1000 }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <span style={{
            fontSize: 12, fontWeight: 700, color: 'var(--brand-blue)',
            textTransform: 'uppercase', letterSpacing: '0.1em',
            background: 'rgba(2,134,195,0.08)', padding: '6px 12px', borderRadius: 999
          }}>
            Bacaan Hubungan & Diri
          </span>
          <h1 style={{ fontSize: 36, fontWeight: 800, color: 'var(--text-primary)', marginTop: 16, marginBottom: 12, letterSpacing: '-0.02em' }}>
            Insight & Edukasi Pilihan
          </h1>
          <p style={{ fontSize: 15, color: 'var(--text-secondary)', lineHeight: 1.6, maxWidth: 500, margin: '0 auto' }}>
            Breakdown psikologi relasi, komunikasi asertif, dan self-growth dengan bahasa enteng yang gak bikin pusing.
          </p>
        </div>

        {/* Search & Categories */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20, marginBottom: 40 }}>
          {/* Search bar */}
          <div style={{ position: 'relative', width: '100%', maxWidth: 500, margin: '0 auto' }}>
            <span style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}>
              <Search size={18} />
            </span>
            <input
              type="text"
              placeholder="Cari artikel (misal: anxious, boundaries, ghosting)..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              style={{
                width: '100%', padding: '12px 16px 12px 44px', borderRadius: 8,
                border: '1px solid var(--border)', background: 'var(--surface)',
                fontSize: 14, outline: 'none', transition: 'border-color 150ms ease'
              }}
              onFocus={e => e.target.style.borderColor = 'var(--brand-blue)'}
              onBlur={e => e.target.style.borderColor = 'var(--border)'}
            />
          </div>

          {/* Categories Tab */}
          <div style={{ display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap' }}>
            {CATEGORIES.map(category => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                style={{
                  padding: '8px 16px', borderRadius: 20,
                  fontSize: 13, fontWeight: 600, cursor: 'pointer',
                  background: selectedCategory === category ? 'var(--brand-blue)' : 'var(--surface)',
                  color: selectedCategory === category ? 'white' : 'var(--text-secondary)',
                  border: selectedCategory === category ? '1px solid var(--brand-blue)' : '1px solid var(--border-subtle)',
                  transition: 'all 150ms ease'
                }}
              >
                {category}
              </button>
            ))}
          </div>
        </div>

        {/* Main Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr',
          gap: 32,
        }}>
          {/* Trending Section if no search */}
          {searchQuery === '' && selectedCategory === 'Semua' && trendingPosts.length > 0 && (
            <div>
              <h2 style={{ fontSize: 18, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 16 }}>Lagi Trending Pekan Ini</h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 24 }}>
                {trendingPosts.map(post => (
                  <div key={`trending-${post.id}`} className="card" style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
                    <div style={{ position: 'relative', height: 180, width: '100%' }}>
                      <Image src={post.coverImage} alt={post.title} fill style={{ objectFit: 'cover' }} />
                      <span style={{
                        position: 'absolute', top: 12, left: 12,
                        background: 'var(--brand-blue)', color: 'white',
                        fontSize: 10, fontWeight: 700, padding: '4px 10px', borderRadius: 4,
                        textTransform: 'uppercase', letterSpacing: '0.05em'
                      }}>
                        {post.category}
                      </span>
                    </div>
                    <div style={{ padding: 24, flex: 1, display: 'flex', flexDirection: 'column' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12, color: 'var(--text-secondary)', fontSize: 11, marginBottom: 8 }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                          <BookOpen size={12} />
                          {post.author.name}
                        </span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                          <Clock size={12} />
                          {post.readTime}
                        </span>
                      </div>
                      <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 8, lineHeight: 1.4 }}>
                        <Link href={`/blog/${post.slug}`} style={{ textDecoration: 'none', color: 'inherit' }} onMouseOver={e => e.currentTarget.style.color = 'var(--brand-blue)'} onMouseOut={e => e.currentTarget.style.color = 'inherit'}>
                          {post.title}
                        </Link>
                      </h3>
                      <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6, margin: '0 0 16px', flex: 1 }}>
                        {post.excerpt}
                      </p>
                      <Link href={`/blog/${post.slug}`} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 700, color: 'var(--brand-blue)', textDecoration: 'none' }}>
                        Baca Selengkapnya
                        <ArrowRight size={14} />
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* All Articles Section */}
          <div>
            <h2 style={{ fontSize: 18, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 16 }}>
              {searchQuery || selectedCategory !== 'Semua' ? 'Hasil Pencarian' : 'Semua Artikel'} ({filteredPosts.length})
            </h2>
            
            {filteredPosts.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '64px 32px', background: 'var(--surface)', borderRadius: 8, border: '1px solid var(--border-subtle)' }}>
                <p style={{ fontSize: 15, color: 'var(--text-secondary)', margin: '0 0 8px' }}>Duh, artikel yang kamu cari gak ketemu nih...</p>
                <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: 0 }}>Coba cari keyword lain atau ganti filter kategori.</p>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 24 }}>
                {filteredPosts.map(post => (
                  <div key={post.id} className="card" style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
                    <div style={{ position: 'relative', height: 160, width: '100%' }}>
                      <Image src={post.coverImage} alt={post.title} fill style={{ objectFit: 'cover' }} />
                      <span style={{
                        position: 'absolute', top: 12, left: 12,
                        background: 'rgba(27,30,40,0.85)', color: 'white',
                        fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 4,
                        textTransform: 'uppercase', letterSpacing: '0.05em', backdropFilter: 'blur(4px)'
                      }}>
                        {post.category}
                      </span>
                    </div>
                    <div style={{ padding: 20, flex: 1, display: 'flex', flexDirection: 'column' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12, color: 'var(--text-secondary)', fontSize: 11, marginBottom: 8 }}>
                        <span>{post.publishedAt}</span>
                        <span>&bull;</span>
                        <span>{post.readTime}</span>
                      </div>
                      <h3 style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 8, lineHeight: 1.4, height: 42, overflow: 'hidden' }}>
                        <Link href={`/blog/${post.slug}`} style={{ textDecoration: 'none', color: 'inherit' }} onMouseOver={e => e.currentTarget.style.color = 'var(--brand-blue)'} onMouseOut={e => e.currentTarget.style.color = 'inherit'}>
                          {post.title}
                        </Link>
                      </h3>
                      <p style={{ fontSize: 12.5, color: 'var(--text-secondary)', lineHeight: 1.5, margin: '0 0 16px', flex: 1, height: 56, overflow: 'hidden' }}>
                        {post.excerpt}
                      </p>
                      <Link href={`/blog/${post.slug}`} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 700, color: 'var(--brand-blue)', textDecoration: 'none' }}>
                        Baca
                        <ArrowRight size={14} />
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
