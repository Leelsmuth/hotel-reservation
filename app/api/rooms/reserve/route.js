import {
  buildReservation,
  pricingOf,
  ReservationInputError,
  validateReservationInput,
} from '@/lib/booking/reservations';
import repository from '@/lib/data/repository';
import { NextResponse } from 'next/server';

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

    const reservation = await repository.findReservationByBookingIdAndEmail(
      bookingId,
      email
    );

    if (!reservation) {
      return NextResponse.json(
        {
          message: 'No reservation found with the provided bookingId and email',
          isEmpty: true,
        },
        { status: 404 }
      );
    }

    return NextResponse.json({ reservation });
  } catch (error) {
    console.error('Failed to fetch reservation:', error);
    return NextResponse.json(
      { error: 'Failed to fetch reservation' },
      { status: 500 }
    );
  }
}

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

    const room = await repository.getRoom(input.updatePathId);
    if (!room) {
      return NextResponse.json(
        { error: `Room ${input.updatePathId} does not exist.` },
        { status: 404 }
      );
    }

    // Price, status and room details come from the server, never the request
    const reservation = buildReservation({
      input,
      room,
      discounts: await repository.getDiscounts(),
    });

    const { bookingId, reservationId } =
      await repository.createReservation(reservation);

    return NextResponse.json({
      message: 'Reservation created successfully, and room updated',
      bookingId,
      reservationId,
      pricing: pricingOf(reservation),
    });
  } catch (error) {
    console.error('Transaction failed:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
