import Stripe from 'stripe';
import { USE_MOCKS } from '@/lib/config/mockMode';
import * as mockStripe from '@/lib/mock/mockStripe';

let stripe = null;

// Created lazily: `new Stripe()` throws when STRIPE_SECRET_KEY is missing, and
// that must not break imports in mock mode.
export const getStripe = () => {
  if (!stripe) {
    stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2023-08-16',
    });
  }
  return stripe;
};

/**
 * Creates a payment intent (in mock mode, a mock intent the mock checkout
 * form can confirm).
 *
 * @param {{ amount: number, currency: string, metadata?: object }} params
 *   `amount` in cents; `metadata` values must be strings.
 */
export const createPaymentIntent = async ({ amount, currency, metadata }) => {
  if (USE_MOCKS) {
    return mockStripe.createIntent({ amount, currency, metadata });
  }

  return getStripe().paymentIntents.create({ amount, currency, metadata });
};

/** Fetches a payment intent from Stripe (or the mock store) by id. */
export const retrievePaymentIntent = async (paymentIntentId) => {
  if (USE_MOCKS) {
    return mockStripe.retrieveIntent(paymentIntentId);
  }

  return getStripe().paymentIntents.retrieve(paymentIntentId);
};
