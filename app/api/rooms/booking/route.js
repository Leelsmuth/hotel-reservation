import { PaymentError, verifyReservationPayment } from '@/lib/booking/payments';
import repository from '@/lib/data/repository';
import { retrievePaymentIntent } from '@/lib/payment-gateway/stripe';
import { RESERVATION_STATUS } from '@/lib/static/roomLegend';
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

    const reservation = await repository.getReservationById(reservationId);

    if (!reservation) {
      return NextResponse.json(
        { error: 'Reservation not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(reservation);
  } catch (error) {
    console.error('Error fetching reservation document:', error);
    return NextResponse.json(
      { error: 'Failed to fetch reservation' },
      { status: 500 }
    );
  }
}

/**
 * Completes a booking after payment.
 *
 * Body: { reservationId, bookingId, paymentIntentId, userId? }
 *
 * The payment is fetched from Stripe and must have succeeded, for this
 * reservation, for the full amount. The browser can no longer send arbitrary
 * `updates` (that let anyone mark a reservation as paid without paying).
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

    const success = NextResponse.json({
      message: 'Reservation updated successfully',
      reservationId,
      bookingId,
    });

    const reservation = await repository.getReservationById(reservationId);
    if (!reservation) {
      return NextResponse.json(
        { error: 'Reservation not found' },
        { status: 404 }
      );
    }

    // Retrying with the payment that already booked it (double submit, retry
    // after a network error) is fine
    if (
      reservation.bookingStatus === RESERVATION_STATUS.BOOKED &&
      reservation.paymentDetails?.paymentIntentId === paymentIntentId
    ) {
      return success;
    }
    if (reservation.bookingStatus !== RESERVATION_STATUS.RESERVED) {
      return NextResponse.json(
        { error: 'This reservation is already booked or cancelled.' },
        { status: 409 }
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

    const paymentUpdates = verifyReservationPayment({
      reservation,
      paymentIntent,
    });

    // NOTE: userId can't be verified without server-side auth (see README)
    const signedInUserId =
      typeof userId === 'string' && userId ? userId : null;

    await repository.updateReservation(reservationId, {
      ...paymentUpdates,
      isGuest: !signedInUserId,
      userId: signedInUserId,
    });

    return success;
  } catch (error) {
    if (error instanceof PaymentError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error('Error updating reservation:', error);
    return NextResponse.json(
      { error: 'Failed to update reservation' },
      { status: 500 }
    );
  }
}

export async function POST(request) {}
