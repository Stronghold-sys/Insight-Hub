import { NextResponse } from 'next/server'
import { getSessionUser } from '@/lib/auth'
import { dbQuery } from '@/lib/db'
import { checkDuitkuTransactionStatus } from '@/lib/duitku'
import { processSuccessfulPayment, processExpiredPayment, processCancelledPayment, mapDuitkuResultCode, PaymentStatus } from '@/lib/paymentService'

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
      `SELECT o.id, o.plan_id as \`planId\`, o.status as \`orderStatus\`,
              o.total_amount as amount, o.user_id as \`userId\`,
              p.id as \`paymentId\`, p.status as \`paymentStatus\`,
              p.reference, p.va_number as \`vaNumber\`,
              p.payment_url as \`paymentUrl\`, p.payment_method as channel,
              p.expires_at as \`expiresAt\`,
              p.paid_at as \`paidAt\`
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
    if (orderData.orderStatus && ['pending', 'PENDING'].includes(orderData.orderStatus)) {
      try {
        const duitkuStatus = await checkDuitkuTransactionStatus(orderId)
        console.log(`[Status API] Duitku status for ${orderId}: ${duitkuStatus.statusCode}`)

        const mappedStatus = mapDuitkuResultCode(duitkuStatus.statusCode)

        if (mappedStatus === PaymentStatus.SUCCESS) {
          await processSuccessfulPayment(orderData)

          // Re-fetch status terbaru dari DB
          const updated = await dbQuery<any>(
            `SELECT o.status as \`orderStatus\`, p.status as \`paymentStatus\`,
                     p.paid_at as \`paidAt\`
             FROM orders o JOIN payments p ON o.id = p.order_id WHERE o.id = $1`,
            [orderId]
          )

          return NextResponse.json({
            success: true,
            status: (updated[0]?.orderStatus || 'SUCCESS').toLowerCase(),
            order: {
              ...orderData,
              orderStatus: updated[0]?.orderStatus || 'SUCCESS',
              paymentStatus: updated[0]?.paymentStatus || 'SUCCESS',
              paidAt: updated[0]?.paidAt,
            }
          })
        }

        if (mappedStatus === PaymentStatus.EXPIRED || mappedStatus === PaymentStatus.FAILED) {
          await processExpiredPayment(orderData)
          return NextResponse.json({
            success: true,
            status: mappedStatus.toLowerCase(),
            order: { ...orderData, orderStatus: 'EXPIRED', paymentStatus: 'EXPIRED' }
          })
        }

        if (mappedStatus === PaymentStatus.CANCELLED) {
          await processCancelledPayment(orderData)
          return NextResponse.json({
            success: true,
            status: 'cancelled',
            order: { ...orderData, orderStatus: 'CANCELLED', paymentStatus: 'CANCELLED' }
          })
        }

      } catch (err: any) {
        // Fallback ke status lokal jika Duitku tidak bisa dihubungi
        console.warn(`[Status API] Duitku status check failed for ${orderId}: ${err.message}`)
      }
    }

    return NextResponse.json({
      success: true,
      status: (orderData.orderStatus || 'PENDING').toLowerCase(),
      order: orderData
    })

  } catch (error: any) {
    console.error('[Status API] Error:', error)
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 })
  }
}
