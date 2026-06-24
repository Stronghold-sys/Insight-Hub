import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import { getDuitkuPaymentMethods } from '@/lib/duitku';

export async function GET(request: Request) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const amountStr = searchParams.get('amount') || '10000';
    const amount = parseInt(amountStr, 10) || 10000;

    const methods = await getDuitkuPaymentMethods(amount);
    return NextResponse.json({ success: true, methods });
  } catch (error) {
    console.error('[API] Error fetching payment methods:', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}
