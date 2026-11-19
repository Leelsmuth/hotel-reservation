import { loadBooking } from '@/lib/booking/loadBooking';
import repository from '@/lib/data/repository';
import { CANCELLATION_REASON } from '@/lib/static/roomLegend';
import { NextResponse } from 'next/server';

/**
 * Cancels a reservation and frees its room.
 *
 * Body: { reservationId, scope? }
 *   scope "room" (default): just this room
 *   scope "booking": every room of its booking
 *
 * The room and dates to free come from the stored reservation. (Older
 * clients also send roomId, bookedFrom and bookedUntil; they're ignored.)
 * Rooms that are already cancelled, checked in or checked out are left as
 * they are.
 */
export async function PATCH(request) {
  try {
    const { reservationId, scope = 'room' } = await request.json();

    if (!reservationId || typeof reservationId !== 'string') {
      return NextResponse.json(
        { error: 'Missing required fields in request body' },
        { status: 400 }
      );
    }
    if (scope !== 'room' && scope !== 'booking') {
      return NextResponse.json(
        { error: 'scope must be "room" or "booking"' },
        { status: 400 }
      );
    }

    const booking = await loadBooking(reservationId);
    if (!booking) {
      return NextResponse.json(
        { error: 'Reservation not found' },
        { status: 404 }
      );
    }

    const ids =
      scope === 'booking'
        ? booking.rooms.map((room) => room.id)
        : [reservationId];
    const cancelledIds = await repository.cancelReservations(ids, {
      reason: CANCELLATION_REASON.GUEST,
    });

    if (cancelledIds.length === 0) {
      return NextResponse.json(
        {
          error:
            'This reservation is already cancelled, checked in or checked out.',
        },
        { status: 409 }
      );
    }

    const rooms =
      cancelledIds.length === 1 ? '' : ` (${cancelledIds.length} rooms)`;
    return NextResponse.json({
      message: `Reservation cancelled successfully${rooms}.`,
      messageFull: `Reservations ${cancelledIds.join(', ')} cancelled successfully, and their rooms updated.`,
      cancelledIds,
    });
  } catch (error) {
    console.error('Error cancelling reservation or updating room:', error);
    return NextResponse.json(
      { error: 'Failed to cancel reservation or update room' },
      { status: 500 }
    );
  }
}
