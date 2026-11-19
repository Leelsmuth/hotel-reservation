/**
 * Handles the Stripe webhook events the hotel uses (server-only).
 *
 * payment_intent.succeeded: completes the booking the payment was for
 * (lib/booking/completeBooking.js), so it's booked even if the guest closed
 * the tab before the browser could report the payment. The payment is
 * fetched again from Stripe rather than taken from the event.
 */
import { completePaidBooking } from '@/lib/booking/completeBooking';
import { PaymentError, paidReservationIdsOf } from '@/lib/booking/payments';
import { retrievePaymentIntent } from '@/lib/payment-gateway/stripe';

export const handleStripeEvent = async (event) => {
  if (event?.type !== 'payment_intent.succeeded') {
    return { ignored: true };
  }

  let paymentIntent;
  try {
    paymentIntent = await retrievePaymentIntent(event.data?.object?.id);
  } catch (error) {
    // Retrying won't help: report it as unusable rather than failed
    throw new PaymentError(400, `Unknown payment: ${error.message}`);
  }
  if (paidReservationIdsOf(paymentIntent).length === 0) {
    // Not a payment for a reservation
    return { ignored: true };
  }
  return completePaidBooking({ paymentIntent });
};
