'use client';

import Checkmark from '@/components/icons/Checkmark';
import Container from '@/components/layout/Container';
import HeadingOne from '@/components/typography/HeadingOne';
import AltStyledButton from '@/components/ui/AltStyledButton';
import StyledLink from '@/components/ui/StyledLink';
import { useBooking } from '@/context/BookingContext';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';

const ReservationConfirmation = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { bookingDetails, updateBooking, resetBookingDetails } = useBooking();

  const [reservationId, setReservationId] = useState('');
  const [bookingId, setBookingId] = useState('');

  const bookingHandler = () => {
    router.replace(`/booking?resId=${reservationId}&bId=${bookingId}`);
  };

  useEffect(() => {
    const resId = searchParams.get('resId');
    const bId = searchParams.get('bId');
    console.log(bookingDetails);

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
          <StyledLink linkText="Return to Homepage" path="/" />
          <AltStyledButton
            btnText="Proceed to Booking"
            clickHandler={bookingHandler}
          />
        </div>
      </div>
    </Container>
  );
};

export default ReservationConfirmation;
