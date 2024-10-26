'use client';

import { createContext, useContext, useState, useEffect } from 'react';
import differenceInCalendarDays from 'date-fns/differenceInCalendarDays';
import { db } from '@/lib/firebase/firebase';
import { doc, onSnapshot } from 'firebase/firestore';
// import { DISCOUNT } from '@/lib/static/roomLegend';

const BookingContext = createContext();

export const BookingProvider = ({ children }) => {
  const [bookingDetails, setBookingDetails] = useState({
    checkInDate: null,
    checkOutDate: null,
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
    contactDetails: { fullName: '', email: '', phone: '' },
  });

  const [discounts, setDiscounts] = useState({
    ELEVEN: 0,
    TWENTYONE: 0,
    THIRTYPLUS: 0,
  });

  const TAX_PERCENTAGE = 13;

  useEffect(() => {
    const discountDocRef = doc(db, 'discounts', 'daysDiscount');

    const unsubscribe = onSnapshot(discountDocRef, (doc) => {
      if (doc.exists()) {
        const discountData = doc.data();
        setDiscounts({
          ELEVEN: discountData.ELEVEN || 0,
          TWENTYONE: discountData.TWENTYONE || 0,
          THIRTYPLUS: discountData.THIRTYPLUS || 0,
        });
      } else {
        console.error('No discount data found');
      }
    });

    return () => unsubscribe();
  }, []);

  const updateRoomPrice = (roomPrice) => {
    const roundToTwoDecimals = (num) => Math.round(num * 100) / 100;

    const discountFactor = 1 - bookingDetails.discount / 100;
    const pricePerNight = roundToTwoDecimals(roomPrice * discountFactor);
    const discountAmount = roundToTwoDecimals(
      (roomPrice - pricePerNight) * bookingDetails.nightsCount
    );
    const subtotal = roundToTwoDecimals(
      pricePerNight * bookingDetails.nightsCount
    );
    const tax = roundToTwoDecimals((subtotal * TAX_PERCENTAGE) / 100);
    const totalPrice = roundToTwoDecimals(subtotal + tax);

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
    let applicableDiscount = 0;

    if (numOfNights >= 30) {
      applicableDiscount = discounts.THIRTYPLUS;
    } else if (numOfNights > 20) {
      applicableDiscount = discounts.TWENTYONE;
    } else if (numOfNights > 10) {
      applicableDiscount = discounts.ELEVEN;
    }

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
