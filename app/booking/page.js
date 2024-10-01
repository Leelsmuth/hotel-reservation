'use client';

import PayPalButton from '@/components/payment/PayPalButton';
import { useBooking } from '@/context/BookingContext';

const Booking = () => {
  const { bookingDetails, updateBooking } = useBooking();
  console.log(bookingDetails);

  const handlePaymentSuccess = (details) => {
    console.log('Transaction completed by ' + details.payer.name.given_name);
    alert('Payment successful! Transaction ID: ' + details.id);
  };

  const handlePaymentError = (error) => {
    console.error('Payment failed: ', error);
    alert('Payment failed. Please try again.');
  };

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
