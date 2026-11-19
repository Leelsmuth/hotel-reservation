/**
 * Turns a successful payment into a booking (server-only).
 *
 * Both the browser (PATCH /api/rooms/booking, right after paying) and
 * Stripe (POST /api/stripe/webhook, even if the guest closed the tab) call
 * completePaidBooking(). Whichever comes first books the rooms and sends the
 * confirmation email; the other finds them already booked. Calling it again
 * with the same payment is always safe.
 *
 * If the payment can't book its rooms (the hold expired and someone else
 * took them, or the reservation changed, e.g. it was paid twice), the
 * payment is refunded in full, the refund is noted on the reservations and
 * the guest is emailed, once.
 */
import repository from '@/lib/data/repository';
import {
  PaymentError,
  paidReservationIdsOf,
  verifyReservationPayment,
} from '@/lib/booking/payments';
import { groupIdsOf, RoomUnavailableError } from '@/lib/booking/reservations';
import {
  sendBookingConfirmation,
  sendRefundEmail,
} from '@/lib/booking/bookingEmails';
import { refundPayment } from '@/lib/payment-gateway/stripe';
import { CANCELLATION_REASON } from '@/lib/static/roomLegend';

export const OUTCOME = {
  BOOKED: 'booked',
  ALREADY_BOOKED: 'already-booked',
  REFUNDED: 'refunded',
};

const wasRefunded = (reservations, paymentIntentId) =>
  reservations.some((reservation) =>
    (reservation.refunds || []).some(
      (refund) => refund.paymentIntentId === paymentIntentId
    )
  );

/** "expired" if a room was released because its hold ran out, else "changed". */
const refundReasonFor = (reservations) =>
  reservations.some(
    (reservation) =>
      reservation.cancellationReason === CANCELLATION_REASON.EXPIRED
  )
    ? 'expired'
    : 'changed';

const refundUnusablePayment = async ({ paymentIntent, paid }) => {
  const reason = refundReasonFor(paid);
  const refund = await refundPayment({
    paymentIntentId: paymentIntent.id,
    reason,
  });
  const isNew = await repository.recordRefund(
    paid.map((reservation) => reservation.id),
    {
      paymentIntentId: paymentIntent.id,
      refundId: refund.id,
      amount: refund.amount,
      reason,
      at: new Date().toISOString(),
    }
  );
  if (isNew) {
    console.warn(
      `Payment ${paymentIntent.id} refunded (${reason}): it couldn't book reservations ${paid
        .map((reservation) => reservation.id)
        .join(', ')}`
    );
    await sendRefundEmail(paid, refund.amount, reason);
  }
  return { outcome: OUTCOME.REFUNDED, reason, reservations: paid };
};

/**
 * @param {object} paymentIntent - As fetched from Stripe (never as reported
 *   by the browser)
 * @param {string|null} [userId] - The signed-in guest paying (browser only;
 *   null for a guest checkout). Left as it is when undefined (webhook).
 * @returns {Promise<{ outcome, reason?, reservations }>}
 * @throws PaymentError if the payment isn't a valid, full payment for them
 */
export const completePaidBooking = async ({ paymentIntent, userId }) => {
  const paidIds = paidReservationIdsOf(paymentIntent);
  const paid =
    paidIds.length > 0 ? await repository.getReservationsByIds(paidIds) : [];

  // The rooms of one payment always belong to one booking
  if (
    paid.length === 0 ||
    paid.length !== paidIds.length ||
    !paid.every((reservation) => groupIdsOf(paid[0]).includes(reservation.id))
  ) {
    console.warn(
      `Payment ${paymentIntent.id} is for unknown reservations: ${paidIds.join(', ')}`
    );
    throw new PaymentError(402, 'Payment could not be verified.');
  }

  const paymentUpdates = verifyReservationPayment({
    reservations: paid,
    paymentIntent,
  });

  if (wasRefunded(paid, paymentIntent.id)) {
    return {
      outcome: OUTCOME.REFUNDED,
      reason: refundReasonFor(paid),
      reservations: paid,
    };
  }

  // NOTE: userId can't be verified without server-side auth (see README)
  const signedIn = typeof userId === 'string' && userId !== '';
  const accountUpdates =
    userId === undefined
      ? {}
      : { isGuest: !signedIn, userId: signedIn ? userId : null };

  try {
    const { alreadyBooked } = await repository.completeReservations(paidIds, {
      paymentIntentId: paymentIntent.id,
      updatesById: Object.fromEntries(
        Object.entries(paymentUpdates).map(([id, updates]) => [
          id,
          { ...updates, ...accountUpdates },
        ])
      ),
    });

    if (alreadyBooked) {
      // The other caller got there first. A guest who signed in to pay
      // still gets the booking on their account.
      if (
        signedIn &&
        paid.some((reservation) => reservation.userId !== userId)
      ) {
        await repository.updateReservations(
          Object.fromEntries(paidIds.map((id) => [id, accountUpdates]))
        );
      }
      return { outcome: OUTCOME.ALREADY_BOOKED, reservations: paid };
    }

    const booked = await repository.getReservationsByIds(paidIds);
    await sendBookingConfirmation(booked);
    return { outcome: OUTCOME.BOOKED, reservations: booked };
  } catch (error) {
    if (!(error instanceof RoomUnavailableError)) throw error;
    return refundUnusablePayment({ paymentIntent, paid });
  }
};
