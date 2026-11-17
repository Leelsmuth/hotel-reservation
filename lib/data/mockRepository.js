/**
 * In-memory implementation of the data repository used in mock mode.
 *
 * It intentionally reproduces the behaviour of lib/data/firestoreRepository.js
 * (including its quirks) so the UI behaves the same against mock data as it
 * does against Firestore.
 */
import { isDateOverlap } from '@/lib/helpers/isDateOverlap';
import { isRoomAvailableForDateRange } from '@/lib/helpers/isRoomAvailableForDateRange';
import { ROOM_STATUS, ROOM_TYPES_IDS } from '@/lib/static/roomLegend';
import { createUser } from '@/lib/mock/mockAuthServer';
import {
  clone,
  generateMockId,
  getMockStore,
  mockLatency,
} from '@/lib/mock/store';

const sameDates = (a, b) =>
  a.bookedFrom === b.bookedFrom && a.bookedUntil === b.bookedUntil;

const roomsOfType = (typeId) =>
  [...getMockStore().rooms.values()]
    .filter((room) => room.typeId === typeId)
    .sort((a, b) => a.pathId.localeCompare(b.pathId));

export const findAvailableRooms = async (desiredStartDate, desiredEndDate) => {
  await mockLatency();
  const results = {};

  for (const type of Object.values(ROOM_TYPES_IDS)) {
    const rooms = roomsOfType(type);

    // Rooms with status "available" win regardless of dates (same as Firestore)
    const availableRoom = rooms.find(
      (room) => room.status === ROOM_STATUS.AVAILABLE
    );
    if (availableRoom) {
      results[type] = clone(availableRoom);
      continue;
    }

    // Otherwise look for a booked room that is free for the requested dates
    // (Firestore version keeps the last match, so do the same).
    let foundAvailableRoom = null;
    for (const room of rooms) {
      if (
        room.status === ROOM_STATUS.BOOKED &&
        isRoomAvailableForDateRange(
          room.bookings,
          desiredStartDate,
          desiredEndDate
        )
      ) {
        foundAvailableRoom = room;
      }
    }
    results[type] = clone(foundAvailableRoom);
  }

  return results;
};

export const getRoom = async (pathId) => {
  await mockLatency();
  return clone(getMockStore().rooms.get(pathId) ?? null);
};

export const getDiscounts = async () => {
  await mockLatency();
  return clone(getMockStore().discounts);
};

export const getReservationById = async (reservationId) => {
  await mockLatency();
  return clone(getMockStore().reservations.get(reservationId) ?? null);
};

export const findReservationByBookingIdAndEmail = async (bookingId, email) => {
  await mockLatency();
  let reservation = null;
  for (const res of getMockStore().reservations.values()) {
    if (res.bookingId === bookingId && res.contactDetails?.email === email) {
      reservation = res;
    }
  }
  return clone(reservation);
};

export const findReservationsByUser = async (userId, bookingStatus) => {
  await mockLatency();
  return clone(
    [...getMockStore().reservations.values()].filter(
      (res) => res.bookingStatus === bookingStatus && res.userId === userId
    )
  );
};

export const createReservation = async (bookingDetails) => {
  await mockLatency();
  const { bookingDates, updatePathId, ...reservationDetails } = bookingDetails;
  const store = getMockStore();

  const room = store.rooms.get(updatePathId);
  if (!room) {
    throw new Error(`Room document with ID ${updatePathId} does not exist.`);
  }

  const existingBookings = room.bookings || [];
  if (isDateOverlap(existingBookings, bookingDates)) {
    throw new Error('The new booking dates overlap with an existing booking.');
  }

  const reservationId = generateMockId('mock-res');
  store.reservations.set(reservationId, {
    ...clone(reservationDetails),
    id: reservationId,
    bookingDates: { ...bookingDates },
  });

  room.status = ROOM_STATUS.BOOKED;
  if (!existingBookings.some((b) => sameDates(b, bookingDates))) {
    room.bookings = [...existingBookings, { ...bookingDates }];
  }

  return { bookingId: reservationDetails.bookingId, reservationId };
};

export const updateReservation = async (reservationId, updates) => {
  await mockLatency();
  const store = getMockStore();
  const reservation = store.reservations.get(reservationId);
  if (!reservation) {
    throw new Error(`No document to update: reservations/${reservationId}`);
  }
  store.reservations.set(reservationId, {
    ...reservation,
    ...clone(updates),
  });
};

export const cancelReservation = async ({
  reservationId,
  roomId,
  bookedFrom,
  bookedUntil,
}) => {
  await mockLatency();
  const store = getMockStore();

  const reservation = store.reservations.get(reservationId);
  if (!reservation) {
    throw new Error(`Reservation with ID ${reservationId} does not exist.`);
  }

  const room = store.rooms.get(roomId);
  if (!room) {
    throw new Error(`Room with ID ${roomId} does not exist.`);
  }

  const existingBookings = room.bookings || [];
  const bookingToRemove = { bookedFrom, bookedUntil };

  reservation.bookingStatus = 'cancelled';
  room.bookings = existingBookings.filter(
    (b) => !sameDates(b, bookingToRemove)
  );

  if (existingBookings.length === 1) {
    room.status = 'available';
  }
};

export const signUpUser = async ({ fullName, email, password }) => {
  await mockLatency();
  const user = createUser({ fullName, email, password });
  return { uid: user.uid, user };
};

export const addRoom = async (content) => {
  await mockLatency();
  const pathId = generateMockId('mock-room');
  getMockStore().rooms.set(pathId, { bookings: [], ...clone(content), pathId });
  return pathId;
};
