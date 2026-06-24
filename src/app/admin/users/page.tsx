'use client'

import { useState, useEffect } from 'react';
import { Users, Search, AlertCircle, CheckCircle, ShieldAlert } from 'lucide-react';

export default function AdminUsersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchUsers = async (q = '') => {
    try {
      const res = await fetch(`/api/admin/users?q=${q}`);
      const data = await res.json();
      if (data.success) {
        setUsers(data.users);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
    fetchUsers(e.target.value);
  };

  const toggleUserStatus = async (userId: string) => {
    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, action: 'toggle_status' }),
      });
      const data = await res.json();
      if (data.success) {
        setUsers(prev => prev.map(u => u.id === userId ? { ...u, isActive: data.newStatus } : u));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const changeUserRole = async (userId: string, newRole: string) => {
    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, action: 'change_role', role: newRole }),
      });
      const data = await res.json();
      if (data.success) {
        setUsers(prev => prev.map(u => u.id === userId ? { ...u, role: newRole } : u));
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="animate-fadein">
      <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: 'var(--text-primary)', margin: '0 0 4px' }}>User Management</h1>
          <p style={{ color: 'var(--text-secondary)', margin: 0 }}>Kelola status akun, ubah hak akses (role), dan cari pengguna Insight Hub.</p>
        </div>
      </div>

      {/* Search Bar */}
      <div style={{ position: 'relative', marginBottom: 20, maxWidth: 400 }}>
        <Search size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
        <input
          className="input"
          placeholder="Cari email, nama, atau panggilan..."
          value={search}
          onChange={handleSearchChange}
          style={{ paddingLeft: 38 }}
        />
      </div>

      {/* Users Table Card */}
      <div className="card" style={{ padding: 0, overflowX: 'auto' }}>
        {loading ? (
          <div style={{ padding: 40, textAlign: 'center' }}>
            <div className="spinner" style={{ borderColor: 'rgba(2,134,195,0.2)', borderTopColor: 'var(--brand-blue)', width: 32, height: 32, margin: '0 auto 12px' }} />
            <p style={{ color: 'var(--text-secondary)', fontSize: 13 }}>Memuat daftar user...</p>
          </div>
        ) : users.length === 0 ? (
          <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-secondary)', fontSize: 14 }}>
            Tidak ada user ditemukan.
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 13 }}>
            <thead>
              <tr style={{ background: '#F7F9FA', borderBottom: '1px solid var(--border-subtle)', color: 'var(--text-secondary)' }}>
                <th style={{ padding: '12px 16px' }}>User</th>
                <th style={{ padding: '12px 16px' }}>Email</th>
                <th style={{ padding: '12px 16px' }}>Role</th>
                <th style={{ padding: '12px 16px' }}>Joined Date</th>
                <th style={{ padding: '12px 16px' }}>Status</th>
                <th style={{ padding: '12px 16px', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map(u => (
                <tr key={u.id} style={{ borderBottom: '1px solid var(--border-subtle)', transition: 'background 150ms ease' }}>
                  <td style={{ padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{
                      width: 32, height: 32, borderRadius: '50%', background: 'rgba(2,134,195,0.15)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, color: 'var(--brand-blue)',
                      overflow: 'hidden', position: 'relative'
                    }}>
                      {u.avatarUrl ? (
                        <img src={u.avatarUrl} alt={u.nickname} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        u.nickname?.charAt(0) || 'U'
                      )}
                    </div>
                    <div>
                      <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{u.fullName || u.nickname}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>ID: {u.id.substring(0, 8)}...</div>
                    </div>
                  </td>
                  <td style={{ padding: '14px 16px', color: 'var(--text-primary)' }}>{u.email}</td>
                  <td style={{ padding: '14px 16px' }}>
                    <select
                      value={u.role}
                      onChange={e => changeUserRole(u.id, e.target.value)}
                      style={{
                        padding: '4px 8px', borderRadius: 4, border: '1px solid var(--border)',
                        background: 'var(--surface)', fontSize: 12, fontWeight: 600, color: u.role === 'admin' ? 'var(--brand-blue)' : 'var(--text-primary)'
                      }}
                    >
                      <option value="user">User</option>
                      <option value="admin">Admin</option>
                    </select>
                  </td>
                  <td style={{ padding: '14px 16px', color: 'var(--text-secondary)' }}>{u.joinedDate}</td>
                  <td style={{ padding: '14px 16px' }}>
                    <span style={{
                      padding: '2px 8px', borderRadius: 999, fontSize: 11, fontWeight: 700,
                      background: u.isActive ? 'rgba(23,184,151,0.1)' : 'rgba(211,47,47,0.1)',
                      color: u.isActive ? 'var(--teal)' : 'var(--error)'
                    }}>
                      {u.isActive ? 'Active' : 'Suspended'}
                    </span>
                  </td>
                  <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                    <button
                      onClick={() => toggleUserStatus(u.id)}
                      className="btn btn-sm"
                      style={{
                        background: u.isActive ? 'rgba(211,47,47,0.06)' : 'rgba(23,184,151,0.06)',
                        color: u.isActive ? 'var(--error)' : 'var(--teal)',
                        borderColor: u.isActive ? 'rgba(211,47,47,0.2)' : 'rgba(23,184,151,0.2)',
                        fontSize: 11, fontWeight: 700
                      }}
                    >
                      {u.isActive ? 'Suspend' : 'Activate'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
