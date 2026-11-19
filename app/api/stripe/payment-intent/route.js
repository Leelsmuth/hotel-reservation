import {
  PAYMENT_CURRENCY,
  PaymentError,
  quoteReservation,
} from '@/lib/booking/payments';
import {
  extendHoldsWhilePaying,
  releaseExpiredHoldsQuietly,
} from '@/lib/booking/holds';
import { createPaymentIntent } from '@/lib/payment-gateway/stripe';
import { NextResponse } from 'next/server';

/**
 * Creates a payment intent for a reservation. The amount is worked out on
 * the server from the reservation; the browser only says which reservation.
 * For a booking with several rooms, the payment covers every room of the
 * booking that is still awaiting payment.
 *
 * Body: { reservationId }  ->  { clientSecret, amount (dollars), reservationIds }
 */
export async function POST(req) {
  try {
    const { reservationId } = await req.json();

    if (!reservationId || typeof reservationId !== 'string') {
      return NextResponse.json(
        { error: 'reservationId is required' },
        { status: 400 }
      );
    }

    await releaseExpiredHoldsQuietly();
    const { reservation, reservations, amount, totalPrice } =
      await quoteReservation(reservationId);
    const reservationIds = reservations.map((r) => r.id);

    const paymentIntent = await createPaymentIntent({
      amount,
      currency: PAYMENT_CURRENCY,
      // Lets the booking step check which reservations the payment was made
      // for (metadata values are strings of up to 500 characters)
      metadata: {
        reservationId,
        reservationIds: reservationIds.join(','),
        bookingId: reservation.bookingId,
      },
    });

    // A guest paying near the end of the hold gets a few more minutes
    await extendHoldsWhilePaying(reservations);

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
      amount: totalPrice,
      reservationIds,
    });
  } catch (error) {
    if (error instanceof PaymentError) {
      return NextResponse.json(
        { error: error.message, code: error.code },
        { status: error.status }
      );
    }
    console.error('Error creating payment intent:', error);
    return NextResponse.json(
      { error: 'Could not set up the payment. Please try again.' },
      { status: 500 }
    );
  }
}
