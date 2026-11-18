'use client';

import { createContext, useContext, useState, useEffect } from 'react';
import differenceInCalendarDays from 'date-fns/differenceInCalendarDays';
import addDays from 'date-fns/addDays';
import { subscribeToDiscounts } from '@/lib/data/discounts';
import {
  calculateBookingPrice,
  discountForNights,
} from '@/lib/pricing/bookingPrice';
// import { DISCOUNT } from '@/lib/static/roomLegend';

const BookingContext = createContext();

export const BookingProvider = ({ children }) => {
  const [bookingDetails, setBookingDetails] = useState({
    checkInDate: new Date(),
    checkOutDate: addDays(new Date(), 1),
    nightsCount: 1,
    discount: 0,
    discountAmount: 0,
    roomTypeId: '',
    roomId: '',
    roomNo: null,
    guestCount: 1,
    guestCountActual: 1,
    guestDetails: [],
    roomPrice: 0,
    tax: 0,
    subtotal: 0,
    totalPrice: 0,
    paymentDetails: null,
    isGuest: true,
    bookingStatus: 'reserved',
    userId: null,
    checkedInBy: null,
    checkedOutBy: null,
    contactDetails: { fullName: '', email: '', phone: '' },
  });

  const [discounts, setDiscounts] = useState({
    ELEVEN: 0,
    TWENTYONE: 0,
    THIRTYPLUS: 0,
  });
  // False until the first discount values arrive, so the UI doesn't
  // advertise "0% off" while they load
  const [discountsLoaded, setDiscountsLoaded] = useState(false);

  useEffect(() => {
    const unsubscribe = subscribeToDiscounts((discountData) => {
      setDiscountsLoaded(true);
      setDiscounts({
        ELEVEN: discountData.ELEVEN || 0,
        TWENTYONE: discountData.TWENTYONE || 0,
        THIRTYPLUS: discountData.THIRTYPLUS || 0,
      });
    });

    return () => unsubscribe();
  }, []);

  // Display only: the server prices the stay itself (lib/pricing/bookingPrice)
  const updateRoomPrice = (roomPrice) => {
    const { tax, subtotal, totalPrice, discountAmount } = calculateBookingPrice({
      roomPrice,
      nights: bookingDetails.nightsCount,
      discount: bookingDetails.discount,
    });

    setBookingDetails((prev) => ({
      ...prev,
      roomPrice,
      tax,
      subtotal,
      totalPrice,
      discountAmount,
    }));
  };

  const updateDates = (checkInDate, checkOutDate) => {
    const numOfNights = differenceInCalendarDays(checkOutDate, checkInDate);
    const applicableDiscount = discountForNights(numOfNights, discounts);

    setBookingDetails((prev) => ({
      ...prev,
      checkInDate,
      checkOutDate,
      discount: applicableDiscount,
      nightsCount: numOfNights,
    }));
  };

  const updateRoomSelection = (roomTypeId, roomId, roomNo) => {
    setBookingDetails((prev) => ({
      ...prev,
      roomTypeId,
      roomId,
      roomNo,
    }));
  };

  const updateGuestCount = (guestCount, guestCountActual) => {
    setBookingDetails((prev) => ({
      ...prev,
      guestCount,
      guestCountActual,
    }));
  };

  const updateGuestDetails = (guestDetails) => {
    setBookingDetails((prev) => ({
      ...prev,
      guestDetails,
    }));
  };

  const updatePaymentDetails = (paymentDetails) => {
    setBookingDetails((prev) => ({
      ...prev,
      paymentDetails,
    }));
  };

  const updateBookingStatus = (bookingStatus) => {
    setBookingDetails((prev) => ({
      ...prev,
      bookingStatus,
    }));
  };

  const updateIsGuest = (isGuest) => {
    setBookingDetails((prev) => ({
      ...prev,
      isGuest,
    }));
  };

  const updateContactDetails = (contactDetails) => {
    setBookingDetails((prev) => ({
      ...prev,
      contactDetails,
    }));
  };

  const updateUserId = (userId) => {
    setBookingDetails((prev) => ({
      ...prev,
      userId,
    }));
  };

  const updateBookingId = (bookingId) => {
    setBookingDetails((prev) => ({
      ...prev,
      bookingId,
    }));
  };

  const updateBooking = (newDetails) => {
    setBookingDetails((prevDetails) => ({
      ...prevDetails,
      ...newDetails,
    }));
  };

  const resetBookingDetails = () => {
    setBookingDetails({
      checkInDate: null,
      checkOutDate: null,
      nightsCount: 1,
      discount: 0,
      discountAmount: 0,
      roomTypeId: '',
      roomId: '',
      guestCount: 1,
      guestDetails: [],
      roomPrice: 0,
      tax: 0,
      subtotal: 0,
      totalPrice: 0,
      paymentDetails: null,
      isGuest: true,
      bookingStatus: 'reserved',
      userId: null,
      checkedInBy: null,
      checkedOutBy: null,
      contactDetails: { fullName: '', email: '', phone: '' },
    });
  };

  return (
    <BookingContext.Provider
      value={{
        bookingDetails,
        // Length-of-stay discounts in percent ({ ELEVEN, TWENTYONE, THIRTYPLUS }),
        // for explaining prices. The server applies them itself.
        discounts,
        discountsLoaded,
        updateDates,
        updateRoomSelection,
        updateGuestCount,
        updateGuestDetails,
        updatePaymentDetails,
        updateBookingStatus,
        updateIsGuest,
        updateContactDetails,
        updateUserId,
        updateBookingId,
        updateRoomPrice,
        updateBooking,
        resetBookingDetails,
      }}
    >
      {children}
    </BookingContext.Provider>
  );
};

export const useBooking = () => useContext(BookingContext);
