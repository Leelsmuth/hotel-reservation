import { db } from '@/lib/firebase/firebase';
import { ROOM_STATUS } from '@/lib/static/roomLegend';
import {
  addDoc,
  arrayUnion,
  collection,
  doc,
  getDocs,
  query,
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
    const bookingDetails = await request.json();

    const { bookingDates, updatePathId, ...reservationDetails } =
      bookingDetails;

    const reservationRef = await addDoc(
      collection(db, 'reservations'),
      reservationDetails
    );

    const roomDocRef = doc(db, `rooms/${updatePathId}`);

    await updateDoc(roomDocRef, {
      status: ROOM_STATUS.BOOKED,
      bookings: arrayUnion(bookingDates), // Use `arrayUnion` to add the new booking object without overwriting the array
    });

    return NextResponse.json({
      message: 'Reservation created successfully',
      reservationId: reservationRef.id,
      bookingId: reservationDetails.bookingId,
    });
  } catch (error) {
    console.error('Failed to create reservation or update room:', error);
    return NextResponse.json(
      { error: 'Failed to create reservation or update room' },
      { status: 500 }
    );
  }
}
