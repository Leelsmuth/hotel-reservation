/**
 * Which rooms are free for a stay. Shared by the Firestore and mock
 * repositories so both decide the same way.
 */
import { isRoomAvailableForDateRange } from '@/lib/helpers/isRoomAvailableForDateRange';
import { ROOM_STATUS, ROOM_TYPES_IDS } from '@/lib/static/roomLegend';

const BOOKABLE_STATUSES = [ROOM_STATUS.AVAILABLE, ROOM_STATUS.BOOKED];

/**
 * Groups the rooms that are free from `startDate` to `endDate` by room type
 * (rooms under maintenance never are). Every room type is present, with an
 * empty list when none is free.
 *
 * @param {object[]} rooms - Room documents (with pathId)
 * @returns {{ [typeId]: object[] }}
 */
export const freeRoomsByType = (rooms, startDate, endDate) => {
  const result = Object.fromEntries(
    Object.values(ROOM_TYPES_IDS).map((typeId) => [typeId, []])
  );

  rooms
    .filter(
      (room) =>
        result[room.typeId] &&
        BOOKABLE_STATUSES.includes(room.status) &&
        isRoomAvailableForDateRange(room.bookings, startDate, endDate)
    )
    .sort((a, b) => String(a.pathId).localeCompare(String(b.pathId)))
    .forEach((room) => result[room.typeId].push(room));

  return result;
};
