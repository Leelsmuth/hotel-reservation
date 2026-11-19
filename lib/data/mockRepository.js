/**
 * In-memory implementation of the data repository used in mock mode.
 *
 * It intentionally reproduces the behaviour of lib/data/firestoreRepository.js
 * (including its quirks) so the UI behaves the same against mock data as it
 * does against Firestore.
 */
import { freeRoomsByType } from '@/lib/booking/availability';
import {
  ACTIVE_STATUSES,
  RoomUnavailableError,
} from '@/lib/booking/reservations';
import { isDateOverlap } from '@/lib/helpers/isDateOverlap';
import {
  CANCELLATION_REASON,
  RESERVATION_STATUS,
  ROOM_STATUS,
  ROOM_TYPES_NAMES,
} from '@/lib/static/roomLegend';
import { createUser } from '@/lib/mock/mockAuthServer';
import {
  clone,
  generateMockId,
  getMockStore,
  mockLatency,
} from '@/lib/mock/store';

const sameDates = (a, b) =>
  a.bookedFrom === b.bookedFrom && a.bookedUntil === b.bookedUntil;

export const findFreeRooms = async (desiredStartDate, desiredEndDate) => {
  await mockLatency();
  return clone(
    freeRoomsByType(
      [...getMockStore().rooms.values()],
      desiredStartDate,
      desiredEndDate
    )
  );
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

export const isBookingIdTaken = async (bookingId) => {
  await mockLatency();
  return [...getMockStore().reservations.values()].some(
    (reservation) => reservation.bookingId === bookingId
  );
};

export const getReservationsByIds = async (reservationIds) => {
  await mockLatency();
  const { reservations } = getMockStore();
  return clone(
    reservationIds.map((id) => reservations.get(id)).filter(Boolean)
  );
};

export const findReservationsByBookingIdAndEmail = async (bookingId, email) => {
  await mockLatency();
  return clone(
    [...getMockStore().reservations.values()].filter(
      (res) =>
        res.bookingId === bookingId && res.contactDetails?.email === email
    )
  );
};

export const findReservationsByStatus = async (bookingStatus) => {
  await mockLatency();
  return clone(
    [...getMockStore().reservations.values()].filter(
      (res) => res.bookingStatus === bookingStatus
    )
  );
};

export const findReservationsByUser = async (userId, bookingStatus) => {
  await mockLatency();
  return clone(
    [...getMockStore().reservations.values()].filter(
      (res) => res.bookingStatus === bookingStatus && res.userId === userId
    )
  );
};

export const createReservations = async (reservations) => {
  await mockLatency();
  const store = getMockStore();

  const roomPathIds = reservations.map((r) => r.updatePathId);
  if (new Set(roomPathIds).size !== roomPathIds.length) {
    throw new Error('The same room was requested twice.');
  }

  // Check every room before changing anything (all or nothing, like the
  // Firestore transaction)
  const rooms = roomPathIds.map((pathId) => {
    const room = store.rooms.get(pathId);
    if (!room) {
      throw new Error(`Room document with ID ${pathId} does not exist.`);
    }
    return room;
  });
  rooms.forEach((room, index) => {
    if (isDateOverlap(room.bookings || [], reservations[index].bookingDates)) {
      throw new RoomUnavailableError(
        `The ${ROOM_TYPES_NAMES[room.typeId] ?? 'room'} was just booked by someone else for these dates.`
      );
    }
  });

  const reservationIds = reservations.map(() => generateMockId('mock-res'));

  reservations.forEach(
    ({ bookingDates, updatePathId, ...reservationDetails }, index) => {
      const id = reservationIds[index];
      store.reservations.set(id, {
        ...clone(reservationDetails),
        id,
        bookingDates: { ...bookingDates },
        groupReservationIds: [...reservationIds],
      });

      const room = rooms[index];
      const existingBookings = room.bookings || [];
      room.status = ROOM_STATUS.BOOKED;
      if (!existingBookings.some((b) => sameDates(b, bookingDates))) {
        room.bookings = [...existingBookings, { ...bookingDates }];
      }
    }
  );

  return { bookingId: reservations[0].bookingId, reservationIds };
};

export const updateReservations = async (updatesById) => {
  await mockLatency();
  const store = getMockStore();
  const ids = Object.keys(updatesById);
  const missing = ids.find((id) => !store.reservations.has(id));
  if (missing) {
    throw new Error(`No document to update: reservations/${missing}`);
  }
  ids.forEach((id) => {
    store.reservations.set(id, {
      ...store.reservations.get(id),
      ...clone(updatesById[id]),
    });
  });
};

export const cancelReservations = async (
  reservationIds,
  { reason, at } = {}
) => {
  await mockLatency();
  const store = getMockStore();

  const reservations = reservationIds.map((id) => {
    const reservation = store.reservations.get(id);
    if (!reservation) {
      throw new Error(`Reservation with ID ${id} does not exist.`);
    }
    return reservation;
  });
  const toCancel = reservations.filter((r) =>
    ACTIVE_STATUSES.includes(r.bookingStatus)
  );
  toCancel.forEach(({ roomId }) => {
    if (!store.rooms.has(roomId)) {
      throw new Error(`Room with ID ${roomId} does not exist.`);
    }
  });

  toCancel.forEach((reservation) => {
    reservation.bookingStatus = RESERVATION_STATUS.CANCELLED;
    if (reason) {
      reservation.cancellationReason = reason;
      reservation.cancelledAt = at ?? new Date().toISOString();
    }

    const room = store.rooms.get(reservation.roomId);
    room.bookings = (room.bookings || []).filter(
      (b) => !sameDates(b, reservation.bookingDates)
    );
    if (room.bookings.length === 0 && room.status === ROOM_STATUS.BOOKED) {
      room.status = ROOM_STATUS.AVAILABLE;
    }
  });

  return toCancel.map((r) => r.id);
};

export const completeReservations = async (
  reservationIds,
  { paymentIntentId, updatesById }
) => {
  await mockLatency();
  const store = getMockStore();
  const reservations = reservationIds.map((id) => {
    const reservation = store.reservations.get(id);
    if (!reservation) {
      throw new Error(`Reservation with ID ${id} does not exist.`);
    }
    return reservation;
  });

  if (
    reservations.every(
      (r) =>
        r.bookingStatus === RESERVATION_STATUS.BOOKED &&
        r.paymentDetails?.paymentIntentId === paymentIntentId
    )
  ) {
    return { alreadyBooked: true };
  }

  // Check everything before changing anything (all or nothing)
  const toRetake = reservations.filter(
    (r) => r.bookingStatus !== RESERVATION_STATUS.RESERVED
  );
  toRetake.forEach((reservation) => {
    if (
      reservation.bookingStatus !== RESERVATION_STATUS.CANCELLED ||
      reservation.cancellationReason !== CANCELLATION_REASON.EXPIRED
    ) {
      throw new RoomUnavailableError(
        'A room this payment was for is no longer awaiting payment.'
      );
    }
    const room = store.rooms.get(reservation.roomId);
    if (!room || isDateOverlap(room.bookings || [], reservation.bookingDates)) {
      throw new RoomUnavailableError(
        'A room this payment was for has been booked by someone else.'
      );
    }
  });

  reservations.forEach((reservation) => {
    Object.assign(reservation, clone(updatesById[reservation.id]), {
      bookingStatus: RESERVATION_STATUS.BOOKED,
    });
  });
  toRetake.forEach((reservation) => {
    reservation.cancellationReason = null;
    reservation.cancelledAt = null;
    const room = store.rooms.get(reservation.roomId);
    room.status = ROOM_STATUS.BOOKED;
    room.bookings = [...(room.bookings || []), { ...reservation.bookingDates }];
  });

  return { alreadyBooked: false };
};

export const recordRefund = async (reservationIds, refund) => {
  await mockLatency();
  const reservations = reservationIds
    .map((id) => getMockStore().reservations.get(id))
    .filter(Boolean);
  const isNew = !reservations.some((r) =>
    (r.refunds || []).some(
      (noted) => noted.paymentIntentId === refund.paymentIntentId
    )
  );
  if (isNew) {
    reservations.forEach((reservation) => {
      reservation.refunds = [...(reservation.refunds || []), clone(refund)];
    });
  }
  return isNew;
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
