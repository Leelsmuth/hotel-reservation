// pages/Booking.js
'use client';

import Spinner from '@/components/anim/Spinner';
import Container from '@/components/layout/Container';
import StripeCheckout from '@/components/payment/StripeCheckout';
import HeadingOne from '@/components/typography/HeadingOne';
import { useAuth } from '@/context/AuthProvider';
import { useBooking } from '@/context/BookingContext';
import {
  RESERVATION_STATUS,
  ROOM_MAIN_PICTURES,
  ROOM_TYPES_NAMES,
} from '@/lib/static/roomLegend';
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

  const { updateBooking, updateIsGuest, updateUserId } = useBooking();
  const { user } = useAuth();

  const fetchReservation = async (reservationId) => {
    // setLoading(true);
    setError(null);
    setBookingDetails({
      id: 'k6HPgYB12fKPnHMEglfh',
      paymentDetails: {
        paymentMode: 'PAYPAL',
        currency: 'USD',
        payerDetails: {
          email_address: 'loadedclient@personal.example.com',
          payer_id: 'ZQHKUUTJC5JS8',
          name: {
            given_name: 'Jonathan',
            surname: 'Jinadu',
          },
          address: {
            country_code: 'CA',
          },
        },
        paymentStatus: 'COMPLETED',
        amountPaid: '169.50',
        paymentId: '0B984214VW926542C',
        paidOn: '2024-10-03T14:34:16Z',
        payInitiated: '2024-10-03T14:34:02Z',
      },
      nightsCount: 1,
      isGuest: true,
      bookingId: 'AZIOIRZGA1',
      guestCount: '2',
      discount: 0,
      roomTypeId: 'dStandard',
      checkOutDate: '2024-10-03T18:00:29.123Z',
      guestDetails: [
        {
          name: 'Jonathan Lee',
          age: '25',
        },
        {
          age: '28',
          name: 'Trish Lee',
        },
      ],
      checkInDate: '2024-10-02T18:00:29.123Z',
      roomId: '0CgKQ7NHaYh2yNRTN1rc',
      subtotal: 150,
      discountAmount: 0,
      bookingStatus: 'reserved',
      contactDetails: {
        email: 'lori.sullivan0204@gmail.com',
        phone: '08053529911',
        name: 'Jonathan lee',
      },
      roomPrice: 150,
      userId: null,
      tax: 19.5,
      bookingDates: {
        bookedFrom: '2024-10-02',
        bookedUntil: '2024-10-03',
      },
      totalPrice: 169.5,
    });

    return;

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
          {!isSubmitting && (
            <Fragment>
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
