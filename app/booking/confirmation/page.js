'use client';

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
    <div>
      <h1>Reservation Successful!</h1>
      <p>
        A confirmation email will be sent to you shortly your Booking ID:{' '}
        {reservationCode}. Please note that you will not be eligible for a
        refund if you cancel your booking after 48 hours.
      </p>
      <div className="flex gap-6">
        <StyledLink linkText="Return to Homepage" path="/" />
      </div>
    </div>
  );
};

export default BookingConfirmation;
