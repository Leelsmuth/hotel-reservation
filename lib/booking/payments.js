/**
 * Server-side payment rules for reservations:
 *  - what to charge is worked out from the reservation's room, dates and the
 *    current discounts (never from an amount sent by the browser);
 *  - a reservation is only marked as paid after Stripe confirms a succeeded
 *    payment of exactly that amount, made for that reservation.
 */
import repository from '@/lib/data/repository';
import { isChargeableAmount, toCents } from '@/lib/payment-gateway/amount';
import { priceStay } from '@/lib/pricing/bookingPrice';
import { RESERVATION_STATUS } from '@/lib/static/roomLegend';

export const PAYMENT_CURRENCY = 'cad';

/** An error the API should return to the browser with `status`. */
export class PaymentError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

const loadPayableReservation = async (reservationId) => {
  const reservation = await repository.getReservationById(reservationId);
  if (!reservation) {
    throw new PaymentError(404, 'Reservation not found.');
  }
  if (reservation.bookingStatus !== RESERVATION_STATUS.RESERVED) {
    throw new PaymentError(
      409,
      'This reservation can no longer be paid for (it is already booked or cancelled).'
    );
  }
  return reservation;
};

/**
 * The amount (in cents) to charge for a reservation.
 *
 * The price is recomputed from the room's current price and discounts rather
 * than read from the stored total, so reservations created before prices were
 * computed on the server (when the browser could set any total) can't be
 * paid at a tampered price. If the recomputed total differs from the one the
 * guest was shown, the payment is refused rather than charging a surprise
 * amount.
 */
export const quoteReservation = async (reservationId) => {
  const reservation = await loadPayableReservation(reservationId);

  const room = await repository.getRoom(reservation.roomId);
  if (!room) {
    throw new PaymentError(409, 'The room for this reservation no longer exists.');
  }

  const { totalPrice } = priceStay({
    roomPrice: room.price,
    bookedFrom: reservation.bookingDates?.bookedFrom,
    bookedUntil: reservation.bookingDates?.bookedUntil,
    discounts: await repository.getDiscounts(),
  });

  if (!isChargeableAmount(totalPrice)) {
    throw new PaymentError(409, 'This reservation has no amount to pay.');
  }
  if (toCents(totalPrice) !== toCents(reservation.totalPrice)) {
    throw new PaymentError(
      409,
      'The price of this reservation has changed. Please make a new reservation.'
    );
  }

  return { reservation, amount: toCents(totalPrice), totalPrice };
};

/**
 * Checks that `paymentIntent` (as fetched from Stripe, not as reported by the
 * browser) paid in full for `reservation`. Returns the updates that mark the
 * reservation as booked.
 */
export const verifyReservationPayment = ({ reservation, paymentIntent }) => {
  const problems = [];
  if (paymentIntent.status !== 'succeeded') {
    problems.push(`status is "${paymentIntent.status}"`);
  }
  if (paymentIntent.metadata?.reservationId !== reservation.id) {
    problems.push('it was made for a different reservation');
  }
  if (paymentIntent.currency !== PAYMENT_CURRENCY) {
    problems.push(`currency is ${paymentIntent.currency}`);
  }
  if (paymentIntent.amount !== toCents(reservation.totalPrice)) {
    problems.push(
      `amount is ${paymentIntent.amount} cents, expected ${toCents(reservation.totalPrice)}`
    );
  }

  if (problems.length > 0) {
    console.warn(
      `Payment ${paymentIntent.id} rejected for reservation ${reservation.id}: ${problems.join('; ')}`
    );
    throw new PaymentError(402, 'Payment could not be verified.');
  }

  return {
    paymentDetails: {
      paymentStatus: 'COMPLETED',
      paymentIntentId: paymentIntent.id,
      paymentAmount: paymentIntent.amount,
    },
    bookingStatus: RESERVATION_STATUS.BOOKED,
  };
};
