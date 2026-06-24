'use client'

import { useState, useEffect } from 'react'
import { Shield, Key, Check, Plus } from 'lucide-react'

export default function RolesAdminPage() {
  const [roles, setRoles] = useState<any[]>([])
  const [permissions, setPermissions] = useState<any[]>([])
  const [mapping, setMapping] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const [newRole, setNewRole] = useState({ id: '', name: '', desc: '' })
  const [newPermission, setNewPermission] = useState({ id: '', name: '', desc: '' })

  const fetchRBACData = async () => {
    try {
      const res = await fetch('/api/admin/roles')
      const data = await res.json()
      if (data.success) {
        setRoles(data.roles)
        setPermissions(data.permissions)
        setMapping(data.mapping)
      }
    } catch (e) {
      console.error('Failed to fetch RBAC details:', e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchRBACData()
  }, [])

  const handleAddRole = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newRole.id || !newRole.name) return
    try {
      const res = await fetch('/api/admin/roles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'create_role',
          data: newRole
        })
      })
      const data = await res.json()
      if (data.success) {
        setNewRole({ id: '', name: '', desc: '' })
        fetchRBACData()
      }
    } catch (err) {
      console.error(err)
    }
  }

  const handleAddPermission = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newPermission.id || !newPermission.name) return
    try {
      const res = await fetch('/api/admin/roles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'create_permission',
          data: newPermission
        })
      })
      const data = await res.json()
      if (data.success) {
        setNewPermission({ id: '', name: '', desc: '' })
        fetchRBACData()
      }
    } catch (err) {
      console.error(err)
    }
  }

  const toggleMapping = async (roleId: string, permissionId: string) => {
    try {
      const res = await fetch('/api/admin/roles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'toggle_mapping',
          roleId,
          permissionId
        })
      })
      const data = await res.json()
      if (data.success) {
        // Toggle mapping locally
        const exists = mapping.some(m => m.roleId === roleId && m.permissionId === permissionId)
        if (exists) {
          setMapping(mapping.filter(m => !(m.roleId === roleId && m.permissionId === permissionId)))
        } else {
          setMapping([...mapping, { roleId, permissionId }])
        }
      }
    } catch (err) {
      console.error(err)
    }
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
        <div className="spinner" style={{ borderColor: 'rgba(2,134,195,0.2)', borderTopColor: 'var(--brand-blue)', width: 36, height: 36, marginBottom: 12 }} />
        <p style={{ color: 'var(--text-secondary)', fontSize: 13 }}>Memuat parameter RBAC...</p>
      </div>
    )
  }

  return (
    <div className="animate-fadein" style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Header */}
      <div>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: 'var(--text-primary)', margin: '0 0 4px' }}>Roles &amp; Permissions Management</h1>
        <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: 0 }}>Atur peran pengguna (RBAC), hak akses menu kontrol, dan pemetaan izin di sistem pusat.</p>
      </div>

      {/* Grid 2 Columns */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 24 }}>
        
        {/* Roles List & Form */}
        <div className="card" style={{ padding: 24 }}>
          <h3 style={{ fontSize: 15, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Shield size={16} color="var(--brand-blue)" />
            Daftar Peran (Roles)
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}>
            {roles.map(role => (
              <div key={role.id} style={{ padding: 12, borderRadius: 6, background: '#F7F9FA', border: '1px solid var(--border-subtle)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                  <strong style={{ fontSize: 13, color: 'var(--text-primary)' }}>{role.name}</strong>
                  <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--brand-blue)', background: 'rgba(2,134,195,0.08)', padding: '2px 6px', borderRadius: 4 }}>{role.id}</span>
                </div>
                <p style={{ fontSize: 11.5, color: 'var(--text-secondary)', margin: 0 }}>{role.desc}</p>
              </div>
            ))}
          </div>
          
          <form onSubmit={handleAddRole} style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
            <h4 style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>Tambah Role Baru</h4>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <input
                required
                type="text"
                placeholder="ID Role (e.g. staff)"
                value={newRole.id}
                onChange={e => setNewRole({ ...newRole, id: e.target.value.toLowerCase().replace(/[^a-z_]/g, '') })}
                style={{ padding: '6px 10px', borderRadius: 4, border: '1px solid var(--border)', fontSize: 12, background: 'var(--surface)' }}
              />
              <input
                required
                type="text"
                placeholder="Nama Tampil"
                value={newRole.name}
                onChange={e => setNewRole({ ...newRole, name: e.target.value })}
                style={{ padding: '6px 10px', borderRadius: 4, border: '1px solid var(--border)', fontSize: 12, background: 'var(--surface)' }}
              />
            </div>
            <input
              required
              type="text"
              placeholder="Deskripsi peran"
              value={newRole.desc}
              onChange={e => setNewRole({ ...newRole, desc: e.target.value })}
              style={{ padding: '6px 10px', borderRadius: 4, border: '1px solid var(--border)', fontSize: 12, background: 'var(--surface)' }}
            />
            <button type="submit" className="btn btn-primary btn-sm" style={{ alignSelf: 'flex-start', display: 'flex', alignItems: 'center', gap: 4 }}>
              <Plus size={12} /> Add Role
            </button>
          </form>
        </div>

        {/* Permissions List & Form */}
        <div className="card" style={{ padding: 24 }}>
          <h3 style={{ fontSize: 15, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Key size={16} color="var(--teal)" />
            Hak Akses (Permissions)
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}>
            {permissions.map(perm => (
              <div key={perm.id} style={{ padding: 12, borderRadius: 6, background: '#F7F9FA', border: '1px solid var(--border-subtle)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                  <strong style={{ fontSize: 13, color: 'var(--text-primary)' }}>{perm.name}</strong>
                  <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--teal)', background: 'rgba(23,184,151,0.08)', padding: '2px 6px', borderRadius: 4 }}>{perm.id}</span>
                </div>
                <p style={{ fontSize: 11.5, color: 'var(--text-secondary)', margin: 0 }}>{perm.desc}</p>
              </div>
            ))}
          </div>

          <form onSubmit={handleAddPermission} style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
            <h4 style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>Tambah Permission Baru</h4>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <input
                required
                type="text"
                placeholder="ID (e.g. read_logs)"
                value={newPermission.id}
                onChange={e => setNewPermission({ ...newPermission, id: e.target.value.toLowerCase().replace(/[^a-z_]/g, '') })}
                style={{ padding: '6px 10px', borderRadius: 4, border: '1px solid var(--border)', fontSize: 12, background: 'var(--surface)' }}
              />
              <input
                required
                type="text"
                placeholder="Nama Hak Akses"
                value={newPermission.name}
                onChange={e => setNewPermission({ ...newPermission, name: e.target.value })}
                style={{ padding: '6px 10px', borderRadius: 4, border: '1px solid var(--border)', fontSize: 12, background: 'var(--surface)' }}
              />
            </div>
            <input
              required
              type="text"
              placeholder="Deskripsi hak akses"
              value={newPermission.desc}
              onChange={e => setNewPermission({ ...newPermission, desc: e.target.value })}
              style={{ padding: '6px 10px', borderRadius: 4, border: '1px solid var(--border)', fontSize: 12, background: 'var(--surface)' }}
            />
            <button type="submit" className="btn btn-primary btn-sm" style={{ alignSelf: 'flex-start', display: 'flex', alignItems: 'center', gap: 4 }}>
              <Plus size={12} /> Add Permission
            </button>
          </form>
        </div>

      </div>

      {/* Role-Permission Matrix */}
      <div className="card" style={{ padding: 24 }}>
        <h3 style={{ fontSize: 15, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 16 }}>Pemetaan Role &amp; Permission</h3>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ background: '#F7F9FA', borderBottom: '1px solid var(--border)' }}>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 700, color: 'var(--text-secondary)' }}>Permission / Role</th>
                {roles.map(role => (
                  <th key={role.id} style={{ padding: '12px 16px', textAlign: 'center', fontWeight: 700, color: 'var(--text-secondary)' }}>{role.name}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {permissions.map(perm => (
                <tr key={perm.id} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                  <td style={{ padding: '12px 16px' }}>
                    <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{perm.name}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{perm.id}</div>
                  </td>
                  {roles.map(role => {
                    const hasAccess = mapping.some(m => m.roleId === role.id && m.permissionId === perm.id)
                    return (
                      <td key={role.id} style={{ padding: '12px 16px', textAlign: 'center' }}>
                        <button
                          onClick={() => toggleMapping(role.id, perm.id)}
                          style={{
                            background: 'none', border: 'none', cursor: 'pointer',
                            color: hasAccess ? 'var(--teal)' : 'var(--text-muted)',
                            padding: 8, borderRadius: 4, transition: 'all 100ms ease'
                          }}
                        >
                          <Check size={20} style={{ opacity: hasAccess ? 1 : 0.15 }} />
                        </button>
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  )
}
