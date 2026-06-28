/**
 * Duitku Payment Gateway — Core Library
 *
 * Dokumentasi resmi: https://docs.duitku.com
 *
 * KEAMANAN:
 * - Semua credentials dibaca dari environment variables
 * - Tidak ada hardcoded API key, merchant code, atau URL
 * - Fail-fast jika env vars tidak dikonfigurasi
 */
import crypto from 'crypto'

// ============================================================
// Configuration — Fail-fast jika env vars tidak dikonfigurasi
// ============================================================
function getRequiredEnv(key: string): string {
  const val = process.env[key]
  if (!val || val.trim() === '') {
    throw new Error(
      `[Duitku] Environment variable "${key}" tidak dikonfigurasi. ` +
      `Set di .env (local) dan Cloudflare Pages Dashboard (production).`
    )
  }
  return val.trim()
}

function getConfig() {
  const merchantCode = getRequiredEnv('DUITKU_MERCHANT_CODE')
  const merchantKey  = getRequiredEnv('DUITKU_MERCHANT_KEY')
  const isSandbox    = (process.env.DUITKU_IS_SANDBOX || 'false').toLowerCase() === 'true'
  const callbackUrl  = process.env.DUITKU_CALLBACK_URL || ''
  const returnUrl    = process.env.DUITKU_RETURN_URL || ''
  const expiryMinutes = parseInt(process.env.DUITKU_EXPIRY_MINUTES || '1440', 10)

  const baseUrl = isSandbox
    ? 'https://sandbox.duitku.com/webapi/api/merchant'
    : 'https://passport.duitku.com/webapi/api/merchant'

  return { merchantCode, merchantKey, isSandbox, callbackUrl, returnUrl, expiryMinutes, baseUrl }
}

// ============================================================
// Types
// ============================================================
export interface DuitkuPaymentMethod {
  name: string
  paymentMethod: string
  paymentImage: string
  totalFee?: number
}

export interface DuitkuTransactionRequest {
  paymentAmount: number
  merchantOrderId: string
  productDetails: string
  email: string
  paymentMethod: string
  customerVaName: string
  /** Override callback URL — defaults to DUITKU_CALLBACK_URL env var */
  callbackUrl?: string
  /** Override return URL — defaults to DUITKU_RETURN_URL env var */
  returnUrl?: string
  expiryPeriod?: number
  customerDetail?: {
    firstName: string
    lastName?: string
    email: string
    phoneNumber?: string
  }
}

export interface DuitkuTransactionResponse {
  merchantCode: string
  reference: string
  paymentUrl: string
  vaNumber?: string
  statusCode: string
  statusMessage: string
}

export interface DuitkuStatusResponse {
  merchantOrderId: string
  reference: string
  amount: string
  statusCode: string
  statusMessage: string
}

// ============================================================
// Internal HTTP helper with timeout + retry
// ============================================================
async function duitkuFetch(
  url: string,
  payload: object,
  timeoutMs = 15000,
  maxRetries = 2
): Promise<any> {
  let lastError: Error | null = null

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), timeoutMs)

    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        signal: controller.signal,
      })

      if (!res.ok) {
        const errText = await res.text().catch(() => '(no body)')
        throw new Error(`HTTP ${res.status}: ${errText.substring(0, 300)}`)
      }

      return await res.json()
    } catch (err: any) {
      lastError = err
      console.warn(`[Duitku] Attempt ${attempt}/${maxRetries} failed: ${err.message}`)
      if (attempt < maxRetries) {
        await new Promise(r => setTimeout(r, 1000 * attempt)) // backoff
      }
    } finally {
      clearTimeout(timer)
    }
  }

  throw lastError || new Error('[Duitku] All retry attempts failed')
}

// ============================================================
// Public API: Get Payment Methods
// ============================================================
/**
 * Ambil daftar metode pembayaran yang aktif untuk merchant.
 * Selalu dari Duitku API — tidak ada fallback statis.
 */
export async function getDuitkuPaymentMethods(amount: number): Promise<DuitkuPaymentMethod[]> {
  const cfg = getConfig()

  const datetime = new Date()
    .toISOString()
    .replace('T', ' ')
    .replace(/\..+/, '') // "YYYY-MM-DD HH:mm:ss"

  // Signature: SHA256(merchantCode + amount + datetime + merchantKey)
  const sigSource = cfg.merchantCode + amount.toString() + datetime + cfg.merchantKey
  const signature = crypto.createHash('sha256').update(sigSource).digest('hex')

  const endpoint = `${cfg.baseUrl}/paymentmethod/getpaymentmethod`
  const payload = {
    merchantcode: cfg.merchantCode,
    amount,
    datetime,
    signature,
  }

  console.log(`[Duitku] Fetching payment methods (sandbox=${cfg.isSandbox}, amount=${amount})`)

  const data = await duitkuFetch(endpoint, payload)

  if (!data || !Array.isArray(data.paymentFee)) {
    console.warn('[Duitku] Unexpected payment methods response:', JSON.stringify(data).substring(0, 200))
    return []
  }

  return data.paymentFee.map((item: any) => ({
    name: item.name,
    paymentMethod: item.paymentMethod,
    paymentImage: item.paymentImage || '',
    totalFee: item.totalFee || 0,
  }))
}

// ============================================================
// Public API: Create Invoice (Inquiry)
// ============================================================
/**
 * Buat transaksi baru di Duitku.
 * Signature: MD5(merchantCode + merchantOrderId + paymentAmount + merchantKey)
 */
export async function createDuitkuInvoice(req: DuitkuTransactionRequest): Promise<DuitkuTransactionResponse> {
  const cfg = getConfig()

  // Signature: MD5(merchantCode + merchantOrderId + paymentAmount + merchantKey)
  const sigSource = cfg.merchantCode + req.merchantOrderId + req.paymentAmount.toString() + cfg.merchantKey
  const signature = crypto.createHash('md5').update(sigSource).digest('hex')

  const endpoint = `${cfg.baseUrl}/v2/inquiry`
  const payload = {
    merchantCode: cfg.merchantCode,
    paymentAmount: req.paymentAmount,
    merchantOrderId: req.merchantOrderId,
    productDetails: req.productDetails,
    email: req.email,
    paymentMethod: req.paymentMethod,
    customerVaName: req.customerVaName,
    callbackUrl: req.callbackUrl || cfg.callbackUrl,
    returnUrl: req.returnUrl || cfg.returnUrl,
    expiryPeriod: req.expiryPeriod || cfg.expiryMinutes,
    signature,
    customerDetail: req.customerDetail,
  }

  console.log(`[Duitku] Creating invoice for Order: ${req.merchantOrderId}, Amount: ${req.paymentAmount}`)

  const data = await duitkuFetch(endpoint, payload)

  if (!data.reference && data.statusCode !== '00') {
    throw new Error(data.statusMessage || `Duitku gagal membuat invoice untuk order ${req.merchantOrderId}`)
  }

  return {
    merchantCode: data.merchantCode || cfg.merchantCode,
    reference: data.reference,
    paymentUrl: data.paymentUrl || '',
    vaNumber: data.vaNumber || undefined,
    statusCode: data.statusCode || '00',
    statusMessage: data.statusMessage || 'Success',
  }
}

// ============================================================
// Public API: Check Transaction Status
// ============================================================
/**
 * Cek status transaksi langsung ke Duitku.
 * Signature: MD5(merchantCode + merchantOrderId + merchantKey)
 */
export async function checkDuitkuTransactionStatus(merchantOrderId: string): Promise<DuitkuStatusResponse> {
  const cfg = getConfig()

  const sigSource = cfg.merchantCode + merchantOrderId + cfg.merchantKey
  const signature = crypto.createHash('md5').update(sigSource).digest('hex')

  const endpoint = `${cfg.baseUrl}/transactionStatus`
  const payload = {
    merchantCode: cfg.merchantCode,
    merchantOrderId,
    signature,
  }

  console.log(`[Duitku] Checking status for Order: ${merchantOrderId}`)

  const data = await duitkuFetch(endpoint, payload)

  return {
    merchantOrderId: data.merchantOrderId || merchantOrderId,
    reference: data.reference || '',
    amount: data.amount || '0',
    statusCode: data.statusCode || 'XX',
    statusMessage: data.statusMessage || 'Unknown',
  }
}

// ============================================================
// Callback Signature Verification
// ============================================================
/**
 * Verifikasi signature yang dikirim Duitku di callback webhook.
 * Formula: MD5(merchantCode + amount + merchantOrderId + merchantKey)
 *
 * PENTING: Jangan pernah percaya callback tanpa verifikasi ini.
 */
export function verifyDuitkuCallbackSignature(params: {
  merchantCode: string
  amount: string
  merchantOrderId: string
  signature: string
}): boolean {
  const cfg = getConfig()

  const sigSource = params.merchantCode + params.amount + params.merchantOrderId + cfg.merchantKey
  const calculated = crypto.createHash('md5').update(sigSource).digest('hex')

  const isValid = calculated.toLowerCase() === params.signature.toLowerCase()
  if (!isValid) {
    console.warn(
      `[Duitku Callback] Signature mismatch for Order: ${params.merchantOrderId}. ` +
      `Expected: ${calculated}, Received: ${params.signature}`
    )
  }
  return isValid
}
