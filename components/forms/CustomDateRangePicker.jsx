'use client';

import { useEffect, useState } from 'react';
import { DateRange } from 'react-date-range';
import 'react-date-range/dist/styles.css';
import 'react-date-range/dist/theme/default.css';
import format from 'date-fns/format';
import addDays from 'date-fns/addDays';
import { useBooking } from '@/context/BookingContext';
import StyledButton from '../ui/StyledButton';

export default function CustomDateRangePicker({ fetchAvailableRooms }) {
  const { bookingDetails, updateGuestCount, updateDates } = useBooking();
  const today = new Date();
  const defaultEndDate = addDays(today, 1);

  const [dateRange, setDateRange] = useState([
    {
      startDate: today,
      endDate: defaultEndDate,
      key: 'selection',
    },
  ]);

  const [guestCount, setGuestCount] = useState(1);
  const [showDatePicker, setShowDatePicker] = useState(false);

  useEffect(() => {
    updateDates(dateRange[0].startDate, dateRange[0].endDate);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dateRange[0].endDate, dateRange[0].startDate]);

  useEffect(() => {
    if (bookingDetails.checkInDate || bookingDetails.checkOutDate) {
      setDateRange([
        {
          ...dateRange[0],
          startDate: bookingDetails.checkInDate,
          endDate: bookingDetails.checkOutDate,
        },
      ]);
    } else {
      updateDates(dateRange[0].startDate, dateRange[0].endDate);
    }

    setGuestCount(bookingDetails.guestCount);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="flex items-end justify-center space-x-4 py-5 border border-gray-400 rounded-full p-4 relative">
      <div className="flex flex-col">
        <label className="text-xs text-gray-500 mb-1">Check in</label>
        <input
          className="w-40 p-2 rounded-full border border-gray-300 text-center focus:outline-none focus:ring-2 focus:ring-yellow-500 cursor-pointer"
          readOnly
          value={format(dateRange[0].startDate, 'dd MMM yyyy')}
          onClick={() => setShowDatePicker(!showDatePicker)}
        />
      </div>

      {/* Check-out input */}
      <div className="flex flex-col">
        <label className="text-xs text-gray-500 mb-1">Check out</label>
        <input
          className="w-40 p-2 rounded-full border border-gray-300 text-center focus:outline-none focus:ring-2 focus:ring-yellow-500 cursor-pointer"
          readOnly
          value={
            dateRange[0].endDate
              ? format(dateRange[0].endDate, 'dd MMM yyyy')
              : 'Select a date'
          }
          onClick={() => setShowDatePicker(!showDatePicker)}
        />
      </div>

      {/* Guest input */}
      <div className="flex flex-col">
        <label className="text-xs text-gray-500 mb-1">Guest</label>
        <input
          className="w-20 p-2 rounded-full border border-gray-300 text-center focus:outline-none focus:ring-2 focus:ring-yellow-500"
          type="number"
          min="1"
          max="4"
          value={guestCount}
          onChange={(e) => {
            setGuestCount(e.target.value);
            updateGuestCount(e.target.value);
          }}
        />
      </div>
      <StyledButton
        btnText="Check Availability"
        clickHandler={fetchAvailableRooms}
      />

      {/* Date Range Picker - Toggle Visibility */}
      {showDatePicker && (
        <div className="absolute top-16 z-10">
          <DateRange
            editableDateInputs={true}
            onChange={(item) => setDateRange([item.selection])}
            moveRangeOnFirstSelection={false}
            ranges={dateRange}
            rangeColors={['#FDBA12']} // Custom color for selected range
            minDate={today}
          />
        </div>
      )}
    </div>
  );
}
