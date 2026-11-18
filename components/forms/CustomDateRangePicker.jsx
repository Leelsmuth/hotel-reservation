'use client';

import { useEffect, useId, useRef, useState } from 'react';
import { DateRange } from 'react-date-range';
import 'react-date-range/dist/styles.css';
import 'react-date-range/dist/theme/default.css';
import format from 'date-fns/format';
import addDays from 'date-fns/addDays';
import differenceInCalendarDays from 'date-fns/differenceInCalendarDays';
import { isValid, parseISO, startOfDay } from 'date-fns';
import { useBooking } from '@/context/BookingContext';
import OptionGenerator from './OptionGenerator ';
import Button from '../ui/Button';
import Icon from '../ui/Icon';
import { pluralize } from '@/lib/helpers/formatters';

const MAX_GUESTS_PER_ROOM = 4;
// How long the finished selection stays visible before the calendar closes
const CLOSE_DELAY_MS = 400;

// <input type="date"> works with "yyyy-MM-dd" strings in local time
const toInputValue = (date) => format(date, 'yyyy-MM-dd');
const fromInputValue = (value) => {
  if (!value) return null;
  const date = parseISO(value);
  return isValid(date) ? date : null;
};

/** True while the viewport matches `query` (false during server render). */
const useMediaQuery = (query) => {
  const [matches, setMatches] = useState(false);
  useEffect(() => {
    const media = window.matchMedia(query);
    const update = () => setMatches(media.matches);
    update();
    media.addEventListener('change', update);
    return () => media.removeEventListener('change', update);
  }, [query]);
  return matches;
};

/**
 * Availability search: stay dates + number of guests.
 * Used on the home page hero and at the top of /make-reservation.
 *
 * The dates open a calendar popover (Escape or clicking outside closes it;
 * the date fields at the top of the calendar can also be typed into).
 */
const CustomDateRangePicker = ({
  fetchAvailableRooms,
  submitLabel = 'Check availability',
  layout = 'bar',
}) => {
  const { bookingDetails, updateGuestCount, updateDates } = useBooking();
  const today = new Date();
  const defaultEndDate = addDays(today, 1);
  const idBase = useId();
  const datesLabelId = `${idBase}-dates-label`;
  const datesValueId = `${idBase}-dates-value`;
  const nightsId = `${idBase}-nights`;
  const calendarId = `${idBase}-calendar`;
  const guestsId = `${idBase}-guests`;
  const checkInId = `${idBase}-check-in`;
  const checkOutId = `${idBase}-check-out`;

  const [dateRange, setDateRange] = useState([
    {
      startDate: today,
      endDate: defaultEndDate,
      key: 'selection',
    },
  ]);

  const [guestCount, setGuestCount] = useState(1);
  const [showDatePicker, setShowDatePicker] = useState(false);
  // 0 = next click picks check-in, 1 = next click picks check-out
  const [selectionStep, setSelectionStep] = useState(0);
  const [closeAfterRender, setCloseAfterRender] = useState(false);
  // Two months side by side from tablet width up, stacked on phones, so a
  // stay that runs into next month can be picked without paging the calendar
  const isWide = useMediaQuery('(min-width: 768px)');

  const rootRef = useRef(null);
  const triggerRef = useRef(null);

  const updateParams = () => {
    setShowDatePicker(false);
    updateDates(dateRange[0].startDate, dateRange[0].endDate);
    setTimeout(() => {
      fetchAvailableRooms(dateRange[0].startDate, dateRange[0].endDate);
      const newCount =
        guestCount > MAX_GUESTS_PER_ROOM ? MAX_GUESTS_PER_ROOM : guestCount;
      updateGuestCount(newCount, guestCount);
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

    setGuestCount(bookingDetails.guestCountActual);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // react-date-range renders some controls without accessible names: label
  // them once the calendar is on screen
  useEffect(() => {
    if (!showDatePicker) return;
    const root = rootRef.current;
    if (!root) return;
    const label = (selector, text) =>
      root.querySelectorAll(selector).forEach((el, index) => {
        const value = Array.isArray(text) ? text[index] : text;
        if (value) el.setAttribute('aria-label', value);
      });
    label('.rdrPprevButton', 'Previous month');
    label('.rdrNextButton', 'Next month');
    label('.rdrMonthPicker select', 'Month');
    label('.rdrYearPicker select', 'Year');
  }, [showDatePicker, dateRange]);

  // Close the calendar on outside click / Escape
  useEffect(() => {
    if (!showDatePicker) return undefined;
    const onPointerDown = (event) => {
      if (!rootRef.current?.contains(event.target)) setShowDatePicker(false);
    };
    const onKeyDown = (event) => {
      if (event.key === 'Escape') {
        setShowDatePicker(false);
        triggerRef.current?.focus();
      }
    };
    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [showDatePicker]);

  const { startDate, endDate } = dateRange[0];
  const nights = Math.max(differenceInCalendarDays(endDate, startDate), 1);
  const formattedDateRange = `${format(startDate, 'EEE d MMM')} – ${format(
    endDate,
    'EEE d MMM yyyy'
  )}`;
  // Shorter version for narrow screens
  const shortDateRange = `${format(startDate, 'd MMM')} – ${format(endDate, 'd MMM yyyy')}`;

  // Keep check-out at least one night after check-in. The calendar closes
  // once both dates have been picked.
  const handleSelect = (ranges) => {
    const { startDate: start, endDate: end } = ranges.selection;

    if (end <= start) {
      setDateRange([
        { ...ranges.selection, startDate: start, endDate: addDays(start, 1) },
      ]);
    } else {
      setDateRange([ranges.selection]);
    }

    if (selectionStep === 0) {
      setSelectionStep(1);
    } else {
      setSelectionStep(0);
      setCloseAfterRender(true);
    }
  };

  // Close once both dates are picked. The timer starts after the completed
  // range has rendered (effects run after the DOM update), so the guest
  // always sees the highlighted stay for a moment before the calendar goes.
  useEffect(() => {
    if (!closeAfterRender || !showDatePicker) return undefined;
    const timer = setTimeout(() => {
      setCloseAfterRender(false);
      setShowDatePicker(false);
      triggerRef.current?.focus();
    }, CLOSE_DELAY_MS);
    return () => clearTimeout(timer);
  }, [closeAfterRender, showDatePicker, dateRange]);

  // A date typed into the Check-in / Check-out fields. Keeps the stay valid:
  // check-in not in the past, check-out at least one night after check-in.
  const handleTypedDate = (which, value) => {
    const date = fromInputValue(value);
    if (!date) return;
    const todayStart = startOfDay(new Date());
    if (which === 'start') {
      if (date < todayStart) return;
      const end = endDate > date ? endDate : addDays(date, 1);
      setDateRange([{ ...dateRange[0], startDate: date, endDate: end }]);
    } else {
      if (date <= startDate) return;
      setDateRange([{ ...dateRange[0], endDate: date }]);
    }
    // Clicking in the calendar after typing starts a fresh selection
    setSelectionStep(0);
  };

  const toggleCalendar = () => {
    setSelectionStep(0);
    setCloseAfterRender(false);
    setShowDatePicker((prev) => !prev);
  };

  const isStacked = layout === 'stacked';

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        updateParams();
      }}
      className={`grid grid-cols-[minmax(0,1fr)] gap-4 ${
        isStacked
          ? ''
          : 'sm:grid-cols-2 sm:items-start lg:grid-cols-[minmax(0,1.7fr)_minmax(0,1fr)_auto]'
      }`}
      aria-label="Search available rooms"
    >
      <div
        className={`relative ${isStacked ? '' : 'sm:col-span-2 lg:col-span-1'}`}
        ref={rootRef}
      >
        <span id={datesLabelId} className="form-label" aria-hidden="true">
          Check-in – Check-out
        </span>
        <button
          ref={triggerRef}
          type="button"
          className="form-input flex items-center gap-3 text-left"
          aria-haspopup="dialog"
          aria-expanded={showDatePicker}
          aria-controls={calendarId}
          onClick={toggleCalendar}
        >
          <Icon name="calendar" className="h-5 w-5 text-gold-700" />
          <span className="sr-only">Check-in – Check-out: </span>
          <span id={datesValueId} className="flex-1 truncate font-medium">
            <span className="sm:hidden">{shortDateRange}</span>
            <span className="hidden sm:inline">{formattedDateRange}</span>
          </span>
          <span
            id={nightsId}
            className="shrink-0 rounded-full bg-sand-100 px-2 py-0.5 text-xs font-semibold text-ink-700"
          >
            {pluralize(nights, 'night')}
          </span>
        </button>
        {showDatePicker && (
          <div
            id={calendarId}
            role="dialog"
            aria-label="Choose check-in and check-out dates"
            // Enter in the typed date fields confirms that date; it must not
            // submit the search form
            onKeyDown={(event) => {
              if (event.key === 'Enter' && event.target.tagName === 'INPUT') {
                event.preventDefault();
              }
            }}
            className="date-popover absolute left-0 top-full z-30 mt-2 w-full min-w-[18.5rem] sm:w-[22rem] md:w-[42rem] animate-fade-in overflow-hidden rounded-2xl border border-ink-100 bg-white shadow-popover"
          >
            {/* Typed dates. Our own labelled native date fields: the
                library's built-in ones stop working when drag-selection is
                off (see dragSelectionEnabled below). */}
            <div className="grid grid-cols-2 gap-3 border-b border-ink-100 bg-sand-100 p-3">
              <div>
                <label htmlFor={checkInId} className="form-label text-xs">
                  Check-in
                </label>
                <input
                  id={checkInId}
                  type="date"
                  className="form-input py-2 text-sm"
                  min={toInputValue(today)}
                  value={toInputValue(startDate)}
                  onChange={(event) =>
                    handleTypedDate('start', event.target.value)
                  }
                />
              </div>
              <div>
                <label htmlFor={checkOutId} className="form-label text-xs">
                  Check-out
                </label>
                <input
                  id={checkOutId}
                  type="date"
                  className="form-input py-2 text-sm"
                  min={toInputValue(addDays(startDate, 1))}
                  value={toInputValue(endDate)}
                  onChange={(event) =>
                    handleTypedDate('end', event.target.value)
                  }
                />
              </div>
            </div>
            <DateRange
              showDateDisplay={false}
              onChange={handleSelect}
              moveRangeOnFirstSelection={false}
              ranges={dateRange}
              rangeColors={['#634C0C']}
              color="#634C0C"
              minDate={today}
              weekStartsOn={1}
              months={2}
              // Select on press. With drag-selection on, pressing a day first
              // collapses the highlight to that single day and only shows the
              // full stay on release, which flickers on every click.
              dragSelectionEnabled={false}
              direction={isWide ? 'horizontal' : 'vertical'}
              monthDisplayFormat="MMMM yyyy"
            />
            <div className="flex items-center justify-between gap-3 border-t border-ink-100 px-4 py-3">
              <p className="text-sm text-ink-600" aria-live="polite">
                {selectionStep === 1
                  ? 'Now choose your check-out date'
                  : pluralize(nights, 'night')}
              </p>
              <Button
                size="sm"
                variant="dark"
                onClick={() => {
                  setShowDatePicker(false);
                  triggerRef.current?.focus();
                }}
              >
                Done
              </Button>
            </div>
          </div>
        )}
      </div>

      <div>
        <label htmlFor={guestsId} className="form-label">
          Guests
        </label>
        <div className="relative">
          <Icon
            name="users"
            className="pointer-events-none absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-gold-700"
          />
          <select
            id={guestsId}
            className="form-select pl-11"
            value={guestCount}
            aria-describedby={
              guestCount > MAX_GUESTS_PER_ROOM ? `${guestsId}-hint` : undefined
            }
            onChange={(e) => {
              const value = parseInt(e.target.value, 10);
              setGuestCount(value);
            }}
          >
            <OptionGenerator numOptions={30} unit="guest" />
          </select>
        </div>
        {guestCount > MAX_GUESTS_PER_ROOM && (
          <p id={`${guestsId}-hint`} className="form-hint">
            Rooms sleep up to {MAX_GUESTS_PER_ROOM}. You'll need more than one
            room.
          </p>
        )}
      </div>

      <div className={isStacked ? '' : 'sm:pt-[1.625rem]'}>
        <Button type="submit" size="lg" icon="search" fullWidth>
          {submitLabel}
        </Button>
      </div>
    </form>
  );
};

export default CustomDateRangePicker;
