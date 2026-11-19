/**
 * lib/data/firestoreRepository.js (used in production) against an
 * in-memory Firestore stand-in (tests/support/fakeFirestore.js).
 */
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { RoomUnavailableError } from '@/lib/booking/reservations';
import { store } from '../support/fakeFirestore';

vi.mock('firebase/firestore', () => import('../support/fakeFirestore'));
vi.mock('firebase/auth', () => ({
  createUserWithEmailAndPassword: vi.fn(),
  deleteUser: vi.fn(),
}));
vi.mock('@/lib/firebase/firebase', async () => ({
  db: (await import('../support/fakeFirestore')).db,
  auth: {},
}));

const repo = await import('@/lib/data/firestoreRepository');

const STAY = { bookedFrom: '2031-03-01', bookedUntil: '2031-03-03' };
const room = (id, typeId, extra = {}) =>
  store.set(`rooms/${id}`, {
    id,
    typeId,
    status: 'available',
    bookings: [],
    price: 120,
    ...extra,
  });
const reservationFor = (pathId, changes = {}) => ({
  bookingId: 'AZTEST0001',
  updatePathId: pathId,
  roomId: pathId,
  bookingDates: STAY,
  bookingStatus: 'reserved',
  totalPrice: 100,
  contactDetails: { email: 'guest@example.com' },
  ...changes,
});
const saved = (id) => store.get(`reservations/${id}`);

beforeEach(() => {
  store.clear();
  room('q1', 'sSuite');
  room('q2', 'sSuite', { petFriendly: true });
  room('k1', 'dStandard', {
    status: 'booked',
    bookings: [{ bookedFrom: '2031-03-02', bookedUntil: '2031-03-04' }],
  });
  room('m1', 'dStandard', { status: 'maintenance' });
});

describe('finding free rooms', () => {
  test('by type; not under maintenance or booked for the dates', async () => {
    const free = await repo.findFreeRooms(
      new Date('2031-03-01'),
      new Date('2031-03-02')
    );
    expect(free.sSuite.map((r) => r.pathId)).toEqual(['q1', 'q2']);
    expect(free.dStandard).toEqual([]);
    expect(free.sSuite[1].petFriendly).toBe(true);
  });
});

describe('creating the reservations of a booking', () => {
  test('all linked to each other, rooms marked booked', async () => {
    const { bookingId, reservationIds } = await repo.createReservations([
      reservationFor('q1'),
      reservationFor('q2'),
    ]);
    expect(bookingId).toBe('AZTEST0001');
    for (const id of reservationIds) {
      expect(saved(id).groupReservationIds).toEqual(reservationIds);
      expect(saved(id).updatePathId).toBeUndefined();
    }
    expect(store.get('rooms/q1')).toMatchObject({
      status: 'booked',
      bookings: [STAY],
    });
  });

  test('all or nothing when a room is taken', async () => {
    const before = JSON.stringify([...store]);
    await expect(
      repo.createReservations([reservationFor('q1'), reservationFor('k1')])
    ).rejects.toThrow(RoomUnavailableError);
    expect(JSON.stringify([...store])).toBe(before);
  });

  test('the same room twice is refused', async () => {
    await expect(
      repo.createReservations([reservationFor('q1'), reservationFor('q1')])
    ).rejects.toThrow(/twice/);
  });
});

describe('looking reservations up', () => {
  test('by IDs, booking ID + email, status; booking ID in use', async () => {
    const { reservationIds } = await repo.createReservations([
      reservationFor('q1'),
      reservationFor('q2'),
    ]);
    expect(
      await repo.getReservationsByIds([...reservationIds, 'missing'])
    ).toHaveLength(2);
    expect(
      await repo.findReservationsByBookingIdAndEmail(
        'AZTEST0001',
        'guest@example.com'
      )
    ).toHaveLength(2);
    expect(await repo.findReservationsByStatus('reserved')).toHaveLength(2);
    expect(await repo.isBookingIdTaken('AZTEST0001')).toBe(true);
    expect(await repo.isBookingIdTaken('AZOTHER000')).toBe(false);
  });

  test('updateReservations updates several at once', async () => {
    const { reservationIds } = await repo.createReservations([
      reservationFor('q1'),
      reservationFor('q2'),
    ]);
    await repo.updateReservations(
      Object.fromEntries(
        reservationIds.map((id) => [id, { bookingStatus: 'booked' }])
      )
    );
    expect(reservationIds.map((id) => saved(id).bookingStatus)).toEqual([
      'booked',
      'booked',
    ]);
  });
});

describe('cancelling', () => {
  test('frees the rooms, saves the reason, skips ones not reserved or booked', async () => {
    const { reservationIds } = await repo.createReservations([
      reservationFor('q1'),
      reservationFor('q2'),
    ]);
    saved(reservationIds[1]).bookingStatus = 'checkedIn';

    const cancelled = await repo.cancelReservations(reservationIds, {
      reason: 'expired',
      at: 'T1',
    });
    expect(cancelled).toEqual([reservationIds[0]]);
    expect(saved(reservationIds[0])).toMatchObject({
      bookingStatus: 'cancelled',
      cancellationReason: 'expired',
      cancelledAt: 'T1',
    });
    expect(store.get('rooms/q1')).toMatchObject({
      bookings: [],
      status: 'available',
    });
    expect(store.get('rooms/q2').bookings).toEqual([STAY]);
    expect(await repo.cancelReservations([reservationIds[0]])).toEqual([]);
  });
});

describe('completing a payment', () => {
  const updates = (ids, paymentIntentId) =>
    Object.fromEntries(
      ids.map((id) => [id, { paymentDetails: { paymentIntentId } }])
    );

  test('books reservations awaiting payment; the same payment again changes nothing', async () => {
    const { reservationIds } = await repo.createReservations([
      reservationFor('q1'),
    ]);
    const payment = {
      paymentIntentId: 'pi_1',
      updatesById: updates(reservationIds, 'pi_1'),
    };
    expect(await repo.completeReservations(reservationIds, payment)).toEqual({
      alreadyBooked: false,
    });
    expect(saved(reservationIds[0]).bookingStatus).toBe('booked');
    expect(await repo.completeReservations(reservationIds, payment)).toEqual({
      alreadyBooked: true,
    });
  });

  test('takes back rooms released by an expired hold, if still free', async () => {
    const { reservationIds } = await repo.createReservations([
      reservationFor('q1'),
      reservationFor('q2'),
    ]);
    await repo.cancelReservations(reservationIds, { reason: 'expired' });

    await repo.completeReservations(reservationIds, {
      paymentIntentId: 'pi_1',
      updatesById: updates(reservationIds, 'pi_1'),
    });
    for (const id of reservationIds) {
      expect(saved(id)).toMatchObject({
        bookingStatus: 'booked',
        cancellationReason: null,
      });
    }
    expect(store.get('rooms/q1')).toMatchObject({
      status: 'booked',
      bookings: [STAY],
    });
  });

  test('refuses, changing nothing, when a released room was taken', async () => {
    const { reservationIds } = await repo.createReservations([
      reservationFor('q1'),
      reservationFor('q2'),
    ]);
    await repo.cancelReservations(reservationIds, { reason: 'expired' });
    store.get('rooms/q2').bookings.push({ ...STAY });

    const before = JSON.stringify([...store]);
    await expect(
      repo.completeReservations(reservationIds, {
        paymentIntentId: 'pi_1',
        updatesById: {},
      })
    ).rejects.toThrow(RoomUnavailableError);
    expect(JSON.stringify([...store])).toBe(before);
  });

  test('refuses rooms the guest cancelled, or booked with another payment', async () => {
    const { reservationIds } = await repo.createReservations([
      reservationFor('q1'),
    ]);
    await repo.completeReservations(reservationIds, {
      paymentIntentId: 'pi_1',
      updatesById: updates(reservationIds, 'pi_1'),
    });
    await expect(
      repo.completeReservations(reservationIds, {
        paymentIntentId: 'pi_2',
        updatesById: {},
      })
    ).rejects.toThrow(RoomUnavailableError);

    const other = await repo.createReservations([
      reservationFor('q2', { bookingId: 'AZTEST0002' }),
    ]);
    await repo.cancelReservations(other.reservationIds, { reason: 'guest' });
    await expect(
      repo.completeReservations(other.reservationIds, {
        paymentIntentId: 'pi_3',
        updatesById: {},
      })
    ).rejects.toThrow(RoomUnavailableError);
  });
});

describe('refunds', () => {
  test('noted once per payment', async () => {
    const { reservationIds } = await repo.createReservations([
      reservationFor('q1'),
      reservationFor('q2'),
    ]);
    const refund = {
      paymentIntentId: 'pi_2',
      refundId: 're_1',
      amount: 20000,
      at: 'T2',
    };
    expect(await repo.recordRefund(reservationIds, refund)).toBe(true);
    expect(
      await repo.recordRefund(reservationIds, { ...refund, refundId: 're_2' })
    ).toBe(false);
    for (const id of reservationIds)
      expect(saved(id).refunds).toEqual([refund]);
  });
});
