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

export async function POST(request) {
  try {
    const bookingDetails = await request.json();
    const { bookingDates, updatePathId, ...reservationDetails } =
      bookingDetails;

    await runTransaction(db, async (transaction) => {
      const reservationRef = doc(collection(db, 'reservations'));

      const roomDocRef = doc(db, `rooms/${updatePathId}`);

      const roomDoc = await transaction.get(roomDocRef);
      if (!roomDoc.exists()) {
        throw new Error(
          `Room document with ID ${updatePathId} does not exist.`
        );
      }

      const existingBookings = roomDoc.data().bookings || [];
      if (isDateOverlap(existingBookings, bookingDates)) {
        throw new Error(
          'The new booking dates overlap with an existing booking.'
        );
      }

      transaction.set(reservationRef, {
        ...reservationDetails,
        bookingDates,
      });

      transaction.update(roomDocRef, {
        status: ROOM_STATUS.BOOKED,
        bookings: arrayUnion(bookingDates),
      });
    });

    return NextResponse.json({
      message: 'Reservation created successfully, and room updated',
      bookingId: reservationDetails.bookingId,
    });
  } catch (error) {
    console.error('Transaction failed:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
