import { releaseExpiredHoldsQuietly } from '@/lib/booking/holds';
import { isPetFriendly } from '@/lib/booking/reservations';
import { nightsBetween } from '@/lib/pricing/bookingPrice';
import repository from '@/lib/data/repository';
import { NextResponse } from 'next/server';

/**
 * Rooms free for a stay.
 *
 * GET ?startDate=yyyy-MM-dd&endDate=yyyy-MM-dd ->
 *   availableRooms:  { [typeId]: room | null }  one free room of each type
 *   availableCounts: { [typeId]: number }       how many rooms of each type
 *                                               are free (for multi-room bookings)
 *   petFriendlyCounts: { [typeId]: number }     how many of those take pets
 */
export async function GET(request) {
  try {
    const url = new URL(request.url);
    const startDate = url.searchParams.get('startDate');
    const endDate = url.searchParams.get('endDate');
    const nights = nightsBetween(startDate, endDate);
    if (!Number.isInteger(nights) || nights < 1) {
      return NextResponse.json(
        {
          error:
            'startDate and endDate must be yyyy-MM-dd dates, with endDate after startDate.',
        },
        { status: 400 }
      );
    }
    const desiredStartDate = new Date(startDate);
    const desiredEndDate = new Date(endDate);

    // Rooms held by unpaid reservations past their hour are free again
    await releaseExpiredHoldsQuietly();
    const freeRooms = await repository.findFreeRooms(
      desiredStartDate,
      desiredEndDate
    );

    const availableRooms = {};
    const availableCounts = {};
    const petFriendlyCounts = {};
    for (const [typeId, rooms] of Object.entries(freeRooms)) {
      availableRooms[typeId] = rooms[0] ?? null;
      availableCounts[typeId] = rooms.length;
      petFriendlyCounts[typeId] = rooms.filter(isPetFriendly).length;
    }

    return NextResponse.json({
      availableRooms,
      availableCounts,
      petFriendlyCounts,
    });
  } catch (error) {
    console.error('Error fetching available rooms:', error);
    return NextResponse.json(
      { error: 'Failed to fetch available rooms' },
      { status: 500 }
    );
  }
}

export async function POST(request) {}
