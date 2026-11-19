import { beforeEach, describe, expect, test, vi } from 'vitest';
import { api } from '../support/api';
import { emailsAbout } from '../support/emails';
import {
  availability,
  complete,
  getBooking,
  payWithCard,
  reserve,
  startPayment,
} from '../support/booking';

const MINUTE = 60 * 1000;
let start;
/** Moves the clock to `minutes` after the test started. */
const at = (minutes) => vi.setSystemTime(start + minutes * MINUTE);

beforeEach(() => {
  start = Date.now();
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(start);
});

const lookup = async (bookingId, email) =>
  (await api.get(`/api/rooms/reserve?bookingId=${bookingId}&email=${email}`))
    .body;

describe('demo reservations whose hold already ran out', () => {
  test('are released on the first request; only the one that had a hold gets an email', async () => {
    const expired = (await lookup('AZGUESTEXP1', 'eve.expired@example.com'))
      .reservation;
    expect(expired).toMatchObject({
      bookingStatus: 'cancelled',
      cancellationReason: 'expired',
    });
    expect(expired.cancelledAt).toBeTruthy();

    const old = (await lookup('AZOLDRES01', 'oscar.old@example.com'))
      .reservation;
    expect(old).toMatchObject({
      bookingStatus: 'cancelled',
      cancellationReason: 'expired',
    });

    expect(emailsAbout('Reservation Expired - AZGUESTEXP1')).toHaveLength(1);
    expect(emailsAbout('Reservation Expired - AZOLDRES01')).toHaveLength(0);

    const active = (await lookup('AZJANERES1', 'jane@example.com')).reservation;
    expect(active.bookingStatus).toBe('reserved');
  });
});

describe('a hold running out', () => {
  test('new reservations are held for 1 hour', async () => {
    const { body } = await reserve([{ typeId: 'sSuite', adults: 2 }]);
    expect(body.holdExpiresAt).toBe(
      new Date(start + 60 * MINUTE).toISOString()
    );
    expect(await getBooking(body.reservationId)).toMatchObject({
      createdAt: new Date(start).toISOString(),
      holdExpiresAt: body.holdExpiresAt,
    });
  });

  test('after an hour unpaid: cancelled ("expired"), rooms freed, one email', async () => {
    const before = (await availability()).availableCounts.eSuite;
    const { body } = await reserve([
      { typeId: 'eSuite', adults: 2 },
      { typeId: 'eSuite', adults: 1 },
    ]);

    at(59);
    expect((await availability()).availableCounts.eSuite).toBe(before - 2);

    at(60);
    expect((await availability()).availableCounts.eSuite).toBe(before);
    const { groupReservations } = await getBooking(body.reservationId);
    for (const room of groupReservations) {
      expect(room).toMatchObject({
        bookingStatus: 'cancelled',
        cancellationReason: 'expired',
      });
    }

    await api.get('/api/cron/release-holds');
    const emails = emailsAbout(`Reservation Expired - ${body.bookingId}`);
    expect(emails).toHaveLength(1);
    expect(emails[0].text).toContain('Rooms: 2');
  });

  test('an expired reservation can no longer be paid', async () => {
    const { body } = await reserve([{ typeId: 'sSuite', adults: 1 }]);
    at(61);
    const { status, body: error } = await startPayment(body.reservationId);
    expect(status).toBe(409);
    expect(error.code).toBe('expired');
    expect(error.error).toMatch(/expired because it wasn't paid within 1 hour/);
  });

  test('the clean-up endpoint releases them too (and needs CRON_SECRET when set)', async () => {
    const { body } = await reserve([{ typeId: 'sSuite', adults: 1 }]);
    at(61);
    const released = await api.get('/api/cron/release-holds');
    // (The demo reservations awaiting payment have run out by now too)
    expect(released.body.released).toContain(body.reservationId);

    vi.stubEnv('CRON_SECRET', 's3cret');
    expect((await api.get('/api/cron/release-holds')).status).toBe(401);
    expect(
      (
        await api.get('/api/cron/release-holds', {
          authorization: 'Bearer s3cret',
        })
      ).status
    ).toBe(200);
    vi.unstubAllEnvs();
  });
});

describe('starting to pay near the end of the hour', () => {
  test('gives up to 15 more minutes, never past 1 hour 15', async () => {
    const { body } = await reserve([{ typeId: 'sSuite', adults: 1 }]);
    const holdEnd = async () =>
      new Date((await getBooking(body.reservationId)).holdExpiresAt).getTime() -
      start;

    at(50);
    await startPayment(body.reservationId);
    expect(await holdEnd()).toBe(65 * MINUTE);

    at(64); // past the original hour, still held
    await availability();
    expect((await getBooking(body.reservationId)).bookingStatus).toBe(
      'reserved'
    );
    const payment = await startPayment(body.reservationId);
    expect(await holdEnd()).toBe(75 * MINUTE); // capped

    const intent = await payWithCard(payment.body.clientSecret);
    expect(
      (await complete(body.reservationId, body.bookingId, intent.id)).status
    ).toBe(200);
    expect((await getBooking(body.reservationId)).bookingStatus).toBe('booked');
  });
});

describe('a payment that finishes after the hold ran out', () => {
  test('rooms still free: booked anyway', async () => {
    const before = (await availability()).availableCounts.pSuite;
    const { body } = await reserve([{ typeId: 'pSuite', adults: 2 }]);
    const payment = await startPayment(body.reservationId);

    at(80);
    await availability(); // releases the hold
    expect((await getBooking(body.reservationId)).cancellationReason).toBe(
      'expired'
    );

    const intent = await payWithCard(payment.body.clientSecret);
    expect(
      (await complete(body.reservationId, body.bookingId, intent.id)).status
    ).toBe(200);
    expect(await getBooking(body.reservationId)).toMatchObject({
      bookingStatus: 'booked',
      cancellationReason: null,
    });
    expect((await availability()).availableCounts.pSuite).toBe(before - 1);
    expect(
      emailsAbout(`Booking Confirmation - ${body.bookingId}`)
    ).toHaveLength(1);
  });

  test('rooms taken by someone else: refunded in full, once', async () => {
    const { body } = await reserve([{ typeId: 'eSuite', adults: 2 }]);
    const payment = await startPayment(body.reservationId);

    at(80);
    const suitesFree = (await availability()).availableCounts.eSuite;
    const other = await reserve(
      Array(suitesFree).fill({ typeId: 'eSuite', adults: 1 })
    );
    expect(other.status).toBe(200);

    const intent = await payWithCard(payment.body.clientSecret);
    const refused = await complete(
      body.reservationId,
      body.bookingId,
      intent.id
    );
    expect(refused.status).toBe(409);
    expect(refused.body).toMatchObject({ code: 'refunded' });
    expect(refused.body.error).toMatch(
      /expired before your payment went through/
    );

    // Asking again, or Stripe reporting it, doesn't refund or email twice
    expect(
      (await complete(body.reservationId, body.bookingId, intent.id)).body.code
    ).toBe('refunded');
    const room = await getBooking(body.reservationId);
    expect(room.bookingStatus).toBe('cancelled');
    expect(room.refunds).toEqual([
      expect.objectContaining({
        paymentIntentId: intent.id,
        amount: intent.amount,
        reason: 'expired',
      }),
    ]);
    const emails = emailsAbout(`Payment Refunded - ${body.bookingId}`);
    expect(emails).toHaveLength(1);
    expect(emails[0].text).toContain('after your reservation had expired');
    expect(emails[0].text).toContain('Amount refunded: $791.00 CAD');
    expect((await getBooking(other.body.reservationId)).bookingStatus).toBe(
      'reserved'
    );
  });
});

describe('ending a hold on purpose (mock mode, for QA)', () => {
  test('POST /api/mock/holds/expire cancels the booking as after a real hour', async () => {
    const { body } = await reserve([
      { typeId: 'sSuite', adults: 1 },
      { typeId: 'sSuite', adults: 1 },
    ]);
    const { status, body: result } = await api.post('/api/mock/holds/expire', {
      bookingId: body.bookingId,
    });
    expect(status).toBe(200);
    expect(result.released).toEqual([
      { bookingId: body.bookingId, reservationIds: body.reservationIds },
    ]);
    expect((await getBooking(body.reservationId)).cancellationReason).toBe(
      'expired'
    );
    expect(emailsAbout(`Reservation Expired - ${body.bookingId}`)).toHaveLength(
      1
    );

    const again = await api.post('/api/mock/holds/expire', {
      bookingId: body.bookingId,
    });
    expect(again.status).toBe(404);
  });
});
