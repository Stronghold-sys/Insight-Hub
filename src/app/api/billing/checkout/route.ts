import { NextResponse } from 'next/server'
import { getSessionUser } from '@/lib/auth'
import { dbQuery } from '@/lib/db'
import { createDuitkuInvoice } from '@/lib/duitku'
import crypto from 'crypto'

export async function POST(request: Request) {
  try {
    const user = await getSessionUser()
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json().catch(() => ({}))
    const { planId, paymentMethodCode, promoCode } = body

    // ============================================================
    // VALIDASI: Frontend HANYA boleh kirim planId, paymentMethodCode, promoCode
    // Semua harga DIHITUNG ULANG di backend dari database
    // ============================================================
    if (!planId || !paymentMethodCode) {
      return NextResponse.json(
        { success: false, error: 'Plan ID dan Payment Method wajib diisi' },
        { status: 400 }
      )
    }

    // Tolak request yang mencoba mengirim harga dari frontend (Anti-Tampering)
    const forbidden = ['price', 'total', 'subtotal', 'tax', 'discount', 'admin_fee', 'amount']
    for (const field of forbidden) {
      if (body[field] !== undefined) {
        console.warn(`[Checkout] Anti-tampering: Blocked field "${field}" dari user ${user.id}`)
        return NextResponse.json(
          { success: false, error: 'Parameter tidak valid' },
          { status: 400 }
        )
      }
    }

    // 1. Ambil harga dari database — BUKAN dari client
    // is_active tidak ada di schema pricing_plans, jadi query id saja
    const plans = await dbQuery<any>(
      'SELECT id, name, price FROM pricing_plans WHERE id = ? LIMIT 1',
      [planId]
    )
    if (plans.length === 0) {
      return NextResponse.json({ success: false, error: 'Paket tidak ditemukan' }, { status: 404 })
    }

    const plan = plans[0]
    const basePrice = parseFloat(plan.price)
    if (isNaN(basePrice) || basePrice <= 0) {
      return NextResponse.json({ success: false, error: 'Harga paket tidak valid' }, { status: 400 })
    }

    let discount = 0
    let usedPromoId: string | null = null

    // 2. Validasi promo code dari database (is_active bertipe smallint)
    if (promoCode) {
      const codes = await dbQuery<any>(
        `SELECT id, discount_pct, max_uses, used_count FROM promo_codes
         WHERE code = ? AND is_active = 1 AND (expires_at IS NULL OR expires_at > NOW())
         LIMIT 1`,
        [promoCode]
      )
      if (codes.length > 0) {
        const codeData = codes[0]
        if (codeData.max_uses === null || codeData.used_count < codeData.max_uses) {
          discount = Math.round(basePrice * (codeData.discount_pct / 100))
          usedPromoId = codeData.id
        }
      }
    }

    const adminFee = 0
    const finalAmount = Math.max(basePrice - discount + adminFee, 0)

    if (finalAmount < 1000) {
      return NextResponse.json(
        { success: false, error: 'Total pembayaran minimum Rp 1.000' },
        { status: 400 }
      )
    }

    // 3. Cegah double pending order untuk paket yang sama
    const pendingOrders = await dbQuery<any>(
      `SELECT o.id FROM orders o
       JOIN payments p ON o.id = p.order_id
       WHERE o.user_id = ? AND o.plan_id = ? AND o.status = 'pending'
         AND p.expires_at > NOW()
       LIMIT 1`,
      [user.id, planId]
    )
    if (pendingOrders.length > 0) {
      return NextResponse.json({
        success: false,
        error: 'Kamu sudah punya transaksi pending untuk paket ini. Selesaikan atau tunggu expired.',
        orderId: pendingOrders[0].id
      }, { status: 400 })
    }

    // 4. Buat Order dan Order Items
    const orderId = `ORD-${Date.now()}-${crypto.randomBytes(4).toString('hex').toUpperCase()}`
    await dbQuery(
      `INSERT INTO orders (id, user_id, plan_id, amount, discount_amount, admin_fee, total_amount, status, coupon_code, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'pending', ?, NOW())`,
      [orderId, user.id, planId, basePrice, discount, adminFee, finalAmount, promoCode || null]
    )

    await dbQuery(
      `INSERT INTO order_items (id, order_id, item_name, qty, price, created_at)
       VALUES (?, ?, ?, 1, ?, NOW())`,
      [crypto.randomUUID(), orderId, `Langganan Insight Hub — Paket ${plan.name}`, finalAmount]
    )

    // Tandai promo code terpakai (setelah order dibuat)
    if (usedPromoId) {
      await dbQuery(
        'UPDATE promo_codes SET used_count = used_count + 1 WHERE id = ?',
        [usedPromoId]
      )
    }

    // 5. Kirim request ke Duitku (URL dari env vars)
    const expiryMinutes = parseInt(process.env.DUITKU_EXPIRY_MINUTES || '5', 10)

    let duitkuResponse
    try {
      duitkuResponse = await createDuitkuInvoice({
        paymentAmount: Math.round(finalAmount),
        merchantOrderId: orderId,
        productDetails: `Aktivasi Paket ${plan.name} — Insight Hub`,
        email: user.email,
        paymentMethod: paymentMethodCode,
        customerVaName: (user.fullName || user.nickname || 'Customer').substring(0, 50),
        expiryPeriod: expiryMinutes,
        customerDetail: {
          firstName: (user.fullName || user.nickname || 'Customer').substring(0, 50),
          email: user.email,
        },
      })
    } catch (err: any) {
      // Rollback: hapus order yang dibuat tadi
      await dbQuery('DELETE FROM order_items WHERE order_id = ?', [orderId]).catch(() => {})
      await dbQuery('DELETE FROM orders WHERE id = ?', [orderId]).catch(() => {})
      if (usedPromoId) {
        await dbQuery(
          'UPDATE promo_codes SET used_count = used_count - 1 WHERE id = ?',
          [usedPromoId]
        ).catch(() => {})
      }
      console.error('[Checkout] Duitku inquiry failed:', err.message)
      return NextResponse.json(
        { success: false, error: `Gagal terhubung ke payment gateway: ${err.message}` },
        { status: 520 }
      )
    }

    // 6. Simpan Payment record
    const paymentId = crypto.randomUUID()
    const expiresAt = new Date()
    expiresAt.setMinutes(expiresAt.getMinutes() + expiryMinutes)

    await dbQuery(
      `INSERT INTO payments (id, order_id, amount, status, payment_method, payment_channel,
        reference, va_number, payment_url, expires_at, created_at)
       VALUES (?, ?, ?, 'pending', ?, ?, ?, ?, ?, ?, NOW())`,
      [
        paymentId,
        orderId,
        finalAmount,
        paymentMethodCode,
        duitkuResponse.vaNumber ? 'Virtual Account' : 'Redirect',
        duitkuResponse.reference,
        duitkuResponse.vaNumber || null,
        duitkuResponse.paymentUrl || null,
        expiresAt,
      ]
    )

    // 7. Log checkout
    await dbQuery(
      `INSERT INTO payment_logs (id, payment_id, event_type, message, payload, created_at)
       VALUES (?, ?, 'checkout_initiated', ?, ?, NOW())`,
      [
        crypto.randomUUID(),
        paymentId,
        `Checkout dibuat: Paket ${planId}, Rp ${finalAmount}, channel ${paymentMethodCode}`,
        JSON.stringify({ orderId, reference: duitkuResponse.reference, expiryMinutes }),
      ]
    )

    // 8. Status history
    await dbQuery(
      `INSERT INTO transaction_status_history (payment_id, from_status, to_status, created_at)
       VALUES (?, 'none', 'pending', NOW())`,
      [paymentId]
    )

    // 9. Log audit (audit_logs.id bertipe uuid)
    await dbQuery(
      'INSERT INTO audit_logs (id, user_id, action, details, created_at) VALUES (?, ?, ?, ?, NOW())',
      [crypto.randomUUID(), user.id, 'payment_initiated', `Order ${orderId} dibuat untuk paket ${planId}`]
    )

    return NextResponse.json({
      success: true,
      orderId,
      payment: {
        amount: finalAmount,
        vaNumber: duitkuResponse.vaNumber || null,
        paymentUrl: duitkuResponse.paymentUrl || null,
        reference: duitkuResponse.reference,
        channel: paymentMethodCode,
        expiresAt: expiresAt.toISOString(),
      },
    })
  } catch (error: any) {
    console.error('[Checkout] Internal Server Error:', error)
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 })
  }
}
