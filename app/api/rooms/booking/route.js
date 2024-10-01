import { db } from '@/lib/firebase/firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { NextResponse } from 'next/server';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const reservationId = searchParams.get('id');

    if (!reservationId) {
      return NextResponse.json(
        { error: 'Missing reservation ID in query parameters' },
        { status: 400 }
      );
    }

    const reservationRef = doc(db, 'reservations', reservationId);
    const reservationSnapshot = await getDoc(reservationRef);

    if (!reservationSnapshot.exists()) {
      return NextResponse.json(
        { error: 'Reservation not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      id: reservationSnapshot.id,
      ...reservationSnapshot.data(),
    });
  } catch (error) {
    console.error('Error fetching reservation document:', error);
    return NextResponse.json(
      { error: 'Failed to fetch reservation' },
      { status: 500 }
    );
  }
}

export async function PATCH(request) {
  try {
    const { reservationId, updates, bookingId } = await request.json();

    if (!reservationId || !updates || !bookingId) {
      return NextResponse.json(
        {
          error:
            'Missing reservationId or updates or bookingId in the request body',
        },
        { status: 400 }
      );
    }

    const reservationRef = doc(db, 'reservations', reservationId);

    await updateDoc(reservationRef, {
      ...updates,
    });

    return NextResponse.json({
      message: 'Reservation updated successfully',
      reservationId,
      bookingId,
    });
  } catch (error) {
    console.error('Error updating reservation:', error);
    return NextResponse.json(
      { error: 'Failed to update reservation' },
      { status: 500 }
    );
  }
}

export async function POST(request) {}
