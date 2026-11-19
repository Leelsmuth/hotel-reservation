import { describe, expect, test } from 'vitest';
import {
  DEFAULT_PARTY,
  clampParty,
  describeParty,
  occupancyOf,
  partyLimits,
  roomOccupancyProblem,
  roomsNeededFor,
  sumOccupancy,
} from '@/lib/booking/occupancy';

describe('roomOccupancyProblem (who can share a room)', () => {
  test.each([
    [{ adults: 4, children: 2, pets: 2 }],
    [{ adults: 1, children: 5, pets: 0 }],
    [{ adults: 1, children: 0, pets: 0 }],
  ])('allows %o', (room) => {
    expect(roomOccupancyProblem(room)).toBeNull();
  });

  test.each([
    [{ adults: 0, children: 1, pets: 0 }, /at least 1 adult/],
    [{ adults: 1.5, children: 0, pets: 0 }, /at least 1 adult/],
    [{ adults: 5, children: 0, pets: 0 }, /up to 4 adults/],
    [{ adults: 3, children: 4, pets: 0 }, /up to 6 guests, children included/],
    [{ adults: 2, children: -1, pets: 0 }, /0 or more/],
    [{ adults: 1, children: 0, pets: 3 }, /up to 2 pets/],
  ])('refuses %o', (room, message) => {
    expect(roomOccupancyProblem(room)).toMatch(message);
  });
});

describe('roomsNeededFor', () => {
  test.each([
    [{ adults: 2, children: 0, pets: 0 }, 1],
    [{ adults: 4, children: 2, pets: 2 }, 1],
    [{ adults: 5, children: 0, pets: 0 }, 2], // 4 adults per room
    [{ adults: 2, children: 5, pets: 0 }, 2], // 6 guests per room
    [{ adults: 2, children: 0, pets: 3 }, 2], // 2 pets per room
    [{ adults: 8, children: 0, pets: 0 }, 2],
  ])('%o needs %i room(s)', (party, rooms) => {
    expect(roomsNeededFor(party)).toBe(rooms);
  });

  test('every party the search allows fits in 10 rooms, with an adult in each', () => {
    for (let adults = 1; adults <= 30; adults += 1) {
      const { children, pets } = partyLimits({ adults });
      const rooms = roomsNeededFor({
        adults,
        children: children.max,
        pets: pets.max,
      });
      expect(rooms).toBeLessThanOrEqual(10);
      expect(rooms).toBeLessThanOrEqual(adults);
    }
  });
});

describe('search party limits', () => {
  test('the search starts at 2 adults', () => {
    expect(DEFAULT_PARTY).toEqual({ adults: 2, children: 0, pets: 0 });
  });

  test('one adult can bring up to 5 children and 2 pets', () => {
    expect(partyLimits({ adults: 1 })).toEqual({
      adults: { min: 1, max: 30 },
      children: { min: 0, max: 5 },
      pets: { min: 0, max: 2 },
    });
  });

  test('clampParty brings a party within the limits', () => {
    expect(clampParty({ adults: 1, children: 9, pets: 7 })).toEqual({
      adults: 1,
      children: 5,
      pets: 2,
    });
    expect(clampParty({ adults: 99, children: -4, pets: 'abc' })).toEqual({
      adults: 30,
      children: 0,
      pets: 0,
    });
    expect(clampParty(undefined)).toEqual(DEFAULT_PARTY);
  });
});

describe('describing a party', () => {
  test('lists children and pets only when there are any', () => {
    expect(describeParty({ adults: 2, children: 1, pets: 1 })).toBe(
      '2 adults, 1 child, 1 pet'
    );
    expect(describeParty({ adults: 1, children: 3, pets: 0 })).toBe(
      '1 adult, 3 children'
    );
  });

  test('reservations from before adults were recorded count their guests as adults', () => {
    expect(occupancyOf({ guestCount: 3 })).toEqual({
      adults: 3,
      children: 0,
      pets: 0,
    });
    expect(
      occupancyOf({ guestCount: 4, adults: 2, children: 2, pets: 1 })
    ).toEqual({ adults: 2, children: 2, pets: 1 });
  });

  test('sumOccupancy adds rooms up', () => {
    expect(
      sumOccupancy([
        { adults: 2, children: 1, pets: 0 },
        { adults: 1, children: 0, pets: 2 },
      ])
    ).toEqual({ adults: 3, children: 1, pets: 2 });
  });
});
