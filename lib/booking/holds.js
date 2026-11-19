/**
 * The hold on unpaid reservations (server-only).
 *
 * A reservation holds its rooms for HOLD_MINUTES (1 hour). If it isn't paid
 * by `holdExpiresAt`, it's cancelled with reason "expired", its rooms are
 * released and the guest is emailed. A guest who starts paying near the end
 * gets a short extension (PAYMENT_GRACE_MINUTES), so a hold can't run out in
 * the middle of a payment.
 *
 * Expired holds are released whenever availability is searched, a booking
 * is made, looked up or paid for (so nothing depends on a scheduled job),
 * and by GET /api/cron/release-holds, which a scheduler can call so emails
 * go out on time even when the site is quiet.
 *
 * Reservations made before holds were recorded have no `holdExpiresAt`:
 * they're long past their hour and are released without an email.
 */
import repository from '@/lib/data/repository';
import { sendHoldExpiredEmails } from '@/lib/booking/bookingEmails';
import {
  CANCELLATION_REASON,
  RESERVATION_STATUS,
} from '@/lib/static/roomLegend';

const minutesFromEnv = (name, fallback) => {
  const value = Number(process.env[name]);
  return Number.isFinite(value) && value > 0 ? value : fallback;
};

// Both can be shortened for testing (e.g. RESERVATION_HOLD_MINUTES=2)
export const HOLD_MINUTES = minutesFromEnv('RESERVATION_HOLD_MINUTES', 60);
export const PAYMENT_GRACE_MINUTES = minutesFromEnv(
  'PAYMENT_GRACE_MINUTES',
  15
);

const addMinutes = (date, minutes) =>
  new Date(date.getTime() + minutes * 60 * 1000);

/** `createdAt` and `holdExpiresAt` for a reservation made at `now`. */
export const newHold = (now = new Date()) => ({
  createdAt: now.toISOString(),
  holdExpiresAt: addMinutes(now, HOLD_MINUTES).toISOString(),
});

/** True if `reservation` is unpaid and its hold has run out. */
export const isHoldExpired = (reservation, now = new Date()) =>
  reservation.bookingStatus === RESERVATION_STATUS.RESERVED &&
  (!reservation.holdExpiresAt || new Date(reservation.holdExpiresAt) <= now);

/**
 * The hold for a reservation whose guest starts paying at `now`: at least
 * PAYMENT_GRACE_MINUTES from now, but never more than that past the
 * original hour (so paying again and again can't keep rooms forever).
 * Null if it doesn't need to change.
 */
export const holdWhilePaying = (reservation, now = new Date()) => {
  if (!reservation.createdAt || !reservation.holdExpiresAt) return null;
  const current = new Date(reservation.holdExpiresAt);
  const latest = addMinutes(
    new Date(reservation.createdAt),
    HOLD_MINUTES + PAYMENT_GRACE_MINUTES
  );
  const wanted = addMinutes(now, PAYMENT_GRACE_MINUTES);
  const extended = new Date(Math.min(latest.getTime(), wanted.getTime()));
  return extended > current ? extended.toISOString() : null;
};

/**
 * Cancels every unpaid reservation whose hold has run out (reason
 * "expired"), releasing its rooms, and emails the guests. Safe to run
 * often and at the same time as itself: a reservation is only cancelled,
 * and emailed about, once.
 *
 * @returns {Promise<string[]>} IDs of the reservations released
 */
export const releaseExpiredHolds = async (now = new Date()) => {
  const unpaid = await repository.findReservationsByStatus(
    RESERVATION_STATUS.RESERVED
  );
  const expired = unpaid.filter((reservation) =>
    isHoldExpired(reservation, now)
  );
  if (expired.length === 0) return [];

  const releasedIds = await repository.cancelReservations(
    expired.map((reservation) => reservation.id),
    { reason: CANCELLATION_REASON.EXPIRED, at: now.toISOString() }
  );

  // Only reservations that had a hold get an email (see above)
  await sendHoldExpiredEmails(
    expired.filter(
      (reservation) =>
        releasedIds.includes(reservation.id) && reservation.holdExpiresAt
    )
  );
  return releasedIds;
};

/**
 * releaseExpiredHolds() for the start of an API request: a failure is
 * logged but doesn't fail the request.
 */
export const releaseExpiredHoldsQuietly = async () => {
  try {
    await releaseExpiredHolds();
  } catch (error) {
    console.error('Could not release expired holds:', error);
  }
};

/**
 * Gives the reservations a guest is paying for the short extension
 * described in holdWhilePaying().
 */
export const extendHoldsWhilePaying = async (
  reservations,
  now = new Date()
) => {
  const updates = {};
  reservations.forEach((reservation) => {
    const holdExpiresAt = holdWhilePaying(reservation, now);
    if (holdExpiresAt) updates[reservation.id] = { holdExpiresAt };
  });
  if (Object.keys(updates).length > 0) {
    await repository.updateReservations(updates);
  }
};
