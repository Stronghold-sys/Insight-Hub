'use client'

import { useState, useEffect } from 'react';
import { Shield, Users, FileText, CheckSquare, Lock, Activity, TrendingUp } from 'lucide-react';

export default function AdminDashboardPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/admin/dashboard')
      .then(res => res.json())
      .then(resData => {
        if (resData.success) {
          setData(resData);
        }
        setLoading(false);
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
        <p style={{ color: 'var(--text-secondary)', fontSize: 13 }}>Memuat dasbor admin...</p>
      </div>
    );
  }

  const stats = data?.stats || { totalUsers: 0, activeUsers: 0, totalJournals: 0, totalChatsAnalyzed: 0 };
  const auditLogs = data?.latestAudit || [];

  return (
    <div className="animate-fadein">
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 24, fontWeight: 800, color: 'var(--text-primary)', margin: '0 0 4px' }}>Dasbor Admin</h1>
        <p style={{ color: 'var(--text-secondary)', margin: 0 }}>Statistik dan aktivitas platform secara real-time.</p>
      </div>

      {/* Stats Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
        {[
          { label: 'Total User Terdaftar', value: stats.totalUsers, icon: Users, color: 'var(--brand-blue)', bg: 'rgba(2,134,195,0.1)' },
          { label: 'User Aktif', value: stats.activeUsers, icon: Activity, color: 'var(--teal)', bg: 'rgba(23,184,151,0.1)' },
          { label: 'Total Entri Jurnal', value: stats.totalJournals, icon: FileText, color: 'var(--warning)', bg: 'rgba(245,166,35,0.1)' },
          { label: 'Analisis Chat', value: stats.totalChatsAnalyzed, icon: Shield, color: '#9B59B6', bg: 'rgba(155,89,182,0.1)' },
        ].map(s => (
          <div key={s.label} className="card animate-fadein" style={{ padding: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <div style={{ width: 36, height: 36, borderRadius: 8, background: s.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <s.icon size={18} color={s.color} />
              </div>
            </div>
            <div style={{ fontSize: 26, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 4 }}>{s.value}</div>
            <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Latest Audit Logs & Subscription breakdown */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 20 }}>
        {/* Audit Logs */}
        <div className="card" style={{ padding: 20 }}>
          <h3 style={{ fontSize: 15, marginBottom: 16 }}>Aktivitas Admin & User Terkini</h3>
          {auditLogs.length === 0 ? (
            <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>Belum ada log aktivitas.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {auditLogs.map((log: any) => (
                <div key={log.id} style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: 12, borderBottom: '1px solid var(--border-subtle)', fontSize: 13 }}>
                  <div>
                    <span style={{ fontWeight: 700, color: 'var(--text-primary)', marginRight: 6 }}>{log.nickname || 'Sistem'}</span>
                    <span style={{ color: 'var(--text-secondary)' }}>{log.action}: {log.details}</span>
                  </div>
                  <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{log.date}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Subscription Info */}
        <div className="card" style={{ padding: 20 }}>
          <h3 style={{ fontSize: 15, marginBottom: 16 }}>Status Langganan Aktif</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {data?.planCounts && data.planCounts.length > 0 ? (
              data.planCounts.map((p: any) => (
                <div key={p.plan_id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', textTransform: 'uppercase' }}>
                    {p.plan_id}
                  </span>
                  <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--brand-blue)' }}>
                    {p.count} user
                  </span>
                </div>
              ))
            ) : (
              <div style={{ textAlign: 'center', padding: 20, color: 'var(--text-muted)', fontSize: 13 }}>
                Belum ada data langganan premium.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
