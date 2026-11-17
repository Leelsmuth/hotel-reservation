/**
 * Converts a dollar amount (e.g. 305.1) to the integer number of cents Stripe
 * expects (30510). Rounds instead of truncating: 305.1 * 100 is
 * 30509.999999999996 in floating point.
 *
 * @param {number|string} amount - Amount in dollars.
 * @returns {number} - Amount in cents, or NaN if `amount` is not a number.
 */
export const toCents = (amount) => Math.round(Number(amount) * 100);

/** True for amounts that can be charged (a positive, finite dollar value). */
export const isChargeableAmount = (amount) =>
  amount !== null &&
  amount !== '' &&
  Number.isFinite(Number(amount)) &&
  toCents(amount) > 0;
