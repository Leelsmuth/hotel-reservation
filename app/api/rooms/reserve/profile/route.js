import { db } from '@/lib/firebase/firebase';
import { isDateOverlap } from '@/lib/helpers/isDateOverlap';
import { ROOM_STATUS } from '@/lib/static/roomLegend';
import {
  arrayUnion,
  collection,
  doc,
  getDocs,
  query,
  runTransaction,
  where,
} from 'firebase/firestore';
import { NextResponse } from 'next/server';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const bookingStatus = searchParams.get('bookingStatus');
    const userId = searchParams.get('userId');

    if (!bookingStatus || !userId) {
      return NextResponse.json(
        { error: 'Missing bookingStatus or userId in query parameters' },
        { status: 400 }
      );
    }

    const reservationsRef = collection(db, 'reservations');
    const reservationQuery = query(
      reservationsRef,
      where('bookingStatus', '==', bookingStatus),
      where('userId', '==', userId)
    );

    const querySnapshot = await getDocs(reservationQuery);

    if (querySnapshot.empty) {
      return NextResponse.json(
        {
          message: `No ${bookingStatus} reservation found`,
        },
        { status: 404 }
      );
    }

    let reservations = [];
    querySnapshot.forEach((doc) => {
      reservations.push({ id: doc.id, ...doc.data() });
    });

    return NextResponse.json({ reservations });
  } catch (error) {
    console.error('Failed to fetch reservation:', error);
    return NextResponse.json(
      { error: 'Failed to fetch reservation' },
      { status: 500 }
    );
  }
}

export async function POST(request) {}
