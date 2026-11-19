/**
 * Who can stay in a room: the one place the occupancy rules live, shared by
 * the booking UI and the API so they can't disagree.
 *
 * Per room:
 *   - 1 to 4 adults (every room needs an adult);
 *   - up to 6 guests in total, children included;
 *   - up to 2 pets, and only in a pet-friendly room. There's no pet fee.
 *   Service animals aren't pets: they're welcome in every room.
 *
 * A "party" is who's travelling: { adults, children, pets }.
 */
import { pluralize } from '@/lib/helpers/formatters';

export const MIN_ADULTS_PER_ROOM = 1;
export const MAX_ADULTS_PER_ROOM = 4;
export const MAX_GUESTS_PER_ROOM = 6;
export const MAX_PETS_PER_ROOM = 2;

/** The search starts with this party. */
export const DEFAULT_PARTY = { adults: 2, children: 0, pets: 0 };

/** Largest party the search offers (fits in the 10 rooms a booking allows). */
const MAX_ADULTS_IN_SEARCH = 30;
const MAX_CHILDREN_IN_SEARCH = 20;
const MAX_PETS_IN_SEARCH = 20;

const isCount = (value) => Number.isInteger(value) && value >= 0;

/**
 * Why a room can't have these occupants, or null if it can.
 *
 * @param {{ adults: number, children: number, pets: number }} room
 */
export const roomOccupancyProblem = ({ adults, children, pets }) => {
  if (!isCount(adults) || adults < MIN_ADULTS_PER_ROOM) {
    return 'Every room needs at least 1 adult.';
  }
  if (adults > MAX_ADULTS_PER_ROOM) {
    return `A room can have up to ${MAX_ADULTS_PER_ROOM} adults.`;
  }
  if (!isCount(children)) {
    return 'The number of children must be 0 or more.';
  }
  if (adults + children > MAX_GUESTS_PER_ROOM) {
    return `A room can have up to ${MAX_GUESTS_PER_ROOM} guests, children included.`;
  }
  if (!isCount(pets) || pets > MAX_PETS_PER_ROOM) {
    return `A room can have up to ${MAX_PETS_PER_ROOM} pets.`;
  }
  return null;
};

/** The fewest rooms a party fits in. */
export const roomsNeededFor = ({ adults, children = 0, pets = 0 }) =>
  Math.max(
    1,
    Math.ceil(adults / MAX_ADULTS_PER_ROOM),
    Math.ceil((adults + children) / MAX_GUESTS_PER_ROOM),
    Math.ceil(pets / MAX_PETS_PER_ROOM)
  );

/**
 * The range the search offers for each part of a party. Children and pets
 * are limited by the adults, as every room needs one: an adult can have up
 * to 5 children (6 guests) and 2 pets with them.
 */
export const partyLimits = ({ adults }) => ({
  adults: { min: 1, max: MAX_ADULTS_IN_SEARCH },
  children: {
    min: 0,
    max: Math.min(
      MAX_CHILDREN_IN_SEARCH,
      adults * (MAX_GUESTS_PER_ROOM - MIN_ADULTS_PER_ROOM)
    ),
  },
  pets: {
    min: 0,
    max: Math.min(MAX_PETS_IN_SEARCH, adults * MAX_PETS_PER_ROOM),
  },
});

/** `party` with every part brought within partyLimits(). */
export const clampParty = (party) => {
  const clamp = (value, { min, max }) =>
    Math.min(max, Math.max(min, Number(value) || 0));
  const adults = clamp(party?.adults ?? DEFAULT_PARTY.adults, {
    min: 1,
    max: MAX_ADULTS_IN_SEARCH,
  });
  const limits = partyLimits({ adults });
  return {
    adults,
    children: clamp(party?.children, limits.children),
    pets: clamp(party?.pets, limits.pets),
  };
};

/**
 * Who's in a reserved room. Reservations made before adults, children and
 * pets were recorded only have `guestCount`: those guests count as adults.
 */
export const occupancyOf = (reservation) =>
  Number.isInteger(reservation?.adults)
    ? {
        adults: reservation.adults,
        children: Number(reservation.children) || 0,
        pets: Number(reservation.pets) || 0,
      }
    : {
        adults: Number(reservation?.guestCount) || 1,
        children: 0,
        pets: 0,
      };

/** Adds up the occupants of several rooms. */
export const sumOccupancy = (rooms) =>
  rooms.reduce(
    (total, room) => ({
      adults: total.adults + (Number(room.adults) || 0),
      children: total.children + (Number(room.children) || 0),
      pets: total.pets + (Number(room.pets) || 0),
    }),
    { adults: 0, children: 0, pets: 0 }
  );

/** "2 adults, 1 child, 1 pet" (children and pets only when there are any). */
export const describeParty = ({ adults, children = 0, pets = 0 }) =>
  [
    pluralize(adults, 'adult'),
    children > 0 && pluralize(children, 'child', 'children'),
    pets > 0 && pluralize(pets, 'pet'),
  ]
    .filter(Boolean)
    .join(', ');
