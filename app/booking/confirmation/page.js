'use client';

import Checkmark from '@/components/icons/Checkmark';
import Container from '@/components/layout/Container';
import HeadingOne from '@/components/typography/HeadingOne';
import StyledLink from '@/components/ui/StyledLink';
import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';

const BookingConfirmation = () => {
  const searchParams = useSearchParams();
  const [reservationCode, setReservationCode] = useState('');

  useEffect(() => {
    const bId = searchParams.get('bId');

    if (bId) {
      setReservationCode(bId);
    }
  }, [searchParams]);
  return (
    <Container classes="my-10">
      <div className="max-w-[500px] p-4 md:p-8 mx-auto shadow-2xl">
        <HeadingOne classes="text-center mb-8">Booking Successful!</HeadingOne>
        <div className="text-center">
          <Checkmark classes="w-32 h-32 mx-auto" />
        </div>
        <p>
          A confirmation email will be sent to you shortly your Booking ID:{' '}
          {reservationCode}. Please note that Booking cancellation attracts a
          penalty charge of 30% of initial booking cost.
        </p>
        <div className="flex flex-col text-center gap-6 mt-6">
          <StyledLink linkText="Return to Homepage" path="/" />
        </div>
      </div>
    </Container>
  );
};

export default BookingConfirmation;
