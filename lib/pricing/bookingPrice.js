/**
 * The single source of truth for what a stay costs. Used by the booking UI
 * (to display prices) and by the API (to decide what to charge), so the two
 * can't disagree. The server never trusts prices sent by the browser.
 */
import { differenceInCalendarDays, isValid, parseISO } from 'date-fns';

export const TAX_PERCENTAGE = 13;

const roundToTwoDecimals = (num) => Math.round(num * 100) / 100;

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

/** Length-of-stay discount (percent) for a number of nights. */
export const discountForNights = (nights, discounts = {}) => {
  if (nights >= 30) return discounts.THIRTYPLUS || 0;
  if (nights > 20) return discounts.TWENTYONE || 0;
  if (nights > 10) return discounts.ELEVEN || 0;
  return 0;
};

/**
 * Price breakdown for `nights` nights at `roomPrice` per night with a
 * `discount` percent off, plus tax.
 */
export const calculateBookingPrice = ({ roomPrice, nights, discount = 0 }) => {
  const discountFactor = 1 - discount / 100;
  const pricePerNight = roundToTwoDecimals(roomPrice * discountFactor);
  const discountAmount = roundToTwoDecimals(
    (roomPrice - pricePerNight) * nights
  );
  const subtotal = roundToTwoDecimals(pricePerNight * nights);
  const tax = roundToTwoDecimals((subtotal * TAX_PERCENTAGE) / 100);
  const totalPrice = roundToTwoDecimals(subtotal + tax);

  return {
    roomPrice,
    nightsCount: nights,
    discount,
    discountAmount,
    subtotal,
    tax,
    totalPrice,
  };
};

/**
 * Nights between two "yyyy-MM-dd" dates, or NaN if either date is invalid.
 */
export const nightsBetween = (bookedFrom, bookedUntil) => {
  if (!DATE_PATTERN.test(bookedFrom) || !DATE_PATTERN.test(bookedUntil)) {
    return NaN;
  }
  const from = parseISO(bookedFrom);
  const until = parseISO(bookedUntil);
  if (!isValid(from) || !isValid(until)) return NaN;
  return differenceInCalendarDays(until, from);
};

/**
 * Full price of a stay in a room, as the server computes it.
 *
 * @param {{ roomPrice: number, bookedFrom: string, bookedUntil: string,
 *           discounts: object }} stay
 */
export const priceStay = ({ roomPrice, bookedFrom, bookedUntil, discounts }) => {
  const nights = nightsBetween(bookedFrom, bookedUntil);
  return calculateBookingPrice({
    roomPrice,
    nights,
    discount: discountForNights(nights, discounts),
  });
};

/**
 * Adds up the prices of several rooms booked together (same dates). Each
 * room is priced (and rounded) on its own, so the combined total is exactly
 * the sum of the per-room totals that are stored and charged.
 *
 * @param {Array<ReturnType<typeof calculateBookingPrice>>} prices
 */
export const sumBookingPrices = (prices) => {
  const sum = (field) =>
    roundToTwoDecimals(
      prices.reduce((total, price) => total + (Number(price[field]) || 0), 0)
    );

  return {
    nightsCount: prices[0]?.nightsCount ?? 0,
    discount: prices[0]?.discount ?? 0,
    discountAmount: sum('discountAmount'),
    subtotal: sum('subtotal'),
    tax: sum('tax'),
    totalPrice: sum('totalPrice'),
  };
};
