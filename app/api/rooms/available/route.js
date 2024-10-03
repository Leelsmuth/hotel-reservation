import { db } from '@/lib/firebase/firebase';
import { isRoomAvailableForDateRange } from '@/lib/helpers/isRoomAvailableForDateRange';
import { ROOM_TYPES_IDS } from '@/lib/static/roomLegend';
import { collection, getDocs, limit, query, where } from 'firebase/firestore';
import { NextResponse } from 'next/server';

export async function GET(request) {
  try {
    const roomTypes = Object.values(ROOM_TYPES_IDS);

    const url = new URL(request.url);
    const desiredStartDate = new Date(url.searchParams.get('startDate'));
    const desiredEndDate = new Date(url.searchParams.get('endDate'));

    const results = {};

    for (const type of roomTypes) {
      const availableRoomQuery = query(
        collection(db, 'rooms'),
        where('status', '==', 'available'),
        where('typeId', '==', type),
        limit(1)
      );

      const availableSnapshot = await getDocs(availableRoomQuery);

      // Step 2: If there is an available room, prioritize it
      if (!availableSnapshot.empty) {
        availableSnapshot.forEach((doc) => {
          results[type] = {
            pathId: doc.id,
            ...doc.data(),
          };
        });
        continue; // Move to the next room type
      }

      // Step 3: If no available room, check booked rooms with the `bookings` array
      const bookedRoomQuery = query(
        collection(db, 'rooms'),
        where('status', '==', 'booked'),
        where('typeId', '==', type)
      );

      const bookedSnapshot = await getDocs(bookedRoomQuery);

      let foundAvailableRoom = null;

      // Check each booked room to see if it's free during the desired date range
      bookedSnapshot.forEach((doc) => {
        const roomData = doc.data();

        // Check if this room is available for the given date range
        if (
          isRoomAvailableForDateRange(
            roomData.bookings,
            desiredStartDate,
            desiredEndDate
          )
        ) {
          foundAvailableRoom = {
            pathId: doc.id,
            ...roomData,
          };
        }
      });

      // If an available room is found based on date range, use it; otherwise, set to null
      results[type] = foundAvailableRoom || null;
    }

    // Return the result as JSON
    return NextResponse.json({ availableRooms: results });
  } catch (error) {
    console.error('Error fetching available rooms:', error);
    return NextResponse.json(
      { error: 'Failed to fetch available rooms' },
      { status: 500 }
    );
  }
}

export async function POST(request) {}
