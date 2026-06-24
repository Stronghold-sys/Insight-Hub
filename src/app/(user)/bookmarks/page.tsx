'use client'

import { useState, useEffect } from 'react'
import { Bookmark, FolderOpen, ArrowRight, Trash2, ExternalLink } from 'lucide-react'
import Link from 'next/link'
import { LoadingState, EmptyState } from '@/components/ui/FeedbackStates'

export default function BookmarksPage() {
  const [bookmarks, setBookmarks] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Fetch user bookmarks from database
    fetch('/api/user/bookmarks')
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setBookmarks(data.bookmarks);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [])

  const handleDelete = async (id: string) => {
    try {
      const b = bookmarks.find(x => x.id === id);
      if (!b) return;
      const res = await fetch('/api/user/bookmarks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ itemType: b.type, itemId: id, action: 'remove' })
      });
      const data = await res.json();
      if (data.success) {
        setBookmarks(prev => prev.filter(x => x.id !== id));
      }
    } catch (e) {
      console.error(e);
    }
  }

  return (
    <>
      <div style={{ maxWidth: 840, margin: '0 auto' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 28 }}>
          <div style={{
            width: 40, height: 40, borderRadius: 8, background: 'rgba(2,134,195,0.08)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--brand-blue)'
          }}>
            <Bookmark size={20} />
          </div>
          <div>
            <h1 style={{ fontSize: 20, fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>Simpanan Saya</h1>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: 0 }}>Artikel dan template komunikasi yang kamu tandai buat dibaca nanti.</p>
          </div>
        </div>

        {loading ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '64px 0' }}>
            <LoadingState message="Memuat data simpanan..." />
          </div>
        ) : bookmarks.length === 0 ? (
          <EmptyState
            title="Belum Ada Simpanan"
            message="Jelajahi perpustakaan edukasi atau blog kuis kita, lalu klik ikon simpan/bookmark biar gampang dicari nanti."
          />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {bookmarks.map((bookmark) => (
              <div
                key={bookmark.id}
                className="card"
                style={{
                  padding: '16px 20px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 16
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <span style={{
                    fontSize: 9, fontWeight: 800, textTransform: 'uppercase',
                    padding: '3px 8px', borderRadius: 4,
                    background: bookmark.type === 'article' 
                      ? 'rgba(2,134,195,0.08)' 
                      : bookmark.type === 'guide'
                      ? 'rgba(124,58,237,0.08)'
                      : 'rgba(23,184,151,0.08)',
                    color: bookmark.type === 'article' 
                      ? 'var(--brand-blue)' 
                      : bookmark.type === 'guide'
                      ? 'rgb(124,58,237)'
                      : 'var(--teal)'
                  }}>
                    {bookmark.type === 'article' ? 'Artikel' : bookmark.type === 'guide' ? 'Panduan' : 'Template'}
                  </span>
                  <span style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--text-primary)' }}>
                    {bookmark.title}
                  </span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Link
                    href={bookmark.path}
                    className="btn btn-secondary btn-sm"
                    style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '6px 12px', border: '1px solid var(--border)' }}
                  >
                    Buka
                    <ExternalLink size={12} />
                  </Link>
                  <button
                    onClick={() => handleDelete(bookmark.id)}
                    style={{
                      background: 'none', border: 'none', cursor: 'pointer',
                      padding: 6, borderRadius: 4, color: 'var(--text-muted)',
                      transition: 'color 150ms ease'
                    }}
                    onMouseOver={e => e.currentTarget.style.color = 'var(--error)'}
                    onMouseOut={e => e.currentTarget.style.color = 'var(--text-muted)'}
                    title="Hapus bookmark"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  )
}
