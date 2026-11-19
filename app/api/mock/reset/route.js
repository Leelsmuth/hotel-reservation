/**
 * Mock mode only: puts the dummy data back as it was when the server
 * started (fresh demo reservations, rooms, users and holds), without a
 * restart. Used by the browser tests before each test; handy for QA too.
 *
 * POST -> 200 { reset: true, seededAt }
 */
import { USE_MOCKS } from '@/lib/config/mockMode';
import { resetMockStore } from '@/lib/mock/store';
import { NextResponse } from 'next/server';

export async function POST() {
  if (!USE_MOCKS) {
    return NextResponse.json({ message: 'Not found' }, { status: 404 });
  }
  const { seededAt } = resetMockStore();
  return NextResponse.json({ reset: true, seededAt });
}
