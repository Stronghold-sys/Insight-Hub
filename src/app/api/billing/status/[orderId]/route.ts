import { NextResponse } from 'next/server'
import { getSessionUser } from '@/lib/auth'
import { dbQuery } from '@/lib/db'
import { checkDuitkuTransactionStatus } from '@/lib/duitku'
import { processSuccessfulPayment, processExpiredPayment, mapDuitkuResultCode } from '@/lib/paymentService'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ orderId: string }> }
) {
  try {
    const user = await getSessionUser()
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const { orderId } = await params

    // 1. Fetch order + payment dari database (PostgreSQL syntax)
    const orderRes = await dbQuery<any>(
      `SELECT o.id, o.plan_id as "planId", o.status as "orderStatus",
              o.total_amount as amount, o.user_id as "userId",
              p.id as "paymentId", p.status as "paymentStatus",
              p.reference, p.va_number as "vaNumber",
              p.payment_url as "paymentUrl", p.payment_method as channel,
              TO_CHAR(p.expires_at, 'YYYY-MM-DD HH24:MI:SS') as "expiresAt",
              TO_CHAR(p.paid_at, 'YYYY-MM-DD HH24:MI:SS') as "paidAt"
       FROM orders o
       JOIN payments p ON o.id = p.order_id
       WHERE o.id = $1 AND o.user_id = $2
       LIMIT 1`,
      [orderId, user.id]
    )

    if (orderRes.length === 0) {
      return NextResponse.json({ success: false, error: 'Order tidak ditemukan' }, { status: 404 })
    }

    const orderData = orderRes[0]

    // 2. Jika pending — query status terbaru dari Duitku
    if (orderData.orderStatus === 'pending') {
      try {
        const duitkuStatus = await checkDuitkuTransactionStatus(orderId)
        console.log(`[Status API] Duitku status for ${orderId}: ${duitkuStatus.statusCode}`)

        const mappedStatus = mapDuitkuResultCode(duitkuStatus.statusCode)

        if (mappedStatus === 'success') {
          await processSuccessfulPayment(orderData)

          // Re-fetch status terbaru dari DB
          const updated = await dbQuery<any>(
            `SELECT o.status as "orderStatus", p.status as "paymentStatus",
                    TO_CHAR(p.paid_at, 'YYYY-MM-DD HH24:MI:SS') as "paidAt"
             FROM orders o JOIN payments p ON o.id = p.order_id WHERE o.id = $1`,
            [orderId]
          )

          return NextResponse.json({
            success: true,
            status: 'success',
            order: {
              ...orderData,
              orderStatus: updated[0]?.orderStatus || 'success',
              paymentStatus: updated[0]?.paymentStatus || 'success',
              paidAt: updated[0]?.paidAt,
            }
          })
        }

        if (mappedStatus === 'expired' || mappedStatus === 'failed') {
          await processExpiredPayment(orderData)
          return NextResponse.json({
            success: true,
            status: mappedStatus,
            order: { ...orderData, orderStatus: mappedStatus, paymentStatus: mappedStatus }
          })
        }

      } catch (err: any) {
        // Fallback ke status lokal jika Duitku tidak bisa dihubungi
        console.warn(`[Status API] Duitku status check failed for ${orderId}: ${err.message}`)
      }
    }

    return NextResponse.json({
      success: true,
      status: orderData.orderStatus,
      order: orderData
    })

  } catch (error: any) {
    console.error('[Status API] Error:', error)
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 })
  }
}
