import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import { dbQuery } from '@/lib/db';

export async function GET() {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    // Ambil bookmarks milik user
    const dbBookmarks = await dbQuery<any>(
      'SELECT item_type, item_id, DATE_FORMAT(created_at, "%Y-%m-%d") as date FROM user_bookmarks WHERE user_id = ? ORDER BY created_at DESC',
      [user.id]
    );

    // Ambil detail artikel dari DB untuk melengkapi bookmark bertipe article
    const articles = await dbQuery<any>('SELECT id, title, slug FROM articles');
    const articleMap = new Map(articles.map((a: any) => [a.id, a]));

    const bookmarks = dbBookmarks.map((b: any) => {
      if (b.item_type === 'article') {
        const art = articleMap.get(b.item_id);
        return {
          id: b.item_id,
          title: art?.title || 'Artikel Edukasi',
          type: 'article',
          path: `/blog/${art?.slug || ''}`
        };
      } else if (b.item_type === 'guide') {
        const guideTitles: Record<string, string> = {
          'g1': 'Cara Minta Maaf yang Beneran (Tanpa "Tapi")',
          'g2': 'Set Boundaries Tanpa Terasa Jahat',
          'g3': 'Keluar dari Loop Silent Treatment',
          'g4': 'Cara Dengerin yang Beneran (Active Listening)',
          'g5': 'Cara Ekspresikan Perasaan Tanpa Menyalahkan',
          'g6': 'Deteksi Red Flag vs Deal Breaker'
        };
        return {
          id: b.item_id,
          title: guideTitles[b.item_id] || 'Panduan Edukasi',
          type: 'guide',
          path: '/library'
        };
      } else {
        // Fallback untuk tipe template static
        const templateTitles: Record<string, string> = {
          '1': 'Template Chat: Menyesal Setelah Berkata Kasar',
          '2': 'Template Chat: Membuat Batasan (Boundary)',
          '3': 'Template Chat: Membahas Chat Telat Kabar'
        };
        return {
          id: b.item_id,
          title: templateTitles[b.item_id] || 'Template Komunikasi',
          type: 'template',
          path: '/library'
        };
      }
    });

    return NextResponse.json({ success: true, bookmarks });
  } catch (error) {
    console.error('Error fetching user bookmarks:', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { itemType, itemId, action } = await req.json();

    if (!itemType || !itemId) {
      return NextResponse.json({ success: false, error: 'Tipe dan ID item wajib diisi' }, { status: 400 });
    }

    // Periksa apakah bookmark sudah ada
    const existing = await dbQuery(
      'SELECT * FROM user_bookmarks WHERE user_id = ? AND item_type = ? AND item_id = ?',
      [user.id, itemType, itemId]
    );

    if (action === 'remove' || (action === undefined && existing.length > 0)) {
      // Hapus bookmark
      await dbQuery(
        'DELETE FROM user_bookmarks WHERE user_id = ? AND item_type = ? AND item_id = ?',
        [user.id, itemType, itemId]
      );
      return NextResponse.json({ success: true, action: 'removed' });
    } else {
      // Tambahkan bookmark (jika belum ada)
      if (existing.length === 0) {
        await dbQuery(
          'INSERT INTO user_bookmarks (user_id, item_type, item_id) VALUES (?, ?, ?)',
          [user.id, itemType, itemId]
        );
      }
      return NextResponse.json({ success: true, action: 'added' });
    }
  } catch (error) {
    console.error('Error saving user bookmark:', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}
