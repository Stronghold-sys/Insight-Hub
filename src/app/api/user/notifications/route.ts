import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import { dbQuery } from '@/lib/db';
import crypto from 'crypto';

export async function GET() {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    let dbNotifications = await dbQuery<any>(
      `SELECT id, title, message, is_read as isRead, priority, DATE_FORMAT(created_at, '%Y-%m-%d %H:%i') as date 
       FROM notifications 
       WHERE user_id = ? 
       ORDER BY created_at DESC`,
      [user.id]
    );

    // Seeding default notifications if empty so the feature is immediately functional and displays nicely
    if (dbNotifications.length === 0) {
      const defaultNotifs = [
        {
          id: crypto.randomUUID(),
          title: 'Selamat datang di Insight Hub!',
          message: `Halo ${user.nickname || 'Pengguna'}! Selamat bergabung di platform self-awareness berbasis sains. Pantau hasil kuis, riwayat mood, dan analisis chat kamu di sini.`,
          priority: 'medium'
        },
        {
          id: crypto.randomUUID(),
          title: 'Tips Hubungan: Komunikasi Asertif',
          message: 'Cobalah gunakan "I-statement" seperti "Aku merasa khawatir saat..." daripada menyalahkan "Kamu selalu saja..." ketika berbicara dengan orang terdekat hari ini.',
          priority: 'low'
        },
        {
          id: crypto.randomUUID(),
          title: 'Assessment Kebutuhan Validasi Selesai',
          message: 'Analisis kuis Kebutuhan Validasi kamu telah siap. Klik halaman Insight untuk membaca penjelasan dimensi kepribadian kamu selengkapnya.',
          priority: 'low'
        }
      ];

      for (const n of defaultNotifs) {
        await dbQuery(
          'INSERT INTO notifications (id, user_id, title, message, is_read, priority) VALUES (?, ?, ?, ?, false, ?)',
          [n.id, user.id, n.title, n.message, n.priority]
        );
      }

      // Re-fetch seeded notifications
      dbNotifications = await dbQuery<any>(
        `SELECT id, title, message, is_read as isRead, priority, DATE_FORMAT(created_at, '%Y-%m-%d %H:%i') as date 
         FROM notifications 
         WHERE user_id = ? 
         ORDER BY created_at DESC`,
         [user.id]
      );
    }

    // Sanitize notifications to fix undefined invoice numbers and remove technical terms
    const sanitizedNotifications = []
    for (const notif of dbNotifications) {
      let message = notif.message || ''
      let title = notif.title || ''

      // Fix undefined invoice number
      if (message.includes('No. Invoice: undefined') || message.includes('No. Invoice: null')) {
        const inv = await dbQuery<any>(
          `SELECT i.invoice_number 
           FROM invoices i
           JOIN payments p ON i.payment_id = p.id
           JOIN orders o ON p.order_id = o.id
           WHERE o.user_id = ?::text AND p.status = 'SUCCESS'
           ORDER BY i.created_at DESC
           LIMIT 1`,
          [user.id]
        )
        if (inv.length > 0 && inv[0].invoice_number) {
          message = message.replace('No. Invoice: undefined', `No. Invoice: ${inv[0].invoice_number}`)
                           .replace('No. Invoice: null', `No. Invoice: ${inv[0].invoice_number}`)
        }
      }

      // Remove technical words
      const cleanText = (text: string) => {
        if (!text) return text
        return text
          .replace(/duitku/gi, 'sistem pembayaran')
          .replace(/payment gateway/gi, 'layanan pembayaran')
          .replace(/database/gi, 'sistem')
          .replace(/\bai\b/gi, 'sistem cerdas')
      }

      message = cleanText(message)
      title = cleanText(title)

      sanitizedNotifications.push({
        ...notif,
        title,
        message
      })
    }

    return NextResponse.json({ success: true, notifications: sanitizedNotifications, userId: user.id });
  } catch (error) {
    console.error('Error fetching user notifications:', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { action, id } = await req.json();

    if (!action) {
      return NextResponse.json({ success: false, error: 'Action wajib ditentukan' }, { status: 400 });
    }

    if (action === 'mark_read') {
      if (id === 'all') {
        await dbQuery(
          'UPDATE notifications SET is_read = true WHERE user_id = ?',
          [user.id]
        );
      } else {
        await dbQuery(
          'UPDATE notifications SET is_read = true WHERE user_id = ? AND id = ?',
          [user.id, id]
        );
      }
      return NextResponse.json({ success: true });
    }

    if (action === 'toggle_read') {
      const current = await dbQuery(
        'SELECT is_read FROM notifications WHERE user_id = ? AND id = ?',
        [user.id, id]
      );
      if (current.length > 0) {
        const nextStatus = !current[0].is_read;
        await dbQuery(
          'UPDATE notifications SET is_read = ? WHERE user_id = ? AND id = ?',
          [nextStatus, user.id, id]
        );
        return NextResponse.json({ success: true, nextStatus });
      }
    }

    if (action === 'delete') {
      await dbQuery(
        'DELETE FROM notifications WHERE user_id = ? AND id = ?',
        [user.id, id]
      );
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ success: false, error: 'Action tidak valid' }, { status: 400 });
  } catch (error) {
    console.error('Error modifying user notification:', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}
