'use client';

import Checkmark from '@/components/icons/Checkmark';
import Container from '@/components/layout/Container';
import HeadingOne from '@/components/typography/HeadingOne';
import AltStyledButton from '@/components/ui/AltStyledButton';
import AltStyledLink from '@/components/ui/AltStyledLink';
import StyledButton from '@/components/ui/StyledButton';
import { useAuth } from '@/context/AuthProvider';
import { useBooking } from '@/context/BookingContext';
import { useRouter, useSearchParams } from 'next/navigation';
import { Fragment, useEffect, useState } from 'react';

const ReservationConfirmation = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const {
    bookingDetails,
    updateBooking,
    resetBookingDetails,
    updateIsGuest,
    updateUserId,
  } = useBooking();
  const { user } = useAuth();

  const [reservationId, setReservationId] = useState('');
  const [bookingId, setBookingId] = useState('');

  const bookingHandler = () => {
    if (user) {
      updateIsGuest(false);
      updateUserId(user.uid);
    }
    router.replace(`/booking?resId=${reservationId}&bId=${bookingId}`);
  };

  const handleBookingLogin = () => {
    const redirectUrl = `/booking?resId=${reservationId}&bId=${bookingId}`;
    router.push(`/login?redirectTo=${encodeURIComponent(redirectUrl)}`);
  };

  const handleBookingSignup = () => {
    const redirectUrl = `/booking?resId=${reservationId}&bId=${bookingId}`;
    router.push(`/signup?redirectTo=${encodeURIComponent(redirectUrl)}`);
  };

  useEffect(() => {
    const resId = searchParams.get('resId');
    const bId = searchParams.get('bId');

    if (resId) {
      setReservationId(resId);
    }
    if (bId) {
      setBookingId(bId);
    }
  }, [searchParams]);
  return (
    <Container classes="my-10">
      <div className="max-w-[500px] p-4 md:p-8 mx-auto shadow-2xl">
        <HeadingOne classes="text-center mb-8">
          Reservation Successful!
        </HeadingOne>
        <div className="text-center">
          <Checkmark classes="w-32 h-32 mx-auto" />
        </div>
        <p>
          A confirmation email will be sent to you shortly your Reservation ID:{' '}
          {bookingId} . Please note that your reservation will be only held for
          an hour and will be lost if not booked before then.
        </p>
        <div className="flex flex-col text-center gap-6 mt-6">
          <AltStyledLink linkText="Return to Homepage" path="/" />
          {user ? (
            <StyledButton
              btnText="Proceed to Booking"
              clickHandler={bookingHandler}
            />
          ) : (
            <Fragment>
              <div className="text-2xl font-bold">OR</div>
              <div>
                <div className="text-xl mb-2">Proceed to Booking:</div>
                <div className=" flex flex-col gap-4 justify-center px-4">
                  <StyledButton
                    btnText="Existing customer? Login"
                    clickHandler={handleBookingLogin}
                  />
                  <AltStyledButton
                    btnText="New customer? Create account"
                    clickHandler={handleBookingSignup}
                  />
                  <StyledButton
                    btnText="Continue as Guest"
                    clickHandler={bookingHandler}
                  />
                </div>
              </div>
            </Fragment>
          )}
        </div>
      </div>
      <div className="h-60"></div>
    </Container>
  );
};

export default ReservationConfirmation;
