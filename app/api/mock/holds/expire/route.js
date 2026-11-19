/**
 * Mock mode only: ends holds now instead of in an hour, to try expiry
 * without waiting (used by `npm run mock:expire-holds`).
 *
 * Body: { bookingId? }  the booking to expire; all unpaid bookings if left out
 *   -> 200 { released: [{ bookingId, reservationIds }] }
 *   -> 404 if no unpaid reservation has that booking ID
 *
 * It moves the hold's end (`holdExpiresAt`) into the past and then runs the
 * normal release (lib/booking/holds.js), so what follows is exactly what
 * happens after a real hour: cancelled with reason "expired", rooms freed,
 * "Reservation expired" email in the terminal. An open payment page can
 * still pay afterwards, to try late payments (booked if the rooms are still
 * free, refunded if not).
 */
import { USE_MOCKS } from '@/lib/config/mockMode';
import { releaseExpiredHolds } from '@/lib/booking/holds';
import repository from '@/lib/data/repository';
import { RESERVATION_STATUS } from '@/lib/static/roomLegend';
import { NextResponse } from 'next/server';

export async function POST(request) {
  if (!USE_MOCKS) {
    return NextResponse.json({ message: 'Not found' }, { status: 404 });
  }

  const { bookingId } = await request.json().catch(() => ({}));
  if (bookingId !== undefined && typeof bookingId !== 'string') {
    return NextResponse.json(
      { error: 'bookingId must be a string' },
      { status: 400 }
    );
  }

  const unpaid = (
    await repository.findReservationsByStatus(RESERVATION_STATUS.RESERVED)
  ).filter(
    (reservation) =>
      !bookingId || reservation.bookingId === bookingId.trim().toUpperCase()
  );
  if (bookingId && unpaid.length === 0) {
    return NextResponse.json(
      {
        error: `No reservation awaiting payment has booking ID ${bookingId}. It may already be paid, cancelled or expired.`,
      },
      { status: 404 }
    );
  }

  // The hold ended a second ago (keeping when it was made, so the email
  // goes out like after a real hour)
  const ended = new Date(Date.now() - 1000).toISOString();
  if (unpaid.length > 0) {
    await repository.updateReservations(
      Object.fromEntries(
        unpaid.map((reservation) => [
          reservation.id,
          {
            holdExpiresAt: ended,
            createdAt: reservation.createdAt ?? ended,
          },
        ])
      )
    );
  }
  const releasedIds = await releaseExpiredHolds();

  const released = {};
  unpaid
    .filter((reservation) => releasedIds.includes(reservation.id))
    .forEach((reservation) => {
      released[reservation.bookingId] ??= [];
      released[reservation.bookingId].push(reservation.id);
    });
  return NextResponse.json({
    released: Object.entries(released).map(([id, reservationIds]) => ({
      bookingId: id,
      reservationIds,
    })),
  });
}
