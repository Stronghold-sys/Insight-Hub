'use client'

import { useState, useEffect } from 'react';
import { Lock, ShieldAlert, FileText, Clock } from 'lucide-react';

export default function AdminSecurityPage() {
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [securityEvents, setSecurityEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/admin/security')
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setAuditLogs(data.auditLogs);
          setSecurityEvents(data.securityEvents);
        }
        setLoading(false)
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
        <div className="spinner" style={{ borderColor: 'rgba(2,134,195,0.2)', borderTopColor: 'var(--brand-blue)', width: 36, height: 36, marginBottom: 12 }} />
        <p style={{ color: 'var(--text-secondary)', fontSize: 13 }}>Memuat log keamanan...</p>
      </div>
    );
  }

  return (
    <div className="animate-fadein" style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: 'var(--text-primary)', margin: '0 0 4px' }}>Security & Audit Logs</h1>
        <p style={{ color: 'var(--text-secondary)', margin: 0 }}>Pantau riwayat login, perubahan status, dan aktivitas mencurigakan.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        {/* Audit Trail */}
        <div className="card" style={{ padding: 20 }}>
          <h3 style={{ fontSize: 15, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
            <FileText size={16} /> Audit Trail Aktivitas
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, maxHeight: 450, overflowY: 'auto' }}>
            {auditLogs.map(log => (
              <div key={log.id} style={{ padding: '10px 12px', borderRadius: 6, borderBottom: '1px solid var(--border-subtle)', fontSize: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{log.nickname || 'System'} ({log.email || 'guest'})</span>
                  <span style={{ color: 'var(--text-muted)', fontSize: 10 }}>{log.date}</span>
                </div>
                <p style={{ margin: 0, color: 'var(--text-secondary)' }}>
                  Action: <strong style={{ color: 'var(--brand-blue)' }}>{log.action}</strong> - {log.details}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Security Alerts */}
        <div className="card" style={{ padding: 20 }}>
          <h3 style={{ fontSize: 15, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
            <ShieldAlert size={16} color="var(--error)" /> Security Alerts & Events
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, maxHeight: 450, overflowY: 'auto' }}>
            {securityEvents.map(event => {
              const isFailed = event.event_type.includes('failed');
              return (
                <div key={event.id} style={{ padding: '10px 12px', borderRadius: 6, borderLeft: `3px solid ${isFailed ? 'var(--error)' : 'var(--teal)'}`, background: isFailed ? 'rgba(211,47,47,0.03)' : 'rgba(23,184,151,0.03)', fontSize: 12 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span style={{ fontWeight: 700, color: isFailed ? 'var(--error)' : 'var(--teal)' }}>
                      {event.event_type.toUpperCase()}
                    </span>
                    <span style={{ color: 'var(--text-muted)', fontSize: 10 }}>{event.date}</span>
                  </div>
                  <p style={{ margin: '0 0 4px', color: 'var(--text-secondary)' }}>{event.description}</p>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: 'var(--text-muted)' }}>
                    <span>Email: {event.email || 'tidak dikenal'}</span>
                    <span>IP: {event.ip_address || '127.0.0.1'}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
