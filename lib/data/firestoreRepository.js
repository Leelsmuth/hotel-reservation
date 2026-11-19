/**
 * Firestore implementation of the data repository used by the API routes.
 * See lib/data/repository.js for the contract and lib/data/mockRepository.js
 * for the in-memory implementation used in mock mode.
 */
import { auth, db } from '@/lib/firebase/firebase';
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
import { createUserWithEmailAndPassword, deleteUser } from 'firebase/auth';
import {
  addDoc,
  arrayUnion,
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  query,
  runTransaction,
  serverTimestamp,
  setDoc,
  where,
  writeBatch,
} from 'firebase/firestore';

export const findFreeRooms = async (desiredStartDate, desiredEndDate) => {
  const bookableRooms = query(
    collection(db, 'rooms'),
    where('status', 'in', [ROOM_STATUS.AVAILABLE, ROOM_STATUS.BOOKED])
  );
  const snapshot = await getDocs(bookableRooms);
  const rooms = snapshot.docs.map((roomDoc) => ({
    pathId: roomDoc.id,
    ...roomDoc.data(),
  }));

  return freeRoomsByType(rooms, desiredStartDate, desiredEndDate);
};

export const getRoom = async (pathId) => {
  const roomSnapshot = await getDoc(doc(db, 'rooms', pathId));
  return roomSnapshot.exists()
    ? { pathId: roomSnapshot.id, ...roomSnapshot.data() }
    : null;
};

export const getDiscounts = async () => {
  const discountSnapshot = await getDoc(doc(db, 'discounts', 'daysDiscount'));
  return discountSnapshot.exists() ? discountSnapshot.data() : {};
};

export const getReservationById = async (reservationId) => {
  const reservationRef = doc(db, 'reservations', reservationId);
  const reservationSnapshot = await getDoc(reservationRef);

  if (!reservationSnapshot.exists()) {
    return null;
  }

  return {
    id: reservationSnapshot.id,
    ...reservationSnapshot.data(),
  };
};

export const isBookingIdTaken = async (bookingId) => {
  const snapshot = await getDocs(
    query(
      collection(db, 'reservations'),
      where('bookingId', '==', bookingId),
      limit(1)
    )
  );
  return !snapshot.empty;
};

export const getReservationsByIds = async (reservationIds) => {
  const reservations = await Promise.all(
    reservationIds.map((id) => getReservationById(id))
  );
  return reservations.filter(Boolean);
};

export const findReservationsByBookingIdAndEmail = async (bookingId, email) => {
  const reservationsRef = collection(db, 'reservations');
  const reservationQuery = query(
    reservationsRef,
    where('bookingId', '==', bookingId),
    where('contactDetails.email', '==', email)
  );

  const querySnapshot = await getDocs(reservationQuery);
  return querySnapshot.docs.map((reservationDoc) => ({
    id: reservationDoc.id,
    ...reservationDoc.data(),
  }));
};

export const findReservationsByStatus = async (bookingStatus) => {
  const snapshot = await getDocs(
    query(
      collection(db, 'reservations'),
      where('bookingStatus', '==', bookingStatus)
    )
  );
  return snapshot.docs.map((reservationDoc) => ({
    id: reservationDoc.id,
    ...reservationDoc.data(),
  }));
};

export const findReservationsByUser = async (userId, bookingStatus) => {
  const reservationsRef = collection(db, 'reservations');
  const reservationQuery = query(
    reservationsRef,
    where('bookingStatus', '==', bookingStatus),
    where('userId', '==', userId)
  );

  const querySnapshot = await getDocs(reservationQuery);

  let reservations = [];
  querySnapshot.forEach((doc) => {
    reservations.push({ id: doc.id, ...doc.data() });
  });

  return reservations;
};

const sameDates = (a, b) =>
  a.bookedFrom === b.bookedFrom && a.bookedUntil === b.bookedUntil;

/**
 * Creates the reservations of one booking (one per room) and marks their
 * rooms as booked, all or nothing. Each reservation gets the IDs of all of
 * them in `groupReservationIds`.
 */
export const createReservations = async (reservations) => {
  const roomPathIds = reservations.map((r) => r.updatePathId);
  if (new Set(roomPathIds).size !== roomPathIds.length) {
    throw new Error('The same room was requested twice.');
  }

  let reservationIds = [];

  await runTransaction(db, async (transaction) => {
    const roomRefs = roomPathIds.map((pathId) => doc(db, 'rooms', pathId));

    // Firestore transactions need every read before the first write
    const roomDocs = [];
    for (const roomRef of roomRefs) {
      roomDocs.push(await transaction.get(roomRef));
    }

    roomDocs.forEach((roomDoc, index) => {
      if (!roomDoc.exists()) {
        throw new Error(
          `Room document with ID ${roomPathIds[index]} does not exist.`
        );
      }
      const existingBookings = roomDoc.data().bookings || [];
      if (isDateOverlap(existingBookings, reservations[index].bookingDates)) {
        const name = ROOM_TYPES_NAMES[roomDoc.data().typeId] ?? 'room';
        throw new RoomUnavailableError(
          `The ${name} was just booked by someone else for these dates.`
        );
      }
    });

    const reservationRefs = reservations.map(() =>
      doc(collection(db, 'reservations'))
    );
    const ids = reservationRefs.map((ref) => ref.id);

    reservations.forEach(
      ({ bookingDates, updatePathId, ...reservationDetails }, index) => {
        transaction.set(reservationRefs[index], {
          ...reservationDetails,
          bookingDates,
          groupReservationIds: ids,
        });
        transaction.update(roomRefs[index], {
          status: ROOM_STATUS.BOOKED,
          bookings: arrayUnion(bookingDates),
        });
      }
    );

    reservationIds = ids;
  });

  return { bookingId: reservations[0].bookingId, reservationIds };
};

/** Applies `{ [reservationId]: updates }` to several reservations at once. */
export const updateReservations = async (updatesById) => {
  const batch = writeBatch(db);
  Object.entries(updatesById).forEach(([reservationId, updates]) => {
    batch.update(doc(db, 'reservations', reservationId), { ...updates });
  });
  await batch.commit();
};

/**
 * Cancels reservations and frees their rooms for those dates, all or
 * nothing. The room and dates come from each stored reservation. Ones that
 * are already cancelled, checked in or checked out are left alone.
 * `reason` and `at` are saved as `cancellationReason` and `cancelledAt`.
 *
 * @returns {Promise<string[]>} the IDs that were cancelled
 */
export const cancelReservations = async (
  reservationIds,
  { reason, at } = {}
) => {
  let cancelledIds = [];

  await runTransaction(db, async (transaction) => {
    const reservations = [];
    for (const reservationId of reservationIds) {
      const reservationRef = doc(db, 'reservations', reservationId);
      const reservationDoc = await transaction.get(reservationRef);
      if (!reservationDoc.exists()) {
        throw new Error(`Reservation with ID ${reservationId} does not exist.`);
      }
      reservations.push({ ref: reservationRef, ...reservationDoc.data() });
    }
    const toCancel = reservations.filter((r) =>
      ACTIVE_STATUSES.includes(r.bookingStatus)
    );

    const rooms = new Map();
    for (const { roomId } of toCancel) {
      if (rooms.has(roomId)) continue;
      const roomRef = doc(db, 'rooms', roomId);
      const roomDoc = await transaction.get(roomRef);
      if (!roomDoc.exists()) {
        throw new Error(`Room with ID ${roomId} does not exist.`);
      }
      rooms.set(roomId, { ref: roomRef, ...roomDoc.data() });
    }

    for (const reservation of toCancel) {
      transaction.update(reservation.ref, {
        bookingStatus: RESERVATION_STATUS.CANCELLED,
        ...(reason
          ? {
              cancellationReason: reason,
              cancelledAt: at ?? new Date().toISOString(),
            }
          : {}),
      });
    }

    for (const [roomId, room] of rooms) {
      const released = toCancel
        .filter((r) => r.roomId === roomId)
        .map((r) => r.bookingDates);
      const bookings = (room.bookings || []).filter(
        (booking) => !released.some((dates) => sameDates(booking, dates))
      );
      transaction.update(room.ref, {
        bookings,
        ...(bookings.length === 0 && room.status === ROOM_STATUS.BOOKED
          ? { status: ROOM_STATUS.AVAILABLE }
          : {}),
      });
    }

    cancelledIds = toCancel.map((r) => r.ref.id);
  });

  return cancelledIds;
};

/**
 * Marks the reservations a payment was for as booked, all or nothing.
 * Rooms still awaiting payment are booked as they are. Rooms released
 * because their hold expired are taken again if they're still free for the
 * dates. Anything else (taken by someone else, cancelled by the guest,
 * booked with another payment) throws RoomUnavailableError.
 *
 * @param {string[]} reservationIds
 * @param {{ paymentIntentId: string, updatesById: object }} payment -
 *   `updatesById[id]`: fields to save on each (payment details, etc.)
 * @returns {Promise<{ alreadyBooked: boolean }>} alreadyBooked: this payment
 *   had booked them already (nothing changed)
 */
export const completeReservations = async (
  reservationIds,
  { paymentIntentId, updatesById }
) => {
  let alreadyBooked = false;

  await runTransaction(db, async (transaction) => {
    const reservations = [];
    for (const reservationId of reservationIds) {
      const ref = doc(db, 'reservations', reservationId);
      const snapshot = await transaction.get(ref);
      if (!snapshot.exists()) {
        throw new Error(`Reservation with ID ${reservationId} does not exist.`);
      }
      reservations.push({ ref, ...snapshot.data() });
    }

    alreadyBooked = reservations.every(
      (r) =>
        r.bookingStatus === RESERVATION_STATUS.BOOKED &&
        r.paymentDetails?.paymentIntentId === paymentIntentId
    );
    if (alreadyBooked) return;

    const toRetake = [];
    for (const reservation of reservations) {
      if (reservation.bookingStatus === RESERVATION_STATUS.RESERVED) continue;
      if (
        reservation.bookingStatus !== RESERVATION_STATUS.CANCELLED ||
        reservation.cancellationReason !== CANCELLATION_REASON.EXPIRED
      ) {
        throw new RoomUnavailableError(
          'A room this payment was for is no longer awaiting payment.'
        );
      }
      const roomRef = doc(db, 'rooms', reservation.roomId);
      const roomDoc = await transaction.get(roomRef);
      if (
        !roomDoc.exists() ||
        isDateOverlap(roomDoc.data().bookings || [], reservation.bookingDates)
      ) {
        throw new RoomUnavailableError(
          'A room this payment was for has been booked by someone else.'
        );
      }
      toRetake.push({ reservation, roomRef });
    }

    for (const reservation of reservations) {
      transaction.update(reservation.ref, {
        ...updatesById[reservation.ref.id],
        bookingStatus: RESERVATION_STATUS.BOOKED,
      });
    }
    for (const { reservation, roomRef } of toRetake) {
      transaction.update(reservation.ref, {
        cancellationReason: null,
        cancelledAt: null,
      });
      transaction.update(roomRef, {
        status: ROOM_STATUS.BOOKED,
        bookings: arrayUnion(reservation.bookingDates),
      });
    }
  });

  return { alreadyBooked };
};

/**
 * Notes a refund on the reservations a payment was for (`refunds` list).
 * Returns false, changing nothing, if that payment's refund is already
 * noted, so callers can act on a refund exactly once.
 *
 * @param {string[]} reservationIds
 * @param {{ paymentIntentId, refundId, amount, at }} refund
 */
export const recordRefund = async (reservationIds, refund) => {
  let isNew = false;

  await runTransaction(db, async (transaction) => {
    const reservations = [];
    for (const reservationId of reservationIds) {
      const ref = doc(db, 'reservations', reservationId);
      const snapshot = await transaction.get(ref);
      if (snapshot.exists()) reservations.push({ ref, ...snapshot.data() });
    }
    isNew = !reservations.some((r) =>
      (r.refunds || []).some(
        (noted) => noted.paymentIntentId === refund.paymentIntentId
      )
    );
    if (!isNew) return;
    for (const reservation of reservations) {
      transaction.update(reservation.ref, {
        refunds: [...(reservation.refunds || []), refund],
      });
    }
  });

  return isNew;
};

export const signUpUser = async ({ fullName, email, password }) => {
  let user = null;

  try {
    const userCredential = await createUserWithEmailAndPassword(
      auth,
      email,
      password
    );
    user = userCredential.user;

    const userDocRef = doc(db, 'users', user.uid);

    await setDoc(userDocRef, {
      fullName,
      email,
      createdAt: serverTimestamp(),
      isAdmin: false,
    });

    return { uid: user.uid, user };
  } catch (error) {
    if (user) {
      await deleteUser(user);
    }
    throw error;
  }
};

export const addRoom = async (content) => {
  // const docRef = await setDoc(doc(db, 'roomList', content.typeId), content);
  const docRef = await addDoc(collection(db, 'rooms'), content);
  return docRef.id;
};
