import { getRoomByType } from '@/lib/static/roomCatalog';
import { ROOM_MAIN_PICTURES, ROOM_TYPES_NAMES } from '@/lib/static/roomLegend';
import { sumBookingPrices } from '@/lib/pricing/bookingPrice';
import { formatPrice, pluralize } from '@/lib/helpers/formatters';
import {
  describeParty,
  occupancyOf,
  sumOccupancy,
} from '@/lib/booking/occupancy';

/** Name and photo of a room type, also for types no longer in the catalog. */
export const roomTypeDisplay = (typeId) =>
  getRoomByType(typeId) ?? {
    name: ROOM_TYPES_NAMES[typeId],
    image: ROOM_MAIN_PICTURES[typeId],
  };

/**
 * <StaySummary> props for the rooms of a booking: reservations from the
 * server, or estimates shaped like them ({ roomTypeId, adults, children,
 * pets, bookingDates, ...calculateBookingPrice() }). Who's in each room is
 * described as "2 adults, 1 child, 1 pet". One room looks exactly as it
 * always has; several rooms are listed with a line each in the price.
 *
 * @param {object[]} reservations - The rooms, in order (at least one)
 * @param {{ totalLabel?: string }} options
 */
export const staySummaryProps = (reservations, { totalLabel } = {}) => {
  const [first] = reservations;
  const nights = first.nightsCount;
  const totals =
    reservations.length === 1 ? first : sumBookingPrices(reservations);
  const occupancies = reservations.map(occupancyOf);
  const everyone = sumOccupancy(occupancies);

  return {
    room: roomTypeDisplay(first.roomTypeId),
    rooms: reservations.map((reservation, index) => ({
      name: roomTypeDisplay(reservation.roomTypeId).name,
      guestsLabel: describeParty(occupancies[index]),
    })),
    checkIn: first.bookingDates?.bookedFrom,
    checkOut: first.bookingDates?.bookedUntil,
    nights,
    guests: everyone.adults + everyone.children,
    guestsLabel: describeParty(everyone),
    price: {
      ...(reservations.length === 1
        ? { roomPrice: first.roomPrice }
        : {
            lines: reservations.map((reservation, index) => ({
              label: `Room ${index + 1}: ${formatPrice(
                reservation.roomPrice
              )} × ${pluralize(Number(nights) || 0, 'night')}`,
              amount: Number(reservation.roomPrice) * (Number(nights) || 0),
            })),
          }),
      nights,
      discount: first.discount,
      discountAmount: totals.discountAmount,
      tax: totals.tax,
      total: totals.totalPrice,
      ...(totalLabel ? { totalLabel } : {}),
    },
  };
};
