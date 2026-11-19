import { describe, expect, test } from 'vitest';
import { api } from '../support/api';
import {
  CONTACT,
  availability,
  complete,
  day,
  getBooking,
  intentIdOf,
  pay,
  payWithCard,
  reserve,
  startPayment,
} from '../support/booking';

const EIGHT_GUESTS = [
  { typeId: 'dStandard', adults: 4 },
  { typeId: 'dStandard', adults: 2 },
  { typeId: 'pSuite', adults: 2 },
];

describe('reserving several rooms', () => {
  test('one booking ID, rooms reserved together, priced by the server', async () => {
    const before = (await availability()).availableCounts;
    const { status, body } = await reserve(EIGHT_GUESTS);

    expect(status).toBe(200);
    expect(body.bookingId).toMatch(/^AZ[A-Z0-9]{8}$/);
    expect(body.reservationIds).toHaveLength(3);
    // 2 nights: King 135 x 2 + 13% = 305.10; Deluxe 150 x 2 + 13% = 339.00
    expect(body.pricing.totalPrice).toBe(949.2);
    expect(body.pricing.rooms.map((r) => r.totalPrice)).toEqual([
      305.1, 305.1, 339,
    ]);

    const after = (await availability()).availableCounts;
    expect(after.dStandard).toBe(before.dStandard - 2);
    expect(after.pSuite).toBe(before.pSuite - 1);
  });

  test('prices and status sent by the browser are ignored', async () => {
    const { body } = await api.post('/api/rooms/reserve', {
      bookingId: 'AZMINE0000',
      bookingDates: { bookedFrom: day(400), bookedUntil: day(401) },
      contactDetails: CONTACT,
      rooms: [{ typeId: 'sSuite', adults: 1 }],
      totalPrice: 1,
      bookingStatus: 'booked',
    });
    const room = await getBooking(body.reservationId);
    expect(body.bookingId).not.toBe('AZMINE0000');
    expect(room.totalPrice).toBe(135.6);
    expect(room.bookingStatus).toBe('reserved');
  });

  test('the rooms are linked, in order, in different physical rooms', async () => {
    const { body } = await reserve(EIGHT_GUESTS);
    const { groupReservations } = await getBooking(body.reservationIds[1]);

    expect(groupReservations.map((r) => r.id)).toEqual(body.reservationIds);
    expect(new Set(groupReservations.map((r) => r.roomId)).size).toBe(3);
    for (const room of groupReservations) {
      expect(room).toMatchObject({
        bookingId: body.bookingId,
        bookingStatus: 'reserved',
        guestCountActual: 8,
        groupReservationIds: body.reservationIds,
      });
    }
    expect(groupReservations.map((r) => r.guestCount)).toEqual([4, 2, 2]);
  });

  test('looking the booking up returns every room', async () => {
    const { body } = await reserve(EIGHT_GUESTS);
    const lookup = await api.get(
      `/api/rooms/reserve?bookingId=${body.bookingId}&email=${CONTACT.email}`
    );
    expect(lookup.status).toBe(200);
    expect(lookup.body.reservations.map((r) => r.id)).toEqual(
      body.reservationIds
    );
    expect(lookup.body.reservation.id).toBe(body.reservationIds[0]);
  });

  test('asking for more rooms than are free reserves nothing', async () => {
    const before = (await availability()).availableCounts;
    const { status, body } = await reserve([
      ...Array(before.eSuite + 1).fill({ typeId: 'eSuite', adults: 1 }),
      { typeId: 'sSuite', adults: 1 },
    ]);
    expect(status).toBe(409);
    expect(body.error).toBe(
      `Only ${before.eSuite} Presidential Suites are available for these dates, not ${before.eSuite + 1}.`
    );
    expect((await availability()).availableCounts).toEqual(before);
  });

  test('two guests after the last rooms at once: one gets them, the other a 409', async () => {
    const free = (await availability()).availableCounts.eSuite;
    const [a, b] = await Promise.all([
      reserve(Array(free).fill({ typeId: 'eSuite', adults: 1 })),
      reserve([{ typeId: 'eSuite', adults: 1 }]),
    ]);
    expect([a.status, b.status].sort()).toEqual([200, 409]);
    expect((await availability()).availableCounts.eSuite).toBe(
      a.status === 200 ? 0 : free - 1
    );
  });
});

describe('paying for several rooms', () => {
  test('one payment for the whole booking', async () => {
    const { body } = await reserve(EIGHT_GUESTS);
    const payment = await startPayment(body.reservationIds[0]);
    expect(payment.status).toBe(200);
    expect(payment.body.amount).toBe(949.2);
    expect(payment.body.reservationIds).toEqual(body.reservationIds);

    const intent = await payWithCard(payment.body.clientSecret);
    const done = await complete(body.reservationId, body.bookingId, intent.id);
    expect(done.status).toBe(200);

    const { groupReservations } = await getBooking(body.reservationId);
    for (const room of groupReservations) {
      expect(room.bookingStatus).toBe('booked');
      expect(room.paymentDetails.paymentIntentId).toBe(intent.id);
    }
    // Each room's share of the one payment
    expect(
      groupReservations.map((r) => r.paymentDetails.paymentAmount)
    ).toEqual([30510, 30510, 33900]);
  });

  test('reporting the same payment again is fine; paying again is not', async () => {
    const { body } = await reserve(EIGHT_GUESTS);
    const intent = await pay(body.reservationId);
    await complete(body.reservationId, body.bookingId, intent.id);

    expect(
      (await complete(body.reservationId, body.bookingId, intent.id)).status
    ).toBe(200);
    expect(
      (await complete(body.reservationIds[2], body.bookingId, intent.id)).status
    ).toBe(200);
    expect((await startPayment(body.reservationId)).status).toBe(409);
  });

  test('a payment for another booking, or one not paid, is refused', async () => {
    const { body } = await reserve(EIGHT_GUESTS);
    const other = await pay('mock-res-john-reserved-1');
    expect(
      (await complete(body.reservationId, body.bookingId, other.id)).status
    ).toBe(402);

    const unpaid = await startPayment(body.reservationId);
    const unpaidId = intentIdOf(unpaid.body.clientSecret);
    expect(
      (await complete(body.reservationId, body.bookingId, unpaidId)).status
    ).toBe(402);
    expect((await getBooking(body.reservationId)).bookingStatus).toBe(
      'reserved'
    );
  });

  test('after cancelling one room, the payment covers the rest', async () => {
    const { body } = await reserve([
      { typeId: 'sSuite', adults: 1 },
      { typeId: 'eSuite', adults: 2 },
    ]);
    await api.patch('/api/rooms/cancel-reservation', {
      reservationId: body.reservationIds[0],
    });

    // Started from the cancelled room: still pays for the booking's other room
    const payment = await startPayment(body.reservationIds[0]);
    expect(payment.body.reservationIds).toEqual([body.reservationIds[1]]);
    expect(payment.body.amount).toBe(791); // 350 x 2 nights + 13%

    const intent = await payWithCard(payment.body.clientSecret);
    expect(
      (await complete(body.reservationIds[0], body.bookingId, intent.id)).status
    ).toBe(200);
    const { groupReservations } = await getBooking(body.reservationId);
    expect(groupReservations.map((r) => r.bookingStatus)).toEqual([
      'cancelled',
      'booked',
    ]);
  });
});

describe('cancelling', () => {
  test('one room, then the rest of the booking; rooms are freed', async () => {
    const before = (await availability()).availableCounts;
    const { body } = await reserve(EIGHT_GUESTS);

    const one = await api.patch('/api/rooms/cancel-reservation', {
      reservationId: body.reservationIds[1],
    });
    expect(one.body.cancelledIds).toEqual([body.reservationIds[1]]);

    const rest = await api.patch('/api/rooms/cancel-reservation', {
      reservationId: body.reservationIds[0],
      scope: 'booking',
    });
    expect(rest.body.cancelledIds).toHaveLength(2);

    const again = await api.patch('/api/rooms/cancel-reservation', {
      reservationId: body.reservationIds[0],
      scope: 'booking',
    });
    expect(again.status).toBe(409);
    expect((await availability()).availableCounts).toEqual(before);
  });

  test('the room and dates to free come from the reservation, not the request', async () => {
    const { body } = await reserve([{ typeId: 'pSuite', adults: 2 }]);
    const { status } = await api.patch('/api/rooms/cancel-reservation', {
      reservationId: body.reservationId,
      roomId: 'someone-elses-room',
      bookedFrom: 'x',
      bookedUntil: 'y',
    });
    expect(status).toBe(200);
    expect((await getBooking(body.reservationId)).cancellationReason).toBe(
      'guest'
    );
  });
});

describe('requests the API refuses', () => {
  test.each([
    [[], /between 1 and 10 rooms/],
    [Array(11).fill({ typeId: 'sSuite', adults: 1 }), /between 1 and 10 rooms/],
    [[{ typeId: 'bogus', adults: 1 }], /valid room type/],
    [[{ typeId: 'sSuite', adults: 5 }], /up to 4 adults/],
  ])('rooms %j -> 400', async (rooms, message) => {
    const { status, body } = await reserve(rooms);
    expect(status).toBe(400);
    expect(body.error).toMatch(message);
  });

  test.each([
    'startDate=garbage&endDate=x',
    'startDate=2031-01-05&endDate=2031-01-05',
    'startDate=2031-01-05&endDate=2031-01-02',
    '',
  ])('availability with bad dates (%s) -> 400', async (query) => {
    expect((await api.get(`/api/rooms/available?${query}`)).status).toBe(400);
  });
});

describe('older requests and reservations still work', () => {
  test('rooms given as { typeId, guestCount }: guests counted as adults', async () => {
    const { body } = await reserve([{ typeId: 'pSuite', guestCount: 3 }]);
    expect(await getBooking(body.reservationId)).toMatchObject({
      adults: 3,
      children: 0,
      pets: 0,
      guestCount: 3,
    });
  });

  test('the single-room { updatePathId, guestCount } request', async () => {
    const { status, body } = await api.post('/api/rooms/reserve', {
      bookingDates: { bookedFrom: day(400), bookedUntil: day(401) },
      contactDetails: CONTACT,
      updatePathId: 'mock-room-1100',
      guestCount: 3,
      guestCountActual: 7,
    });
    expect(status).toBe(200);
    expect(body.pricing.roomPrice).toBe(120);
    expect(await getBooking(body.reservationId)).toMatchObject({
      guestCount: 3,
      guestCountActual: 7,
      groupReservations: [expect.objectContaining({ id: body.reservationId })],
    });
  });

  test('demo reservations made before multi-room bookings', async () => {
    const payment = await startPayment('mock-res-guest-reserved-1');
    expect(payment.body.reservationIds).toEqual(['mock-res-guest-reserved-1']);
    const lookup = await api.get(
      '/api/rooms/reserve?bookingId=AZGUESTBK1&email=gary.guest@example.com'
    );
    expect(lookup.body.reservations).toHaveLength(1);
  });
});
