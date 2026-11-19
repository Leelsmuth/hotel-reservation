import { releaseExpiredHolds } from '@/lib/booking/holds';
import { NextResponse } from 'next/server';

/**
 * Releases unpaid reservations whose hold has run out and emails their
 * guests (see lib/booking/holds.js). The API does this on every search,
 * booking and payment anyway; calling this on a schedule (e.g. every
 * 5 minutes) also sends the "expired" emails on time when the site is quiet.
 *
 * GET -> { released: [reservation ids] }
 *
 * If CRON_SECRET is set, requests need `Authorization: Bearer <CRON_SECRET>`
 * (what Vercel Cron sends).
 */
export async function GET(request) {
  const secret = process.env.CRON_SECRET;
  if (secret && request.headers.get('authorization') !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const released = await releaseExpiredHolds();
    return NextResponse.json({ released });
  } catch (error) {
    console.error('Could not release expired holds:', error);
    return NextResponse.json(
      { error: 'Could not release expired holds' },
      { status: 500 }
    );
  }
}
