import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import { dbQuery } from '@/lib/db';
import crypto from 'crypto';

// GET /api/admin/moderation?status=pending
export async function GET(request: Request) {
  try {
    const user = await getSessionUser();
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ message: 'Akses ditolak!' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || 'pending';

    // Get moderation queue from moderation_logs and reports
    const items = await dbQuery<any>(
      `SELECT ml.id, ml.content_type as type, ml.categories as reason,
              'pending' as status, 'medium' as severity,
              DATE_FORMAT(ml.created_at, '%d %b %Y, %H:%i') as flaggedAt,
              u.id as userId, u.email as userEmail,
              COALESCE(p.nickname, u.email) as userNickname,
              CONCAT('Konten terdeteksi: ', ml.categories) as content
       FROM moderation_logs ml
       JOIN users u ON ml.user_id = u.id
       LEFT JOIN user_profiles p ON u.id = p.user_id
       WHERE ml.flagged = 1
       ORDER BY ml.created_at DESC
       LIMIT 50`
    );

    // Stats
    const [pendingRes, resolvedRes, flaggedRes] = await Promise.all([
      dbQuery<any>('SELECT COUNT(*) as count FROM moderation_logs WHERE flagged = 1'),
      dbQuery<any>('SELECT COUNT(*) as count FROM moderation_actions'),
      dbQuery<any>('SELECT COUNT(*) as count FROM moderation_logs WHERE flagged = 1'),
    ]);

    return NextResponse.json({
      success: true,
      items: items.filter((item: any) => status === 'pending' || item.status === status),
      stats: {
        pending: pendingRes[0]?.count || 0,
        resolved: resolvedRes[0]?.count || 0,
        flagged: flaggedRes[0]?.count || 0,
      },
    });
  } catch (error) {
    console.error('Error in admin moderation GET API:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}

// POST /api/admin/moderation - Take action on flagged content
export async function POST(request: Request) {
  try {
    const adminUser = await getSessionUser();
    if (!adminUser || adminUser.role !== 'admin') {
      return NextResponse.json({ message: 'Akses ditolak!' }, { status: 403 });
    }

    const body = await request.json();
    const { itemId, action } = body;

    if (!itemId || !action) {
      return NextResponse.json({ message: 'Item ID dan action wajib diisi.' }, { status: 400 });
    }

    // Get the moderation log item to find associated user
    const items = await dbQuery<any>('SELECT user_id FROM moderation_logs WHERE id = ?', [itemId]);

    if (action === 'approve') {
      // Mark as not flagged (false positive)
      await dbQuery(`UPDATE moderation_logs SET flagged = 0 WHERE id = ?`, [itemId]);

      // Record action
      await dbQuery(
        `INSERT INTO moderation_actions (target_user_id, action_type, reason, admin_id) VALUES (?, ?, ?, ?)`,
        [items[0]?.user_id, 'content_approved', 'False positive - konten aman', adminUser.id]
      );

      await dbQuery(
        `INSERT INTO audit_logs (user_id, action, details) VALUES (?, 'moderation_approve', ?)`,
        [adminUser.id, `Item moderasi ${itemId} disetujui (konten aman)`]
      );

      return NextResponse.json({ success: true });
    }

    if (action === 'reject') {
      // Delete flagged content (mark as removed)
      await dbQuery(`UPDATE moderation_logs SET flagged = 0 WHERE id = ?`, [itemId]);

      await dbQuery(
        `INSERT INTO moderation_actions (target_user_id, action_type, reason, admin_id) VALUES (?, ?, ?, ?)`,
        [items[0]?.user_id, 'content_removed', 'Konten melanggar aturan platform', adminUser.id]
      );

      await dbQuery(
        `INSERT INTO audit_logs (user_id, action, details) VALUES (?, 'moderation_reject', ?)`,
        [adminUser.id, `Konten ${itemId} dihapus karena melanggar aturan`]
      );

      return NextResponse.json({ success: true });
    }

    if (action === 'escalate') {
      await dbQuery(
        `INSERT INTO moderation_actions (target_user_id, action_type, reason, admin_id) VALUES (?, ?, ?, ?)`,
        [items[0]?.user_id, 'escalated', 'Memerlukan review lebih lanjut oleh senior', adminUser.id]
      );

      await dbQuery(
        `INSERT INTO audit_logs (user_id, action, details) VALUES (?, 'moderation_escalate', ?)`,
        [adminUser.id, `Konten ${itemId} dieskalasi ke senior moderator`]
      );

      return NextResponse.json({ success: true });
    }

    if (action === 'ban_user') {
      if (!items[0]?.user_id) {
        return NextResponse.json({ message: 'User tidak ditemukan.' }, { status: 404 });
      }

      // Suspend the user
      await dbQuery(`UPDATE users SET is_active = 0 WHERE id = ?`, [items[0].user_id]);

      await dbQuery(
        `INSERT INTO moderation_actions (target_user_id, action_type, reason, admin_id) VALUES (?, ?, ?, ?)`,
        [items[0].user_id, 'user_suspended', 'Pelanggaran berulang terhadap aturan platform', adminUser.id]
      );

      await dbQuery(
        `INSERT INTO security_events (user_id, event_type, description) VALUES (?, 'account_suspended', ?)`,
        [items[0].user_id, `Akun disuspend oleh admin karena konten bermasalah (ID: ${itemId})`]
      );

      await dbQuery(
        `INSERT INTO audit_logs (user_id, action, details) VALUES (?, 'user_suspended', ?)`,
        [adminUser.id, `User ${items[0].user_id} disuspend karena konten bermasalah`]
      );

      // Clean up the moderation log
      await dbQuery(`UPDATE moderation_logs SET flagged = 0 WHERE id = ?`, [itemId]);

      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ message: 'Action tidak dikenali.' }, { status: 400 });
  } catch (error) {
    console.error('Error in admin moderation POST API:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}
