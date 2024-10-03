'use client';

import Spinner from '@/components/anim/Spinner';
import PayPalButton from '@/components/payment/PayPalButton';
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

  const fetchReservation = async (reservationId) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/rooms/booking?id=${reservationId}`);

      if (!response.ok) {
        throw new Error(`Error: ${response.statusText}`);
      }

      const data = await response.json();
      setBookingDetails(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const completeBooking = async (paymentDetails) => {
    const updates = {
      paymentDetails,
      bookingStatus: RESERVATION_STATUS.BOOKED,
    };

    try {
      const response = await fetch('/api/rooms/booking', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ reservationId, updates, bookingId }),
      });

      if (!response.ok) {
        throw new Error(`Error updating reservation: ${response.statusText}`);
      }

      const data = await response.json();

      router.replace(`/booking/confirmation?bId=${data.bookingId}`);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const handlePaymentSuccess = (details) => {
    const paymentDetails = {
      paymentMode: 'PAYPAL',
      paymentId: details.id,
      currency: details.purchase_units[0].amount.currency_code,
      amountPaid: details.purchase_units[0].amount.value,
      paymentStatus: details.status,
      payInitiated: details.create_time,
      paidOn: details.update_time,
      payerDetails: details.payer,
    };

    completeBooking(paymentDetails);
  };

  const handlePaymentError = (error) => {
    console.error('Payment failed: ', error);
    alert('Payment failed. Please try again.');
  };

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
    <Fragment>
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
          <h1>Checkout</h1>
          <div>Total Price: $ {bookingDetails?.totalPrice}</div>
          <PayPalButton
            amount={bookingDetails?.totalPrice}
            onSuccess={handlePaymentSuccess}
            onError={handlePaymentError}
          />
        </div>
      )}
    </Fragment>
  );
};

export default Booking;
