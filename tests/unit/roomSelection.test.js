import { describe, expect, test } from 'vitest';
import {
  canUseType,
  cannotAddRoomReason,
  fitSelectionToAvailability,
  newRoom,
  petRoomsLeft,
  planRooms,
  roomForRest,
  roomsLeft,
  splitEvenly,
} from '@/lib/booking/roomSelection';

const ORDER = ['sSuite', 'dStandard', 'pSuite', 'eSuite'];
const LOTS_FREE = {
  counts: { sSuite: 10, dStandard: 5, pSuite: 5, eSuite: 4 },
  petCounts: { sSuite: 2, dStandard: 2, pSuite: 1, eSuite: 0 },
};
const NO_PET_ROOMS = {
  counts: LOTS_FREE.counts,
  petCounts: { sSuite: 0, dStandard: 0, pSuite: 0, eSuite: 0 },
};
// [typeId, adults, children, pets] per room
const shape = (rooms) =>
  rooms.map(({ typeId, adults, children, pets }) => [
    typeId,
    adults,
    children,
    pets,
  ]);
const plan = (party, preferredTypeId, availability = LOTS_FREE) =>
  shape(planRooms({ party, preferredTypeId, availability, typeOrder: ORDER }));

test('splitEvenly', () => {
  expect(splitEvenly(8, 2)).toEqual([4, 4]);
  expect(splitEvenly(5, 2)).toEqual([3, 2]);
  expect(splitEvenly(30, 8)).toEqual([4, 4, 4, 4, 4, 4, 3, 3]);
});

describe('planRooms: rooms for a whole party', () => {
  test('2 adults: one room of the chosen type', () => {
    expect(plan({ adults: 2, children: 0, pets: 0 }, 'dStandard')).toEqual([
      ['dStandard', 2, 0, 0],
    ]);
  });

  test('8 adults: two rooms of 4', () => {
    expect(plan({ adults: 8, children: 0, pets: 0 }, 'dStandard')).toEqual([
      ['dStandard', 4, 0, 0],
      ['dStandard', 4, 0, 0],
    ]);
  });

  test('children fill the emptiest rooms, 6 guests at most', () => {
    expect(plan({ adults: 2, children: 5, pets: 0 }, 'sSuite')).toEqual([
      ['sSuite', 1, 3, 0],
      ['sSuite', 1, 2, 0],
    ]);
    expect(plan({ adults: 5, children: 7, pets: 0 }, 'sSuite')).toEqual([
      ['sSuite', 3, 3, 0],
      ['sSuite', 2, 4, 0],
    ]);
  });

  test('pets go in pet-friendly rooms, of another type if needed', () => {
    expect(plan({ adults: 8, children: 0, pets: 1 }, 'eSuite')).toEqual([
      ['sSuite', 4, 0, 1],
      ['eSuite', 4, 0, 0],
    ]);
    expect(plan({ adults: 2, children: 0, pets: 3 }, 'dStandard')).toEqual([
      ['dStandard', 1, 0, 2],
      ['dStandard', 1, 0, 1],
    ]);
  });

  test('with no pet-friendly rooms free, the room is planned without the pet', () => {
    expect(
      plan({ adults: 2, children: 0, pets: 1 }, 'dStandard', NO_PET_ROOMS)
    ).toEqual([['dStandard', 2, 0, 0]]);
  });

  test("a room without pets doesn't take the last pet-friendly room", () => {
    const lastKingTakesPets = {
      counts: { dStandard: 1, sSuite: 3 },
      petCounts: { dStandard: 1, sSuite: 0 },
    };
    expect(
      plan({ adults: 6, children: 0, pets: 1 }, 'dStandard', lastKingTakesPets)
    ).toEqual([
      ['dStandard', 3, 0, 1],
      ['sSuite', 3, 0, 0],
    ]);
  });

  test('falls back to other types when the chosen one runs out', () => {
    expect(
      plan({ adults: 8, children: 0, pets: 0 }, 'dStandard', {
        counts: { dStandard: 1, pSuite: 5, eSuite: 4 },
        petCounts: {},
      })
    ).toEqual([
      ['dStandard', 4, 0, 0],
      ['pSuite', 4, 0, 0],
    ]);
  });

  test('30 adults: 8 rooms', () => {
    expect(plan({ adults: 30, children: 0, pets: 0 }, 'sSuite')).toHaveLength(
      8
    );
  });
});

describe('what is still free', () => {
  const selection = [
    newRoom('dStandard', { adults: 2, pets: 1 }),
    newRoom('dStandard', { adults: 2 }),
  ];

  test('roomsLeft and petRoomsLeft count the selection', () => {
    expect(roomsLeft(selection, LOTS_FREE, 'dStandard')).toBe(3);
    expect(petRoomsLeft(selection, LOTS_FREE, 'dStandard')).toBe(1);
  });

  test('canUseType', () => {
    expect(canUseType(selection, LOTS_FREE, 'eSuite', { withPets: true })).toBe(
      false
    );
    expect(
      canUseType(selection, LOTS_FREE, 'dStandard', {
        withPets: true,
        skipKey: selection[0].key,
      })
    ).toBe(true);
    expect(
      canUseType(
        selection,
        { counts: { dStandard: 2 }, petCounts: { dStandard: 2 } },
        'dStandard'
      )
    ).toBe(false);
  });

  test('cannotAddRoomReason', () => {
    expect(
      cannotAddRoomReason(selection, { counts: { dStandard: 2 } }, ORDER)
    ).toBe("You've added every room that's free for these dates.");
    expect(
      cannotAddRoomReason(
        [...Array(10)].map(() => newRoom('sSuite')),
        { counts: { sSuite: 20 } },
        ORDER
      )
    ).toMatch(/up to 10 rooms/);
    expect(cannotAddRoomReason(selection, LOTS_FREE, ORDER)).toBeNull();
  });

  test('fitSelectionToAvailability drops rooms that are no longer free', () => {
    const rooms = [newRoom('dStandard', { pets: 1 }), newRoom('dStandard')];
    expect(
      shape(
        fitSelectionToAvailability(rooms, {
          counts: { dStandard: 2 },
          petCounts: { dStandard: 0 },
        })
      )
    ).toEqual([['dStandard', 1, 0, 0]]);
  });
});

describe('roomForRest: the room added for whoever has no room yet', () => {
  test('takes the guests not placed yet', () => {
    const room = roomForRest({
      selection: [newRoom('sSuite', { adults: 4 })],
      party: { adults: 6, children: 1, pets: 0 },
      availability: LOTS_FREE,
      typeOrder: ORDER,
    });
    expect(shape([room])).toEqual([['sSuite', 2, 1, 0]]);
  });

  test('prefers a type with a pet-friendly room for unplaced pets', () => {
    const room = roomForRest({
      selection: [newRoom('eSuite', { adults: 2 })],
      party: { adults: 4, children: 0, pets: 2 },
      availability: LOTS_FREE,
      typeOrder: ORDER,
    });
    expect(shape([room])).toEqual([['sSuite', 2, 0, 2]]);
  });

  test('a chosen type without pet-friendly rooms gets no pets', () => {
    const room = roomForRest({
      selection: [],
      party: { adults: 2, children: 0, pets: 1 },
      availability: LOTS_FREE,
      typeOrder: ORDER,
      typeId: 'eSuite',
    });
    expect(shape([room])).toEqual([['eSuite', 2, 0, 0]]);
  });

  test('when everyone has a room: 1 adult', () => {
    const room = roomForRest({
      selection: [newRoom('sSuite', { adults: 2 })],
      party: { adults: 2, children: 0, pets: 0 },
      availability: LOTS_FREE,
      typeOrder: ORDER,
    });
    expect(shape([room])).toEqual([['sSuite', 1, 0, 0]]);
  });
});
