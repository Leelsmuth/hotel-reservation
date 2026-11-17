/**
 * Mock of Stripe's "confirm payment" call, used by the mock card form
 * (components/payment/MockPaymentForm.jsx). Only available in mock mode.
 *
 * Body: { clientSecret, cardNumber }
 *   -> 200 { paymentIntent }          payment succeeded
 *   -> 402 { error: { type, code, message } }   card declined, etc.
 */
import { USE_MOCKS } from '@/lib/config/mockMode';
import { confirmIntent, MockStripeError } from '@/lib/mock/mockStripe';
import { mockLatency } from '@/lib/mock/store';
import { NextResponse } from 'next/server';

export async function POST(request) {
  if (!USE_MOCKS) {
    return NextResponse.json({ message: 'Not found' }, { status: 404 });
  }

  const { clientSecret, cardNumber } = await request.json();
  await mockLatency();

  try {
    const paymentIntent = confirmIntent({ clientSecret, cardNumber });
    return NextResponse.json({ paymentIntent });
  } catch (error) {
    if (error instanceof MockStripeError) {
      return NextResponse.json(
        {
          error: {
            type: error.type,
            code: error.code,
            decline_code: error.decline_code,
            message: error.message,
          },
        },
        { status: error.type === 'card_error' ? 402 : 400 }
      );
    }
    throw error;
  }
}
