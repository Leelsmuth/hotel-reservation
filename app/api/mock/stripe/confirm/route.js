/**
 * Mock of Stripe's "confirm payment" call, used by the mock card form
 * (components/payment/MockPaymentForm.jsx). Only available in mock mode.
 *
 * Body: { clientSecret, cardNumber }
 * A successful payment is also sent to /api/stripe/webhook, like Stripe does.
 *   -> 200 { paymentIntent }          payment succeeded
 *   -> 402 { error: { type, code, message } }   card declined, etc.
 */
import { USE_MOCKS } from '@/lib/config/mockMode';
import { confirmIntent, MockStripeError } from '@/lib/mock/mockStripe';
import { mockLatency } from '@/lib/mock/store';
import { NextResponse } from 'next/server';

// Like Stripe, report the payment to the webhook too, a moment later and
// independently of the browser (MOCK_WEBHOOK_DELAY_MS, default 1500;
// negative turns it off, to test the browser on its own).
const sendMockWebhook = (request, paymentIntent) => {
  const delay = Number(process.env.MOCK_WEBHOOK_DELAY_MS ?? 1500);
  if (!(delay >= 0)) return;
  setTimeout(() => {
    fetch(new URL('/api/stripe/webhook', request.url), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: `evt_mock_${paymentIntent.id}`,
        type: 'payment_intent.succeeded',
        data: { object: paymentIntent },
      }),
    }).catch((error) => console.error('Mock webhook failed:', error));
  }, delay);
};

export async function POST(request) {
  if (!USE_MOCKS) {
    return NextResponse.json({ message: 'Not found' }, { status: 404 });
  }

  const { clientSecret, cardNumber } = await request.json();
  await mockLatency();

  try {
    const paymentIntent = confirmIntent({ clientSecret, cardNumber });
    sendMockWebhook(request, paymentIntent);
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
