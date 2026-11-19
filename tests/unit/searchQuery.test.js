import { describe, expect, test } from 'vitest';
import { searchFromQuery, searchToQuery } from '@/lib/booking/searchQuery';

const TODAY = new Date('2031-05-10T15:00:00');
const roundTrip = (query) => searchToQuery(searchFromQuery(query, TODAY));

describe('the search in the web address', () => {
  test('round trip', () => {
    expect(
      roundTrip('from=2031-06-01&to=2031-06-04&adults=3&children=1&pets=1')
    ).toBe('from=2031-06-01&to=2031-06-04&adults=3&children=1&pets=1');
  });

  test('defaults to 2 adults; leaves out 0 children and pets', () => {
    expect(roundTrip('from=2031-06-01&to=2031-06-02')).toBe(
      'from=2031-06-01&to=2031-06-02&adults=2'
    );
  });

  test('dates in the past move to today, keeping the number of nights', () => {
    expect(roundTrip('from=2031-04-01&to=2031-04-05&adults=1')).toBe(
      'from=2031-05-10&to=2031-05-14&adults=1'
    );
  });

  test('check-out before check-in becomes 1 night', () => {
    expect(roundTrip('from=2031-06-01&to=2031-05-01')).toBe(
      'from=2031-06-01&to=2031-06-02&adults=2'
    );
  });

  test('an invalid date keeps just the party', () => {
    expect(searchFromQuery('from=2031-02-30&adults=4', TODAY)).toEqual({
      checkIn: null,
      checkOut: null,
      party: { adults: 4, children: 0, pets: 0 },
    });
  });

  test('no search in the address', () => {
    expect(searchFromQuery('', TODAY)).toBeNull();
    expect(searchFromQuery('utm_source=newsletter', TODAY)).toBeNull();
  });

  test('numbers are brought within the limits', () => {
    expect(searchFromQuery('adults=1&children=9&pets=9', TODAY).party).toEqual({
      adults: 1,
      children: 5,
      pets: 2,
    });
  });
});
