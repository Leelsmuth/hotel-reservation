/**
 * Builds reservation documents on the server from what the guest chose
 * (room, dates, guests, contact details). Anything that affects money or
 * status (price, discount, tax, total, bookingStatus, paymentDetails, room
 * type) is decided here, never taken from the request.
 */
import { RESERVATION_STATUS } from '@/lib/static/roomLegend';
import { nightsBetween, priceStay } from '@/lib/pricing/bookingPrice';

export const MAX_GUESTS_PER_ROOM = 4;

export class ReservationInputError extends Error {}

const isNonEmptyString = (value) =>
  typeof value === 'string' && value.trim() !== '';

/**
 * Throws ReservationInputError if the request can't become a reservation.
 */
export const validateReservationInput = (input) => {
  const { bookingDates, updatePathId, contactDetails, guestCount } = input ?? {};

  if (!isNonEmptyString(updatePathId) || updatePathId.includes('/')) {
    throw new ReservationInputError('A valid room is required.');
  }

  const nights = nightsBetween(
    bookingDates?.bookedFrom,
    bookingDates?.bookedUntil
  );
  if (!Number.isInteger(nights) || nights < 1) {
    throw new ReservationInputError(
      'Check-out must be at least one day after check-in (dates as yyyy-MM-dd).'
    );
  }

  if (
    !isNonEmptyString(contactDetails?.name) ||
    !isNonEmptyString(contactDetails?.email) ||
    !isNonEmptyString(contactDetails?.phone)
  ) {
    throw new ReservationInputError('All contact details are required.');
  }

  const guests = Number(guestCount);
  if (!Number.isInteger(guests) || guests < 1 || guests > MAX_GUESTS_PER_ROOM) {
    throw new ReservationInputError(
      `Guest count must be between 1 and ${MAX_GUESTS_PER_ROOM}.`
    );
  }

  if (!isNonEmptyString(input.bookingId)) {
    throw new ReservationInputError('A booking ID is required.');
  }
};

/**
 * The reservation document to store (same shape the app has always used).
 * `updatePathId` is consumed by repository.createReservation().
 *
 * @param {object} input     - Request body from /make-reservation
 * @param {object} room      - The room from the database (with pathId)
 * @param {object} discounts - Length-of-stay discounts from the database
 */
export const buildReservation = ({ input, room, discounts }) => {
  const { bookedFrom, bookedUntil } = input.bookingDates;
  const pricing = priceStay({
    roomPrice: room.price,
    bookedFrom,
    bookedUntil,
    discounts,
  });
  const userId = isNonEmptyString(input.userId) ? input.userId : null;
  const guestCount = Number(input.guestCount);

  return {
    // What the guest chose
    bookingId: input.bookingId,
    checkInDate: input.checkInDate ?? null,
    checkOutDate: input.checkOutDate ?? null,
    guestCount,
    guestCountActual: Number(input.guestCountActual) || guestCount,
    guestDetails: Array.isArray(input.guestDetails)
      ? input.guestDetails.map(({ name = '', age = '' } = {}) => ({ name, age }))
      : [],
    contactDetails: {
      name: input.contactDetails.name.trim(),
      email: input.contactDetails.email.trim(),
      phone: input.contactDetails.phone.trim(),
    },
    // NOTE: the API can't verify who is signed in (no server-side auth yet),
    // so userId is still taken from the request.
    userId,
    isGuest: !userId,
    bookingDates: { bookedFrom, bookedUntil },
    updatePathId: room.pathId,

    // Decided by the server
    roomId: room.pathId,
    roomNo: room.id,
    roomTypeId: room.typeId,
    ...pricing,
    bookingStatus: RESERVATION_STATUS.RESERVED,
    paymentDetails: null,
    checkedInBy: null,
    checkedOutBy: null,
  };
};

/** The price fields of a reservation, as returned to the browser. */
export const pricingOf = (reservation) => ({
  roomPrice: reservation.roomPrice,
  nightsCount: reservation.nightsCount,
  discount: reservation.discount,
  discountAmount: reservation.discountAmount,
  subtotal: reservation.subtotal,
  tax: reservation.tax,
  totalPrice: reservation.totalPrice,
});
