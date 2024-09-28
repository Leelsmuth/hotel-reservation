// app/context/BookingContext.js
'use client';

import { createContext, useContext, useState } from 'react';

const BookingContext = createContext();

export function BookingProvider({ children }) {
  const [bookingDetails, setBookingDetails] = useState({
    checkInDate: null,
    checkOutDate: null,
    roomTypeId: '',
    roomId: '',
    guestCount: 1,
    guestDetails: [],
    roomPrice: 0,
    tax: 0,
    totalPrice: 0,
    paymentDetails: null,
    isGuest: false,
    userId: null,
    bookingId: '',
  });

  const updateBooking = (newDetails) => {
    setBookingDetails((prevDetails) => ({
      ...prevDetails,
      ...newDetails,
    }));
  };

  return (
    <BookingContext.Provider value={{ bookingDetails, updateBooking }}>
      {children}
    </BookingContext.Provider>
  );
}

export const useBooking = () => {
  useContext(BookingContext);
};
