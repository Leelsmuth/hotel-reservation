import {
  PAYMENT_CURRENCY,
  PaymentError,
  quoteReservation,
} from '@/lib/booking/payments';
import { createPaymentIntent } from '@/lib/payment-gateway/stripe';
import { NextResponse } from 'next/server';

/**
 * Creates a payment intent for a reservation. The amount is worked out on
 * the server from the reservation; the browser only says which reservation.
 *
 * Body: { reservationId }  ->  { clientSecret, amount (dollars) }
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

    const { reservation, amount, totalPrice } =
      await quoteReservation(reservationId);

    const paymentIntent = await createPaymentIntent({
      amount,
      currency: PAYMENT_CURRENCY,
      // Lets the booking step check the payment was made for this reservation
      metadata: { reservationId, bookingId: reservation.bookingId },
    });

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
      amount: totalPrice,
    });
  } catch (error) {
    if (error instanceof PaymentError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error('Error creating payment intent:', error);
    return NextResponse.json(
      { error: 'Could not set up the payment. Please try again.' },
      { status: 500 }
    );
  }
}
