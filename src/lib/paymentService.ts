/**
 * Payment Service — Shared business logic for processing payments
 * Digunakan oleh: callback/route.ts, status/[orderId]/route.ts, return/route.ts
 *
 * Prinsip:
 * - Idempotent: aman dipanggil berkali-kali untuk order yang sama
 * - Parameter Placeholder: Gunakan "?" agar sesuai dengan convertQuery di db.ts
 */
import { dbQuery } from './db'
import crypto from 'crypto'
import { calculateExpirationDate } from './dateUtils'


export enum PaymentStatus {
  PENDING = 'PENDING',
  WAITING_PAYMENT = 'WAITING_PAYMENT',
  PROCESSING = 'PROCESSING',
  PAID = 'PAID',
  SUCCESS = 'SUCCESS',
  FAILED = 'FAILED',
  EXPIRED = 'EXPIRED',
  CANCELLED = 'CANCELLED',
  REFUNDED = 'REFUNDED',
  CHARGEBACK = 'CHARGEBACK',
  VOID = 'VOID'
}

/**
 * Aktivasi subscription, buat invoice, dan kirim notifikasi
 * setelah pembayaran dikonfirmasi berhasil (idempotent).
 */
export async function processSuccessfulPayment(order: {
  id: string
  paymentId: string
  planId: string
  userId: string
  amount: string | number
}): Promise<void> {
  // Idempotency guard — jangan proses ulang yang sudah success
  const current = await dbQuery<any>(
    'SELECT status FROM orders WHERE id = ? LIMIT 1',
    [order.id]
  )
  if (current.length > 0 && ['success', 'SUCCESS', 'paid', 'PAID'].includes(current[0].status)) {
    console.log(`[PaymentService] Order ${order.id} already processed as success. Skipping.`)
    return
  }

  const subscriptionId = crypto.randomUUID()
  const endsAt = calculateExpirationDate(new Date(), 30)


  // 1. Hapus subscription lama user
  await dbQuery('DELETE FROM subscriptions WHERE user_id::text = ?', [order.userId])

  // 2. Buat subscription baru
  await dbQuery(
    `INSERT INTO subscriptions (id, user_id, plan_id, status, starts_at, ends_at)
     VALUES (?, ?, ?, 'active', NOW(), ?)`,
    [subscriptionId, order.userId, order.planId, endsAt]
  )

  // 3. Update payment — link ke subscription
  await dbQuery(
    `UPDATE payments SET status = 'SUCCESS', paid_at = NOW(), subscription_id = ? WHERE id = ?`,
    [subscriptionId, order.paymentId]
  )

  // 4. Update order status
  await dbQuery('UPDATE orders SET status = ? WHERE id = ?', ['SUCCESS', order.id])

  // 5. Buat invoice (Simpan ke invoices dan payment_invoices untuk kompatibilitas penuh)
  // Check if invoice already exists
  const existingInv = await dbQuery<any>(
    'SELECT invoice_number FROM invoices WHERE payment_id = ? LIMIT 1',
    [order.paymentId]
  )
  let invoiceNumber = ''
  if (existingInv.length > 0) {
    invoiceNumber = existingInv[0].invoice_number || existingInv[0].invoiceNumber
  } else {
    invoiceNumber = `INV-${Date.now()}-${crypto.randomBytes(3).toString('hex').toUpperCase()}`
    const invoiceId = crypto.randomUUID()
    
    // Simpan ke invoices (dipakai oleh api/user/billing)
    await dbQuery(
      `INSERT INTO invoices (id, payment_id, invoice_number, pdf_url, created_at)
       VALUES (?, ?, ?, ?, NOW())`,
      [invoiceId, order.paymentId, invoiceNumber, `/invoices/${invoiceNumber}.pdf`]
    )

    // Simpan ke payment_invoices (sesuai spesifikasi tabel user)
    await dbQuery(
      `INSERT INTO payment_invoices (id, payment_id, invoice_number, pdf_url, created_at)
       VALUES (?, ?, ?, ?, NOW())`,
      [crypto.randomUUID(), order.paymentId, invoiceNumber, `/invoices/${invoiceNumber}.pdf`]
    )
  }

  // 6. Log status transition ke payment_history (sesuai spesifikasi tabel user)
  await dbQuery(
    `INSERT INTO payment_history (payment_id, from_status, to_status, created_at)
     VALUES (?, 'PENDING', 'SUCCESS', NOW())`,
    [order.paymentId]
  )

  // 6b. Log status transition ke payment_status_history
  await dbQuery(
    `INSERT INTO payment_status_history (payment_id, from_status, to_status, created_at)
     VALUES (?, 'PENDING', 'SUCCESS', NOW())`,
    [order.paymentId]
  )

  // 7. Log status transition ke transaction_status_history (compatibility)
  await dbQuery(
    `INSERT INTO transaction_status_history (payment_id, from_status, to_status, changed_at)
     VALUES (?, 'PENDING', 'SUCCESS', NOW())`,
    [order.paymentId]
  )

  // 8. Payment log
  await dbQuery(
    `INSERT INTO payment_logs (id, payment_id, event_type, message, payload, created_at)
     VALUES (?, ?, 'payment_success', ?, ?, NOW())`,
    [
      crypto.randomUUID(),
      order.paymentId,
      `Pembayaran sukses untuk order ${order.id}. Paket ${order.planId} aktif. Invoice: ${invoiceNumber}.`,
      JSON.stringify({ orderId: order.id, invoiceNumber })
    ]
  )

  // 9. Audit log
  await dbQuery(
    'INSERT INTO audit_logs (id, user_id, action, details, created_at) VALUES (?, ?, ?, ?, NOW())',
    [
      crypto.randomUUID(),
      order.userId,
      'subscription_upgrade',
      JSON.stringify({ planId: order.planId, orderId: order.id, invoiceNumber })
    ]
  )

  const friendlyPlan = (order.planId || '').toUpperCase() === 'BASIC' ? 'Basic' : (order.planId || '').toUpperCase() === 'COUPLE' ? 'Couple Plan' : 'Premium'
  const successMessage = `Selamat! Paket ${friendlyPlan} kamu sudah aktif selama 30 hari. No. Invoice: ${invoiceNumber}.`

  // 10. Notifikasi ke user (payment_notifications - sesuai spesifikasi tabel user)
  await dbQuery(
    `INSERT INTO payment_notifications (id, user_id, payment_id, title, message, is_read, created_at)
     VALUES (?, ?, ?, ?, ?, 0, NOW())`,
    [
      crypto.randomUUID(),
      order.userId,
      order.paymentId,
      'Pembayaran Berhasil! 🎉',
      successMessage
    ]
  )

  // Tambahkan juga ke tabel notifications (compatibility)
  await dbQuery(
    `INSERT INTO notifications (id, user_id, title, message, is_read, priority, created_at)
     VALUES (?, ?, ?, ?, false, ?, NOW())`,
    [
      crypto.randomUUID(),
      order.userId,
      'Pembayaran Berhasil! 🎉',
      successMessage,
      'high'
    ]
  )

  console.log(`[PaymentService] Order ${order.id} processed successfully. Subscription: ${subscriptionId}`)
}

/**
 * Tandai order sebagai expired/failed (idempotent).
 */
export async function processExpiredPayment(order: {
  id: string
  paymentId: string
}): Promise<void> {
  const current = await dbQuery<any>(
    'SELECT status FROM orders WHERE id = ? LIMIT 1',
    [order.id]
  )
  if (current.length > 0 && ['expired', 'EXPIRED', 'failed', 'FAILED', 'cancelled', 'CANCELLED'].includes(current[0].status)) {
    console.log(`[PaymentService] Order ${order.id} already in terminal state: ${current[0].status}. Skipping.`)
    return
  }

  const fromStatus = current[0]?.status || 'PENDING'

  await dbQuery('UPDATE orders SET status = ? WHERE id = ?', ['EXPIRED', order.id])
  await dbQuery('UPDATE payments SET status = ? WHERE id = ?', ['EXPIRED', order.paymentId])

  await dbQuery(
    `INSERT INTO payment_history (payment_id, from_status, to_status, created_at)
     VALUES (?, ?, 'EXPIRED', NOW())`,
    [order.paymentId, fromStatus]
  )

  await dbQuery(
    `INSERT INTO payment_status_history (payment_id, from_status, to_status, created_at)
     VALUES (?, ?, 'EXPIRED', NOW())`,
    [order.paymentId, fromStatus]
  )

  await dbQuery(
    `INSERT INTO transaction_status_history (payment_id, from_status, to_status, changed_at)
     VALUES (?, ?, 'EXPIRED', NOW())`,
    [order.paymentId, fromStatus]
  )

  await dbQuery(
    `INSERT INTO payment_logs (id, payment_id, event_type, message, created_at)
     VALUES (?, ?, 'payment_expired', ?, NOW())`,
    [
      crypto.randomUUID(),
      order.paymentId,
      `Batas waktu pembayaran untuk order ${order.id} telah habis (expired).`
    ]
  )

  console.log(`[PaymentService] Order ${order.id} marked as expired.`)
}

/**
 * Tandai order sebagai cancelled (idempotent).
 */
export async function processCancelledPayment(order: {
  id: string
  paymentId: string
}): Promise<void> {
  const current = await dbQuery<any>(
    'SELECT status FROM orders WHERE id = ? LIMIT 1',
    [order.id]
  )
  if (current.length > 0 && ['expired', 'EXPIRED', 'failed', 'FAILED', 'cancelled', 'CANCELLED', 'success', 'SUCCESS', 'paid', 'PAID'].includes(current[0].status)) {
    return
  }

  const fromStatus = current[0]?.status || 'PENDING'

  await dbQuery('UPDATE orders SET status = ? WHERE id = ?', ['CANCELLED', order.id])
  await dbQuery('UPDATE payments SET status = ? WHERE id = ?', ['CANCELLED', order.paymentId])

  await dbQuery(
    `INSERT INTO payment_history (payment_id, from_status, to_status, created_at)
     VALUES (?, ?, 'CANCELLED', NOW())`,
    [order.paymentId, fromStatus]
  )

  await dbQuery(
    `INSERT INTO payment_status_history (payment_id, from_status, to_status, created_at)
     VALUES (?, ?, 'CANCELLED', NOW())`,
    [order.paymentId, fromStatus]
  )

  await dbQuery(
    `INSERT INTO transaction_status_history (payment_id, from_status, to_status, changed_at)
     VALUES (?, ?, 'CANCELLED', NOW())`,
    [order.paymentId, fromStatus]
  )

  await dbQuery(
    `INSERT INTO payment_logs (id, payment_id, event_type, message, created_at)
     VALUES (?, ?, 'payment_cancelled', ?, NOW())`,
    [
      crypto.randomUUID(),
      order.paymentId,
      `Order ${order.id} dibatalkan.`
    ]
  )
}

/**
 * Tandai order sebagai refunded (idempotent).
 */
export async function processRefundedPayment(order: {
  id: string
  paymentId: string
  userId: string
}): Promise<void> {
  const current = await dbQuery<any>(
    'SELECT status FROM orders WHERE id = ? LIMIT 1',
    [order.id]
  )
  if (current.length > 0 && ['refunded', 'REFUNDED'].includes(current[0].status)) {
    return
  }

  const fromStatus = current[0]?.status || 'SUCCESS'

  await dbQuery('UPDATE orders SET status = ? WHERE id = ?', ['REFUNDED', order.id])
  await dbQuery('UPDATE payments SET status = ? WHERE id = ?', ['REFUNDED', order.paymentId])

  await dbQuery(
    `INSERT INTO payment_history (payment_id, from_status, to_status, created_at)
     VALUES (?, ?, 'REFUNDED', NOW())`,
    [order.paymentId, fromStatus]
  )

  await dbQuery(
    `INSERT INTO payment_status_history (payment_id, from_status, to_status, created_at)
     VALUES (?, ?, 'REFUNDED', NOW())`,
    [order.paymentId, fromStatus]
  )

  await dbQuery(
    `INSERT INTO transaction_status_history (payment_id, from_status, to_status, changed_at)
     VALUES (?, ?, 'REFUNDED', NOW())`,
    [order.paymentId, fromStatus]
  )

  await dbQuery(
    'INSERT INTO audit_logs (id, user_id, action, details, created_at) VALUES (?, ?, ?, ?, NOW())',
    [crypto.randomUUID(), order.userId, 'payment_refunded', `Order ${order.id} telah di-refund.`]
  )

  await dbQuery(
    `INSERT INTO payment_logs (id, payment_id, event_type, message, created_at)
     VALUES (?, ?, 'payment_refunded', ?, NOW())`,
    [crypto.randomUUID(), order.paymentId, `Pembayaran untuk order ${order.id} telah direfund.`]
  )
}

/**
 * Tandai order sebagai chargeback (idempotent).
 */
export async function processChargebackPayment(order: {
  id: string
  paymentId: string
  userId: string
}): Promise<void> {
  const current = await dbQuery<any>(
    'SELECT status FROM orders WHERE id = ? LIMIT 1',
    [order.id]
  )
  if (current.length > 0 && ['chargeback', 'CHARGEBACK'].includes(current[0].status)) {
    return
  }

  const fromStatus = current[0]?.status || 'SUCCESS'

  await dbQuery('UPDATE orders SET status = ? WHERE id = ?', ['CHARGEBACK', order.id])
  await dbQuery('UPDATE payments SET status = ? WHERE id = ?', ['CHARGEBACK', order.paymentId])

  // Nonaktifkan subscription karena chargeback
  await dbQuery("UPDATE subscriptions SET status = 'expired' WHERE user_id::text = ?", [order.userId])

  await dbQuery(
    `INSERT INTO payment_history (payment_id, from_status, to_status, created_at)
     VALUES (?, ?, 'CHARGEBACK', NOW())`,
    [order.paymentId, fromStatus]
  )

  await dbQuery(
    `INSERT INTO payment_status_history (payment_id, from_status, to_status, created_at)
     VALUES (?, ?, 'CHARGEBACK', NOW())`,
    [order.paymentId, fromStatus]
  )

  await dbQuery(
    `INSERT INTO transaction_status_history (payment_id, from_status, to_status, changed_at)
     VALUES (?, ?, 'CHARGEBACK', NOW())`,
    [order.paymentId, fromStatus]
  )

  await dbQuery(
    'INSERT INTO audit_logs (id, user_id, action, details, created_at) VALUES (?, ?, ?, ?, NOW())',
    [crypto.randomUUID(), order.userId, 'payment_chargeback', `Order ${order.id} mengalami chargeback. Subscription dinonaktifkan.`]
  )
}

/**
 * Map Duitku resultCode ke status internal
 */
export function mapDuitkuResultCode(resultCode: string): PaymentStatus {
  switch (resultCode) {
    case '00': return PaymentStatus.SUCCESS
    case '01': return PaymentStatus.PENDING
    case '02': return PaymentStatus.EXPIRED
    default:   return PaymentStatus.FAILED
  }
}

