import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import { dbQuery } from '@/lib/db';
import crypto from 'crypto';

// GET /api/admin/support?status=open&ticketId=...
export async function GET(request: Request) {
  try {
    const user = await getSessionUser();
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ message: 'Akses ditolak!' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const ticketId = searchParams.get('ticketId');
    const status = searchParams.get('status') || 'all';
    const search = searchParams.get('q') || '';

    // If fetching a specific ticket's replies
    if (ticketId) {
      const replies = await dbQuery<any>(
        `SELECT sr.id, sr.message_text as message, sr.sender_role as senderRole, DATE_FORMAT(sr.created_at, '%d %b %Y, %H:%i') as createdAt
         FROM support_replies sr
         WHERE sr.ticket_id = ?
         ORDER BY sr.created_at ASC`,
        [ticketId]
      );

      // Add the original ticket message as first entry
      const ticket = await dbQuery<any>('SELECT description, "user" as sender_role, created_at FROM support_tickets WHERE id = ?', [ticketId]);
      const allMessages = ticket.length > 0
        ? [{ id: 'original', message: ticket[0].description, senderRole: 'user', createdAt: new Date(ticket[0].created_at).toLocaleDateString('id-ID') }].concat(replies)
        : replies;

      return NextResponse.json({ success: true, replies: allMessages });
    }

    // Fetch ticket list with filters
    let sql = `
      SELECT t.id, t.subject, t.category, t.priority, t.status,
             DATE_FORMAT(t.created_at, '%d %b %Y') as createdAt,
             u.email as userEmail, p.nickname as userNickname,
             (SELECT COUNT(*) FROM support_replies WHERE ticket_id = t.id) as repliesCount
      FROM support_tickets t
      JOIN users u ON t.user_id = u.id
      LEFT JOIN user_profiles p ON u.id = p.user_id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (status !== 'all') {
      sql += ` AND t.status = ?`;
      params.push(status);
    }
    if (search) {
      sql += ` AND (t.subject LIKE ? OR u.email LIKE ?)`;
      params.push(`%${search}%`, `%${search}%`);
    }
    sql += ` ORDER BY t.created_at DESC LIMIT 50`;

    const tickets = await dbQuery<any>(sql, params);

    // Stats
    const [openRes, inProgressRes, resolvedRes] = await Promise.all([
      dbQuery<any>('SELECT COUNT(*) as count FROM support_tickets WHERE status = "open"'),
      dbQuery<any>('SELECT COUNT(*) as count FROM support_tickets WHERE status = "in_progress"'),
      dbQuery<any>('SELECT COUNT(*) as count FROM support_tickets WHERE status = "resolved"'),
    ]);

    return NextResponse.json({
      success: true,
      tickets,
      stats: {
        open: openRes[0]?.count || 0,
        inProgress: inProgressRes[0]?.count || 0,
        resolved: resolvedRes[0]?.count || 0,
        avgResponseHr: 2,
      },
    });
  } catch (error) {
    console.error('Error in admin support GET API:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}

// POST /api/admin/support - Reply to ticket, update status
export async function POST(request: Request) {
  try {
    const user = await getSessionUser();
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ message: 'Akses ditolak!' }, { status: 403 });
    }

    const body = await request.json();
    const { ticketId, action, reply, status } = body;

    if (!ticketId) {
      return NextResponse.json({ message: 'Ticket ID wajib dilampirkan.' }, { status: 400 });
    }

    if (action === 'reply') {
      if (!reply?.trim()) {
        return NextResponse.json({ message: 'Balasan tidak boleh kosong.' }, { status: 400 });
      }

      const replyId = crypto.randomUUID();
      await dbQuery(
        `INSERT INTO support_replies (id, ticket_id, sender_role, message_text) VALUES (?, ?, 'admin', ?)`,
        [replyId, ticketId, reply.trim()]
      );

      // Auto-update status to in_progress if open
      await dbQuery(
        `UPDATE support_tickets SET status = 'in_progress', updated_at = NOW() WHERE id = ? AND status = 'open'`,
        [ticketId]
      );

      // Log action
      await dbQuery(
        `INSERT INTO audit_logs (user_id, action, details) VALUES (?, 'support_reply', ?)`,
        [user.id, `Admin membalas tiket ${ticketId}`]
      );

      return NextResponse.json({
        success: true,
        reply: {
          id: replyId,
          message: reply.trim(),
          senderRole: 'admin',
          createdAt: new Date().toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
        }
      });
    }

    if (action === 'update_status') {
      if (!['open', 'in_progress', 'resolved', 'closed'].includes(status)) {
        return NextResponse.json({ message: 'Status tidak valid.' }, { status: 400 });
      }

      await dbQuery(`UPDATE support_tickets SET status = ?, updated_at = NOW() WHERE id = ?`, [status, ticketId]);
      await dbQuery(
        `INSERT INTO audit_logs (user_id, action, details) VALUES (?, 'ticket_status_update', ?)`,
        [user.id, `Status tiket ${ticketId} diubah menjadi ${status}`]
      );

      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ message: 'Action tidak dikenali.' }, { status: 400 });
  } catch (error) {
    console.error('Error in admin support POST API:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}
