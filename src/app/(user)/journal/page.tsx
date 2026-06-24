'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  Plus, Search, BookOpen, Tag, Calendar,
  ChevronRight, X, Edit3, Flag, Star, AlertTriangle,
  MessageCircle, Heart, TrendingUp, Trash2
} from 'lucide-react'
import { formatDate, getMoodColor } from '@/lib/utils'
import Modal from '@/components/ui/Modal'

const INITIAL_MOCK_JOURNALS = [
  {
    id: '1',
    title: 'Ngobrol yang akhirnya berhasil',
    content: 'Tadi gue akhirnya berani ngomong sesuatu yang udah lama gue tahan. Rasanya kayak lepas beban yang berat banget. Ternyata caranya beneran ngaruh — gue pakai "I feel" statement kayak yang gue pelajarin, dan responnya jauh lebih baik dari yang gue bayangin.',
    mood: 'calm',
    date: '2026-06-22',
    tags: ['komunikasi', 'keberanian', 'green flag'],
    entryType: 'reconciliation',
    relatedPerson: 'Pasangan',
    intensity: 7,
    isStarred: true,
    isFlagged: false,
  },
  {
    id: '2',
    title: 'Hari yang bikin overthinking',
    content: 'Gue nggak dapat respons selama 4 jam dan langsung assume yang buruk-buruk. Ini pola lama gue yang muncul lagi. Gue tau ini anxious attachment, tapi tetep aja susah dipaksain berhenti.',
    mood: 'anxious',
    date: '2026-06-20',
    tags: ['overthinking', 'anxious', 'pola'],
    entryType: 'reflection',
    relatedPerson: null,
    intensity: 8,
    isStarred: false,
    isFlagged: true,
  },
]

const ENTRY_TYPES = [
  { id: 'semua', label: 'Semua' },
  { id: 'reflection', label: 'Refleksi' },
  { id: 'conflict', label: 'Konflik' },
  { id: 'reconciliation', label: 'Rekonsiliasi' },
  { id: 'positive', label: 'Momen Positif' },
]

const TYPE_CONFIG = {
  conflict: { label: 'Konflik', color: 'var(--error)', bg: 'rgba(211,47,47,0.08)', icon: AlertTriangle },
  reconciliation: { label: 'Rekonsiliasi', color: 'var(--teal)', bg: 'rgba(23,184,151,0.08)', icon: Heart },
  positive: { label: 'Positif', color: 'var(--warning)', bg: 'rgba(245,166,35,0.08)', icon: Star },
  reflection: { label: 'Refleksi', color: 'var(--brand-blue)', bg: 'rgba(2,134,195,0.08)', icon: BookOpen },
}

export default function JournalPage() {
  const [search, setSearch] = useState('')
  const [activeFilter, setActiveFilter] = useState('semua')
  const [showNewForm, setShowNewForm] = useState(false)
  const [selectedEntry, setSelectedEntry] = useState<any>(null)
  const [newEntry, setNewEntry] = useState({ title: '', content: '', entryType: 'reflection', mood: 'neutral', tags: '' })
  const [saved, setSaved] = useState(false)
  const [deletedToast, setDeletedToast] = useState(false)
  
  const [entries, setEntries] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const fetchEntries = async () => {
    try {
      const res = await fetch('/api/journal')
      const data = await res.json()
      if (data.success && data.entries.length > 0) {
        // Map database fields to UI fields
        const mapped = data.entries.map((e: any) => ({
          id: e.id,
          title: e.title,
          content: e.content,
          mood: e.mood,
          date: e.date,
          tags: e.tag ? e.tag.split(',').map((t: string) => t.trim()) : [],
          entryType: e.tag && e.tag.toLowerCase().includes('konflik') ? 'conflict' : 'reflection',
          isStarred: false,
          isFlagged: false,
        }))
        setEntries(mapped)
      } else {
        setEntries(INITIAL_MOCK_JOURNALS)
      }
    } catch (e) {
      console.error(e)
      setEntries(INITIAL_MOCK_JOURNALS)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchEntries()
    if (typeof window !== 'undefined' && window.location.search.includes('tambah=true')) {
      setShowNewForm(true)
    }
  }, [])

  const filtered = entries.filter(e => {
    const matchSearch = e.title.toLowerCase().includes(search.toLowerCase()) ||
      e.content.toLowerCase().includes(search.toLowerCase()) ||
      (e.tags && e.tags.some((t: string) => t.toLowerCase().includes(search.toLowerCase())))
    const matchFilter = activeFilter === 'semua' || e.entryType === activeFilter
    return matchSearch && matchFilter
  })

  const handleSave = async () => {
    if (!newEntry.title || !newEntry.content) return

    const payload = {
      title: newEntry.title,
      content: newEntry.content,
      mood: newEntry.mood,
      tag: newEntry.tags || (newEntry.entryType === 'conflict' ? 'Konflik' : 'Refleksi')
    }

    try {
      const res = await fetch('/api/journal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      if (res.ok) {
        setSaved(true)
        setShowNewForm(false)
        setNewEntry({ title: '', content: '', entryType: 'reflection', mood: 'neutral', tags: '' })
        fetchEntries()
        setTimeout(() => setSaved(false), 3000)
      }
    } catch (err) {
      console.error(err)
    }
  }

  const handleDelete = async (entryId: string) => {
    if (!window.confirm('Apakah kamu yakin ingin menghapus entri jurnal ini?')) return

    try {
      if (entryId === '1' || entryId === '2') {
        setEntries(prev => prev.filter(e => e.id !== entryId))
        setSelectedEntry(null)
        setDeletedToast(true)
        setTimeout(() => setDeletedToast(false), 3000)
        return
      }

      const res = await fetch(`/api/journal?id=${entryId}`, {
        method: 'DELETE',
      })

      if (res.ok) {
        setSelectedEntry(null)
        setDeletedToast(true)
        fetchEntries()
        setTimeout(() => setDeletedToast(false), 3000)
      } else {
        alert('Gagal menghapus entri jurnal')
      }
    } catch (err) {
      console.error(err)
      alert('Terjadi kesalahan koneksi saat menghapus jurnal')
    }
  }

  return (
    <div className="animate-fadein">
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h1 style={{ fontSize: 22, marginBottom: 4 }}>Journal Relasi</h1>
          <p style={{ color: 'var(--text-secondary)', margin: 0 }}>
            Tempat nulis, merekam, dan refleksi kejadian penting dalam relasimu.
          </p>
        </div>
        <button onClick={() => setShowNewForm(true)} className="btn btn-primary">
          <Plus size={14} /> Tulis baru
        </button>
      </div>

      {saved && (
        <div className="toast toast-success animate-fadein" style={{ marginBottom: 20 }}>
          <p style={{ margin: 0, fontWeight: 600, color: 'var(--teal)' }}>Entri jurnal berhasil disimpan!</p>
        </div>
      )}

      {deletedToast && (
        <div className="toast toast-success animate-fadein" style={{ marginBottom: 20, background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' }}>
          <p style={{ margin: 0, fontWeight: 600, color: 'var(--error)' }}>Entri jurnal berhasil dihapus!</p>
        </div>
      )}

      {/* Stats strip */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 24 }}>
        {[
          { label: 'Total Entri', value: entries.length },
          { label: 'Bintang', value: entries.filter(e => e.isStarred).length },
          { label: 'Perlu Perhatian', value: entries.filter(e => e.isFlagged).length },
          { label: 'Bulan Ini', value: Math.max(1, entries.length) },
        ].map(s => (
          <div key={s.label} className="card" style={{ padding: '14px 16px', textAlign: 'center' }}>
            <p style={{ fontSize: 22, fontWeight: 800, color: 'var(--text-primary)', margin: '0 0 2px' }}>{s.value}</p>
            <p style={{ fontSize: 12, color: 'var(--text-secondary)', margin: 0 }}>{s.label}</p>
          </div>
        ))}
      </div>

      {/* Search & filter */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
          <Search size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input className="input" placeholder="Cari entri jurnal..." value={search} onChange={e => setSearch(e.target.value)} style={{ paddingLeft: 38 }} />
        </div>
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 24, overflowX: 'auto', paddingBottom: 4 }}>
        {ENTRY_TYPES.map(f => (
          <button
            key={f.id}
            onClick={() => setActiveFilter(f.id)}
            className="btn btn-sm"
            style={{
              flexShrink: 0,
              background: activeFilter === f.id ? 'var(--brand-blue)' : 'var(--surface)',
              color: activeFilter === f.id ? 'white' : 'var(--text-secondary)',
              borderColor: activeFilter === f.id ? 'var(--brand-blue)' : 'var(--border)',
            }}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Journal list */}
      {filtered.length === 0 ? (
        <div className="empty-state">
          <BookOpen size={36} color="var(--text-muted)" />
          <h3>Belum ada entri di sini</h3>
          <p>Tulis pengalaman pertamamu hari ini. Nggak perlu panjang-panjang.</p>
          <button onClick={() => setShowNewForm(true)} className="btn btn-primary" style={{ marginTop: 8 }}>
            <Plus size={14} /> Mulai nulis
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {filtered.map(entry => {
            const typeConfig = TYPE_CONFIG[entry.entryType as keyof typeof TYPE_CONFIG] || TYPE_CONFIG.reflection

            return (
              <div
                key={entry.id}
                className="card card-hover"
                style={{ padding: 20, cursor: 'pointer' }}
                onClick={() => setSelectedEntry(entry)}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
                  {/* Type icon */}
                  <div style={{
                    width: 40, height: 40, borderRadius: 10, flexShrink: 0,
                    background: typeConfig.bg, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <typeConfig.icon size={18} color={typeConfig.color} />
                  </div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, marginBottom: 4 }}>
                      <h3 style={{ fontSize: 15, margin: 0, flex: 1, lineHeight: 1.4 }}>{entry.title}</h3>
                      <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
                        {entry.isStarred && <Star size={14} fill="#F5A623" color="#F5A623" />}
                        {entry.isFlagged && <Flag size={14} color="var(--error)" />}
                      </div>
                    </div>

                    <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: '0 0 12px', lineHeight: 1.5, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                      {entry.content}
                    </p>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <div style={{ width: 8, height: 8, borderRadius: '50%', background: getMoodColor(entry.mood) }} />
                        <span style={{ fontSize: 12, color: 'var(--text-secondary)', textTransform: 'capitalize' }}>{entry.mood}</span>
                      </div>
                      <span style={{ color: 'var(--border)', fontSize: 12 }}>·</span>
                      <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{entry.date}</span>
                      {entry.relatedPerson && (
                        <>
                          <span style={{ color: 'var(--border)', fontSize: 12 }}>·</span>
                          <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{entry.relatedPerson}</span>
                        </>
                      )}
                      {entry.tags && entry.tags.map((tag: string) => (
                        <span key={tag} className="tag" style={{ fontSize: 11 }}>{tag}</span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* New entry modal */}
      <Modal isOpen={showNewForm} onClose={() => setShowNewForm(false)} maxWidth={600} title="Tulis entri jurnal">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          <div>
            <label className="label" htmlFor="entry-title">Judul</label>
            <input id="entry-title" className="input" placeholder="Apa yang terjadi hari ini?" value={newEntry.title} onChange={e => setNewEntry(f => ({ ...f, title: e.target.value }))} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label className="label">Tipe kejadian</label>
              <select
                className="input"
                value={newEntry.entryType}
                onChange={e => setNewEntry(f => ({ ...f, entryType: e.target.value }))}
              >
                <option value="reflection">Refleksi Pribadi</option>
                <option value="conflict">Konflik</option>
                <option value="reconciliation">Rekonsiliasi</option>
                <option value="positive">Momen Positif</option>
              </select>
            </div>
            <div>
              <label className="label">Mood saat itu</label>
              <select
                className="input"
                value={newEntry.mood}
                onChange={e => setNewEntry(f => ({ ...f, mood: e.target.value }))}
              >
                <option value="happy">Senang</option>
                <option value="calm">Tenang</option>
                <option value="anxious">Cemas</option>
                <option value="sad">Sedih</option>
                <option value="frustrated">Frustrasi</option>
                <option value="hopeful">Hopeful</option>
                <option value="neutral">Biasa aja</option>
              </select>
            </div>
          </div>

          <div>
            <label className="label" htmlFor="entry-content">Ceritain semuanya</label>
            <textarea
              id="entry-content"
              className="input"
              placeholder="Tulis apa yang terjadi, apa yang kamu rasain, dan apa yang kamu pelajari..."
              value={newEntry.content}
              onChange={e => setNewEntry(f => ({ ...f, content: e.target.value }))}
              rows={6}
              style={{ resize: 'vertical', lineHeight: 1.7 }}
            />
          </div>

          <div>
            <label className="label" htmlFor="entry-tags">Tag (pisah dengan koma)</label>
            <input
              id="entry-tags"
              className="input"
              placeholder="misal: konflik, komunikasi, progress..."
              value={newEntry.tags}
              onChange={e => setNewEntry(f => ({ ...f, tags: e.target.value }))}
            />
          </div>

          <div style={{ display: 'flex', gap: 12, paddingTop: 8 }}>
            <button onClick={() => setShowNewForm(false)} className="btn btn-secondary" style={{ flex: 1, justifyContent: 'center' }}>Batal</button>
            <button
              onClick={handleSave}
              disabled={!newEntry.title || !newEntry.content}
              className="btn btn-primary"
              style={{ flex: 2, justifyContent: 'center', opacity: (newEntry.title && newEntry.content) ? 1 : 0.5 }}
            >
              Simpan entri
            </button>
          </div>
        </div>
      </Modal>

      {/* Entry detail modal */}
      <Modal isOpen={!!selectedEntry} onClose={() => setSelectedEntry(null)} maxWidth={580}>
        {selectedEntry && (
          <div>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20 }}>
              <div>
                <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                  {(() => {
                    const conf = TYPE_CONFIG[selectedEntry.entryType as keyof typeof TYPE_CONFIG] || TYPE_CONFIG.reflection
                    return (
                      <span style={{ fontSize: 12, fontWeight: 700, color: conf.color, background: conf.bg, padding: '2px 10px', borderRadius: 999 }}>
                        {conf.label}
                      </span>
                    )
                  })()}
                  {selectedEntry.isStarred && <Star size={14} fill="#F5A623" color="#F5A623" style={{ marginTop: 3 }} />}
                </div>
                <h2 style={{ fontSize: 20, margin: 0, lineHeight: 1.3 }}>{selectedEntry.title}</h2>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <div style={{ width: 10, height: 10, borderRadius: '50%', background: getMoodColor(selectedEntry.mood) }} />
                <span style={{ fontSize: 13, color: 'var(--text-secondary)', textTransform: 'capitalize' }}>{selectedEntry.mood}</span>
              </div>
              <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>·</span>
              <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{selectedEntry.date}</span>
              {selectedEntry.relatedPerson && (
                <>
                  <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>·</span>
                  <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{selectedEntry.relatedPerson}</span>
                </>
              )}
            </div>

            <p style={{ fontSize: 14, lineHeight: 1.8, color: 'var(--text-primary)', marginBottom: 20 }}>
              {selectedEntry.content}
            </p>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {selectedEntry.tags && selectedEntry.tags.map((tag: string) => (
                <span key={tag} className="tag">{tag}</span>
              ))}
            </div>

            <div style={{
              display: 'flex',
              justifyContent: 'flex-end',
              gap: 12,
              marginTop: 32,
              paddingTop: 16,
              borderTop: '1px solid var(--border-subtle)'
            }}>
              <button
                onClick={() => handleDelete(selectedEntry.id)}
                className="btn btn-ghost"
                style={{ color: 'var(--error)', display: 'flex', alignItems: 'center', gap: 6 }}
              >
                <Trash2 size={15} /> Hapus Entri
              </button>
              <button
                onClick={() => setSelectedEntry(null)}
                className="btn btn-secondary"
              >
                Tutup
              </button>
            </div>
          </div>
        )}
      </Modal>

      <style jsx>{`
        @media (max-width: 767px) {
          div { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  )
}
