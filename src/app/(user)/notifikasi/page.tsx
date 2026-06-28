'use client'

import { useState, useEffect } from 'react'
import { Bell, Check, Trash2, ShieldAlert, Award } from 'lucide-react'
import { supabase, createSafeChannel } from '@/lib/supabaseClient'

export default function NotifikasiPage() {
  const [notifs, setNotifs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [userId, setUserId] = useState<string | null>(null)

  const fetchNotifications = () => {
    fetch('/api/user/notifications')
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setNotifs(data.notifications);
          if (data.userId) {
            setUserId(data.userId);
          }
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }

  useEffect(() => {
    fetchNotifications();
  }, [])

  useEffect(() => {
    if (!userId) return

    // Use a unique channel name (-page suffix) so it doesn't clash with
    // the channel already opened in UserLayout for the notification badge.
    const channel = createSafeChannel(`user-notifications-page-${userId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'notifications', filter: `user_id=eq.${userId}` },
        () => {
          fetchNotifications();
        }
      )
      .on(
        'broadcast',
        { event: 'refresh' },
        () => {
          fetchNotifications();
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [userId])

  const markAllRead = async () => {
    try {
      const res = await fetch('/api/user/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'mark_read', id: 'all' })
      });
      const data = await res.json();
      if (data.success) {
        setNotifs(prev => prev.map(n => ({ ...n, isRead: true, isread: true })));
        window.dispatchEvent(new Event('notifications-updated'));
      }
    } catch (e) {
      console.error(e);
    }
  }

  const deleteNotif = async (id: string | number) => {
    try {
      const res = await fetch('/api/user/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'delete', id })
      });
      const data = await res.json();
      if (data.success) {
        setNotifs(prev => prev.filter(n => n.id !== id));
        window.dispatchEvent(new Event('notifications-updated'));
      }
    } catch (e) {
      console.error(e);
    }
  }

  const toggleRead = async (id: string | number) => {
    try {
      const res = await fetch('/api/user/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'toggle_read', id })
      });
      const data = await res.json();
      if (data.success) {
        setNotifs(prev => prev.map(n => n.id === id ? { ...n, isRead: data.nextStatus, isread: data.nextStatus } : n));
        window.dispatchEvent(new Event('notifications-updated'));
      }
    } catch (e) {
      console.error(e);
    }
  }

  return (
    <>
      <div style={{ maxWidth: 800, margin: '0 auto' }}>
        
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28, flexWrap: 'wrap', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              width: 40, height: 40, borderRadius: 8, background: 'rgba(2,134,195,0.08)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--brand-blue)'
            }}>
              <Bell size={20} />
            </div>
            <div>
              <h1 style={{ fontSize: 20, fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>Notifikasi Inbox</h1>
              <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: 0 }}>Pantau tips harian, summary berkala, dan log keamanan akun kamu.</p>
            </div>
          </div>

          {notifs.some(n => !(n.isRead ?? n.isread)) && (
            <button
              onClick={markAllRead}
              className="btn btn-secondary btn-sm"
              style={{ display: 'flex', alignItems: 'center', gap: 6, border: '1px solid var(--border)', padding: '6px 12px' }}
            >
              <Check size={14} />
              Tandai Semua Dibaca
            </button>
          )}
        </div>

        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '64px 0', gap: 12 }}>
            <div className="spinner" style={{ width: 28, height: 28, borderColor: 'rgba(2,134,195,0.2)', borderTopColor: 'var(--brand-blue)' }} />
            <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Memuat notifikasi...</p>
          </div>
        ) : notifs.length === 0 ? (
          <div className="card" style={{ padding: 48, textAlign: 'center' }}>
            <Bell size={48} color="var(--text-muted)" style={{ margin: '0 auto 16px', opacity: 0.5 }} />
            <h3 style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 8 }}>Semua Bersih!</h3>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: 0 }}>Gak ada notifikasi baru untuk saat ini.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {notifs.map(n => {
              const isHigh = n.priority === 'high'
              const isRead = !!(n.isRead ?? n.isread)
              return (
                <div
                  key={n.id}
                  className="card"
                  style={{
                    padding: 20,
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: 16,
                    borderLeft: isHigh ? '4px solid var(--error)' : (isRead ? '1px solid var(--border-subtle)' : '3px solid var(--brand-blue)'),
                    background: isRead ? 'var(--surface)' : 'rgba(2,134,195,0.02)'
                  }}
                >
                  <div style={{
                    width: 32, height: 32, borderRadius: 6,
                    background: isHigh ? 'rgba(211,47,47,0.08)' : 'rgba(2,134,195,0.08)',
                    color: isHigh ? 'var(--error)' : 'var(--brand-blue)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 2
                  }}>
                    {isHigh ? <ShieldAlert size={16} /> : <Award size={16} />}
                  </div>

                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, marginBottom: 4 }}>
                      <h4 style={{ fontSize: 14, fontWeight: isRead ? 700 : 800, color: 'var(--text-primary)', margin: 0 }}>{n.title}</h4>
                      <span style={{ fontSize: 10, fontWeight: 800, color: isHigh ? 'var(--error)' : 'var(--text-secondary)', textTransform: 'uppercase' }}>
                        {isHigh ? 'Tinggi' : ''}
                      </span>
                    </div>
                    <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5, margin: '0 0 12px' }}>{n.message}</p>
                    
                    <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                      <button
                        onClick={() => toggleRead(n.id)}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 11, fontWeight: 700, color: 'var(--brand-blue)', padding: 0 }}
                      >
                        {isRead ? 'Tandai Belum Dibaca' : 'Tandai Sudah Dibaca'}
                      </button>
                      <button
                        onClick={() => deleteNotif(n.id)}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4, padding: 0 }}
                        onMouseOver={e => e.currentTarget.style.color = 'var(--error)'}
                        onMouseOut={e => e.currentTarget.style.color = 'var(--text-muted)'}
                      >
                        <Trash2 size={12} />
                        Hapus
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </>
  )
}
