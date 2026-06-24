import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import { dbQuery } from '@/lib/db';
import crypto from 'crypto';

// Safe query wrapper
async function safeQuery<T>(query: string, params: any[] = [], fallback: T): Promise<T> {
  try {
    const result = await dbQuery<any>(query, params);
    return result as T;
  } catch {
    return fallback;
  }
}

// GET /api/admin/billing
export async function GET(request: Request) {
  try {
    const user = await getSessionUser();
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ message: 'Akses ditolak!' }, { status: 403 });
    }

    // Plan subscriber counts
    const planCountsRaw = await safeQuery(
      `SELECT plan_id, COUNT(*) as cnt FROM subscriptions WHERE status = 'active' GROUP BY plan_id`,
      [], []
    ) as any[];

    const planCounts: Record<string, number> = {};
    planCountsRaw.forEach((p: any) => { planCounts[p.plan_id] = p.cnt; });

    // Summary stats
    const [totalPaidRes, mrrRes, promoActiveRes, totalUsers] = await Promise.all([
      safeQuery(`SELECT COUNT(*) as count FROM subscriptions WHERE plan_id != 'free' AND status = 'active'`, [], [{ count: 0 }]),
      safeQuery(`SELECT COALESCE(SUM(pp.price), 0) as mrr FROM subscriptions s JOIN pricing_plans pp ON s.plan_id = pp.id WHERE s.status = 'active' AND s.plan_id != 'free'`, [], [{ mrr: 0 }]),
      safeQuery(`SELECT COUNT(*) as count FROM promo_codes WHERE is_active = 1`, [], [{ count: 0 }]),
      safeQuery('SELECT COUNT(*) as count FROM users', [], [{ count: 1 }]),
    ]) as any[];

    const totalUsersCount = (totalUsers as any[])[0]?.count || 1;
    const paidCount = (totalPaidRes as any[])[0]?.count || 0;
    const conversionRate = Math.round((paidCount / totalUsersCount) * 100);

    // Latest subscriptions
    const latestSubscriptions = await safeQuery(
      `SELECT s.id, s.plan_id as planId, s.status,
              DATE_FORMAT(s.starts_at, '%Y-%m-%d') as startDate,
              DATE_FORMAT(s.ends_at, '%Y-%m-%d') as endDate,
              u.email
       FROM subscriptions s
       JOIN users u ON s.user_id = u.id
       ORDER BY s.starts_at DESC
       LIMIT 20`,
      [], []
    );

    // Promo codes
    const promoCodes = await safeQuery(
      `SELECT code, discount_pct as discountPercent,
              COALESCE(max_uses, 0) as maxUses, COALESCE(used_count, 0) as usedCount,
              is_active as isActive, DATE_FORMAT(expires_at, '%Y-%m-%d') as expiresAt
       FROM promo_codes
       ORDER BY created_at DESC`,
      [], []
    );

    // Pricing plans
    const plans = await safeQuery('SELECT * FROM pricing_plans ORDER BY price ASC', [], []);

    return NextResponse.json({
      success: true,
      stats: {
        totalPaidUsers: paidCount,
        mrr: (mrrRes as any[])[0]?.mrr || 0,
        activePromos: (promoActiveRes as any[])[0]?.count || 0,
        conversionRate,
      },
      planCounts,
      latestSubscriptions,
      promoCodes,
      plans,
    });
  } catch (error) {
    console.error('Error in admin billing API:', error);
    return NextResponse.json({ message: 'Internal Server Error', error: String(error) }, { status: 500 });
  }
}

// POST /api/admin/billing - Create promo code, etc.
export async function POST(request: Request) {
  try {
    const user = await getSessionUser();
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ message: 'Akses ditolak!' }, { status: 403 });
    }

    const body = await request.json();
    const { action } = body;

    if (action === 'create_promo') {
      const { code, discount, maxUses, expiresAt } = body;
      if (!code || !discount) {
        return NextResponse.json({ message: 'Kode dan diskon wajib diisi.' }, { status: 400 });
      }

      const id = crypto.randomUUID();
      await dbQuery(
        `INSERT INTO promo_codes (id, code, discount_pct, max_uses, is_active, expires_at) VALUES (?, ?, ?, ?, 1, ?)`,
        [id, code.toUpperCase(), parseInt(discount), maxUses ? parseInt(maxUses) : null, expiresAt || null]
      );

      // Log action
      await safeQuery(
        `INSERT INTO audit_logs (user_id, action, details) VALUES (?, 'promo_created', ?)`,
        [user.id, `Admin membuat kode promo: ${code.toUpperCase()} (${discount}% off)`],
        null
      );

      return NextResponse.json({ success: true, message: 'Promo berhasil dibuat.' });
    }

    if (action === 'deactivate_promo') {
      const { code } = body;
      await dbQuery(`UPDATE promo_codes SET is_active = 0 WHERE code = ?`, [code]);
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ message: 'Action tidak dikenali.' }, { status: 400 });
  } catch (error) {
    console.error('Error in admin billing POST API:', error);
    return NextResponse.json({ message: 'Internal Server Error', error: String(error) }, { status: 500 });
  }
}
