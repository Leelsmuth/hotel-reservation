/**
 * Firestore implementation of the data repository used by the API routes.
 * See lib/data/repository.js for the contract and lib/data/mockRepository.js
 * for the in-memory implementation used in mock mode.
 */
import { auth, db } from '@/lib/firebase/firebase';
import { isDateOverlap } from '@/lib/helpers/isDateOverlap';
import { isRoomAvailableForDateRange } from '@/lib/helpers/isRoomAvailableForDateRange';
import { ROOM_STATUS, ROOM_TYPES_IDS } from '@/lib/static/roomLegend';
import { createUserWithEmailAndPassword, deleteUser } from 'firebase/auth';
import {
  addDoc,
  arrayRemove,
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
  updateDoc,
  where,
} from 'firebase/firestore';

export const findAvailableRooms = async (desiredStartDate, desiredEndDate) => {
  const roomTypes = Object.values(ROOM_TYPES_IDS);
  const results = {};

  for (const type of roomTypes) {
    const availableRoomQuery = query(
      collection(db, 'rooms'),
      where('status', '==', 'available'),
      where('typeId', '==', type),
      limit(1)
    );

    const availableSnapshot = await getDocs(availableRoomQuery);

    // Step 2: If there is an available room, prioritize it
    if (!availableSnapshot.empty) {
      availableSnapshot.forEach((doc) => {
        results[type] = {
          pathId: doc.id,
          ...doc.data(),
        };
      });
      continue; // Move to the next room type
    }

    // Step 3: If no available room, check booked rooms with the `bookings` array
    const bookedRoomQuery = query(
      collection(db, 'rooms'),
      where('status', '==', 'booked'),
      where('typeId', '==', type)
    );

    const bookedSnapshot = await getDocs(bookedRoomQuery);

    let foundAvailableRoom = null;

    // Check each booked room to see if it's free during the desired date range
    bookedSnapshot.forEach((doc) => {
      const roomData = doc.data();

      // Check if this room is available for the given date range
      if (
        isRoomAvailableForDateRange(
          roomData.bookings,
          desiredStartDate,
          desiredEndDate
        )
      ) {
        foundAvailableRoom = {
          pathId: doc.id,
          ...roomData,
        };
      }
    });

    // If an available room is found based on date range, use it; otherwise, set to null
    results[type] = foundAvailableRoom || null;
  }

  return results;
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

export const findReservationByBookingIdAndEmail = async (bookingId, email) => {
  const reservationsRef = collection(db, 'reservations');
  const reservationQuery = query(
    reservationsRef,
    where('bookingId', '==', bookingId),
    where('contactDetails.email', '==', email)
  );

  const querySnapshot = await getDocs(reservationQuery);

  let reservation = null;
  querySnapshot.forEach((doc) => {
    reservation = { id: doc.id, ...doc.data() };
  });

  return reservation;
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

export const createReservation = async (bookingDetails) => {
  const { bookingDates, updatePathId, ...reservationDetails } = bookingDetails;

  let reservationRefId = '';

  await runTransaction(db, async (transaction) => {
    const reservationRef = doc(collection(db, 'reservations'));

    const roomDocRef = doc(db, `rooms/${updatePathId}`);

    const roomDoc = await transaction.get(roomDocRef);
    if (!roomDoc.exists()) {
      throw new Error(`Room document with ID ${updatePathId} does not exist.`);
    }

    const existingBookings = roomDoc.data().bookings || [];
    if (isDateOverlap(existingBookings, bookingDates)) {
      throw new Error('The new booking dates overlap with an existing booking.');
    }

    transaction.set(reservationRef, {
      ...reservationDetails,
      bookingDates,
    });

    transaction.update(roomDocRef, {
      status: ROOM_STATUS.BOOKED,
      bookings: arrayUnion(bookingDates),
    });

    reservationRefId = reservationRef.id;
  });

  return {
    bookingId: reservationDetails.bookingId,
    reservationId: reservationRefId,
  };
};

export const updateReservation = async (reservationId, updates) => {
  const reservationRef = doc(db, 'reservations', reservationId);

  await updateDoc(reservationRef, {
    ...updates,
  });
};

export const cancelReservation = async ({
  reservationId,
  roomId,
  bookedFrom,
  bookedUntil,
}) => {
  await runTransaction(db, async (transaction) => {
    const reservationRef = doc(db, 'reservations', reservationId);
    const reservationDoc = await transaction.get(reservationRef);
    if (!reservationDoc.exists()) {
      throw new Error(`Reservation with ID ${reservationId} does not exist.`);
    }

    const roomRef = doc(db, 'rooms', roomId);
    const roomDoc = await transaction.get(roomRef);
    if (!roomDoc.exists()) {
      throw new Error(`Room with ID ${roomId} does not exist.`);
    }

    const existingBookings = roomDoc.data().bookings || [];

    const bookingToRemove = { bookedFrom, bookedUntil };

    transaction.update(reservationRef, { bookingStatus: 'cancelled' });

    transaction.update(roomRef, {
      bookings: arrayRemove(bookingToRemove),
    });

    if (existingBookings.length === 1) {
      transaction.update(roomRef, { status: 'available' });
    }
  });
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
