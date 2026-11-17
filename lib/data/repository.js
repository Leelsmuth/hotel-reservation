/**
 * Data access for the API routes. Picks the Firestore implementation or the
 * in-memory mock implementation depending on mock mode. Both expose the same
 * functions:
 *
 *   findAvailableRooms(startDate, endDate)       -> { [typeId]: room | null }
 *   getRoom(pathId)                              -> room (with pathId) | null
 *   getDiscounts()                               -> { ELEVEN, TWENTYONE, THIRTYPLUS }
 *   getReservationById(id)                       -> reservation | null
 *   findReservationByBookingIdAndEmail(bId, email) -> reservation | null
 *   findReservationsByUser(userId, bookingStatus) -> reservation[]
 *   createReservation(bookingDetails)            -> { bookingId, reservationId }
 *   updateReservation(id, updates)               -> void
 *   cancelReservation({ reservationId, roomId, bookedFrom, bookedUntil }) -> void
 *   signUpUser({ fullName, email, password })    -> { uid, user }
 *   addRoom(content)                             -> id
 */
import { USE_MOCKS } from '@/lib/config/mockMode';
import * as firestoreRepository from './firestoreRepository';
import * as mockRepository from './mockRepository';

const repository = USE_MOCKS ? mockRepository : firestoreRepository;

export default repository;
