import { NextResponse } from 'next/server'
import { dbQuery } from '@/lib/db'
import { checkDuitkuTransactionStatus } from '@/lib/duitku'
import { processSuccessfulPayment, processExpiredPayment, mapDuitkuResultCode } from '@/lib/paymentService'

/**
 * Return URL Handler — Dipanggil saat user diarahkan kembali dari Duitku
 *
 * ⚠️ KEAMANAN: JANGAN pernah percaya query parameter dari URL.
 * Duitku bisa mengirim ?merchantOrderId=...&resultCode=...
 * tapi parameter ini MUDAH dipalsukan oleh user.
 *
 * Yang benar: Ambil status dari DATABASE, bukan dari URL parameter.
 *
 * Flow:
 * 1. Baca merchantOrderId dari query param (hanya sebagai identifier)
 * 2. Query status ke Duitku API langsung
 * 3. Update DB berdasarkan response Duitku
 * 4. Redirect ke halaman payment instructions yang menampilkan status DB
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)

  // Baca merchantOrderId dari URL — HANYA untuk identifikasi, bukan trust status
  const merchantOrderId = searchParams.get('merchantOrderId')
    || searchParams.get('merchant_order_id')
    || searchParams.get('orderId')

  // Jika tidak ada orderId — redirect ke langganan
  if (!merchantOrderId) {
    return NextResponse.redirect(new URL('/langganan', request.url))
  }

  try {
    // 1. Fetch order dari database — ini sumber kebenaran
    const orderRes = await dbQuery<any>(
      `SELECT o.id, o.plan_id as "planId", o.status as "orderStatus",
              o.total_amount as amount, o.user_id as "userId",
              p.id as "paymentId", p.status as "paymentStatus"
       FROM orders o
       JOIN payments p ON o.id = p.order_id
       WHERE o.id = $1
       LIMIT 1`,
      [merchantOrderId]
    )

    if (orderRes.length === 0) {
      console.warn(`[Return URL] Order tidak ditemukan: ${merchantOrderId}`)
      return NextResponse.redirect(new URL('/langganan', request.url))
    }

    const orderData = orderRes[0]

    // 2. Jika masih pending — cek status terbaru ke Duitku
    if (orderData.orderStatus === 'pending') {
      try {
        const duitkuStatus = await checkDuitkuTransactionStatus(merchantOrderId)
        const mappedStatus = mapDuitkuResultCode(duitkuStatus.statusCode)

        if (mappedStatus === 'success') {
          await processSuccessfulPayment(orderData)
        } else if (mappedStatus === 'expired' || mappedStatus === 'failed') {
          await processExpiredPayment(orderData)
        }
        // Jika 'pending' → tidak ada perubahan, redirect ke halaman tunggu
      } catch (err: any) {
        console.warn(`[Return URL] Duitku status check gagal untuk ${merchantOrderId}: ${err.message}`)
        // Tidak fatal — user tetap diarahkan ke halaman status yang akan polling DB
      }
    }

    // 3. Redirect ke halaman payment instructions (selalu ambil status dari DB)
    return NextResponse.redirect(
      new URL(`/payment/${merchantOrderId}`, request.url)
    )

  } catch (error: any) {
    console.error('[Return URL] Error:', error)
    return NextResponse.redirect(new URL('/langganan', request.url))
  }
}
