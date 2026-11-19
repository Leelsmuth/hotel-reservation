/**
 * Helpers for picking the rooms of a booking on /make-reservation. A
 * selection is a list of rooms: [{ key, typeId, adults, children, pets }]
 * (`key` is only for React). The server re-checks everything when the
 * booking is made.
 *
 * `availability` is what's free for the dates, from /api/rooms/available:
 *   { counts: { [typeId]: rooms free }, petCounts: { [typeId]: pet-friendly rooms free } }
 * Rooms with pets need a pet-friendly room; other rooms can use any room.
 */
import { MAX_ROOMS_PER_BOOKING } from '@/lib/booking/reservations';
import {
  MAX_ADULTS_PER_ROOM,
  MAX_GUESTS_PER_ROOM,
  MAX_PETS_PER_ROOM,
  roomsNeededFor,
  sumOccupancy,
} from '@/lib/booking/occupancy';

let nextKey = 0;
/** A room for a selection, with a unique React key. */
export const newRoom = (
  typeId,
  { adults = 1, children = 0, pets = 0 } = {}
) => {
  nextKey += 1;
  return { key: `room-${nextKey}`, typeId, adults, children, pets };
};

/** `total` shared as evenly as possible over `parts` (earlier parts get more). */
export const splitEvenly = (total, parts) =>
  [...Array(parts)].map(
    (_, index) => Math.floor(total / parts) + (index < total % parts ? 1 : 0)
  );

const usage = (selection, typeId, skipKey) => {
  const rooms = selection.filter(
    (room) => room.typeId === typeId && room.key !== skipKey
  );
  return {
    rooms: rooms.length,
    withPets: rooms.filter((room) => room.pets > 0).length,
  };
};

/** Free rooms of `typeId` not already in the selection. */
export const roomsLeft = (selection, availability, typeId, skipKey) =>
  (availability?.counts?.[typeId] ?? 0) -
  usage(selection, typeId, skipKey).rooms;

/** Free pet-friendly rooms of `typeId` not already taken by rooms with pets. */
export const petRoomsLeft = (selection, availability, typeId, skipKey) =>
  Math.min(
    (availability?.petCounts?.[typeId] ?? 0) -
      usage(selection, typeId, skipKey).withPets,
    roomsLeft(selection, availability, typeId, skipKey)
  );

/**
 * Whether one more room of `typeId` (with pets or not) fits in what's free,
 * next to the rest of the selection. `skipKey` leaves out the room being
 * changed.
 */
export const canUseType = (
  selection,
  availability,
  typeId,
  { withPets = false, skipKey } = {}
) =>
  withPets
    ? petRoomsLeft(selection, availability, typeId, skipKey) > 0
    : roomsLeft(selection, availability, typeId, skipKey) > 0;

/** Everyone in the selection: { adults, children, pets }. */
export const partyOfRooms = (selection) => sumOccupancy(selection);

/** The part of `party` no room in the selection is set up for yet. */
export const unplacedOf = (party, selection) => {
  const placed = partyOfRooms(selection);
  return {
    adults: Math.max(0, party.adults - placed.adults),
    children: Math.max(0, party.children - placed.children),
    pets: Math.max(0, party.pets - placed.pets),
  };
};

/**
 * The room type to offer when a room is added: the same as the last room if
 * it fits, otherwise the first type in `typeOrder` that does. Null when
 * nothing is left.
 */
export const nextRoomType = (
  selection,
  availability,
  typeOrder,
  { withPets = false } = {}
) => {
  const fits = (typeId) =>
    canUseType(selection, availability, typeId, { withPets });
  const last = selection[selection.length - 1]?.typeId;
  if (last && fits(last)) return last;
  return typeOrder.find(fits) ?? null;
};

/**
 * A room to add to the selection, for the guests and pets not placed yet
 * (at least 1 adult). Of `typeId` if given, otherwise of a type that fits;
 * pets only go in if the type has a pet-friendly room left. Null when no
 * room is free.
 */
export const roomForRest = ({
  selection,
  party,
  availability,
  typeOrder,
  typeId,
}) => {
  const rest = unplacedOf(party, selection);
  const adults = Math.min(MAX_ADULTS_PER_ROOM, Math.max(1, rest.adults));
  const children = Math.min(rest.children, MAX_GUESTS_PER_ROOM - adults);
  const wantsPets = rest.pets > 0;

  const type =
    typeId ??
    (wantsPets
      ? nextRoomType(selection, availability, typeOrder, { withPets: true })
      : null) ??
    nextRoomType(selection, availability, typeOrder);
  if (!type) return null;

  const pets =
    wantsPets && canUseType(selection, availability, type, { withPets: true })
      ? Math.min(MAX_PETS_PER_ROOM, rest.pets)
      : 0;
  return newRoom(type, { adults, children, pets });
};

/** Why no more rooms can be added, or null if one can. */
export const cannotAddRoomReason = (selection, availability, typeOrder) => {
  if (selection.length >= MAX_ROOMS_PER_BOOKING) {
    return `You can book up to ${MAX_ROOMS_PER_BOOKING} rooms online. For larger groups, please contact us.`;
  }
  if (!nextRoomType(selection, availability, typeOrder)) {
    return "You've added every room that's free for these dates.";
  }
  return null;
};

/**
 * Rooms for a whole party: as few as it fits in (4 adults, 6 guests and 2
 * pets per room, an adult in each), of `preferredTypeId` where possible.
 * Rooms with pets go in pet-friendly rooms, of another type if needed. May
 * return fewer rooms, or place fewer pets, than the party needs if not
 * enough rooms are free.
 */
export const planRooms = ({
  party,
  preferredTypeId,
  availability,
  typeOrder,
}) => {
  const count = Math.min(MAX_ROOMS_PER_BOOKING, roomsNeededFor(party));

  // Adults evenly, then children into the emptiest rooms
  const adults = splitEvenly(party.adults, count);
  const children = Array(count).fill(0);
  for (let child = 0; child < party.children; child += 1) {
    const candidates = [...Array(count).keys()].filter(
      (i) => adults[i] + children[i] < MAX_GUESTS_PER_ROOM
    );
    if (candidates.length === 0) break;
    const emptiest = candidates.reduce((best, i) =>
      adults[i] + children[i] < adults[best] + children[best] ? i : best
    );
    children[emptiest] += 1;
  }
  // Pets together, 2 per room, in the first rooms
  const pets = [...Array(count)].map((_, i) =>
    Math.max(0, Math.min(MAX_PETS_PER_ROOM, party.pets - i * MAX_PETS_PER_ROOM))
  );

  const plan = [];
  const pickType = (withPets) =>
    [preferredTypeId, ...typeOrder].find((typeId) =>
      canUseType(plan, availability, typeId, { withPets })
    );
  for (let i = 0; i < count; i += 1) {
    let roomPets = pets[i];
    let type = pickType(roomPets > 0);
    if (!type && roomPets > 0) {
      // No pet-friendly room left: the room without pets
      roomPets = 0;
      type = pickType(false);
    }
    if (!type) break;
    plan.push(
      newRoom(type, {
        adults: adults[i],
        children: children[i],
        pets: roomPets,
      })
    );
  }
  return plan;
};

/**
 * Keeps the rooms of a selection that are still free (e.g. after the dates
 * change), in order. A room with pets needs a pet-friendly room to stay.
 */
export const fitSelectionToAvailability = (selection, availability) => {
  const kept = [];
  selection.forEach((room) => {
    if (
      canUseType(kept, availability, room.typeId, { withPets: room.pets > 0 })
    ) {
      kept.push(room);
    }
  });
  return kept;
};
