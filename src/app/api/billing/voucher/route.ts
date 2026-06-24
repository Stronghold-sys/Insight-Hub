import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import { dbQuery } from '@/lib/db';

export async function GET(request: Request) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');

    if (!code) {
      return NextResponse.json({ success: false, error: 'Voucher code is required' }, { status: 400 });
    }

    const formattedCode = code.trim().toUpperCase();

    // Query database for active, unexpired promo code
    const codes = await dbQuery<any>(
      `SELECT id, code, discount_pct, max_uses, used_count 
       FROM promo_codes 
       WHERE code = ? AND is_active = 1 AND (expires_at IS NULL OR expires_at > NOW())`,
      [formattedCode]
    );

    if (codes.length === 0) {
      return NextResponse.json({ 
        success: false, 
        error: 'Kode promo-nya belum cocok, coba cek lagi ya.' 
      });
    }

    const codeData = codes[0];
    
    // Check usage limits
    if (codeData.max_uses !== null && codeData.used_count >= codeData.max_uses) {
      return NextResponse.json({ 
        success: false, 
        error: 'Waduh, kuota voucher ini sudah habis terpakai!' 
      });
    }

    return NextResponse.json({
      success: true,
      discountPct: codeData.discount_pct,
      message: 'Yeay, voucher-nya kepake!'
    });
  } catch (error) {
    console.error('[Voucher API] Error validating promo code:', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}
