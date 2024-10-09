'use client';

import { useEffect, useState } from 'react';
import { DateRange } from 'react-date-range';
import 'react-date-range/dist/styles.css';
import 'react-date-range/dist/theme/default.css';
import format from 'date-fns/format';
import addDays from 'date-fns/addDays';
import { useBooking } from '@/context/BookingContext';
import StyledButton from '../ui/StyledButton';

const CustomDateRangePicker = ({ fetchAvailableRooms }) => {
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

  const updateParams = () => {
    updateDates(dateRange[0].startDate, dateRange[0].endDate);
    setTimeout(() => {
      fetchAvailableRooms(dateRange[0].startDate, dateRange[0].endDate);
    }, 300);
  };

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

  // Format the date range string for display in the single input field
  const formattedDateRange = `${format(
    dateRange[0].startDate,
    'dd MMM yyyy'
  )} - ${format(dateRange[0].endDate, 'dd MMM yyyy')}`;

  // Handle the date range change to ensure end date is always at least +1 day from start date
  const handleSelect = (ranges) => {
    const { startDate, endDate } = ranges.selection;

    // Ensure end date is at least one day after start date
    if (endDate <= startDate) {
      const newEndDate = addDays(startDate, 1);
      setDateRange([{ ...ranges.selection, startDate, endDate: newEndDate }]);
    } else {
      setDateRange([ranges.selection]);
    }

    if (startDate && endDate && startDate !== endDate) {
      setTimeout(() => {
        setShowDatePicker(false);
      }, 100);
    }
  };

  const handleInputClick = () => {
    setShowDatePicker((prev) => !prev);
  };

  return (
    <div className="flex items-end justify-evenly space-x-4 py-5 p-4 relative">
      <div className="flex flex-col w-80 relative">
        <label className="text-lg mb-1">
          Select Check-in & Check-out dates
        </label>
        <input
          className="w-full p-2 rounded-xl border border-gray-300 text-center focus:outline-none focus:ring-2 focus:ring-yellow-500 cursor-pointer"
          readOnly
          value={formattedDateRange}
          onClick={handleInputClick}
        />
        {showDatePicker && (
          <div className="absolute top-full z-10">
            <DateRange
              editableDateInputs={true}
              onChange={handleSelect}
              moveRangeOnFirstSelection={false}
              ranges={dateRange}
              rangeColors={['#725527']}
              minDate={today}
            />
          </div>
        )}
      </div>
      <div className="flex flex-col">
        <label className="text-lg mb-1">No. of Guest</label>
        <select
          className="w-80 p-2 rounded-xl border border-gray-300 text-center focus:outline-none focus:ring-2 focus:ring-yellow-500"
          value={guestCount}
          onChange={(e) => {
            setGuestCount(e.target.value);
            updateGuestCount(e.target.value);
          }}
        >
          <option value="1">1</option>
          <option value="2">2</option>
          <option value="3">3</option>
          <option value="4">4</option>
        </select>
      </div>
      <StyledButton btnText="Check Availability" clickHandler={updateParams} />
    </div>
  );
};

export default CustomDateRangePicker;
