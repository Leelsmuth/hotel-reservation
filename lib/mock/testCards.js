/**
 * Stripe test-mode card numbers understood by the mock payment flow. The
 * server (lib/mock/mockStripe.js) decides the outcome, like Stripe does; the
 * mock card form lists them as hints.
 */
export const MOCK_TEST_CARDS = {
  '4242424242424242': { label: 'Success' },
  '4000000000000002': {
    label: 'Declined',
    error: { code: 'card_declined', message: 'Your card was declined.' },
  },
  '4000000000009995': {
    label: 'Insufficient funds',
    error: {
      code: 'card_declined',
      decline_code: 'insufficient_funds',
      message: 'Your card has insufficient funds.',
    },
  },
  '4000000000000069': {
    label: 'Expired card',
    error: { code: 'expired_card', message: 'Your card has expired.' },
  },
};
