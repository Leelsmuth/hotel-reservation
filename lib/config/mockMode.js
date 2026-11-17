/**
 * Mock mode lets the app run end-to-end without Firebase, Stripe, PayPal or
 * email credentials. All data comes from an in-memory store seeded with dummy
 * fixtures (see lib/mock/fixtures.js).
 *
 * Enable it with `npm run dev:mock`, or by setting NEXT_PUBLIC_USE_MOCKS=true
 * in `.env.local`. It is opt-in only: a missing credential never silently
 * switches the app to fake data.
 *
 * The NEXT_PUBLIC_ prefix is required so the flag is inlined into client
 * bundles as well as being available to API routes.
 */
export const USE_MOCKS = process.env.NEXT_PUBLIC_USE_MOCKS === 'true';
