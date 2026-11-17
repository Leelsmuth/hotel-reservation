// pages/Booking.js
'use client';

import Spinner from '@/components/anim/Spinner';
import Container from '@/components/layout/Container';
import StripeCheckout from '@/components/payment/StripeCheckout';
import HeadingOne from '@/components/typography/HeadingOne';
import { useAuth } from '@/context/AuthProvider';
import { useBooking } from '@/context/BookingContext';
import { useToast } from '@/context/ToastContext';
import {
  RESERVATION_STATUS,
  ROOM_MAIN_PICTURES,
  ROOM_TYPES_NAMES,
} from '@/lib/static/roomLegend';
import { handleError } from '@/lib/toast/handleError';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import { Fragment, useEffect, useState } from 'react';

const Booking = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [reservationId, setReservationId] = useState('');
  const [bookingId, setBookingId] = useState('');
  const [bookingDetails, setBookingDetails] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  // A payment that succeeded but couldn't be turned into a booking yet. Never
  // show the payment form again for it (that would charge the guest twice);
  // completing the booking again with the same payment is safe.
  const [unconfirmedPayment, setUnconfirmedPayment] = useState(null);

  const { updateBooking, updateIsGuest, updateUserId, resetBookingDetails } =
    useBooking();
  const { user } = useAuth();
  const { showToast } = useToast();

  const fetchReservation = async (reservationId) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/rooms/booking?id=${reservationId}`);
      if (!response.ok) {
        if (response.status === 404) {
          setBookingDetails(null);
          setLoading(false);
          router.replace('/');
          return;
        }
        setError(`Error: ${response.statusText}`);
        return;
      }

      const data = await response.json();
      if (data.bookingStatus !== RESERVATION_STATUS.RESERVED) {
        setLoading(false);
        router.replace('/');
        return;
      }
      setBookingDetails(data);
      updateBooking(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // The server checks the payment with Stripe before marking it booked
  const completeBooking = async (paymentIntent) => {
    setUnconfirmedPayment(null);
    setIsSubmitting(true);
    try {
      const response = await fetch('/api/rooms/booking', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reservationId,
          bookingId,
          paymentIntentId: paymentIntent.id,
          userId: user ? user.uid : null,
        }),
      });

      if (!response.ok) {
        const { error: reason } = await response.json().catch(() => ({}));
        handleError(
          showToast,
          reason
            ? `We couldn't complete your booking: ${reason}`
            : 'Oops! Something went wrong.'
        );
        setUnconfirmedPayment({ paymentIntent, reason });
        setIsSubmitting(false);
        return;
      }

      const data = await response.json();

      await fetch('/api/send-confirmation-email/booking', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          recipient: bookingDetails.contactDetails.email,
          bookingDetails,
        }),
      });

      router.replace(`/booking/confirmation?bId=${data.bookingId}`);
      resetBookingDetails();
    } catch (error) {
      console.error('Error:', error);
      handleError(showToast, 'Oops! Something went wrong.');
      setUnconfirmedPayment({ paymentIntent, reason: null });
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    if (user) {
      updateIsGuest(false);
      updateUserId(user.uid);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  // TODO: re-route all transations that have a booking status other then 'reserved'

  useEffect(() => {
    const resId = searchParams.get('resId');
    const bId = searchParams.get('bId');

    if (resId) {
      setReservationId(resId);
      fetchReservation(resId);
    }
    if (bId) {
      setBookingId(bId);
    }
  }, [searchParams]);

  return (
    <Container classes="my-10">
      {loading ? (
        <div className="min-h-screen text-center max-w-screen-lg mx-auto">
          <Spinner
            spinnerColor="text-primary"
            spinnerHeight="h-1/5"
            spinnerWidth="w-1/5"
          />
        </div>
      ) : (
        <div>
          <h1 className="text-4xl text-primary text-center uppercase font-bold">
            Complete Booking
          </h1>
          <div className="text-xl">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 mb-6 text-center">
              <div>
                <div>Check in</div>
                <div className="text-primary text-xl underline">
                  {bookingDetails?.bookingDates.bookedFrom}
                </div>
              </div>
              <div>
                <div>Check out</div>
                <div className="text-primary text-xl underline">
                  {bookingDetails?.bookingDates.bookedUntil}
                </div>
              </div>
              <div>
                <div>Room & Guest</div>
                <div className="text-primary text-xl underline">
                  1 room, {bookingDetails?.guestCount} guests
                </div>
              </div>
            </div>
            <hr />
            <div className="my-6">
              <div className="mb-10 text-black">
                <h4 className="font-semibold">
                  By proceeding you agree to the following:
                </h4>
                <ul className="text-xl list-disc ms-6">
                  <li>All bookings are final</li>
                  <li>
                    Booking cancellation shall attract penalty charge of 30% on
                    initial booking cost.
                  </li>
                  {/* <li>
                    The hotel will offer free cancellation up to 48 hours before
                    check- in otherwise a penalty charge of 30% on initial
                    booking cost will be applied.
                  </li> */}
                </ul>
              </div>
              <div>
                <h2 className="text-3xl font-bold">
                  {ROOM_TYPES_NAMES[bookingDetails?.roomTypeId]}
                </h2>
                <div className="grid grid-cols-2 mb-4">
                  <div>
                    {bookingDetails?.roomPrice} x {bookingDetails?.nightsCount}{' '}
                    nights
                  </div>
                  <div className="text-right">
                    $
                    {(
                      bookingDetails?.roomPrice * bookingDetails?.nightsCount
                    ).toFixed(2)}
                  </div>
                </div>
                <div className="grid grid-cols-2 mb-4">
                  <div>Taxes and fees</div>
                  <div className="text-right">
                    ${bookingDetails?.tax.toFixed(2)}
                  </div>
                </div>
                <div className="grid grid-cols-2 mb-4">
                  <div>Discount</div>
                  <div className="text-right">
                    ${bookingDetails?.discountAmount.toFixed(2)}
                  </div>
                </div>
              </div>
            </div>
            <hr />
            <div className="my-6">
              <div className="mb-8">
                <div className="grid grid-cols-2">
                  <div>Total CAD (Taxes included)</div>
                  <div className="text-right">
                    ${bookingDetails?.totalPrice.toFixed(2)}
                  </div>
                </div>
              </div>
            </div>
          </div>
          {!isSubmitting && unconfirmedPayment && (
            <div
              role="alert"
              className="rounded-xl border border-red-300 bg-red-50 p-4 text-base text-red-800"
            >
              <p className="font-semibold">
                Your payment went through, but we couldn't confirm your
                booking yet.
              </p>
              {unconfirmedPayment.reason && (
                <p>{unconfirmedPayment.reason}</p>
              )}
              <p className="mb-3">
                Please don't pay again. Try again, or contact us with payment
                reference{' '}
                <span className="font-mono">
                  {unconfirmedPayment.paymentIntent.id}
                </span>
                .
              </p>
              <button
                type="button"
                className="bg-alternate text-black border-black border hover:bg-black hover:text-alternate text-lg transition-colors rounded-xl px-4 py-2"
                onClick={() => completeBooking(unconfirmedPayment.paymentIntent)}
              >
                Try again
              </button>
            </div>
          )}
          {!isSubmitting && !unconfirmedPayment && (
            <Fragment>
              <StripeCheckout
                // Wait for the reservation so we don't set up a payment for
                // one that isn't payable (the page redirects away instead)
                reservationId={bookingDetails ? reservationId : null}
                onPaymentSuccess={completeBooking} // Pass completeBooking as a callback
              />
            </Fragment>
          )}
          {isSubmitting && (
            <div className="min-h-screen flex justify-center items-center max-w-screen-lg mx-auto fixed inset-0">
              <Spinner
                spinnerColor="text-primary"
                spinnerHeight="h-1/5"
                spinnerWidth="w-1/5"
              />
            </div>
          )}
        </div>
      )}
    </Container>
  );
};

export default Booking;
