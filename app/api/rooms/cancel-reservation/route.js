import { db } from '@/lib/firebase/firebase';
import { arrayRemove, doc, runTransaction } from 'firebase/firestore';
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

    await runTransaction(db, async (transaction) => {
      const reservationRef = doc(db, 'reservations', reservationId);
      const reservationDoc = await transaction.get(reservationRef);
      if (!reservationDoc.exists()) {
        throw new Error(`Reservation with ID ${reservationId} does not exist.`);
      }

      const roomRef = doc(db, 'rooms', roomId);
      const roomDoc = await transaction.get(roomRef);
      if (!roomDoc.exists()) {
        throw new Error(`Room with ID ${roomId} does not exist.`);
      }

      const existingBookings = roomDoc.data().bookings || [];

      const bookingToRemove = { bookedFrom, bookedUntil };

      transaction.update(reservationRef, { bookingStatus: 'cancelled' });

      transaction.update(roomRef, {
        bookings: arrayRemove(bookingToRemove),
      });

      if (existingBookings.length === 1) {
        transaction.update(roomRef, { status: 'available' });
      }
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
