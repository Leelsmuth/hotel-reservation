import { db } from '@/lib/firebase/firebase';
import {
  arrayRemove,
  collection,
  doc,
  getDocs,
  query,
  runTransaction,
  where,
} from 'firebase/firestore';
import { NextResponse } from 'next/server';

export async function PATCH(request) {
  try {
    // Step 1: Extract required fields from the request body
    const { reservationId, roomId, bookedFrom, bookedUntil } =
      await request.json();

    // Validate that all required fields are provided
    if (!reservationId || !roomId || !bookedFrom || !bookedUntil) {
      return NextResponse.json(
        { error: 'Missing required fields in request body' },
        { status: 400 }
      );
    }

    // Step 2: Query to find the specific room document using the `id` field in the `rooms` collection
    const roomQuery = query(collection(db, 'rooms'), where('id', '==', roomId));
    const roomSnapshot = await getDocs(roomQuery);

    if (roomSnapshot.empty) {
      return NextResponse.json(
        { error: `Room with ID ${roomId} not found.` },
        { status: 404 }
      );
    }

    // Assuming only one document matches the `id` field, retrieve the document reference
    const roomDocRef = roomSnapshot.docs[0].ref;

    // Step 3: Run a Firestore transaction to update both the reservations and rooms collections atomically
    await runTransaction(db, async (transaction) => {
      // Reference to the reservation document
      const reservationRef = doc(db, 'reservations', reservationId);

      // Retrieve the reservation document
      const reservationDoc = await transaction.get(reservationRef);
      if (!reservationDoc.exists()) {
        throw new Error(`Reservation with ID ${reservationId} does not exist.`);
      }

      // Retrieve the room document
      const roomDoc = await transaction.get(roomDocRef);
      const existingBookings = roomDoc.data().bookings || [];

      // Remove the booking that matches `bookedFrom` and `bookedUntil`
      const bookingToRemove = { bookedFrom, bookedUntil };

      // Step 4: Update the reservation status to "cancelled"
      transaction.update(reservationRef, { bookingStatus: 'cancelled' });

      // Step 5: Update the room's bookings by removing the specific booking dates
      transaction.update(roomDocRef, {
        bookings: arrayRemove(bookingToRemove),
      });

      // Step 6: If this was the only booking, update the room status to "available"
      if (existingBookings.length === 1) {
        transaction.update(roomDocRef, { status: 'available' });
      }
    });

    // Step 7: Return a success response
    return NextResponse.json({
      message: `Reservation ${reservationId} cancelled successfully, and room ${roomId} updated.`,
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
