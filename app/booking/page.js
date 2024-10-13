// pages/Booking.js
'use client';

import Spinner from '@/components/anim/Spinner';
import Container from '@/components/layout/Container';
import StripeCheckout from '@/components/payment/StripeCheckout';
import HeadingOne from '@/components/typography/HeadingOne';
import { useAuth } from '@/context/AuthProvider';
import { useBooking } from '@/context/BookingContext';
import { RESERVATION_STATUS } from '@/lib/static/roomLegend';
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

  const { updateBooking, updateIsGuest, updateUserId } = useBooking();
  const { user } = useAuth();

  const fetchReservation = async (reservationId) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/rooms/booking?id=${reservationId}`);
      if (!response.ok) throw new Error(`Error: ${response.statusText}`);

      const data = await response.json();
      setBookingDetails(data);
      updateBooking(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const completeBooking = async (paymentIntent) => {
    const updates = {
      paymentDetails: {
        paymentStatus: 'COMPLETED',
        paymentIntentId: paymentIntent.id,
        paymentAmount: paymentIntent.amount,
      },
      bookingStatus: RESERVATION_STATUS.BOOKED,
    };

    setIsSubmitting(true);
    try {
      const response = await fetch('/api/rooms/booking', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reservationId, updates, bookingId }),
      });

      if (!response.ok) {
        throw new Error(`Error updating reservation: ${response.statusText}`);
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
    } catch (error) {
      console.error('Error:', error);
    }
  };

  useEffect(() => {
    if (user) {
      updateIsGuest(false);
      updateUserId(user.uid);
    }
  }, [user]);

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
          <HeadingOne>Complete Booking</HeadingOne>
          {!isSubmitting && (
            <Fragment>
              <div>Total Price: $ {bookingDetails?.totalPrice}</div>
              <StripeCheckout
                amount={bookingDetails?.totalPrice}
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
