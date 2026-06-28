import { NextResponse } from 'next/server';
import { dbQuery } from '@/lib/db';

export async function GET() {
  try {
    // Ambil data kategori, panduan, dan artikel template secara dinamis dari database global
    const categories = await dbQuery<any>('SELECT id, name, description FROM library_categories');
    const dbGuides = await dbQuery<any>('SELECT id, category_id, title, description, read_time, difficulty, tips FROM library_guides');
    const dbArticles = await dbQuery<any>(
      `SELECT id, category_id, title, slug, content as text 
       FROM library_articles 
       WHERE is_published = true`
    );

    // Format tips dari JSON string (jika diperlukan)
    const guides = dbGuides.map((g: any) => {
      let parsedTips = [];
      try {
        parsedTips = typeof g.tips === 'string' ? JSON.parse(g.tips) : (g.tips || []);
      } catch (e) {
        console.error('Error parsing tips JSON:', e);
      }
      return {
        id: g.id,
        category_id: g.category_id,
        category: g.category_id ? g.category_id.charAt(0).toUpperCase() + g.category_id.slice(1) : 'Umum',
        title: g.title,
        desc: g.description,
        readTime: g.read_time,
        difficulty: g.difficulty,
        tips: parsedTips
      };
    });

    // Pilah artikel biasa vs template chat komunikasi
    const articles = dbArticles.filter((a: any) => !a.slug.startsWith('template-'));
    const templates = dbArticles
      .filter((a: any) => a.slug.startsWith('template-'))
      .map((t: any) => {
        // Tag pemisah sederhana (misalnya dari kategori)
        return {
          id: t.slug,
          category: t.category_id ? t.category_id.charAt(0).toUpperCase() + t.category_id.slice(1) : 'Umum',
          title: t.title.replace('Template Chat: ', ''),
          text: t.text,
          tags: [t.category_id || 'relasi']
        };
      });

    return NextResponse.json({
      success: true,
      categories,
      guides,
      templates,
      articles
    });
  } catch (error: any) {
    console.error('Error fetching global library data:', error?.message || error);
    return NextResponse.json({
      success: false,
      error: 'Gagal mengambil data perpustakaan.',
      detail: process.env.NODE_ENV !== 'production' ? String(error?.message || error) : undefined
    }, { status: 500 });
  }
}
