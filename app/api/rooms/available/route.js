import repository from '@/lib/data/repository';
import { NextResponse } from 'next/server';

export async function GET(request) {
  try {
    const url = new URL(request.url);
    const desiredStartDate = new Date(url.searchParams.get('startDate'));
    const desiredEndDate = new Date(url.searchParams.get('endDate'));

    const results = await repository.findAvailableRooms(
      desiredStartDate,
      desiredEndDate
    );

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
