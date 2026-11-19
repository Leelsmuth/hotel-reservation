/**
 * Data access for the API routes. Picks the Firestore implementation or the
 * in-memory mock implementation depending on mock mode. Both expose the same
 * functions:
 *
 *   findFreeRooms(startDate, endDate)           -> { [typeId]: room[] } (free for the dates)
 *   getRoom(pathId)                              -> room (with pathId) | null
 *   getDiscounts()                               -> { ELEVEN, TWENTYONE, THIRTYPLUS }
 *   getReservationById(id)                       -> reservation | null
 *   getReservationsByIds(ids)                    -> reservation[] (missing ones left out)
 *   isBookingIdTaken(bookingId)                  -> boolean
 *   findReservationsByBookingIdAndEmail(bId, email) -> reservation[] (the rooms of a booking)
 *   findReservationsByUser(userId, bookingStatus) -> reservation[]
 *   findReservationsByStatus(bookingStatus)      -> reservation[]
 *   createReservations(reservations)             -> { bookingId, reservationIds }
 *       all or nothing; throws RoomUnavailableError if a room was taken
 *   updateReservations({ [id]: updates })        -> void (all or nothing)
 *   cancelReservations(ids, { reason?, at? })    -> cancelled ids (all or nothing;
 *       skips ones that aren't reserved/booked; saves cancellationReason/cancelledAt)
 *   completeReservations(ids, { paymentIntentId, updatesById }) -> { alreadyBooked }
 *       marks a payment's rooms booked, taking back rooms released by an
 *       expired hold if still free; throws RoomUnavailableError otherwise
 *   recordRefund(ids, refund)                    -> true the first time a
 *       payment's refund is noted (in `refunds`), false after
 *   signUpUser({ fullName, email, password })    -> { uid, user }
 *   addRoom(content)                             -> id
 */
import { USE_MOCKS } from '@/lib/config/mockMode';
import * as firestoreRepository from './firestoreRepository';
import * as mockRepository from './mockRepository';

const repository = USE_MOCKS ? mockRepository : firestoreRepository;

export default repository;
