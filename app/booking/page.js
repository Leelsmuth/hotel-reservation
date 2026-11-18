// pages/Booking.js
'use client';

import Container from '@/components/layout/Container';
import StripeCheckout from '@/components/payment/StripeCheckout';
import BookingSteps from '@/components/booking/BookingSteps';
import StaySummary from '@/components/booking/StaySummary';
import Alert from '@/components/ui/Alert';
import Button from '@/components/ui/Button';
import Icon from '@/components/ui/Icon';
import LoadingState from '@/components/ui/LoadingState';
import { getRoomByType } from '@/lib/static/roomCatalog';
import { useAuth } from '@/context/AuthProvider';
import { useBooking } from '@/context/BookingContext';
import { useToast } from '@/context/ToastContext';
import { RESERVATION_STATUS, ROOM_TYPES_NAMES } from '@/lib/static/roomLegend';
import { handleError } from '@/lib/toast/handleError';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';

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

  const room = bookingDetails ? getRoomByType(bookingDetails.roomTypeId) : null;
  const missingReservation = !searchParams.get('resId');

  return (
    <div className="bg-sand-50/60 pb-16 sm:pb-20">
      <Container classes="pt-8 sm:pt-10">
        <BookingSteps current={4} className="mb-8" />
        <p className="eyebrow mb-2">Secure checkout</p>
        <h1 className="mb-2 font-display text-3xl font-semibold tracking-tight text-ink-900 sm:text-4xl">
          Confirm and pay
        </h1>
        {missingReservation ? (
          <Alert
            tone="info"
            className="mt-6"
            title="No reservation selected"
            action={
              <div className="flex flex-wrap gap-3">
                <Button size="sm" href="/manage-reservation">
                  Find my reservation
                </Button>
                <Button size="sm" variant="secondary" href="/make-reservation">
                  Book a room
                </Button>
              </div>
            }
          >
            Open this page from your reservation confirmation, or look up your
            reservation with its booking ID.
          </Alert>
        ) : loading || (!bookingDetails && !error) ? (
          <LoadingState
            label="Loading your reservation…"
            className="min-h-[50vh]"
          />
        ) : error && !bookingDetails ? (
          <Alert
            tone="error"
            className="mt-6"
            title="We couldn't load your reservation"
            action={
              <Button
                size="sm"
                variant="secondary"
                onClick={() => fetchReservation(reservationId)}
              >
                Try again
              </Button>
            }
          >
            {error}
          </Alert>
        ) : (
          <div>
            <p className="max-w-2xl text-ink-600">
              Your room is reserved. Pay now to confirm your booking.
            </p>

            <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1fr)_400px] lg:gap-12">
              <aside className="lg:sticky lg:top-24 lg:col-start-2 lg:row-start-1 lg:self-start">
                <StaySummary
                  heading="Booking summary"
                  room={
                    room ?? {
                      name: ROOM_TYPES_NAMES[bookingDetails?.roomTypeId],
                    }
                  }
                  checkIn={bookingDetails?.bookingDates.bookedFrom}
                  checkOut={bookingDetails?.bookingDates.bookedUntil}
                  nights={bookingDetails?.nightsCount}
                  guests={bookingDetails?.guestCount}
                  bookingId={bookingId || bookingDetails?.bookingId}
                  price={{
                    roomPrice: bookingDetails?.roomPrice,
                    nights: bookingDetails?.nightsCount,
                    discount: bookingDetails?.discount,
                    discountAmount: bookingDetails?.discountAmount,
                    tax: bookingDetails?.tax,
                    total: bookingDetails?.totalPrice,
                    totalLabel: 'Total to pay (CAD)',
                  }}
                />
              </aside>
              <div className="space-y-6 lg:col-start-1 lg:row-start-1">
                <section
                  aria-labelledby="policy-title"
                  className="card p-5 sm:p-6"
                >
                  <h2
                    id="policy-title"
                    className="font-display text-xl font-semibold text-ink-900"
                  >
                    Before you pay
                  </h2>
                  <p className="mt-1 text-sm text-ink-600">
                    By paying you agree to the following:
                  </p>
                  <ul className="mt-4 space-y-3 text-sm text-ink-700">
                    <li className="flex gap-2.5">
                      <Icon
                        name="check"
                        className="mt-0.5 h-4 w-4 text-gold-700"
                        strokeWidth={2}
                      />
                      All bookings are final.
                    </li>
                    <li className="flex gap-2.5">
                      <Icon
                        name="check"
                        className="mt-0.5 h-4 w-4 text-gold-700"
                        strokeWidth={2}
                      />
                      Cancelling a booking incurs a penalty of 30% of the
                      booking cost.
                    </li>
                  </ul>
                </section>

                <section
                  aria-labelledby="payment-title"
                  className="card p-5 sm:p-6"
                >
                  <div className="mb-5 flex items-center justify-between gap-3">
                    <h2
                      id="payment-title"
                      className="font-display text-xl font-semibold text-ink-900"
                    >
                      Payment
                    </h2>
                    <span className="flex items-center gap-1.5 text-xs font-medium text-ink-600">
                      <Icon name="lock" className="h-4 w-4 text-green-700" />
                      Secure payment
                    </span>
                  </div>
                  {!isSubmitting && unconfirmedPayment && (
                    <Alert
                      tone="error"
                      title="Your payment went through, but we couldn't confirm your booking yet."
                      action={
                        <Button
                          size="sm"
                          variant="dark"
                          onClick={() =>
                            completeBooking(unconfirmedPayment.paymentIntent)
                          }
                        >
                          Try again
                        </Button>
                      }
                    >
                      {unconfirmedPayment.reason && (
                        <p>{unconfirmedPayment.reason}</p>
                      )}
                      <p>
                        Please don't pay again. Try again, or contact us with
                        payment reference{' '}
                        <span className="font-mono font-semibold">
                          {unconfirmedPayment.paymentIntent.id}
                        </span>
                        .
                      </p>
                    </Alert>
                  )}
                  {!isSubmitting && !unconfirmedPayment && (
                    <StripeCheckout
                      // Wait for the reservation so we don't set up a payment for
                      // one that isn't payable (the page redirects away instead)
                      reservationId={bookingDetails ? reservationId : null}
                      onPaymentSuccess={completeBooking} // Pass completeBooking as a callback
                      amount={bookingDetails?.totalPrice}
                    />
                  )}
                </section>
              </div>
            </div>
          </div>
        )}
      </Container>
      {isSubmitting && (
        <LoadingState overlay label="Confirming your booking…" />
      )}
    </div>
  );
};

export default Booking;
