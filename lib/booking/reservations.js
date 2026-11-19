/**
 * Builds reservation documents on the server from what the guest chose
 * (rooms, dates, guests, contact details). Anything that affects money or
 * status (price, discount, tax, total, bookingStatus, paymentDetails, room
 * type) is decided here, never taken from the request.
 *
 * A booking can hold several rooms. Each room is its own reservation
 * document (same shape as always); the rooms of one booking share its
 * bookingId and list each other in `groupReservationIds`, so they are
 * looked up, paid for and cancelled together. Reservations made before
 * multi-room bookings have no `groupReservationIds`: they are a booking of
 * one room.
 */
import {
  RESERVATION_STATUS,
  ROOM_TYPES_IDS,
  ROOM_TYPES_NAMES,
} from '@/lib/static/roomLegend';
import {
  nightsBetween,
  priceStay,
  sumBookingPrices,
} from '@/lib/pricing/bookingPrice';
import { roomOccupancyProblem } from '@/lib/booking/occupancy';

// Larger groups are asked to contact the hotel. Also keeps the list of
// reservation IDs within Stripe's 500-character metadata limit.
export const MAX_ROOMS_PER_BOOKING = 10;

export class ReservationInputError extends Error {}

/** A requested room can't be booked for the dates (someone got there first). */
export class RoomUnavailableError extends Error {}

const isNonEmptyString = (value) =>
  typeof value === 'string' && value.trim() !== '';

const KNOWN_ROOM_TYPES = Object.values(ROOM_TYPES_IDS);

// Missing counts default to `fallback`; anything else must be a number
const countOf = (value, fallback) =>
  value === undefined || value === null || value === ''
    ? fallback
    : Number(value);

/**
 * The rooms a request asks for, one entry per room:
 *   { rooms: [{ typeId, adults, children, pets }] }
 *     -> [{ typeId, adults, children, pets }]
 * Older shapes are still accepted, their guests counting as adults:
 *   { rooms: [{ typeId, guestCount }] }
 *   { updatePathId, guestCount } (one specific room) -> [{ pathId, ... }]
 */
export const roomRequestsOf = (input) => {
  if (Array.isArray(input?.rooms)) {
    return input.rooms.map((room) => ({
      typeId: room?.typeId,
      adults: countOf(room?.adults, Number(room?.guestCount)),
      children: countOf(room?.children, 0),
      pets: countOf(room?.pets, 0),
      guestDetails: room?.guestDetails,
    }));
  }
  return [
    {
      pathId: input?.updatePathId,
      adults: Number(input?.guestCount),
      children: 0,
      pets: 0,
      guestDetails: input?.guestDetails,
    },
  ];
};

/**
 * Throws ReservationInputError if the request can't become a reservation.
 */
export const validateReservationInput = (input) => {
  const { bookingDates, contactDetails } = input ?? {};
  const requests = roomRequestsOf(input);

  if (requests.length < 1 || requests.length > MAX_ROOMS_PER_BOOKING) {
    throw new ReservationInputError(
      `A booking can have between 1 and ${MAX_ROOMS_PER_BOOKING} rooms.`
    );
  }

  requests.forEach((request, index) => {
    // "Room 2: a room can have…" / "A room can have…"
    const problem = (text) =>
      requests.length > 1
        ? `Room ${index + 1}: ${text[0].toLowerCase()}${text.slice(1)}`
        : text;

    if ('pathId' in request) {
      if (!isNonEmptyString(request.pathId) || request.pathId.includes('/')) {
        throw new ReservationInputError('A valid room is required.');
      }
    } else if (!KNOWN_ROOM_TYPES.includes(request.typeId)) {
      throw new ReservationInputError(problem('Choose a valid room type.'));
    }

    const occupancyProblem = roomOccupancyProblem(request);
    if (occupancyProblem) {
      throw new ReservationInputError(problem(occupancyProblem));
    }
  });

  const nights = nightsBetween(
    bookingDates?.bookedFrom,
    bookingDates?.bookedUntil
  );
  if (!Number.isInteger(nights) || nights < 1) {
    throw new ReservationInputError(
      'Check-out must be at least one day after check-in (dates as yyyy-MM-dd).'
    );
  }

  if (
    !isNonEmptyString(contactDetails?.name) ||
    !isNonEmptyString(contactDetails?.email) ||
    !isNonEmptyString(contactDetails?.phone)
  ) {
    throw new ReservationInputError('All contact details are required.');
  }
};

/** Rooms flagged `petFriendly` in the database can take pets. */
export const isPetFriendly = (room) => room?.petFriendly === true;

const unavailable = (free, count, what) =>
  new RoomUnavailableError(
    free === 0
      ? `No ${what} is available for these dates.`
      : `Only ${free} ${what}${free === 1 ? ' is' : 's are'} available for these dates, not ${count}.`
  );

/**
 * Picks a free room for each requested room. Rooms with pets get
 * pet-friendly rooms; the others get rooms that don't take pets where
 * possible, keeping the pet-friendly ones for guests who need them.
 *
 * @param {Array<{ typeId, pets }>} requests
 * @param {{ [typeId]: object[] }} freeRoomsByType - from repository.findFreeRooms()
 * @returns {Array<{ room, request }>} in the order requested
 * @throws RoomUnavailableError if a type doesn't have enough free rooms
 */
export const allocateRooms = (requests, freeRoomsByType) => {
  const wanted = {};
  requests.forEach(({ typeId, pets }) => {
    wanted[typeId] ??= { rooms: 0, withPets: 0 };
    wanted[typeId].rooms += 1;
    if (pets > 0) wanted[typeId].withPets += 1;
  });

  for (const [typeId, count] of Object.entries(wanted)) {
    const free = freeRoomsByType?.[typeId] ?? [];
    const freePetFriendly = free.filter(isPetFriendly).length;
    const name = ROOM_TYPES_NAMES[typeId] ?? 'room';
    if (free.length < count.rooms) {
      throw free.length === 0
        ? new RoomUnavailableError(
            `The ${name} is no longer available for these dates.`
          )
        : unavailable(free.length, count.rooms, name);
    }
    if (freePetFriendly < count.withPets) {
      throw unavailable(
        freePetFriendly,
        count.withPets,
        `pet-friendly ${name}`
      );
    }
  }

  const pools = Object.fromEntries(
    Object.entries(freeRoomsByType).map(([typeId, rooms]) => [
      typeId,
      {
        petFriendly: (rooms ?? []).filter(isPetFriendly),
        other: (rooms ?? []).filter((room) => !isPetFriendly(room)),
      },
    ])
  );

  // Rooms with pets first, so they get the pet-friendly rooms
  const allocated = [];
  requests.forEach((request, index) => {
    if (request.pets > 0) {
      allocated[index] = {
        room: pools[request.typeId].petFriendly.shift(),
        request,
      };
    }
  });
  requests.forEach((request, index) => {
    if (!(request.pets > 0)) {
      const pool = pools[request.typeId];
      allocated[index] = {
        room: pool.other.shift() ?? pool.petFriendly.shift(),
        request,
      };
    }
  });
  return allocated;
};

const cleanGuestDetails = (guestDetails) =>
  Array.isArray(guestDetails)
    ? guestDetails.map(({ name = '', age = '' } = {}) => ({ name, age }))
    : [];

/**
 * The reservation documents to store, one per room (same shape the app has
 * always used). `updatePathId` is consumed by repository.createReservations(),
 * which also links the rooms with `groupReservationIds`.
 *
 * @param {object} input     - Request body from /make-reservation
 * @param {Array<{ room, request }>} rooms - Rooms from the database (with
 *   pathId) and the guests for each, e.g. from allocateRooms()
 * @param {object} discounts - Length-of-stay discounts from the database
 * @param {string} bookingId - Made by the server (lib/booking/bookingIds)
 * @param {{ createdAt, holdExpiresAt }} hold - When it was made and until
 *   when it holds its rooms unpaid (lib/booking/holds)
 */
export const buildReservations = ({
  input,
  rooms,
  discounts,
  bookingId,
  hold,
}) => {
  const { bookedFrom, bookedUntil } = input.bookingDates;
  const userId = isNonEmptyString(input.userId) ? input.userId : null;
  const totalGuests = rooms.reduce(
    (total, { request }) => total + request.adults + request.children,
    0
  );
  // Guests in the whole booking. The older single-room requests sent the
  // size of the party searched for (which may have needed several rooms).
  const guestCountActual = Array.isArray(input.rooms)
    ? totalGuests
    : Number(input.guestCountActual) || totalGuests;

  return rooms.map(({ room, request }) => ({
    // What the guest chose
    bookingId,
    checkInDate: input.checkInDate ?? null,
    checkOutDate: input.checkOutDate ?? null,
    // Guests in this room (adults + children), as before, and who they are
    guestCount: request.adults + request.children,
    adults: request.adults,
    children: request.children,
    pets: request.pets,
    guestCountActual,
    guestDetails: cleanGuestDetails(request.guestDetails),
    contactDetails: {
      name: input.contactDetails.name.trim(),
      email: input.contactDetails.email.trim(),
      phone: input.contactDetails.phone.trim(),
    },
    // NOTE: the API can't verify who is signed in (no server-side auth yet),
    // so userId is still taken from the request.
    userId,
    isGuest: !userId,
    bookingDates: { bookedFrom, bookedUntil },
    updatePathId: room.pathId,

    // Decided by the server
    roomId: room.pathId,
    roomNo: room.id,
    roomTypeId: room.typeId,
    ...priceStay({ roomPrice: room.price, bookedFrom, bookedUntil, discounts }),
    bookingStatus: RESERVATION_STATUS.RESERVED,
    createdAt: hold.createdAt,
    holdExpiresAt: hold.holdExpiresAt,
    paymentDetails: null,
    checkedInBy: null,
    checkedOutBy: null,
  }));
};

/** The price fields of a reservation, as returned to the browser. */
export const pricingOf = (reservation) => ({
  roomPrice: reservation.roomPrice,
  nightsCount: reservation.nightsCount,
  discount: reservation.discount,
  discountAmount: reservation.discountAmount,
  subtotal: reservation.subtotal,
  tax: reservation.tax,
  totalPrice: reservation.totalPrice,
});

/**
 * Combined price of the rooms of a booking, plus each room's own figures.
 * For a single room the totals are that room's, as before.
 */
export const bookingPricingOf = (reservations) => ({
  ...(reservations.length === 1
    ? pricingOf(reservations[0])
    : sumBookingPrices(reservations)),
  rooms: reservations.map((reservation) => ({
    reservationId: reservation.id,
    roomTypeId: reservation.roomTypeId,
    guestCount: reservation.guestCount,
    adults: reservation.adults,
    children: reservation.children,
    pets: reservation.pets,
    ...pricingOf(reservation),
  })),
});

/** IDs of all the rooms in the reservation's booking (itself included). */
export const groupIdsOf = (reservation) =>
  Array.isArray(reservation?.groupReservationIds) &&
  reservation.groupReservationIds.length > 0
    ? reservation.groupReservationIds
    : [reservation.id];

/** Sorts the rooms of a booking into the order they were booked in. */
export const sortByRoomOrder = (reservations) => {
  const order = groupIdsOf(reservations[0] ?? {});
  const position = (reservation) => {
    const index = order.indexOf(reservation.id);
    return index === -1 ? Number.MAX_SAFE_INTEGER : index;
  };
  return [...reservations].sort(
    (a, b) =>
      position(a) - position(b) || String(a.id).localeCompare(String(b.id))
  );
};

/** Statuses that still hold a room (can be paid for or cancelled). */
export const ACTIVE_STATUSES = [
  RESERVATION_STATUS.RESERVED,
  RESERVATION_STATUS.BOOKED,
];
