'use client'

import { useState, useEffect } from 'react'
import { MessageSquare, AlertTriangle, CheckCircle, Clock, XCircle, RefreshCw, Filter, Search, ChevronDown, Shield } from 'lucide-react'

interface Ticket {
  id: string
  userId: string
  userEmail: string
  userNickname: string
  subject: string
  category: string
  priority: 'low' | 'medium' | 'high' | 'urgent'
  status: 'open' | 'in_progress' | 'resolved' | 'closed'
  createdAt: string
  lastReply?: string
  repliesCount: number
}

const PRIORITY_CONFIG = {
  low: { label: 'Rendah', color: 'var(--text-muted)', bg: 'rgba(148,163,184,0.1)' },
  medium: { label: 'Sedang', color: 'var(--warning)', bg: 'rgba(245,159,11,0.1)' },
  high: { label: 'Tinggi', color: 'var(--error)', bg: 'rgba(211,47,47,0.1)' },
  urgent: { label: 'URGENT', color: '#ff0000', bg: 'rgba(255,0,0,0.1)' },
}

const STATUS_CONFIG = {
  open: { label: 'Open', color: 'var(--brand-blue)', bg: 'rgba(2,134,195,0.1)', icon: AlertTriangle },
  in_progress: { label: 'Diproses', color: 'var(--warning)', bg: 'rgba(245,159,11,0.1)', icon: Clock },
  resolved: { label: 'Resolved', color: 'var(--teal)', bg: 'rgba(23,184,151,0.1)', icon: CheckCircle },
  closed: { label: 'Closed', color: 'var(--text-muted)', bg: 'rgba(148,163,184,0.1)', icon: XCircle },
}

export default function AdminSupportPage() {
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [filterPriority, setFilterPriority] = useState('all')
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null)
  const [replies, setReplies] = useState<any[]>([])
  const [replyText, setReplyText] = useState('')
  const [replyLoading, setReplyLoading] = useState(false)
  const [stats, setStats] = useState({ open: 0, inProgress: 0, resolved: 0, avgResponseHr: 0 })

  const fetchTickets = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (search) params.set('q', search)
      if (filterStatus !== 'all') params.set('status', filterStatus)
      if (filterPriority !== 'all') params.set('priority', filterPriority)

      const res = await fetch(`/api/admin/support?${params}`)
      const json = await res.json()
      if (json.success) {
        setTickets(json.tickets || [])
        setStats(json.stats || { open: 0, inProgress: 0, resolved: 0, avgResponseHr: 0 })
      }
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchTickets() }, [filterStatus, filterPriority])

  const handleSelectTicket = async (ticket: Ticket) => {
    setSelectedTicket(ticket)
    try {
      const res = await fetch(`/api/admin/support?ticketId=${ticket.id}`)
      const json = await res.json()
      if (json.success) setReplies(json.replies || [])
    } catch {}
  }

  const handleReply = async () => {
    if (!replyText.trim() || !selectedTicket) return
    setReplyLoading(true)
    try {
      const res = await fetch('/api/admin/support', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ticketId: selectedTicket.id, reply: replyText, action: 'reply' })
      })
      const json = await res.json()
      if (json.success) {
        setReplies(prev => [...prev, json.reply])
        setReplyText('')
        // Update ticket status to in_progress if open
        if (selectedTicket.status === 'open') {
          setTickets(prev => prev.map(t => t.id === selectedTicket.id ? { ...t, status: 'in_progress' } : t))
          setSelectedTicket(prev => prev ? { ...prev, status: 'in_progress' } : null)
        }
      }
    } catch {}
    setReplyLoading(false)
  }

  const handleUpdateStatus = async (ticketId: string, newStatus: string) => {
    try {
      const res = await fetch('/api/admin/support', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ticketId, action: 'update_status', status: newStatus })
      })
      const json = await res.json()
      if (json.success) {
        setTickets(prev => prev.map(t => t.id === ticketId ? { ...t, status: newStatus as any } : t))
        if (selectedTicket?.id === ticketId) {
          setSelectedTicket(prev => prev ? { ...prev, status: newStatus as any } : null)
        }
      }
    } catch {}
  }

  const filteredTickets = tickets.filter(t =>
    (!search || t.subject.toLowerCase().includes(search.toLowerCase()) || t.userEmail.toLowerCase().includes(search.toLowerCase()))
  )

  return (
    <div className="animate-fadein">
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: 'var(--text-primary)', margin: '0 0 4px' }}>Support & Tiket</h1>
          <p style={{ color: 'var(--text-secondary)', margin: 0 }}>Kelola pertanyaan dan laporan dari pengguna platform.</p>
        </div>
        <button onClick={fetchTickets} className="btn btn-secondary btn-sm" style={{ gap: 6 }}>
          <RefreshCw size={12} />
          Refresh
        </button>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 20 }}>
        {[
          { label: 'Open', value: stats.open, color: 'var(--brand-blue)', bg: 'rgba(2,134,195,0.1)' },
          { label: 'Diproses', value: stats.inProgress, color: 'var(--warning)', bg: 'rgba(245,159,11,0.1)' },
          { label: 'Resolved', value: stats.resolved, color: 'var(--teal)', bg: 'rgba(23,184,151,0.1)' },
          { label: 'Avg Response', value: `${stats.avgResponseHr}j`, color: '#9B59B6', bg: 'rgba(155,89,182,0.1)' },
        ].map((s, i) => (
          <div key={i} className="card" style={{ padding: 16, background: s.bg, border: `1px solid ${s.color}20` }}>
            <div style={{ fontSize: 22, fontWeight: 800, color: s.color }}>{s.value}</div>
            <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Main Layout: Ticket List + Detail */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: 20, height: 'calc(100vh - 320px)', minHeight: 400 }}>
        
        {/* Ticket List */}
        <div className="card" style={{ padding: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          {/* Filters */}
          <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', gap: 8 }}>
            <div style={{ flex: 1, position: 'relative' }}>
              <Search size={13} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input className="input" placeholder="Cari tiket..." value={search} onChange={e => setSearch(e.target.value)} style={{ paddingLeft: 30, fontSize: 12, padding: '7px 7px 7px 30px' }} />
            </div>
            <select className="input" value={filterStatus} onChange={e => setFilterStatus(e.target.value)} style={{ width: 'auto', fontSize: 12, padding: '7px 10px' }}>
              <option value="all">Semua Status</option>
              <option value="open">Open</option>
              <option value="in_progress">Diproses</option>
              <option value="resolved">Resolved</option>
              <option value="closed">Closed</option>
            </select>
          </div>

          <div style={{ flex: 1, overflowY: 'auto' }}>
            {loading ? (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 8 }}>
                <div className="spinner" /> <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>Memuat tiket...</span>
              </div>
            ) : filteredTickets.length === 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 8, color: 'var(--text-muted)', fontSize: 13 }}>
                <MessageSquare size={32} />
                <p style={{ margin: 0 }}>Tidak ada tiket ditemukan.</p>
              </div>
            ) : (
              filteredTickets.map(ticket => {
                const statusCfg = STATUS_CONFIG[ticket.status]
                const priorityCfg = PRIORITY_CONFIG[ticket.priority]
                const isSelected = selectedTicket?.id === ticket.id
                return (
                  <div
                    key={ticket.id}
                    onClick={() => handleSelectTicket(ticket)}
                    style={{
                      padding: '14px 16px',
                      borderBottom: '1px solid var(--border-subtle)',
                      cursor: 'pointer',
                      background: isSelected ? 'rgba(2,134,195,0.06)' : 'transparent',
                      borderLeft: isSelected ? '3px solid var(--brand-blue)' : '3px solid transparent',
                      transition: 'all 150ms ease'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                      <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '70%' }}>
                        {ticket.subject}
                      </p>
                      <span style={{ padding: '2px 7px', borderRadius: 999, fontSize: 10, fontWeight: 700, background: priorityCfg.bg, color: priorityCfg.color }}>
                        {priorityCfg.label}
                      </span>
                    </div>
                    <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: '0 0 6px' }}>{ticket.userEmail} • {ticket.category}</p>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ padding: '2px 7px', borderRadius: 999, fontSize: 10, fontWeight: 700, background: statusCfg.bg, color: statusCfg.color }}>
                        {statusCfg.label}
                      </span>
                      <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>{ticket.createdAt}</span>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>

        {/* Ticket Detail */}
        <div className="card" style={{ padding: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          {!selectedTicket ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-muted)', gap: 12 }}>
              <MessageSquare size={40} />
              <p style={{ margin: 0, fontSize: 13 }}>Pilih tiket untuk lihat detail dan balas.</p>
            </div>
          ) : (
            <>
              {/* Ticket Header */}
              <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-subtle)', background: 'rgba(255,255,255,0.2)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                  <div>
                    <h3 style={{ fontSize: 14, fontWeight: 800, color: 'var(--text-primary)', margin: '0 0 4px' }}>{selectedTicket.subject}</h3>
                    <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: 0 }}>
                      dari {selectedTicket.userEmail} • {selectedTicket.createdAt}
                    </p>
                  </div>
                  <select
                    value={selectedTicket.status}
                    onChange={e => handleUpdateStatus(selectedTicket.id, e.target.value)}
                    style={{ fontSize: 11, padding: '4px 8px', borderRadius: 6, border: '1px solid var(--border)', background: 'var(--surface)', fontWeight: 700 }}
                  >
                    <option value="open">Open</option>
                    <option value="in_progress">Diproses</option>
                    <option value="resolved">Resolved</option>
                    <option value="closed">Closed</option>
                  </select>
                </div>
              </div>

              {/* Messages */}
              <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 14 }}>
                {replies.length === 0 ? (
                  <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: 13, padding: 20 }}>
                    Belum ada balasan.
                  </div>
                ) : (
                  replies.map((reply: any, i: number) => {
                    const isAdmin = reply.senderRole === 'admin'
                    return (
                      <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: isAdmin ? 'flex-end' : 'flex-start' }}>
                        <div style={{
                          maxWidth: '80%',
                          padding: '10px 14px',
                          borderRadius: 12,
                          background: isAdmin ? 'rgba(2,134,195,0.9)' : 'rgba(255,255,255,0.6)',
                          color: isAdmin ? 'white' : 'var(--text-primary)',
                          backdropFilter: 'blur(8px)',
                          fontSize: 13,
                          lineHeight: 1.5
                        }}>
                          {reply.message}
                        </div>
                        <span style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 3 }}>
                          {isAdmin ? 'Admin' : 'User'} • {reply.createdAt}
                        </span>
                      </div>
                    )
                  })
                )}
              </div>

              {/* Reply Input */}
              <div style={{ padding: '14px 20px', borderTop: '1px solid var(--border-subtle)', background: 'rgba(255,255,255,0.2)' }}>
                <textarea
                  className="input"
                  placeholder="Tulis balasan ke user..."
                  rows={3}
                  value={replyText}
                  onChange={e => setReplyText(e.target.value)}
                  style={{ resize: 'none', fontSize: 13, marginBottom: 10 }}
                />
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                  <button
                    className="btn btn-primary btn-sm"
                    onClick={handleReply}
                    disabled={replyLoading || !replyText.trim()}
                    style={{ gap: 6 }}
                  >
                    {replyLoading ? <div className="spinner spinner-sm" style={{ borderTopColor: 'white' }} /> : <MessageSquare size={13} />}
                    Kirim Balasan
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
