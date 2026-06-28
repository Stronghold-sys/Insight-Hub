'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  Plus, Search, BookOpen, Tag, Calendar,
  ChevronRight, X, Edit3, Flag, Star, AlertTriangle,
  MessageCircle, Heart, TrendingUp, Trash2, ArrowLeft, RefreshCw
} from 'lucide-react'
import { formatDate, getMoodColor } from '@/lib/utils'
import Modal from '@/components/ui/Modal'

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

interface JournalEntry {
  id: string
  title: string
  content: string
  mood: string
  date: string
  tags: string[]
  entryType: string
  isStarred: boolean
  isPinned: boolean
}

export default function JournalPage() {
  const [search, setSearch] = useState('')
  const [activeFilter, setActiveFilter] = useState('semua')
  const [showNewForm, setShowNewForm] = useState(false)
  const [selectedEntry, setSelectedEntry] = useState<JournalEntry | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [newEntry, setNewEntry] = useState({ title: '', content: '', entryType: 'reflection', mood: 'neutral', tags: '' })
  const [saved, setSaved] = useState(false)
  const [deletedToast, setDeletedToast] = useState(false)
  const [showDeletedOnly, setShowDeletedOnly] = useState(false)
  
  const [entries, setEntries] = useState<JournalEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshCount, setRefreshCount] = useState(0)

  const fetchEntries = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/journal?showDeleted=${showDeletedOnly}`)
      const data = await res.json()
      if (data.success) {
        setEntries(data.entries || [])
      } else {
        setEntries([])
      }
    } catch (e) {
      console.error(e)
      setEntries([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchEntries()

    if (typeof window !== 'undefined' && window.location.search.includes('tambah=true')) {
      const timer = setTimeout(() => {
        setShowNewForm(true)
      }, 0)
      return () => clearTimeout(timer)
    }
  }, [refreshCount, showDeletedOnly])

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
      id: editingId || undefined,
      title: newEntry.title,
      content: newEntry.content,
      mood: newEntry.mood,
      category_id: newEntry.entryType,
      tags: newEntry.tags
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
        setEditingId(null)
        setNewEntry({ title: '', content: '', entryType: 'reflection', mood: 'neutral', tags: '' })
        setRefreshCount(c => c + 1)
        setTimeout(() => setSaved(false), 3000)
      }
    } catch (err) {
      console.error(err)
    }
  }

  const handleStartEdit = (entry: JournalEntry) => {
    setEditingId(entry.id)
    setNewEntry({
      title: entry.title,
      content: entry.content,
      entryType: entry.entryType,
      mood: entry.mood,
      tags: entry.tags ? entry.tags.join(', ') : ''
    })
    setSelectedEntry(null)
    setShowNewForm(true)
  }

  const handleToggleFavorite = async (entry: JournalEntry) => {
    const nextStarred = !entry.isStarred;
    try {
      const res = await fetch('/api/journal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: entry.id,
          title: entry.title,
          content: entry.content,
          mood: entry.mood,
          category_id: entry.entryType,
          is_favorite: nextStarred,
          is_pinned: entry.isPinned,
          tags: entry.tags
        })
      });
      if (res.ok) {
        setRefreshCount(c => c + 1);
        if (selectedEntry && selectedEntry.id === entry.id) {
          setSelectedEntry(prev => prev ? { ...prev, isStarred: nextStarred } : null);
        }
      }
    } catch (e) {
      console.error(e);
    }
  }

  const handleTogglePin = async (entry: JournalEntry) => {
    const nextPinned = !entry.isPinned;
    try {
      const res = await fetch('/api/journal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: entry.id,
          title: entry.title,
          content: entry.content,
          mood: entry.mood,
          category_id: entry.entryType,
          is_favorite: entry.isStarred,
          is_pinned: nextPinned,
          tags: entry.tags
        })
      });
      if (res.ok) {
        setRefreshCount(c => c + 1);
        if (selectedEntry && selectedEntry.id === entry.id) {
          setSelectedEntry(prev => prev ? { ...prev, isPinned: nextPinned } : null);
        }
      }
    } catch (e) {
      console.error(e);
    }
  }

  const handleDelete = async (entryId: string) => {
    if (!window.confirm('Apakah kamu yakin ingin menghapus entri jurnal ini?')) return

    try {
      const res = await fetch(`/api/journal?id=${entryId}`, {
        method: 'DELETE',
      })

      if (res.ok) {
        setSelectedEntry(null)
        setDeletedToast(true)
        setRefreshCount(c => c + 1)
        setTimeout(() => setDeletedToast(false), 3000)
      } else {
        alert('Gagal menghapus entri jurnal')
      }
    } catch (err) {
      console.error(err)
      alert('Terjadi kesalahan koneksi saat menghapus jurnal')
    }
  }

  const handleRestore = async (entryId: string) => {
    try {
      const res = await fetch(`/api/journal?id=${entryId}&action=restore`, {
        method: 'DELETE',
      })

      if (res.ok) {
        setSelectedEntry(null)
        setRefreshCount(c => c + 1)
        alert('Jurnal berhasil dipulihkan!')
      } else {
        alert('Gagal memulihkan entri jurnal')
      }
    } catch (err) {
      console.error(err)
    }
  }

  const handleHardDelete = async (entryId: string) => {
    if (!window.confirm('PERINGATAN: Entri jurnal ini akan dihapus secara PERMANEN dari database dan tidak dapat dipulihkan. Lanjutkan?')) return

    try {
      const res = await fetch(`/api/journal?id=${entryId}&action=hard`, {
        method: 'DELETE',
      })

      if (res.ok) {
        setSelectedEntry(null)
        setRefreshCount(c => c + 1)
        alert('Jurnal dihapus permanen!')
      } else {
        alert('Gagal menghapus permanen entri jurnal')
      }
    } catch (err) {
      console.error(err)
    }
  }

  return (
    <div className="animate-fadein">
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h1 style={{ fontSize: 22, marginBottom: 4 }}>
            {showDeletedOnly ? 'Tempat Sampah Jurnal' : 'Journal Relasi'}
          </h1>
          <p style={{ color: 'var(--text-secondary)', margin: 0 }}>
            {showDeletedOnly 
              ? 'Daftar entri jurnal yang telah dihapus. Kamu bisa memulihkan atau menghapusnya permanen.' 
              : 'Tempat nulis, merekam, dan refleksi kejadian penting dalam relasimu.'}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button 
            onClick={() => setShowDeletedOnly(!showDeletedOnly)} 
            className="btn btn-secondary"
            style={{ display: 'flex', alignItems: 'center', gap: 6 }}
          >
            {showDeletedOnly ? 'Kembali ke Jurnal' : 'Buka Sampah'}
          </button>
          {!showDeletedOnly && (
            <button onClick={() => { setEditingId(null); setNewEntry({ title: '', content: '', entryType: 'reflection', mood: 'neutral', tags: '' }); setShowNewForm(true); }} className="btn btn-primary">
              <Plus size={14} /> Tulis baru
            </button>
          )}
        </div>
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
      {!showDeletedOnly && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 24 }}>
          {[
            { label: 'Total Entri', value: entries.length },
            { label: 'Bintang', value: entries.filter(e => e.isStarred).length },
            { label: 'Disematkan', value: entries.filter(e => e.isPinned).length },
            { label: 'Bulan Ini', value: entries.length },
          ].map(s => (
            <div key={s.label} className="card" style={{ padding: '14px 16px', textAlign: 'center' }}>
              <p style={{ fontSize: 22, fontWeight: 800, color: 'var(--text-primary)', margin: '0 0 2px' }}>{s.value}</p>
              <p style={{ fontSize: 12, color: 'var(--text-secondary)', margin: 0 }}>{s.label}</p>
            </div>
          ))}
        </div>
      )}

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

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '48px 0', gap: 10 }}>
          <RefreshCw className="animate-spin" size={24} color="var(--brand-blue)" />
          <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Memuat jurnal...</span>
        </div>
      ) : filtered.length === 0 ? (
        <div className="empty-state animate-fadein" style={{ padding: 48, background: 'var(--surface)', borderRadius: 12, border: '1px dashed var(--border)', textAlign: 'center' }}>
          <BookOpen size={48} color="var(--text-muted)" style={{ margin: '0 auto 16px', opacity: 0.5 }} />
          <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 8 }}>
            {showDeletedOnly ? 'Tempat Sampah Kosong' : 'Belum Ada Jurnal'}
          </h3>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: '0 0 16px', maxWidth: 400, marginLeft: 'auto', marginRight: 'auto' }}>
            {showDeletedOnly 
              ? 'Bagus sekali! Gak ada jurnal yang terbuang saat ini.' 
              : 'Tulis refleksi harian, konflik, atau momen spesial bersama pasangan di sini untuk membangun self-awareness.'}
          </p>
          {!showDeletedOnly && (
            <button onClick={() => { setEditingId(null); setNewEntry({ title: '', content: '', entryType: 'reflection', mood: 'neutral', tags: '' }); setShowNewForm(true); }} className="btn btn-primary">
              <Plus size={14} /> Mulai Menulis
            </button>
          )}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {filtered.map(entry => {
            const typeConfig = TYPE_CONFIG[entry.entryType as keyof typeof TYPE_CONFIG] || TYPE_CONFIG.reflection

            return (
              <div
                key={entry.id}
                className="card card-hover animate-fadein"
                style={{ padding: 20, cursor: 'pointer', position: 'relative' }}
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
                      <h3 style={{ fontSize: 15, margin: 0, flex: 1, lineHeight: 1.4, fontWeight: 700 }}>
                        {entry.isPinned && <span style={{ color: 'var(--brand-blue)', marginRight: 6 }}>📌</span>}
                        {entry.title}
                      </h3>
                      <div style={{ display: 'flex', gap: 6, flexShrink: 0 }} onClick={e => e.stopPropagation()}>
                        <button onClick={() => handleToggleFavorite(entry)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 2 }}>
                          <Star size={15} fill={entry.isStarred ? '#F5A623' : 'none'} color={entry.isStarred ? '#F5A623' : 'var(--text-muted)'} />
                        </button>
                        <button onClick={() => handleTogglePin(entry)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 2 }}>
                          <span style={{ fontSize: 12, opacity: entry.isPinned ? 1 : 0.4 }}>📌</span>
                        </button>
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
      <Modal isOpen={showNewForm} onClose={() => setShowNewForm(false)} maxWidth={600} title={editingId ? "Edit entri jurnal" : "Tulis entri jurnal"}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          <div>
            <label className="label" htmlFor="entry-title">Judul</label>
            <input id="entry-title" className="input" placeholder="Apa yang terjadi hari ini?" value={newEntry.title} onChange={e => setNewEntry(f => ({ ...f, title: e.target.value }))} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label className="label" htmlFor="entry-type">Tipe kejadian</label>
              <select
                id="entry-type"
                className="input"
                value={newEntry.entryType}
                onChange={e => setNewEntry(f => ({ ...f, entryType: e.target.value }))}
                title="Tipe kejadian"
                aria-label="Tipe kejadian"
              >
                <option value="reflection">Refleksi Pribadi</option>
                <option value="conflict">Konflik</option>
                <option value="reconciliation">Rekonsiliasi</option>
                <option value="positive">Momen Positif</option>
              </select>
            </div>
            <div>
              <label className="label" htmlFor="entry-mood">Mood saat itu</label>
              <select
                id="entry-mood"
                className="input"
                value={newEntry.mood}
                onChange={e => setNewEntry(f => ({ ...f, mood: e.target.value }))}
                title="Mood saat itu"
                aria-label="Mood saat itu"
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
              {editingId ? 'Simpan Perubahan' : 'Simpan entri'}
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
                  {selectedEntry.isPinned && <span style={{ fontSize: 12, marginTop: 1 }}>📌</span>}
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
              justifyContent: 'space-between',
              alignItems: 'center',
              marginTop: 32,
              paddingTop: 16,
              borderTop: '1px solid var(--border-subtle)'
            }}>
              <div>
                {showDeletedOnly ? (
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button
                      onClick={() => handleRestore(selectedEntry.id)}
                      className="btn btn-secondary btn-sm"
                      style={{ color: 'var(--teal)' }}
                    >
                      Puluhkan
                    </button>
                    <button
                      onClick={() => handleHardDelete(selectedEntry.id)}
                      className="btn btn-ghost btn-sm"
                      style={{ color: 'var(--error)' }}
                    >
                      <Trash2 size={13} /> Hapus Permanen
                    </button>
                  </div>
                ) : (
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button
                      onClick={() => handleStartEdit(selectedEntry)}
                      className="btn btn-secondary btn-sm"
                      style={{ display: 'flex', alignItems: 'center', gap: 6 }}
                    >
                      <Edit3 size={13} /> Edit
                    </button>
                    <button
                      onClick={() => handleDelete(selectedEntry.id)}
                      className="btn btn-ghost btn-sm"
                      style={{ color: 'var(--error)', display: 'flex', alignItems: 'center', gap: 6 }}
                    >
                      <Trash2 size={13} /> Hapus
                    </button>
                  </div>
                )}
              </div>
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
