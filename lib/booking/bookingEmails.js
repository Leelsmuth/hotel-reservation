/**
 * Emails the server sends about bookings (server-only). Sending is never
 * allowed to fail the booking itself: errors are logged.
 */
import {
  sendBookingConfirmationEmail,
  sendHoldExpiredEmail,
  sendPaymentRefundedEmail,
} from '@/lib/mailing/mailer';
import { sortByRoomOrder } from '@/lib/booking/reservations';
import { sumBookingPrices } from '@/lib/pricing/bookingPrice';

/** What the email templates need for the rooms of one booking. */
export const emailDetailsFor = (rooms) => {
  const ordered = sortByRoomOrder(rooms);
  return { ...ordered[0], ...sumBookingPrices(ordered), rooms: ordered };
};

const byBooking = (reservations) => {
  const bookings = new Map();
  reservations.forEach((reservation) => {
    const key = `${reservation.bookingId}|${reservation.contactDetails?.email}`;
    bookings.set(key, [...(bookings.get(key) ?? []), reservation]);
  });
  return [...bookings.values()];
};

const safely = async (what, send) => {
  try {
    await send();
  } catch (error) {
    console.error(`Could not send ${what}:`, error);
  }
};

/** One "your reservation expired" email per booking. */
export const sendHoldExpiredEmails = async (expiredReservations) => {
  for (const rooms of byBooking(expiredReservations)) {
    const details = emailDetailsFor(rooms);
    await safely(`expiry email for ${details.bookingId}`, () =>
      sendHoldExpiredEmail(details.contactDetails.email, details)
    );
  }
};

/** "Your booking is confirmed", for the rooms a payment booked. */
export const sendBookingConfirmation = async (rooms) => {
  const details = emailDetailsFor(rooms);
  await safely(`booking confirmation for ${details.bookingId}`, () =>
    sendBookingConfirmationEmail(details.contactDetails.email, details)
  );
};

/**
 * "We refunded your payment", for a payment that couldn't book its rooms.
 * `reason`: "expired" (the hold ran out and the rooms were taken) or
 * "changed" (the reservation was already paid, cancelled, …).
 */
export const sendRefundEmail = async (rooms, amountInCents, reason) => {
  const details = emailDetailsFor(rooms);
  await safely(`refund email for ${details.bookingId}`, () =>
    sendPaymentRefundedEmail(details.contactDetails.email, {
      ...details,
      refundedAmount: (amountInCents / 100).toFixed(2),
      refundReason: reason,
    })
  );
};
