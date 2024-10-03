'use client';

import StyledButton from '@/components/ui/StyledButton';
import StyledLink from '@/components/ui/StyledLink';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';

const ReservationConfirmation = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [reservationId, setReservationId] = useState('');
  const [bookingId, setBookingId] = useState('');

  const bookingHandler = () => {
    router.replace(`/booking?resId=${reservationId}&bId=${bookingId}`);
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
    <div>
      <h1>Reservation Successful!</h1>
      <p>
        A confirmation email will be sent to you shortly your Reservation ID:{' '}
        {bookingId} . Please note that your reservation will be only held for an
        hour and will be lost if not booked before then.
      </p>
      <div className="flex gap-6">
        <StyledLink linkText="Return to Homepage" path="/" />
        <StyledButton
          btnText="Proceed to Booking"
          clickHandler={bookingHandler}
        />
      </div>
    </div>
  );
};

export default ReservationConfirmation;
