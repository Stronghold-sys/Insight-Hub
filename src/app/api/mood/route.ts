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

    // Ambil data mood 30 hari terakhir
    const sql = `
      SELECT id, mood, energy, stress, note, DATE_FORMAT(date, '%Y-%m-%d') as date
      FROM mood_entries
      WHERE user_id = ?
      ORDER BY date ASC
      LIMIT 30
    `;
    const data = await dbQuery<any>(sql, [user.id]);
    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('Error fetching mood:', error);
    return NextResponse.json({ message: 'Gagal mengambil data mood' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ message: 'Harus login dulu ya' }, { status: 401 });
    }

    const { mood, energy, stress, note, date } = await request.json();

    if (!mood) {
      return NextResponse.json({ message: 'Mood-nya harus dipilih ya' }, { status: 400 });
    }

    const entryId = crypto.randomUUID();
    const entryDate = date || new Date().toISOString().split('T')[0];

    // Cek apakah sudah ada mood untuk tanggal tersebut
    const existing = await dbQuery('SELECT id FROM mood_entries WHERE user_id = ? AND date = ?', [user.id, entryDate]);
    
    if (existing.length > 0) {
      // Update saja
      await dbQuery(
        'UPDATE mood_entries SET mood = ?, energy = ?, stress = ?, note = ? WHERE user_id = ? AND date = ?',
        [mood, energy || 5, stress || 5, note || '', user.id, entryDate]
      );
    } else {
      // Insert baru
      await dbQuery(
        'INSERT INTO mood_entries (id, user_id, mood, energy, stress, note, date) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [entryId, user.id, mood, energy || 5, stress || 5, note || '', entryDate]
      );
    }

    // Catat aktivitas user
    await dbQuery(
      'INSERT INTO user_activities (user_id, activity_type, description) VALUES (?, ?, ?)',
      [user.id, 'mood_tracked', `Mencatat mood harian: ${mood}`]
    );

    return NextResponse.json({ success: true, message: 'Mood kamu berhasil disimpan!' });
  } catch (error) {
    console.error('Error saving mood:', error);
    return NextResponse.json({ message: 'Gagal menyimpan mood' }, { status: 500 });
  }
}
