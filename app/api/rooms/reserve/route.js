import {
  allocateRooms,
  bookingPricingOf,
  buildReservations,
  isPetFriendly,
  ReservationInputError,
  roomRequestsOf,
  RoomUnavailableError,
  sortByRoomOrder,
  validateReservationInput,
} from '@/lib/booking/reservations';
import { newBookingId } from '@/lib/booking/bookingIds';
import { newHold, releaseExpiredHoldsQuietly } from '@/lib/booking/holds';
import repository from '@/lib/data/repository';
import { NextResponse } from 'next/server';

/**
 * Looks up a booking by its booking ID and contact email.
 *
 * -> { reservation, reservations }: `reservations` are all the rooms of the
 *    booking, in the order they were booked; `reservation` is the first.
 */
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const bookingId = searchParams.get('bookingId');
    const email = searchParams.get('email');

    if (!bookingId || !email) {
      return NextResponse.json(
        { error: 'Missing bookingId or email in query parameters' },
        { status: 400 }
      );
    }

    await releaseExpiredHoldsQuietly();
    const reservations = await repository.findReservationsByBookingIdAndEmail(
      bookingId,
      email
    );

    if (reservations.length === 0) {
      return NextResponse.json(
        {
          message: 'No reservation found with the provided bookingId and email',
          isEmpty: true,
        },
        { status: 404 }
      );
    }

    const ordered = sortByRoomOrder(reservations);
    return NextResponse.json({
      reservation: ordered[0],
      reservations: ordered,
    });
  } catch (error) {
    console.error('Failed to fetch reservation:', error);
    return NextResponse.json(
      { error: 'Failed to fetch reservation' },
      { status: 500 }
    );
  }
}

/**
 * Reserves one or more rooms for the same stay, as one booking.
 *
 * Body: { rooms: [{ typeId, adults, children, pets }], bookingDates,
 *         contactDetails, userId?, ... }
 *   The booking ID is made here; one sent by the browser is ignored.
 *   (older shapes with a `guestCount` per room, or the single-room
 *   { updatePathId, guestCount }, still work: those guests are adults)
 *
 * -> { bookingId, reservationId (first room), reservationIds,
 *      holdExpiresAt, pricing }
 *    `pricing` has the combined totals and `pricing.rooms` each room's.
 *
 * The server picks a free room of each requested type (pet-friendly for
 * rooms with pets) and reserves them all or none (409 if there aren't enough
 * free rooms any more).
 */
export async function POST(request) {
  try {
    const input = await request.json();

    try {
      validateReservationInput(input);
    } catch (error) {
      if (error instanceof ReservationInputError) {
        return NextResponse.json({ error: error.message }, { status: 400 });
      }
      throw error;
    }

    // Free the rooms of unpaid reservations whose hold has run out first
    await releaseExpiredHoldsQuietly();

    const requests = roomRequestsOf(input);
    let rooms;

    if ('pathId' in requests[0]) {
      // Older single-room requests name the exact room
      const room = await repository.getRoom(requests[0].pathId);
      if (!room) {
        return NextResponse.json(
          { error: `Room ${requests[0].pathId} does not exist.` },
          { status: 404 }
        );
      }
      if (requests[0].pets > 0 && !isPetFriendly(room)) {
        return NextResponse.json(
          { error: 'This room does not take pets.' },
          { status: 409 }
        );
      }
      rooms = [{ room, request: requests[0] }];
    } else {
      const { bookedFrom, bookedUntil } = input.bookingDates;
      const freeRooms = await repository.findFreeRooms(
        new Date(bookedFrom),
        new Date(bookedUntil)
      );
      rooms = allocateRooms(requests, freeRooms);
    }

    // Price, status and room details come from the server, never the request
    const reservations = buildReservations({
      input,
      rooms,
      discounts: await repository.getDiscounts(),
      bookingId: await newBookingId(),
      hold: newHold(),
    });

    const { bookingId, reservationIds } =
      await repository.createReservations(reservations);

    return NextResponse.json({
      message:
        reservations.length === 1
          ? 'Reservation created successfully, and room updated'
          : `Reservation created successfully for ${reservations.length} rooms`,
      bookingId,
      reservationId: reservationIds[0],
      reservationIds,
      holdExpiresAt: reservations[0].holdExpiresAt,
      pricing: bookingPricingOf(
        reservations.map((reservation, index) => ({
          ...reservation,
          id: reservationIds[index],
        }))
      ),
    });
  } catch (error) {
    if (error instanceof RoomUnavailableError) {
      return NextResponse.json({ error: error.message }, { status: 409 });
    }
    console.error('Transaction failed:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
