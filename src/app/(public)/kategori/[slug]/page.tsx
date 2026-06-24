import Link from 'next/link'
import Image from 'next/image'
import { Folder, ArrowRight, Clock, BookOpen } from 'lucide-react'
import { BLOG_POSTS } from '@/lib/data'

interface PageProps {
  params: any
}

export default async function CategoryPage({ params }: PageProps) {
  const { slug } = await params

  // Map slug back to category name
  const getCategoryName = (s: string) => {
    switch (s.toLowerCase()) {
      case 'attachment-style': return 'Attachment Style'
      case 'love-language': return 'Love Language'
      case 'komunikasi': return 'Komunikasi'
      case 'konflik': return 'Konflik'
      default: return decodeURIComponent(s)
    }
  }

  const categoryName = getCategoryName(slug)
  const filteredPosts = BLOG_POSTS.filter(
    post => post.category.toLowerCase() === categoryName.toLowerCase()
  )

  return (
    <div style={{ background: 'transparent', minHeight: 'calc(100vh - 64px)', paddingTop: 48, paddingBottom: 80 }}>
      <div className="container" style={{ maxWidth: 900 }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 32 }}>
          <div style={{
            width: 48, height: 48, borderRadius: 12, background: 'rgba(2,134,195,0.08)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--brand-blue)'
          }}>
            <Folder size={24} />
          </div>
          <div>
            <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Kategori Artikel</span>
            <h1 style={{ fontSize: 24, fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
              Kumpulan Tulisan &ldquo;{categoryName}&rdquo;
            </h1>
          </div>
        </div>

        {/* List of articles */}
        {filteredPosts.length === 0 ? (
          <div className="card" style={{ padding: 48, textAlign: 'center' }}>
            <p style={{ fontSize: 14.5, color: 'var(--text-secondary)', margin: '0 0 16px' }}>Belum ada tulisan di kategori ini.</p>
            <Link href="/blog" className="btn btn-primary btn-sm">
              Lihat Kategori Lain
            </Link>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 24 }}>
            {filteredPosts.map(post => (
              <div key={post.id} className="card" style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
                <div style={{ position: 'relative', height: 160, width: '100%' }}>
                  <Image src={post.coverImage} alt={post.title} fill style={{ objectFit: 'cover' }} />
                </div>
                <div style={{ padding: 20, flex: 1, display: 'flex', flexDirection: 'column' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, color: 'var(--text-secondary)', fontSize: 11, marginBottom: 8 }}>
                    <span>{post.publishedAt}</span>
                    <span>&bull;</span>
                    <span>{post.readTime}</span>
                  </div>
                  <h3 style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 8, lineHeight: 1.4, height: 42, overflow: 'hidden' }}>
                    <Link href={`/blog/${post.slug}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                      {post.title}
                    </Link>
                  </h3>
                  <p style={{ fontSize: 12.5, color: 'var(--text-secondary)', lineHeight: 1.5, margin: '0 0 16px', flex: 1, height: 56, overflow: 'hidden' }}>
                    {post.excerpt}
                  </p>
                  <Link href={`/blog/${post.slug}`} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 700, color: 'var(--brand-blue)', textDecoration: 'none' }}>
                    Baca Tulisan
                    <ArrowRight size={14} />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
