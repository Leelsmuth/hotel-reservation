'use client';

import StyledButton from '@/components/ui/StyledButton';
import StyledLink from '@/components/ui/StyledLink';
import { useRouter, useSearchParams } from 'next/navigation';

const ReservationConfirmation = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [reservationCode, setReservationCode] = useState('');
  const [bookingId, setBookingId] = useState('');

  const bookingHandler = () => {
    router.replace(
      `/booking?rCode=${data.bookingId}&bId=${data.reservationId}`
    );
  };

  useEffect(() => {
    const rCode = searchParams.get('rCode');
    const bId = searchParams.get('bId');

    if (rCode) {
      setReservationCode(rCode);
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
        {reservationCode} . Please note that your reservation will be only held
        for an hour and will be lost if not booked before then.
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
