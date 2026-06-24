'use client'

import { useState, useEffect } from 'react'
import { Shield, AlertTriangle, Clock, EyeOff, Ban, CheckCircle, MessageSquare, Flag, RefreshCw, X } from 'lucide-react'

interface ModerationItem {
  id: string
  type: 'comment' | 'journal' | 'profile' | 'report'
  content: string
  userId: string
  userEmail: string
  userNickname: string
  reason?: string
  flaggedAt: string
  status: 'pending' | 'approved' | 'rejected' | 'escalated'
  severity: 'low' | 'medium' | 'high'
}

export default function AdminModerasiPage() {
  const [items, setItems] = useState<ModerationItem[]>([])
  const [loading, setLoading] = useState(true)
  const [activeFilter, setActiveFilter] = useState('pending')
  const [selectedItem, setSelectedItem] = useState<ModerationItem | null>(null)
  const [actionLoading, setActionLoading] = useState(false)
  const [stats, setStats] = useState({ pending: 0, resolved: 0, flagged: 0 })

  const fetchItems = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/moderation?status=${activeFilter}`)
      const json = await res.json()
      if (json.success) {
        setItems(json.items || [])
        setStats(json.stats || { pending: 0, resolved: 0, flagged: 0 })
      }
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchItems() }, [activeFilter])

  const handleAction = async (itemId: string, action: 'approve' | 'reject' | 'escalate' | 'ban_user') => {
    setActionLoading(true)
    try {
      const res = await fetch('/api/admin/moderation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ itemId, action })
      })
      const json = await res.json()
      if (json.success) {
        setItems(prev => prev.filter(i => i.id !== itemId))
        setSelectedItem(null)
      }
    } catch {}
    setActionLoading(false)
  }

  const SEVERITY_CONFIG: Record<string, { color: string; bg: string; label: string }> = {
    low: { color: 'var(--teal)', bg: 'rgba(23,184,151,0.1)', label: 'Rendah' },
    medium: { color: 'var(--warning)', bg: 'rgba(245,159,11,0.1)', label: 'Sedang' },
    high: { color: 'var(--error)', bg: 'rgba(211,47,47,0.1)', label: 'Tinggi' },
  }

  return (
    <div className="animate-fadein">
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: 'var(--text-primary)', margin: '0 0 4px' }}>Moderasi Konten</h1>
          <p style={{ color: 'var(--text-secondary)', margin: 0 }}>Review dan kelola konten yang dilaporkan atau ditandai oleh sistem.</p>
        </div>
        <button onClick={fetchItems} className="btn btn-secondary btn-sm" style={{ gap: 6 }}>
          <RefreshCw size={12} />
          Refresh
        </button>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 20 }}>
        <div className="card" style={{ padding: 16, background: 'rgba(245,159,11,0.05)', border: '1px solid rgba(245,159,11,0.2)' }}>
          <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--warning)' }}>{stats.pending}</div>
          <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Menunggu Review</div>
        </div>
        <div className="card" style={{ padding: 16, background: 'rgba(211,47,47,0.05)', border: '1px solid rgba(211,47,47,0.2)' }}>
          <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--error)' }}>{stats.flagged}</div>
          <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Konten Ditandai</div>
        </div>
        <div className="card" style={{ padding: 16, background: 'rgba(23,184,151,0.05)', border: '1px solid rgba(23,184,151,0.2)' }}>
          <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--teal)' }}>{stats.resolved}</div>
          <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Selesai Diproses</div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div style={{ display: 'flex', gap: 4, background: 'rgba(255,255,255,0.3)', padding: 4, borderRadius: 10, border: '1px solid rgba(255,255,255,0.3)', marginBottom: 20, width: 'fit-content' }}>
        {['pending', 'approved', 'rejected', 'escalated'].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveFilter(tab)}
            className="btn btn-sm"
            style={{
              background: activeFilter === tab ? 'var(--brand-blue)' : 'transparent',
              color: activeFilter === tab ? 'white' : 'var(--text-secondary)',
              border: 'none', borderRadius: 7, padding: '7px 14px', fontSize: 12
            }}
          >
            {tab === 'pending' ? 'Pending' : tab === 'approved' ? 'Approved' : tab === 'rejected' ? 'Ditolak' : 'Eskalasi'}
          </button>
        ))}
      </div>

      {/* Content Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: selectedItem ? '1fr 1fr' : '1fr', gap: 20 }}>
        {/* Items List */}
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          {loading ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 200, gap: 8 }}>
              <div className="spinner" /> <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>Memuat...</span>
            </div>
          ) : items.length === 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: 200, gap: 8, color: 'var(--text-muted)' }}>
              <CheckCircle size={36} />
              <p style={{ fontSize: 13, margin: 0 }}>Tidak ada item untuk direview.</p>
            </div>
          ) : (
            <div style={{ overflowY: 'auto', maxHeight: 600 }}>
              {items.map(item => {
                const sev = SEVERITY_CONFIG[item.severity]
                return (
                  <div
                    key={item.id}
                    onClick={() => setSelectedItem(item)}
                    style={{
                      padding: '14px 16px',
                      borderBottom: '1px solid var(--border-subtle)',
                      cursor: 'pointer',
                      background: selectedItem?.id === item.id ? 'rgba(2,134,195,0.05)' : 'transparent',
                      borderLeft: selectedItem?.id === item.id ? '3px solid var(--brand-blue)' : '3px solid transparent',
                      transition: 'all 150ms ease'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                      <span style={{ fontSize: 11, fontWeight: 700, background: sev.bg, color: sev.color, padding: '2px 8px', borderRadius: 999 }}>
                        {sev.label}
                      </span>
                      <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>{item.flaggedAt}</span>
                    </div>
                    <p style={{ fontSize: 13, color: 'var(--text-primary)', margin: '0 0 4px', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {item.type === 'comment' ? '[Komentar]' : item.type === 'journal' ? '[Jurnal]' : item.type === 'profile' ? '[Profil]' : '[Laporan]'} {item.content.substring(0, 60)}...
                    </p>
                    <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: 0 }}>{item.userEmail} • {item.reason || 'Dilaporkan user'}</p>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Item Detail */}
        {selectedItem && (
          <div className="card animate-fadein-scale" style={{ padding: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontSize: 14, fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>Detail Konten</h3>
              <button onClick={() => setSelectedItem(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 4 }}>
                <X size={16} />
              </button>
            </div>
            <div style={{ flex: 1, padding: 20, overflowY: 'auto' }}>
              <div style={{ marginBottom: 16, padding: 14, background: 'rgba(255,255,255,0.5)', borderRadius: 8, border: '1px solid rgba(255,255,255,0.4)' }}>
                <p style={{ fontSize: 13, color: 'var(--text-primary)', margin: 0, lineHeight: 1.6 }}>{selectedItem.content}</p>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20, fontSize: 12 }}>
                <div>
                  <p style={{ color: 'var(--text-muted)', margin: '0 0 2px', fontWeight: 700, textTransform: 'uppercase', fontSize: 10 }}>User</p>
                  <p style={{ color: 'var(--text-primary)', margin: 0, fontWeight: 600 }}>{selectedItem.userNickname}</p>
                  <p style={{ color: 'var(--text-muted)', margin: 0 }}>{selectedItem.userEmail}</p>
                </div>
                <div>
                  <p style={{ color: 'var(--text-muted)', margin: '0 0 2px', fontWeight: 700, textTransform: 'uppercase', fontSize: 10 }}>Alasan</p>
                  <p style={{ color: 'var(--text-primary)', margin: 0 }}>{selectedItem.reason || '-'}</p>
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <button
                  className="btn btn-primary"
                  onClick={() => handleAction(selectedItem.id, 'approve')}
                  disabled={actionLoading}
                  style={{ gap: 8, justifyContent: 'center', background: 'linear-gradient(135deg, var(--teal), #14A082)' }}
                >
                  <CheckCircle size={14} /> Setujui (Tidak Bermasalah)
                </button>
                <button
                  className="btn btn-secondary"
                  onClick={() => handleAction(selectedItem.id, 'reject')}
                  disabled={actionLoading}
                  style={{ gap: 8, justifyContent: 'center', color: 'var(--error)', borderColor: 'rgba(211,47,47,0.3)' }}
                >
                  <X size={14} /> Hapus Konten
                </button>
                <button
                  className="btn btn-secondary"
                  onClick={() => handleAction(selectedItem.id, 'escalate')}
                  disabled={actionLoading}
                  style={{ gap: 8, justifyContent: 'center', color: 'var(--warning)', borderColor: 'rgba(245,159,11,0.3)' }}
                >
                  <Flag size={14} /> Eskalasi ke Senior
                </button>
                <button
                  className="btn btn-secondary"
                  onClick={() => handleAction(selectedItem.id, 'ban_user')}
                  disabled={actionLoading}
                  style={{ gap: 8, justifyContent: 'center', color: '#7C3AED', borderColor: 'rgba(124,58,237,0.3)' }}
                >
                  <Ban size={14} /> Suspend User
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
