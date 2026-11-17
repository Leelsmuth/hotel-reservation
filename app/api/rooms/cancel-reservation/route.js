import repository from '@/lib/data/repository';
import { NextResponse } from 'next/server';

export async function PATCH(request) {
  try {
    const { reservationId, roomId, bookedFrom, bookedUntil } =
      await request.json();

    if (!reservationId || !roomId || !bookedFrom || !bookedUntil) {
      return NextResponse.json(
        { error: 'Missing required fields in request body' },
        { status: 400 }
      );
    }

    await repository.cancelReservation({
      reservationId,
      roomId,
      bookedFrom,
      bookedUntil,
    });

    return NextResponse.json({
      message: `Reservation cancelled successfully.`,
      messageFull: `Reservation ${reservationId} cancelled successfully, and room ${roomId} updated.`,
    });
  } catch (error) {
    console.error('Error cancelling reservation or updating room:', error);
    return NextResponse.json(
      { error: 'Failed to cancel reservation or update room' },
      { status: 500 }
    );
  }
}

export async function POST(request) {}
