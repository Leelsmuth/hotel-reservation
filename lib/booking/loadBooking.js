import repository from '@/lib/data/repository';
import { groupIdsOf, sortByRoomOrder } from '@/lib/booking/reservations';

/**
 * Loads a reservation and every room of its booking (itself included), in
 * the order they were booked. Null if the reservation doesn't exist.
 *
 * @returns {Promise<{ reservation: object, rooms: object[] } | null>}
 */
export const loadBooking = async (reservationId) => {
  const reservation = await repository.getReservationById(reservationId);
  if (!reservation) {
    return null;
  }
  const ids = groupIdsOf(reservation);
  const rooms =
    ids.length === 1 && ids[0] === reservation.id
      ? [reservation]
      : sortByRoomOrder(await repository.getReservationsByIds(ids));
  return { reservation, rooms };
};
