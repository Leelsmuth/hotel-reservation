'use client';

import { useState } from 'react';
import { DateRange } from 'react-date-range';
import 'react-date-range/dist/styles.css'; // Main CSS file for the DateRange picker
import 'react-date-range/dist/theme/default.css'; // Default theme for DateRange picker
import format from 'date-fns/format';
import { enGB } from 'date-fns/locale';
import addDays from 'date-fns/addDays';

export default function CustomDateRangePicker() {
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

  return (
    <div className="flex items-center justify-center space-x-4 py-5 border border-gray-400 rounded-full p-4 relative">
      {/* Check-in input */}
      <div className="flex flex-col">
        <label className="text-xs text-gray-500 mb-1">Check in</label>
        <input
          className="w-40 p-2 rounded-full border border-gray-300 text-center focus:outline-none focus:ring-2 focus:ring-yellow-500 cursor-pointer"
          readOnly
          value={format(dateRange[0].startDate, 'dd MMM yyyy', {
            locale: enGB,
          })}
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
              ? format(dateRange[0].endDate, 'dd MMM yyyy', { locale: enGB })
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
          value={guestCount}
          onChange={(e) => setGuestCount(e.target.value)}
        />
      </div>

      {/* Check Availability Button */}
      <button className="bg-yellow-500 text-white rounded-full px-6 py-2 font-semibold hover:bg-yellow-600">
        Check Availability
      </button>

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
