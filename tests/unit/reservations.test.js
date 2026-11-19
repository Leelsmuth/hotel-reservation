import { describe, expect, test } from 'vitest';
import {
  ReservationInputError,
  RoomUnavailableError,
  allocateRooms,
  groupIdsOf,
  roomRequestsOf,
  sortByRoomOrder,
  validateReservationInput,
} from '@/lib/booking/reservations';
import { freeRoomsByType } from '@/lib/booking/availability';

describe('allocateRooms: which physical rooms a booking gets', () => {
  const free = {
    dStandard: [
      { pathId: 'k1' },
      { pathId: 'k2', petFriendly: true },
      { pathId: 'k3' },
    ],
    pSuite: [{ pathId: 'd1' }],
  };
  const pathIds = (requests) =>
    allocateRooms(requests, free).map((x) => x.room.pathId);

  test('rooms with pets get pet-friendly rooms', () => {
    expect(
      pathIds([
        { typeId: 'dStandard', pets: 0 },
        { typeId: 'dStandard', pets: 2 },
        { typeId: 'pSuite', pets: 0 },
      ])
    ).toEqual(['k1', 'k2', 'd1']);
  });

  test('rooms without pets use pet-friendly rooms last', () => {
    expect(
      pathIds([
        { typeId: 'dStandard' },
        { typeId: 'dStandard' },
        { typeId: 'dStandard' },
      ])
    ).toEqual(['k1', 'k3', 'k2']);
  });

  test('not enough free rooms', () => {
    expect(() => pathIds([{ typeId: 'pSuite' }, { typeId: 'pSuite' }])).toThrow(
      new RoomUnavailableError(
        'Only 1 Deluxe Room is available for these dates, not 2.'
      )
    );
    expect(() => pathIds([{ typeId: 'eSuite' }])).toThrow(
      /no longer available/
    );
  });

  test('not enough pet-friendly rooms', () => {
    expect(() => pathIds([{ typeId: 'pSuite', pets: 1 }])).toThrow(
      /No pet-friendly Deluxe Room is available/
    );
    expect(() =>
      pathIds([
        { typeId: 'dStandard', pets: 1 },
        { typeId: 'dStandard', pets: 1 },
      ])
    ).toThrow(
      /Only 1 pet-friendly King Room is available for these dates, not 2/
    );
  });

  test("doesn't change what it's given", () => {
    pathIds([{ typeId: 'dStandard' }]);
    expect(free.dStandard).toHaveLength(3);
  });
});

describe('freeRoomsByType', () => {
  test('leaves out rooms under maintenance and rooms booked for the dates', () => {
    const rooms = [
      { pathId: 'a', typeId: 'sSuite', status: 'available', bookings: [] },
      { pathId: 'b', typeId: 'sSuite', status: 'maintenance', bookings: [] },
      {
        pathId: 'c',
        typeId: 'sSuite',
        status: 'booked',
        bookings: [{ bookedFrom: '2031-01-01', bookedUntil: '2031-01-05' }],
      },
    ];
    const free = freeRoomsByType(
      rooms,
      new Date('2031-01-02'),
      new Date('2031-01-03')
    );
    expect(free.sSuite.map((r) => r.pathId)).toEqual(['a']);
    expect(free.eSuite).toEqual([]);
  });
});

describe('reading a reservation request', () => {
  test('older request shapes still work, their guests as adults', () => {
    expect(
      roomRequestsOf({ rooms: [{ typeId: 'sSuite', guestCount: 3 }] })[0]
    ).toMatchObject({
      typeId: 'sSuite',
      adults: 3,
      children: 0,
      pets: 0,
    });
    expect(
      roomRequestsOf({ updatePathId: 'r1', guestCount: 2 })[0]
    ).toMatchObject({
      pathId: 'r1',
      adults: 2,
    });
  });

  const valid = {
    bookingDates: { bookedFrom: '2031-01-01', bookedUntil: '2031-01-03' },
    contactDetails: {
      name: 'A',
      email: 'a@example.com',
      phone: '+14165550123',
    },
    rooms: [{ typeId: 'sSuite', adults: 2 }],
  };

  test('a valid request passes (no booking ID needed: the server makes it)', () => {
    expect(() => validateReservationInput(valid)).not.toThrow();
  });

  test.each([
    [{ rooms: [] }, /between 1 and 10 rooms/],
    [
      { rooms: [...Array(11)].map(() => ({ typeId: 'sSuite', adults: 1 })) },
      /between 1 and 10 rooms/,
    ],
    [{ rooms: [{ typeId: 'bogus', adults: 1 }] }, /^Choose a valid room type/],
    [
      {
        rooms: [
          { typeId: 'sSuite', adults: 1 },
          { typeId: 'sSuite', adults: 0 },
        ],
      },
      /^Room 2: every room needs at least 1 adult/,
    ],
    [
      { bookingDates: { bookedFrom: '2031-01-03', bookedUntil: '2031-01-03' } },
      /at least one day after/,
    ],
    [
      { contactDetails: { name: 'A', email: '', phone: '1' } },
      /contact details/,
    ],
  ])('refuses %o', (change, message) => {
    expect(() => validateReservationInput({ ...valid, ...change })).toThrow(
      ReservationInputError
    );
    expect(() => validateReservationInput({ ...valid, ...change })).toThrow(
      message
    );
  });
});

describe('the rooms of one booking', () => {
  test('groupIdsOf: older reservations are a booking of one', () => {
    expect(groupIdsOf({ id: 'a' })).toEqual(['a']);
    expect(groupIdsOf({ id: 'a', groupReservationIds: ['b', 'a'] })).toEqual([
      'b',
      'a',
    ]);
  });

  test('sortByRoomOrder', () => {
    const ids = ['b', 'a', 'c'];
    const rooms = ['a', 'c', 'b'].map((id) => ({
      id,
      groupReservationIds: ids,
    }));
    expect(sortByRoomOrder(rooms).map((r) => r.id)).toEqual(ids);
  });
});
