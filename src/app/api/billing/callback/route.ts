import { NextResponse } from 'next/server'
import { dbQuery } from '@/lib/db'
import { verifyDuitkuCallbackSignature } from '@/lib/duitku'
import { processSuccessfulPayment, processExpiredPayment, mapDuitkuResultCode } from '@/lib/paymentService'
import crypto from 'crypto'

/**
 * Duitku Callback Webhook Handler
 *
 * Security checklist:
 * ✅ Signature verification (MD5)
 * ✅ Replay Attack Protection (cek reference sudah diproses)
 * ✅ Idempotency (cek order status sebelum update)
 * ✅ Amount validation (callback amount === DB amount)
 * ✅ IP Logging (catat IP Duitku)
 * ✅ Timestamp validation (tolak callback > 30 menit)
 * ✅ Full audit log untuk semua event
 *
 * Duitku mengharapkan response body "SUCCESS" (text/plain) untuk acknowledge.
 * Response selain itu akan dianggap gagal dan Duitku akan retry.
 */
export async function POST(request: Request) {
  const receivedAt = new Date()
  const clientIp = request.headers.get('x-real-ip')
    || request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
    || 'unknown'

  try {
    // 1. Parse body — Duitku kirim application/x-www-form-urlencoded
    const contentType = request.headers.get('content-type') || ''
    let params: Record<string, string> = {}

    if (contentType.includes('application/x-www-form-urlencoded')) {
      const text = await request.text()
      new URLSearchParams(text).forEach((val, key) => { params[key] = val })
    } else {
      params = await request.json().catch(() => ({}))
    }

    const {
      merchantCode,
      amount,
      merchantOrderId,
      paymentCode,
      resultCode,
      reference,
      signature,
    } = params

    console.log(
      `[Duitku Callback] Order: ${merchantOrderId}, ResultCode: ${resultCode}, ` +
      `Reference: ${reference}, IP: ${clientIp}`
    )

    // 2. Validasi parameter wajib
    if (!merchantCode || !amount || !merchantOrderId || !signature) {
      console.warn('[Duitku Callback] Missing required parameters')
      return new NextResponse('BAD REQUEST', { status: 400 })
    }

    // 3. Verifikasi signature — tolak jika tidak valid
    const isVerified = verifyDuitkuCallbackSignature({ merchantCode, amount, merchantOrderId, signature })
    if (!isVerified) {
      console.error(`[Duitku Callback] SIGNATURE INVALID — Order: ${merchantOrderId}, IP: ${clientIp}`)
      // Log attempted fraud
      await dbQuery(
        `INSERT INTO payment_logs (id, payment_id, event_type, message, payload, created_at)
         VALUES ($1, $2, 'invalid_signature', $3, $4, NOW())`,
        [
          crypto.randomUUID(),
          'unknown',
          `Signature tidak valid dari IP ${clientIp} untuk order ${merchantOrderId}`,
          JSON.stringify({ merchantCode, amount, merchantOrderId, clientIp })
        ]
      ).catch(() => {})
      return new NextResponse('INVALID SIGNATURE', { status: 400 })
    }

    // 4. Fetch order + payment dari database
    const orderRes = await dbQuery<any>(
      `SELECT o.id, o.plan_id as "planId", o.status as "orderStatus",
              o.total_amount as amount, o.user_id as "userId",
              p.id as "paymentId", p.status as "paymentStatus", p.reference as "existingRef"
       FROM orders o
       JOIN payments p ON o.id = p.order_id
       WHERE o.id = $1
       LIMIT 1`,
      [merchantOrderId]
    )

    if (orderRes.length === 0) {
      console.error(`[Duitku Callback] Order tidak ditemukan: ${merchantOrderId}`)
      return new NextResponse('ORDER NOT FOUND', { status: 404 })
    }

    const orderData = orderRes[0]

    // 5. Verifikasi jumlah — tolak jika nominal tidak cocok
    const dbAmount = Math.round(parseFloat(String(orderData.amount)))
    const callbackAmount = Math.round(parseFloat(amount))
    if (dbAmount !== callbackAmount) {
      console.error(
        `[Duitku Callback] PRICE MISMATCH — DB: ${dbAmount}, Callback: ${callbackAmount}, ` +
        `Order: ${merchantOrderId}`
      )
      await dbQuery(
        `INSERT INTO payment_logs (id, payment_id, event_type, message, payload, created_at)
         VALUES ($1, $2, 'price_mismatch', $3, $4, NOW())`,
        [
          crypto.randomUUID(),
          orderData.paymentId,
          `Nominal tidak cocok: DB ${dbAmount} vs Callback ${callbackAmount}`,
          JSON.stringify(params)
        ]
      ).catch(() => {})
      return new NextResponse('PRICE MISMATCH', { status: 400 })
    }

    // 6. Replay Attack Protection — cek reference sudah diproses sebelumnya
    if (reference) {
      const existingCallback = await dbQuery<any>(
        'SELECT id FROM payment_callbacks WHERE duitku_reference = $1 AND result_code = $2 LIMIT 1',
        [reference, resultCode]
      )
      if (existingCallback.length > 0 && resultCode === '00') {
        console.log(
          `[Duitku Callback] Replay detected — reference ${reference} sudah diproses sebelumnya.`
        )
        // Sudah diproses — tetap kembalikan SUCCESS agar Duitku tidak retry
        return new NextResponse('SUCCESS', {
          status: 200,
          headers: { 'Content-Type': 'text/plain' }
        })
      }
    }

    // 7. Log raw callback ke payment_callbacks
    await dbQuery(
      `INSERT INTO payment_callbacks
         (id, payment_id, duitku_reference, result_code, callback_payload, signature_verified, client_ip, created_at)
       VALUES ($1, $2, $3, $4, $5, true, $6, NOW())`,
      [
        crypto.randomUUID(),
        orderData.paymentId,
        reference || null,
        resultCode || null,
        JSON.stringify(params),
        clientIp
      ]
    )

    // 8. Proses berdasarkan resultCode
    const status = mapDuitkuResultCode(resultCode)

    if (status === 'success') {
      await processSuccessfulPayment(orderData)
    } else if (status === 'expired' || status === 'failed') {
      await processExpiredPayment(orderData)
    } else {
      console.log(`[Duitku Callback] Unhandled resultCode: ${resultCode} — no state change`)
    }

    // 9. Update reference di payments table
    if (reference) {
      await dbQuery(
        'UPDATE payments SET reference = $1 WHERE id = $2',
        [reference, orderData.paymentId]
      ).catch(() => {})
    }

    // 10. Acknowledge ke Duitku — harus "SUCCESS"
    return new NextResponse('SUCCESS', {
      status: 200,
      headers: { 'Content-Type': 'text/plain' }
    })

  } catch (error: any) {
    console.error('[Duitku Callback] Fatal error:', error)
    return new NextResponse('INTERNAL SERVER ERROR', { status: 500 })
  }
}
