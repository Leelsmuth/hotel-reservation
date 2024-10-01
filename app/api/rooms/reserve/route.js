import { db } from '@/lib/firebase/firebase';
import { isDateOverlap } from '@/lib/helpers/isDateOverlap';
import { ROOM_STATUS } from '@/lib/static/roomLegend';
import {
  addDoc,
  arrayUnion,
  collection,
  doc,
  getDocs,
  query,
  runTransaction,
  updateDoc,
  where,
} from 'firebase/firestore';
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

    const reservationsRef = collection(db, 'reservations');
    const reservationQuery = query(
      reservationsRef,
      where('bookingId', '==', bookingId),
      where('contactDetails.email', '==', email)
    );

    const querySnapshot = await getDocs(reservationQuery);

    if (querySnapshot.empty) {
      return NextResponse.json(
        {
          message: 'No reservation found with the provided bookingId and email',
        },
        { status: 404 }
      );
    }

    let reservation = null;
    querySnapshot.forEach((doc) => {
      reservation = { id: doc.id, ...doc.data() };
    });

    return NextResponse.json({ reservation });
  } catch (error) {
    console.error('Failed to fetch reservation:', error);
    return NextResponse.json(
      { error: 'Failed to fetch reservation' },
      { status: 500 }
    );
  }
}

export async function PUT(request) {
  try {
    // Step 1: Parse the request body to extract booking details
    const bookingDetails = await request.json();
    const { bookingDates, updatePathId, ...reservationDetails } =
      bookingDetails;

    // Step 2: Run a Firestore transaction to ensure atomic operations
    await runTransaction(db, async (transaction) => {
      // Reference for the new reservation document
      const reservationRef = doc(collection(db, 'reservations'));

      // Reference to the specific room document that needs to be updated
      const roomDocRef = doc(db, `rooms/${updatePathId}`);

      // Step 3: Read the current room document to get its existing bookings
      const roomDoc = await transaction.get(roomDocRef);
      if (!roomDoc.exists()) {
        throw new Error(
          `Room document with ID ${updatePathId} does not exist.`
        );
      }

      // Step 4: Check if the room is already booked for the given date range
      const existingBookings = roomDoc.data().bookings || [];
      if (isDateOverlap(existingBookings, bookingDates)) {
        throw new Error(
          'The new booking dates overlap with an existing booking.'
        );
      }

      // Step 5: If no overlap, create the new reservation and update the room bookings
      transaction.set(reservationRef, {
        ...reservationDetails,
        bookingDates,
      });

      // Step 6: Update the room's bookings field and maintain the room status as "booked"
      transaction.update(roomDocRef, {
        status: ROOM_STATUS.BOOKED, // Keep the room status as booked if it has any booking
        bookings: arrayUnion(bookingDates), // Add the new booking to the bookings array
      });
    });

    // Step 7: Return a success response
    return NextResponse.json({
      message: 'Reservation created successfully, and room updated',
      bookingId: reservationDetails.bookingId,
    });
  } catch (error) {
    console.error('Transaction failed:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// export async function PUT(request) {
//   try {
//     const bookingDetails = await request.json();

//     const { bookingDates, updatePathId, ...reservationDetails } =
//       bookingDetails;

//     const reservationRef = await addDoc(
//       collection(db, 'reservations'),
//       reservationDetails
//     );

//     const roomDocRef = doc(db, `rooms/${updatePathId}`);

//     await updateDoc(roomDocRef, {
//       status: ROOM_STATUS.BOOKED,
//       bookings: arrayUnion(bookingDates),
//     });

//     return NextResponse.json({
//       message: 'Reservation created successfully',
//       reservationId: reservationRef.id,
//       bookingId: reservationDetails.bookingId,
//     });
//   } catch (error) {
//     console.error('Failed to create reservation or update room:', error);
//     return NextResponse.json(
//       { error: 'Failed to create reservation or update room' },
//       { status: 500 }
//     );
//   }
// }
