import crypto from 'crypto';
import { dbQuery } from './db';

const DUITKU_MERCHANT_CODE = process.env.DUITKU_MERCHANT_CODE || 'D12345'; // fallback default
const DUITKU_MERCHANT_KEY = process.env.DUITKU_MERCHANT_KEY || 'api_key_placeholder';
const DUITKU_IS_SANDBOX = process.env.DUITKU_IS_SANDBOX !== 'false'; // default is true (sandbox)

const BASE_URL = DUITKU_IS_SANDBOX
  ? 'https://sandbox.duitku.com/webapi/api/merchant'
  : 'https://passport.duitku.com/webapi/api/merchant';

export interface DuitkuPaymentMethod {
  name: string;
  paymentMethod: string;
  paymentImage: string;
}

export interface DuitkuTransactionRequest {
  paymentAmount: number;
  merchantOrderId: string;
  productDetails: string;
  email: string;
  paymentMethod: string;
  customerVaName: string;
  callbackUrl: string;
  returnUrl: string;
  expiryPeriod?: number; // in minutes
  customerDetail?: {
    firstName: string;
    lastName?: string;
    email: string;
    phoneNumber?: string;
  };
}

export interface DuitkuTransactionResponse {
  merchantCode: string;
  reference: string;
  paymentUrl: string;
  vaNumber?: string;
  statusCode: string;
  statusMessage: string;
}

export interface DuitkuStatusResponse {
  merchantOrderId: string;
  reference: string;
  amount: string;
  statusCode: string;
  statusMessage: string;
}

/**
 * Get active payment methods enabled for the merchant account
 */
export async function getDuitkuPaymentMethods(amount: number): Promise<DuitkuPaymentMethod[]> {
  const fallbacks = [
    { name: 'BCA Virtual Account', paymentMethod: 'BC', paymentImage: 'https://upload.wikimedia.org/wikipedia/commons/5/5c/Bank_Central_Asia.svg' },
    { name: 'Mandiri Virtual Account', paymentMethod: 'M2', paymentImage: 'https://upload.wikimedia.org/wikipedia/commons/a/ad/Bank_Mandiri_logo_2016.svg' },
    { name: 'BNI Virtual Account', paymentMethod: 'I1', paymentImage: 'https://upload.wikimedia.org/wikipedia/commons/f/f0/Bank_Negara_Indonesia_logo_%282004%29.svg' },
    { name: 'Permata Virtual Account', paymentMethod: 'BT', paymentImage: 'https://upload.wikimedia.org/wikipedia/commons/f/ff/Permata_Bank_%282024%29.svg' },
    { name: 'QRIS (Dana, OVO, ShopeePay)', paymentMethod: 'SP', paymentImage: 'https://upload.wikimedia.org/wikipedia/commons/a/a2/Logo_QRIS.svg' },
  ];

  if (DUITKU_MERCHANT_KEY === 'api_key_placeholder') {
    console.log('[Duitku SIMULATION] Using static fallback payment methods');
    return fallbacks;
  }

  try {
    const datetime = new Date().toISOString()
      .replace(/T/, ' ')
      .replace(/\..+/, ''); // Format: YYYY-MM-DD HH:mm:ss

    // signature formula: sha256(merchantCode + amount + datetime + merchantKey)
    const signatureSource = DUITKU_MERCHANT_CODE + amount.toString() + datetime + DUITKU_MERCHANT_KEY;
    const signature = crypto.createHash('sha256').update(signatureSource).digest('hex');

    const endpoint = `${BASE_URL}/paymentmethod/getpaymentmethod`;
    const payload = {
      merchantcode: DUITKU_MERCHANT_CODE,
      amount: amount,
      datetime: datetime,
      signature: signature,
    };

    console.log('[Duitku] Fetching payment methods from:', endpoint);
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error('[Duitku] Payment methods error response:', errText);
      throw new Error(`Duitku HTTP error: ${response.status}`);
    }

    const data = await response.json();
    if (data && Array.isArray(data.paymentFee)) {
      return data.paymentFee.map((item: any) => {
        let image = item.paymentImage;
        if (item.paymentMethod === 'BC') image = 'https://upload.wikimedia.org/wikipedia/commons/5/5c/Bank_Central_Asia.svg';
        else if (item.paymentMethod === 'M2') image = 'https://upload.wikimedia.org/wikipedia/commons/a/ad/Bank_Mandiri_logo_2016.svg';
        else if (item.paymentMethod === 'I1') image = 'https://upload.wikimedia.org/wikipedia/commons/f/f0/Bank_Negara_Indonesia_logo_%282004%29.svg';
        else if (item.paymentMethod === 'BT') image = 'https://upload.wikimedia.org/wikipedia/commons/f/ff/Permata_Bank_%282024%29.svg';
        else if (item.paymentMethod === 'SP') image = 'https://upload.wikimedia.org/wikipedia/commons/a/a2/Logo_QRIS.svg';

        return {
          name: item.name,
          paymentMethod: item.paymentMethod,
          paymentImage: image,
        };
      });
    }

    console.warn('[Duitku] No paymentFee array in response:', data);
    return [];
  } catch (error) {
    console.error('[Duitku] Failed to fetch payment methods:', error);
    // Return static fallback for robust development if API fails or credentials are placeholders
    return fallbacks;
  }
}

/**
 * Create a transaction invoice/inquiry at Duitku
 */
export async function createDuitkuInvoice(req: DuitkuTransactionRequest): Promise<DuitkuTransactionResponse> {
  if (DUITKU_MERCHANT_KEY === 'api_key_placeholder') {
    console.log('[Duitku SIMULATION] Creating simulated invoice for Order:', req.merchantOrderId);
    const isVA = ['BC', 'M2', 'I1', 'BT'].includes(req.paymentMethod);
    const reference = `SIM-REF-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`;
    
    return {
      merchantCode: DUITKU_MERCHANT_CODE,
      reference: reference,
      paymentUrl: isVA ? '' : `https://sandbox.duitku.com/webapi/selectPayment?reference=${reference}`,
      vaNumber: isVA ? `883208${Math.floor(10000000 + Math.random() * 90000000)}` : undefined,
      statusCode: '00',
      statusMessage: 'Success',
    };
  }

  // signature formula: md5(merchantCode + merchantOrderId + paymentAmount + merchantKey)
  const signatureSource = DUITKU_MERCHANT_CODE + req.merchantOrderId + req.paymentAmount.toString() + DUITKU_MERCHANT_KEY;
  const signature = crypto.createHash('md5').update(signatureSource).digest('hex');

  const endpoint = `${BASE_URL}/v2/inquiry`;
  const payload = {
    merchantCode: DUITKU_MERCHANT_CODE,
    paymentAmount: req.paymentAmount,
    merchantOrderId: req.merchantOrderId,
    productDetails: req.productDetails,
    email: req.email,
    paymentMethod: req.paymentMethod,
    customerVaName: req.customerVaName,
    callbackUrl: req.callbackUrl,
    returnUrl: req.returnUrl,
    expiryPeriod: req.expiryPeriod || 1440, // default 24 hours
    signature: signature,
    customerDetail: req.customerDetail,
  };

  console.log('[Duitku] Creating inquiry at:', endpoint, 'OrderID:', req.merchantOrderId);
  
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errText = await response.text();
    console.error('[Duitku] Create invoice error response:', errText);
    throw new Error(`Duitku Inquiry HTTP error: ${response.status}`);
  }

  const data = await response.json();
  
  // Duitku returns status code in statusCode or similar
  if (data.statusCode === '00' || data.reference) {
    return {
      merchantCode: data.merchantCode || DUITKU_MERCHANT_CODE,
      reference: data.reference,
      paymentUrl: data.paymentUrl,
      vaNumber: data.vaNumber,
      statusCode: data.statusCode || '00',
      statusMessage: data.statusMessage || 'Success',
    };
  }

  throw new Error(data.statusMessage || 'Failed to create Duitku transaction');
}

/**
 * Verify if the callback signature matches the calculated signature
 */
export function verifyDuitkuCallbackSignature(params: {
  merchantCode: string;
  amount: string;
  merchantOrderId: string;
  signature: string;
}): boolean {
  if (DUITKU_MERCHANT_KEY === 'api_key_placeholder') {
    console.log('[Duitku SIMULATION] Verifying callback signature (always auto-verified in simulation)');
    return true;
  }

  // signature formula: md5(merchantCode + amount + merchantOrderId + merchantKey)
  const signatureSource = params.merchantCode + params.amount + params.merchantOrderId + DUITKU_MERCHANT_KEY;
  const calculatedSignature = crypto.createHash('md5').update(signatureSource).digest('hex');
  
  const match = calculatedSignature === params.signature;
  if (!match) {
    console.warn('[Duitku Callback] Signature mismatch. Calculated:', calculatedSignature, 'Received:', params.signature);
  }
  return match;
}

/**
 * Query transaction status directly from Duitku's server
 */
export async function checkDuitkuTransactionStatus(merchantOrderId: string): Promise<DuitkuStatusResponse> {
  if (DUITKU_MERCHANT_KEY === 'api_key_placeholder') {
    console.log('[Duitku SIMULATION] Querying transaction status for Order:', merchantOrderId);
    // Fetch local order amount if database exists, otherwise use fallback
    let amount = '149000';
    try {
      const dbRes = await dbQuery<any>('SELECT total_amount FROM orders WHERE id = ?', [merchantOrderId]);
      if (dbRes.length > 0) {
        amount = String(Math.round(parseFloat(dbRes[0].total_amount)));
      }
    } catch (e) {
      // ignore
    }
    return {
      merchantOrderId: merchantOrderId,
      reference: `SIM-REF-${Date.now()}`,
      amount: amount,
      statusCode: '00', // Success
      statusMessage: 'Success',
    };
  }

  // signature formula: md5(merchantCode + merchantOrderId + merchantKey)
  const signatureSource = DUITKU_MERCHANT_CODE + merchantOrderId + DUITKU_MERCHANT_KEY;
  const signature = crypto.createHash('md5').update(signatureSource).digest('hex');

  const endpoint = `${BASE_URL}/transactionStatus`;
  const payload = {
    merchantCode: DUITKU_MERCHANT_CODE,
    merchantOrderId: merchantOrderId,
    signature: signature,
  };

  console.log('[Duitku] Checking status at:', endpoint, 'OrderID:', merchantOrderId);

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errText = await response.text();
    console.error('[Duitku] Check status error response:', errText);
    throw new Error(`Duitku Status HTTP error: ${response.status}`);
  }

  const data = await response.json();
  return {
    merchantOrderId: data.merchantOrderId,
    reference: data.reference,
    amount: data.amount,
    statusCode: data.statusCode,
    statusMessage: data.statusMessage,
  };
}
