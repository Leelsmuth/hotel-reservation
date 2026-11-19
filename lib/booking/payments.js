/**
 * Server-side payment rules for reservations:
 *  - what to charge is worked out from the reservation's room, dates and the
 *    current discounts (never from an amount sent by the browser);
 *  - a reservation is only marked as paid after Stripe confirms a succeeded
 *    payment of exactly that amount, made for that reservation.
 *
 * A booking with several rooms is paid in one payment that covers every room
 * of the booking still awaiting payment. The payment's metadata lists those
 * reservations (`reservationIds`), so completing it books exactly the rooms
 * that were paid for.
 */
import repository from '@/lib/data/repository';
import { loadBooking } from '@/lib/booking/loadBooking';
import { isChargeableAmount, toCents } from '@/lib/payment-gateway/amount';
import { priceStay, sumBookingPrices } from '@/lib/pricing/bookingPrice';
import {
  CANCELLATION_REASON,
  RESERVATION_STATUS,
} from '@/lib/static/roomLegend';

export const PAYMENT_CURRENCY = 'cad';

/**
 * An error the API should return to the browser with `status` (and `code`,
 * e.g. "expired", when the page should react to it).
 */
export class PaymentError extends Error {
  constructor(status, message, code) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

/** True if every room of the booking was released because its hold ran out. */
export const hasExpired = (rooms) =>
  rooms.length > 0 &&
  rooms.every(
    (room) =>
      room.bookingStatus === RESERVATION_STATUS.CANCELLED &&
      room.cancellationReason === CANCELLATION_REASON.EXPIRED
  );

const loadPayableReservations = async (reservationId) => {
  const booking = await loadBooking(reservationId);
  if (!booking) {
    throw new PaymentError(404, 'Reservation not found.');
  }
  const payable = booking.rooms.filter(
    (room) => room.bookingStatus === RESERVATION_STATUS.RESERVED
  );
  if (hasExpired(booking.rooms)) {
    throw new PaymentError(
      409,
      "This reservation expired because it wasn't paid within 1 hour. Please make a new reservation.",
      'expired'
    );
  }
  if (payable.length === 0) {
    throw new PaymentError(
      409,
      'This reservation can no longer be paid for (it is already booked or cancelled).'
    );
  }
  return { reservation: booking.reservation, payable };
};

/**
 * The amount (in cents) to charge for a reservation: the rooms of its
 * booking that are still awaiting payment.
 *
 * The price is recomputed from the room's current price and discounts rather
 * than read from the stored total, so reservations created before prices were
 * computed on the server (when the browser could set any total) can't be
 * paid at a tampered price. If the recomputed total differs from the one the
 * guest was shown, the payment is refused rather than charging a surprise
 * amount.
 */
export const quoteReservation = async (reservationId) => {
  const { reservation, payable } = await loadPayableReservations(reservationId);
  const discounts = await repository.getDiscounts();

  for (const stay of payable) {
    const room = await repository.getRoom(stay.roomId);
    if (!room) {
      throw new PaymentError(
        409,
        'The room for this reservation no longer exists.'
      );
    }

    const { totalPrice } = priceStay({
      roomPrice: room.price,
      bookedFrom: stay.bookingDates?.bookedFrom,
      bookedUntil: stay.bookingDates?.bookedUntil,
      discounts,
    });

    if (!isChargeableAmount(totalPrice)) {
      throw new PaymentError(409, 'This reservation has no amount to pay.');
    }
    if (toCents(totalPrice) !== toCents(stay.totalPrice)) {
      throw new PaymentError(
        409,
        'The price of this reservation has changed. Please make a new reservation.'
      );
    }
  }

  const amount = payable.reduce(
    (total, stay) => total + toCents(stay.totalPrice),
    0
  );

  return {
    reservation,
    reservations: payable,
    amount,
    totalPrice: sumBookingPrices(payable).totalPrice,
  };
};

/**
 * The reservation IDs a payment was made for. Payments made before
 * multi-room bookings only have `reservationId`.
 */
export const paidReservationIdsOf = (paymentIntent) => {
  const { reservationIds, reservationId } = paymentIntent.metadata ?? {};
  if (typeof reservationIds === 'string' && reservationIds) {
    return reservationIds.split(',');
  }
  return reservationId ? [reservationId] : [];
};

/**
 * Checks that `paymentIntent` (as fetched from Stripe, not as reported by the
 * browser) paid in full for exactly `reservations` (the rooms it was made
 * for, see paidReservationIdsOf). Returns the updates that mark each of them
 * as booked: `{ [reservationId]: updates }`.
 *
 * Whether those rooms can still be booked (awaiting payment, or released by
 * an expired hold but still free) is checked when they're booked
 * (repository.completeReservations).
 */
export const verifyReservationPayment = ({ reservations, paymentIntent }) => {
  const problems = [];
  const expectedAmount = reservations.reduce(
    (total, reservation) => total + toCents(reservation.totalPrice),
    0
  );

  if (paymentIntent.status !== 'succeeded') {
    problems.push(`status is "${paymentIntent.status}"`);
  }
  const paidIds = paidReservationIdsOf(paymentIntent);
  if (
    reservations.length === 0 ||
    paidIds.length !== reservations.length ||
    reservations.some((reservation) => !paidIds.includes(reservation.id))
  ) {
    problems.push('it was made for different reservations');
  }
  if (paymentIntent.currency !== PAYMENT_CURRENCY) {
    problems.push(`currency is ${paymentIntent.currency}`);
  }
  if (paymentIntent.amount !== expectedAmount) {
    problems.push(
      `amount is ${paymentIntent.amount} cents, expected ${expectedAmount}`
    );
  }

  if (problems.length > 0) {
    console.warn(
      `Payment ${paymentIntent.id} rejected for reservations ${reservations
        .map((r) => r.id)
        .join(', ')}: ${problems.join('; ')}`
    );
    throw new PaymentError(402, 'Payment could not be verified.');
  }

  return Object.fromEntries(
    reservations.map((reservation) => [
      reservation.id,
      {
        paymentDetails: {
          paymentStatus: 'COMPLETED',
          paymentIntentId: paymentIntent.id,
          // This room's share; the payment itself may cover several rooms
          paymentAmount: toCents(reservation.totalPrice),
        },
      },
    ])
  );
};
