import { redirect } from 'next/navigation';
import { getSessionUser } from '@/lib/auth';
import Link from 'next/link';
import { Shield, Users, FileText, CheckSquare, Lock, BarChart2, CreditCard, MessageSquare, AlertTriangle, ArrowLeft, Key } from 'lucide-react';

export const metadata = {
  title: 'Admin Panel | Insight Hub',
};

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  // Guard server-side: hanya admin yang bisa masuk
  const user = await getSessionUser();
  if (!user || user.role !== 'admin') {
    redirect('/masuk');
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'transparent' }}>
      {/* Admin Sidebar */}
      <aside className="glass admin-sidebar" style={{ width: 260, display: 'flex', flexDirection: 'column', flexShrink: 0, borderRight: '1px solid var(--border)', borderRadius: 0 }}>
        {/* Sidebar Header */}
        <div style={{ padding: '24px 20px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 28, height: 28, borderRadius: 6, background: 'linear-gradient(135deg, #0286C3, #17B897)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Shield size={14} color="white" />
          </div>
          <span style={{ fontWeight: 800, fontSize: 16, color: 'var(--text-primary)' }}>Insight Hub Admin</span>
        </div>

        {/* Sidebar Navigation */}
        <nav style={{ padding: '20px 10px', flex: 1, display: 'flex', flexDirection: 'column', gap: 4 }}>
          <p style={{ fontSize: 10, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', margin: '0 6px 8px', paddingBottom: 6, borderBottom: '1px solid var(--border-subtle)' }}>
            Overview
          </p>
          <Link href="/admin" className="nav-item">
            <Shield size={16} />
            Dashboard
          </Link>
          <Link href="/admin/analytics" className="nav-item">
            <BarChart2 size={16} />
            Analytics & Growth
          </Link>

          <p style={{ fontSize: 10, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', margin: '12px 6px 8px', paddingBottom: 6, borderBottom: '1px solid var(--border-subtle)' }}>
            Pengguna & Konten
          </p>
          <Link href="/admin/users" className="nav-item">
            <Users size={16} />
            User Management
          </Link>
          <Link href="/admin/roles" className="nav-item">
            <Key size={16} />
            Roles &amp; Permissions
          </Link>
          <Link href="/admin/cms" className="nav-item">
            <FileText size={16} />
            Content (CMS)
          </Link>
          <Link href="/admin/assessments" className="nav-item">
            <CheckSquare size={16} />
            Assessments
          </Link>
          <Link href="/admin/moderasi" className="nav-item">
            <AlertTriangle size={16} />
            Moderasi
          </Link>

          <p style={{ fontSize: 10, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', margin: '12px 6px 8px', paddingBottom: 6, borderBottom: '1px solid var(--border-subtle)' }}>
            Bisnis & Keamanan
          </p>
          <Link href="/admin/billing" className="nav-item">
            <CreditCard size={16} />
            Billing & Langganan
          </Link>
          <Link href="/admin/support" className="nav-item">
            <MessageSquare size={16} />
            Support & Tiket
          </Link>
          <Link href="/admin/security" className="nav-item">
            <Lock size={16} />
            Security & Audit
          </Link>
        </nav>

        {/* Sidebar Footer */}
        <div style={{ padding: '20px', borderTop: '1px solid var(--border)' }}>
          <Link href="/dashboard" style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--brand-blue)', textDecoration: 'none', fontSize: 13, fontWeight: 600, marginBottom: 12 }}>
            <ArrowLeft size={14} />
            Kembali ke App User
          </Link>
          <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
            Logged in as {user.nickname} ({user.email})
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main style={{ flex: 1, padding: 32, overflowY: 'auto' }}>
        {children}
      </main>
    </div>
  );
}
