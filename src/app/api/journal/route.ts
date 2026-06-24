import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import { dbQuery } from '@/lib/db';
import crypto from 'crypto';

export async function GET() {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ message: 'Harus login dulu ya' }, { status: 401 });
    }

    // Cari journal milik user
    let journals = await dbQuery('SELECT id FROM journals WHERE user_id = ? LIMIT 1', [user.id]);
    
    if (journals.length === 0) {
      // Buat default journal jika belum ada
      const journalId = crypto.randomUUID();
      await dbQuery('INSERT INTO journals (id, user_id, title) VALUES (?, ?, ?)', [journalId, user.id, `Jurnal ${user.nickname}`]);
      journals = [{ id: journalId }];
    }

    const journalId = journals[0].id;

    // Ambil semua entri untuk jurnal tersebut
    const entries = await dbQuery<any>(
      `SELECT id, title, content, mood, tag, DATE_FORMAT(created_at, '%Y-%m-%d') as date
       FROM journal_entries 
       WHERE journal_id = ? 
       ORDER BY created_at DESC`,
      [journalId]
    );

    return NextResponse.json({ success: true, entries });
  } catch (error) {
    console.error('Error fetching journal:', error);
    return NextResponse.json({ message: 'Gagal mengambil jurnal' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ message: 'Harus login dulu ya' }, { status: 401 });
    }

    const { title, content, mood, tag } = await request.json();

    if (!title || !content || !mood) {
      return NextResponse.json({ message: 'Judul, isi jurnal, dan mood wajib diisi!' }, { status: 400 });
    }

    // Cari journal milik user
    let journals = await dbQuery('SELECT id FROM journals WHERE user_id = ? LIMIT 1', [user.id]);
    if (journals.length === 0) {
      const journalId = crypto.randomUUID();
      await dbQuery('INSERT INTO journals (id, user_id, title) VALUES (?, ?, ?)', [journalId, user.id, `Jurnal ${user.nickname}`]);
      journals = [{ id: journalId }];
    }

    const journalId = journals[0].id;
    const entryId = crypto.randomUUID();

    // Insert entri jurnal baru
    await dbQuery(
      'INSERT INTO journal_entries (id, journal_id, title, content, mood, tag) VALUES (?, ?, ?, ?, ?, ?)',
      [entryId, journalId, title, content, mood, tag || 'Umum']
    );

    // Catat aktivitas user
    await dbQuery(
      'INSERT INTO user_activities (user_id, activity_type, description) VALUES (?, ?, ?)',
      [user.id, 'journal_written', `Menulis jurnal: ${title}`]
    );

    return NextResponse.json({ success: true, message: 'Jurnal kamu berhasil disimpan!' });
  } catch (error) {
    console.error('Error saving journal:', error);
    return NextResponse.json({ message: 'Gagal menyimpan jurnal' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ message: 'Harus login dulu ya' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const entryId = searchParams.get('id');

    if (!entryId) {
      return NextResponse.json({ message: 'ID entri jurnal wajib diisi!' }, { status: 400 });
    }

    // Pastikan entri jurnal tersebut milik user yang sedang login
    const entryCheck = await dbQuery<any>(
      `SELECT je.id, je.title FROM journal_entries je
       JOIN journals j ON je.journal_id = j.id
       WHERE je.id = ? AND j.user_id = ?`,
      [entryId, user.id]
    );

    if (entryCheck.length === 0) {
      return NextResponse.json({ message: 'Entri jurnal tidak ditemukan atau bukan milik Anda' }, { status: 404 });
    }

    const entryTitle = entryCheck[0].title;

    // Hapus entri jurnal
    await dbQuery('DELETE FROM journal_entries WHERE id = ?', [entryId]);

    // Catat aktivitas user
    await dbQuery(
      'INSERT INTO user_activities (user_id, activity_type, description) VALUES (?, ?, ?)',
      [user.id, 'journal_deleted', `Menghapus jurnal: ${entryTitle}`]
    );

    return NextResponse.json({ success: true, message: 'Entri jurnal berhasil dihapus!' });
  } catch (error) {
    console.error('Error deleting journal entry:', error);
    return NextResponse.json({ message: 'Gagal menghapus entri jurnal' }, { status: 500 });
  }
}

