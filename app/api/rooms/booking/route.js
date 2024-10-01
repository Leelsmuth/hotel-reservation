import { db } from '@/lib/firebase/firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { NextResponse } from 'next/server';

export async function GET(request) {
  try {
    // Parse the URL to extract the reservation ID from the query parameters
    const { searchParams } = new URL(request.url);
    const reservationId = searchParams.get('id'); // Retrieve the document ID (e.g., `id=abc123`)

    // Validate that the ID parameter is provided
    if (!reservationId) {
      return NextResponse.json(
        { error: 'Missing reservation ID in query parameters' },
        { status: 400 }
      );
    }

    // Reference to the specific document in the "reservations" collection
    const reservationRef = doc(db, 'reservations', reservationId);

    // Retrieve the document from Firestore
    const reservationSnapshot = await getDoc(reservationRef);

    // Check if the document exists
    if (!reservationSnapshot.exists()) {
      return NextResponse.json(
        { error: 'Reservation not found' },
        { status: 404 }
      );
    }

    // Return the document data as a JSON response
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

export async function POST(request) {
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

    // Step 4: Return a success response
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
