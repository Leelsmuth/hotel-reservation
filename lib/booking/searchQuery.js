/**
 * The availability search in the web address, so a refresh keeps it and a
 * search can be shared:
 *
 *   /make-reservation?from=2026-12-01&to=2026-12-03&adults=2&children=1&pets=1
 *
 * `children` and `pets` are left out when 0.
 */
import {
  addDays,
  differenceInCalendarDays,
  format,
  isValid,
  parseISO,
  startOfDay,
} from 'date-fns';
import { DEFAULT_PARTY, clampParty } from './occupancy';

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

const dateFrom = (value) => {
  if (typeof value !== 'string' || !DATE_PATTERN.test(value)) return null;
  const date = parseISO(value);
  return isValid(date) ? date : null;
};

/** The query string for a search. */
export const searchToQuery = ({ checkIn, checkOut, party }) => {
  const params = new URLSearchParams({
    from: format(checkIn, 'yyyy-MM-dd'),
    to: format(checkOut, 'yyyy-MM-dd'),
    adults: String(party.adults),
  });
  if (party.children > 0) params.set('children', String(party.children));
  if (party.pets > 0) params.set('pets', String(party.pets));
  return params.toString();
};

/**
 * The search in a query string, or null if it has none.
 *
 * Anything invalid falls back to the defaults. Dates in the past move to
 * today, keeping the number of nights, and check-out is always at least one
 * night after check-in. `checkIn`/`checkOut` are null when the query has a
 * party but no (valid) dates.
 *
 * @returns {{ checkIn: Date|null, checkOut: Date|null, party } | null}
 */
export const searchFromQuery = (query, today = new Date()) => {
  const params = new URLSearchParams(query);
  const hasParty = ['adults', 'children', 'pets'].some((key) =>
    params.has(key)
  );
  let checkIn = dateFrom(params.get('from'));
  const requestedCheckOut = dateFrom(params.get('to'));
  if (!checkIn && !hasParty) return null;

  const party = clampParty({
    adults: params.get('adults') ?? DEFAULT_PARTY.adults,
    children: params.get('children'),
    pets: params.get('pets'),
  });
  if (!checkIn) return { checkIn: null, checkOut: null, party };

  const nights =
    requestedCheckOut && requestedCheckOut > checkIn
      ? differenceInCalendarDays(requestedCheckOut, checkIn)
      : 1;
  if (checkIn < startOfDay(today)) checkIn = startOfDay(today);
  return { checkIn, checkOut: addDays(checkIn, nights), party };
};
