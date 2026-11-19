'use client';

import { createContext, useContext, useState, useEffect } from 'react';
import differenceInCalendarDays from 'date-fns/differenceInCalendarDays';
import addDays from 'date-fns/addDays';
import { subscribeToDiscounts } from '@/lib/data/discounts';
import { DEFAULT_PARTY } from '@/lib/booking/occupancy';

const BookingContext = createContext();

/** A new search: tonight, for the default party. */
const newSearch = () => {
  const checkInDate = new Date();
  return {
    checkInDate,
    checkOutDate: addDays(checkInDate, 1),
    nightsCount: 1,
    party: DEFAULT_PARTY,
  };
};

/**
 * The guest's search, shared by the search form, the results and the
 * reservation form: stay dates and who's travelling. (Everything about a
 * reservation itself, such as rooms, prices and contact details, comes from
 * the server.) Also provides the current length-of-stay discounts, for
 * explaining prices.
 */
export const BookingProvider = ({ children }) => {
  // { checkInDate, checkOutDate, nightsCount, party: { adults, children, pets } }
  const [bookingDetails, setBookingDetails] = useState(newSearch);

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

  const updateDates = (checkInDate, checkOutDate) => {
    setBookingDetails((prev) => ({
      ...prev,
      checkInDate,
      checkOutDate,
      nightsCount: differenceInCalendarDays(checkOutDate, checkInDate),
    }));
  };

  /** Who's travelling: { adults, children, pets }. */
  const updateParty = (party) => {
    setBookingDetails((prev) => ({ ...prev, party }));
  };

  /** Back to a new search (after a booking is made). */
  const resetSearch = () => setBookingDetails(newSearch());

  return (
    <BookingContext.Provider
      value={{
        bookingDetails,
        // Length-of-stay discounts in percent ({ ELEVEN, TWENTYONE, THIRTYPLUS }),
        // for explaining prices. The server applies them itself.
        discounts,
        discountsLoaded,
        updateDates,
        updateParty,
        resetSearch,
      }}
    >
      {children}
    </BookingContext.Provider>
  );
};

export const useBooking = () => useContext(BookingContext);
