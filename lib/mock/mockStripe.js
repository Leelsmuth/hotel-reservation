/**
 * Server-side mock of the Stripe PaymentIntents API used in mock mode.
 * Intents live in the mock store so the API can verify payments exactly as
 * it does with Stripe (status, amount, metadata).
 */
import { clone, generateMockId, getMockStore } from './store';
import { MOCK_TEST_CARDS } from './testCards';

export class MockStripeError extends Error {
  constructor({ type = 'invalid_request_error', code, decline_code, message }) {
    super(message);
    this.type = type;
    this.code = code;
    this.decline_code = decline_code;
  }
}

const intents = () => getMockStore().paymentIntents;

export const createIntent = ({ amount, currency, metadata = {} }) => {
  const id = generateMockId('pi_mock').replace(/-/g, '_');
  const intent = {
    id,
    object: 'payment_intent',
    amount,
    currency,
    metadata: { ...metadata },
    status: 'requires_payment_method',
    client_secret: `${id}_secret_mock`,
    last_payment_error: null,
    created: Math.floor(Date.now() / 1000),
  };
  intents().set(id, intent);
  return clone(intent);
};

export const retrieveIntent = (id) => {
  const intent = intents().get(id);
  if (!intent) {
    throw new MockStripeError({
      code: 'resource_missing',
      message: `No such payment_intent: '${id}'`,
    });
  }
  return clone(intent);
};

/** What stripe.confirmPayment() does, decided by the test card number. */
export const confirmIntent = ({ clientSecret, cardNumber }) => {
  const id = String(clientSecret ?? '').split('_secret_')[0];
  const intent = intents().get(id);
  if (!intent || intent.client_secret !== clientSecret) {
    throw new MockStripeError({
      code: 'resource_missing',
      message: 'No such payment_intent.',
    });
  }
  if (intent.status === 'succeeded') {
    throw new MockStripeError({
      code: 'payment_intent_unexpected_state',
      message: 'This PaymentIntent has already succeeded.',
    });
  }

  const card = MOCK_TEST_CARDS[String(cardNumber ?? '').replace(/\D/g, '')];
  const cardError = !card
    ? { code: 'invalid_number', message: 'Your card number is invalid.' }
    : card.error;

  if (cardError) {
    intent.status = 'requires_payment_method';
    intent.last_payment_error = { type: 'card_error', ...cardError };
    throw new MockStripeError({ type: 'card_error', ...cardError });
  }

  intent.status = 'succeeded';
  intent.last_payment_error = null;
  return clone(intent);
};

/** What stripe.refunds.create() does (full refunds only). */
export const createRefund = ({ paymentIntentId, idempotencyKey }) => {
  const store = getMockStore();
  store.refunds ??= new Map();
  if (store.refunds.has(idempotencyKey)) {
    return clone(store.refunds.get(idempotencyKey));
  }

  const intent = intents().get(paymentIntentId);
  if (!intent || intent.status !== 'succeeded') {
    throw new MockStripeError({
      code: 'charge_not_refundable',
      message: 'This payment cannot be refunded.',
    });
  }
  const refund = {
    id: generateMockId('re_mock').replace(/-/g, '_'),
    object: 'refund',
    amount: intent.amount,
    currency: intent.currency,
    payment_intent: intent.id,
    status: 'succeeded',
    created: Math.floor(Date.now() / 1000),
  };
  intent.amount_refunded = intent.amount;
  store.refunds.set(idempotencyKey, refund);
  return clone(refund);
};
