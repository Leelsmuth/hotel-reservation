'use client';

import PayPalButton from '@/components/payment/PayPalButton';
import { useRouter, useSearchParams } from 'next/navigation';

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

  const handlePaymentSuccess = (details) => {
    console.log('Transaction completed by ' + details.payer.name.given_name);
    alert('Payment successful! Transaction ID: ' + details.id);
  };

  const handlePaymentError = (error) => {
    console.error('Payment failed: ', error);
    alert('Payment failed. Please try again.');
  };

  const completeBooking = async () => {
    const updates = {};

    try {
      const response = await fetch('/api/rooms/booking', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ reservationId, updates, bookingId }),
      });

      if (!response.ok) {
        throw new Error(`Error updating reservation: ${response.statusText}`);
      }

      const data = await response.json();
      console.log('Reservation updated successfully:', data);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  useEffect(() => {
    const rCode = searchParams.get('rCode');
    const bId = searchParams.get('bId');

    if (rCode) {
      setReservationId(rCode);
      fetchReservation(rCode);
    }
    if (bId) {
      setBookingId(bId);
    }
  }, [searchParams]);

  return (
    <div>
      <h1>Checkout</h1>
      <div>Total Price: $ {bookingDetails.totalPrice}</div>
      <PayPalButton
        amount={bookingDetails.totalPrice}
        onSuccess={handlePaymentSuccess}
        onError={handlePaymentError}
      />
    </div>
  );
};

export default Booking;
