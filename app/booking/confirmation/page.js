'use client';

import StyledButton from '@/components/ui/StyledButton';
import StyledLink from '@/components/ui/StyledLink';
import { useSearchParams } from 'next/navigation';

const BookingConfirmation = () => {
  const searchParams = useSearchParams();
  const [reservationCode, setReservationCode] = useState('');

  useEffect(() => {
    const rCode = searchParams.get('rCode');

    if (rCode) {
      setReservationCode(rCode);
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
        <StyledButton
          btnText="Proceed to Booking"
          clickHandler={bookingHandler}
        />
      </div>
    </div>
  );
};

export default BookingConfirmation;
