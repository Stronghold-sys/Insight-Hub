import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import { dbQuery } from '@/lib/db';
import crypto from 'crypto';

export async function GET(request: Request) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ message: 'Harus login dulu ya' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const showDeleted = searchParams.get('showDeleted') === 'true';

    // Ambil jurnal milik user (menggunakan RLS / filter user_id)
    const query = showDeleted
      ? `SELECT id, title, content, mood, category_id, visibility, is_favorite, is_pinned, 
                DATE_FORMAT(created_at, '%Y-%m-%d') as date, deleted_at
         FROM journals 
         WHERE user_id = ? AND deleted_at IS NOT NULL 
         ORDER BY deleted_at DESC`
      : `SELECT id, title, content, mood, category_id, visibility, is_favorite, is_pinned, 
                DATE_FORMAT(created_at, '%Y-%m-%d') as date
         FROM journals 
         WHERE user_id = ? AND deleted_at IS NULL 
         ORDER BY is_pinned DESC, created_at DESC`;

    const journals = await dbQuery<any>(query, [user.id]);

    // Ambil tag untuk setiap jurnal
    const entries = await Promise.all(journals.map(async (j: any) => {
      const dbTags = await dbQuery<any>(
        'SELECT tag_name FROM journal_tags WHERE journal_id = ?',
        [j.id]
      );
      return {
        ...j,
        isStarred: j.is_favorite === 1 || j.is_favorite === true,
        isPinned: j.is_pinned === 1 || j.is_pinned === true,
        tags: dbTags.map((t: any) => t.tag_name),
        entryType: j.category_id || 'reflection'
      };
    }));

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

    const body = await request.json();
    const { id, title, content, mood, category_id, visibility, is_favorite, is_pinned, tags } = body;

    if (!title || !content || !mood) {
      return NextResponse.json({ message: 'Judul, isi jurnal, dan mood wajib diisi!' }, { status: 400 });
    }

    const cleanCategoryId = category_id || 'reflection';
    const cleanVisibility = visibility || 'private';
    const cleanIsFavorite = is_favorite ? 1 : 0;
    const cleanIsPinned = is_pinned ? 1 : 0;

    let journalId = id;
    let isUpdate = false;

    if (journalId) {
      // Pastikan jurnal tersebut milik user sebelum update
      const existing = await dbQuery<any>(
        'SELECT id FROM journals WHERE id = ? AND user_id = ?',
        [journalId, user.id]
      );
      if (existing.length > 0) {
        isUpdate = true;
      }
    }

    if (isUpdate) {
      // UPDATE Jurnal
      await dbQuery(
        `UPDATE journals 
         SET title = ?, content = ?, mood = ?, category_id = ?, visibility = ?, 
             is_favorite = ?, is_pinned = ?, updated_at = CURRENT_TIMESTAMP 
         WHERE id = ? AND user_id = ?`,
        [title, content, mood, cleanCategoryId, cleanVisibility, cleanIsFavorite, cleanIsPinned, journalId, user.id]
      );

      // Reset & masukkan ulang tags
      await dbQuery('DELETE FROM journal_tags WHERE journal_id = ?', [journalId]);
      isUpdate = true;
    } else {
      // INSERT Jurnal Baru
      journalId = journalId || crypto.randomUUID();
      await dbQuery(
        `INSERT INTO journals (id, user_id, title, content, mood, category_id, visibility, is_favorite, is_pinned) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [journalId, user.id, title, content, mood, cleanCategoryId, cleanVisibility, cleanIsFavorite, cleanIsPinned]
      );
    }

    // Masukkan tag jika ada
    if (tags && Array.isArray(tags)) {
      for (const t of tags) {
        if (t && typeof t === 'string' && t.trim()) {
          await dbQuery(
            'INSERT INTO journal_tags (id, journal_id, tag_name) VALUES (?, ?, ?)',
            [crypto.randomUUID(), journalId, t.trim()]
          );
        }
      }
    } else if (tags && typeof tags === 'string') {
      const splitTags = tags.split(',').map(t => t.trim()).filter(Boolean);
      for (const t of splitTags) {
        await dbQuery(
          'INSERT INTO journal_tags (id, journal_id, tag_name) VALUES (?, ?, ?)',
          [crypto.randomUUID(), journalId, t]
        );
      }
    }

    // Catat aktivitas user
    await dbQuery(
      'INSERT INTO user_activities (user_id, activity_type, description) VALUES (?, ?, ?)',
      [user.id, isUpdate ? 'journal_updated' : 'journal_written', `${isUpdate ? 'Memperbarui' : 'Menulis'} jurnal: ${title}`]
    );

    return NextResponse.json({ 
      success: true, 
      id: journalId, 
      message: `Jurnal kamu berhasil ${isUpdate ? 'diperbarui' : 'disimpan'}!` 
    });
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
    const id = searchParams.get('id');
    const action = searchParams.get('action'); // 'restore', 'hard', atau null (soft-delete)

    if (!id) {
      return NextResponse.json({ message: 'ID jurnal wajib diisi!' }, { status: 400 });
    }

    // Cek keberadaan jurnal milik user
    const existing = await dbQuery<any>(
      'SELECT id, title FROM journals WHERE id = ? AND user_id = ?',
      [id, user.id]
    );

    if (existing.length === 0) {
      return NextResponse.json({ message: 'Jurnal tidak ditemukan atau bukan milik Anda' }, { status: 404 });
    }

    const journalTitle = existing[0].title;

    if (action === 'restore') {
      // Puluhkan jurnal dari soft-delete
      await dbQuery(
        'UPDATE journals SET deleted_at = NULL WHERE id = ? AND user_id = ?',
        [id, user.id]
      );
      await dbQuery(
        'INSERT INTO user_activities (user_id, activity_type, description) VALUES (?, ?, ?)',
        [user.id, 'journal_restored', `Memulihkan jurnal: ${journalTitle}`]
      );
      return NextResponse.json({ success: true, message: 'Jurnal berhasil dipulihkan!' });
    } else if (action === 'hard') {
      // Hard delete dari database
      await dbQuery('DELETE FROM journals WHERE id = ? AND user_id = ?', [id, user.id]);
      await dbQuery(
        'INSERT INTO user_activities (user_id, activity_type, description) VALUES (?, ?, ?)',
        [user.id, 'journal_deleted_permanent', `Menghapus permanen jurnal: ${journalTitle}`]
      );
      return NextResponse.json({ success: true, message: 'Jurnal berhasil dihapus secara permanen!' });
    } else {
      // Soft-delete (default)
      await dbQuery(
        'UPDATE journals SET deleted_at = CURRENT_TIMESTAMP WHERE id = ? AND user_id = ?',
        [id, user.id]
      );
      await dbQuery(
        'INSERT INTO user_activities (user_id, activity_type, description) VALUES (?, ?, ?)',
        [user.id, 'journal_deleted', `Menghapus jurnal (soft delete): ${journalTitle}`]
      );
      return NextResponse.json({ success: true, message: 'Jurnal berhasil dipindahkan ke tempat sampah!' });
    }
  } catch (error) {
    console.error('Error deleting journal:', error);
    return NextResponse.json({ message: 'Gagal memproses penghapusan jurnal' }, { status: 500 });
  }
}
