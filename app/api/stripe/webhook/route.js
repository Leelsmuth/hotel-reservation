import { PaymentError } from '@/lib/booking/payments';
import { handleStripeEvent } from '@/lib/booking/stripeEvents';
import { USE_MOCKS } from '@/lib/config/mockMode';
import { constructWebhookEvent } from '@/lib/payment-gateway/stripe';
import { NextResponse } from 'next/server';

/**
 * Stripe webhook: Stripe calls this when a payment succeeds, and the
 * booking is completed even if the guest closed the tab
 * (lib/booking/stripeEvents.js).
 *
 * Set up in the Stripe dashboard (Developers > Webhooks): endpoint
 * https://<site>/api/stripe/webhook, event `payment_intent.succeeded`, and
 * put its signing secret in STRIPE_WEBHOOK_SECRET. Requests without a valid
 * signature are rejected. (In mock mode the mock payment form sends the
 * event itself, unsigned.)
 *
 * Responds 200 once handled, including payments it can't use (they're
 * refunded, or logged if they can't be verified), so Stripe doesn't retry
 * them; 500 on unexpected errors, so Stripe retries later.
 */
export async function POST(request) {
  const payload = await request.text();

  let event;
  try {
    event = USE_MOCKS
      ? JSON.parse(payload)
      : constructWebhookEvent(payload, request.headers.get('stripe-signature'));
  } catch (error) {
    console.warn('Rejected Stripe webhook:', error.message);
    return NextResponse.json({ error: 'Invalid webhook' }, { status: 400 });
  }

  try {
    const { outcome, ignored } = await handleStripeEvent(event);
    return NextResponse.json({ received: true, outcome, ignored });
  } catch (error) {
    if (error instanceof PaymentError) {
      console.warn(`Stripe event ${event.id} not used: ${error.message}`);
      return NextResponse.json({ received: true, error: error.message });
    }
    console.error(`Stripe event ${event.id} failed:`, error);
    return NextResponse.json({ error: 'Webhook failed' }, { status: 500 });
  }
}
