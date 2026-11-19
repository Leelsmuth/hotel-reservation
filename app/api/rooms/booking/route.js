import { releaseExpiredHoldsQuietly } from '@/lib/booking/holds';
import { loadBooking } from '@/lib/booking/loadBooking';
import { completePaidBooking, OUTCOME } from '@/lib/booking/completeBooking';
import { paidReservationIdsOf, PaymentError } from '@/lib/booking/payments';
import { retrievePaymentIntent } from '@/lib/payment-gateway/stripe';
import { NextResponse } from 'next/server';

/**
 * GET ?id=reservationId -> the reservation, plus `groupReservations`: every
 * room of its booking (itself included), in the order they were booked.
 */
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

    await releaseExpiredHoldsQuietly();
    const booking = await loadBooking(reservationId);

    if (!booking) {
      return NextResponse.json(
        { error: 'Reservation not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      ...booking.reservation,
      groupReservations: booking.rooms,
    });
  } catch (error) {
    console.error('Error fetching reservation document:', error);
    return NextResponse.json(
      { error: 'Failed to fetch reservation' },
      { status: 500 }
    );
  }
}

/**
 * Completes a booking after payment (the browser, right after paying).
 *
 * Body: { reservationId, bookingId, paymentIntentId, userId? }
 *
 * The payment is fetched from Stripe and must have succeeded, for rooms of
 * this booking, in full. Stripe also reports it to /api/stripe/webhook;
 * whichever arrives first books the rooms (lib/booking/completeBooking.js),
 * so repeating this call is safe.
 *
 * -> 200 booked (or already booked)
 * -> 409 { code: "refunded" } the payment couldn't book the rooms (e.g. the
 *    hold expired and they were taken) and has been refunded in full
 */
export async function PATCH(request) {
  try {
    const { reservationId, bookingId, paymentIntentId, userId } =
      await request.json();

    if (!reservationId || !bookingId || !paymentIntentId) {
      return NextResponse.json(
        {
          error:
            'Missing reservationId, bookingId or paymentIntentId in the request body',
        },
        { status: 400 }
      );
    }

    const booking = await loadBooking(reservationId);
    if (!booking) {
      return NextResponse.json(
        { error: 'Reservation not found' },
        { status: 404 }
      );
    }

    let paymentIntent;
    try {
      paymentIntent = await retrievePaymentIntent(paymentIntentId);
    } catch (error) {
      console.warn(`Unknown payment ${paymentIntentId}:`, error.message);
      return NextResponse.json(
        { error: 'Payment could not be verified.' },
        { status: 402 }
      );
    }

    // Only a payment for rooms of this booking can complete it
    const bookingRoomIds = booking.rooms.map((room) => room.id);
    const paidIds = paidReservationIdsOf(paymentIntent);
    if (
      paidIds.length === 0 ||
      !paidIds.every((id) => bookingRoomIds.includes(id))
    ) {
      console.warn(
        `Payment ${paymentIntentId} is not for booking ${booking.reservation.bookingId}`
      );
      return NextResponse.json(
        { error: 'Payment could not be verified.' },
        { status: 402 }
      );
    }

    const { outcome, reason } = await completePaidBooking({
      paymentIntent,
      // NOTE: userId can't be verified without server-side auth (see README)
      userId: typeof userId === 'string' && userId ? userId : null,
    });

    if (outcome === OUTCOME.REFUNDED) {
      return NextResponse.json(
        {
          code: 'refunded',
          error:
            reason === 'expired'
              ? "Your reservation expired before your payment went through, and its rooms have been booked by someone else. We've refunded your payment in full."
              : "Your reservation changed before your payment went through (it may already be paid for or cancelled). We've refunded this payment in full.",
        },
        { status: 409 }
      );
    }

    return NextResponse.json({
      message: 'Reservation updated successfully',
      reservationId,
      bookingId,
    });
  } catch (error) {
    if (error instanceof PaymentError) {
      return NextResponse.json(
        { error: error.message, code: error.code },
        { status: error.status }
      );
    }
    console.error('Error updating reservation:', error);
    return NextResponse.json(
      { error: 'Failed to update reservation' },
      { status: 500 }
    );
  }
}

export async function POST(request) {}
