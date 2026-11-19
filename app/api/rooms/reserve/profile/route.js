import { releaseExpiredHoldsQuietly } from '@/lib/booking/holds';
import repository from '@/lib/data/repository';
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

    await releaseExpiredHoldsQuietly();
    const reservations = await repository.findReservationsByUser(
      userId,
      bookingStatus
    );

    if (reservations.length === 0) {
      return NextResponse.json(
        {
          message: `No ${bookingStatus} reservation found`,
        },
        { status: 404 }
      );
    }

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
