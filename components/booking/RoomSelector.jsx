'use client';

import { useEffect, useState } from 'react';
import { Field } from '../forms/Field';
import Alert from '../ui/Alert';
import Button from '../ui/Button';
import {
  MAX_ADULTS_PER_ROOM,
  MAX_GUESTS_PER_ROOM,
  MAX_PETS_PER_ROOM,
  describeParty,
} from '@/lib/booking/occupancy';
import {
  canUseType,
  cannotAddRoomReason,
  partyOfRooms,
  roomForRest,
  roomsLeft,
  unplacedOf,
} from '@/lib/booking/roomSelection';
import { formatPrice, pluralize } from '@/lib/helpers/formatters';

const ADD_BUTTON_ID = 'add-room-button';

/** <option>s from..to, e.g. "0 children", "1 child", "2 children". */
const countOptions = (from, to, [singular, plural]) =>
  [...Array(to - from + 1)].map((_, index) => {
    const value = from + index;
    return (
      <option key={value} value={value}>
        {value} {value === 1 ? singular : plural}
      </option>
    );
  });

/** "2 adults and 1 pet" (only the parts that are more than 0). */
const listOf = ({ adults, children, pets }) => {
  const parts = [
    adults > 0 && pluralize(adults, 'adult'),
    children > 0 && pluralize(children, 'child', 'children'),
    pets > 0 && pluralize(pets, 'pet'),
  ].filter(Boolean);
  return parts.length > 1
    ? `${parts.slice(0, -1).join(', ')} and ${parts[parts.length - 1]}`
    : parts[0];
};

/**
 * The rooms of a booking on the reservation form: a room type and who's in
 * it (adults, children, pets) for each room, with "Add another room" /
 * "Remove". Options that break the room rules, or need a pet-friendly room
 * that isn't free, can't be picked.
 *
 * @param {Array<{ key, typeId, adults, children, pets }>} rooms - lib/booking/roomSelection
 * @param {(rooms) => void} onChange
 * @param {object[]} roomTypes - ROOM_CATALOG entries, in the order to offer them
 * @param {{ [typeId]: object | null }} availableRooms - from /api/rooms/available
 * @param {{ counts, petCounts }} availability - free rooms of each type
 * @param {{ adults, children, pets }} party - Who the search was for
 */
const RoomSelector = ({
  rooms,
  onChange,
  roomTypes,
  availableRooms,
  availability,
  party,
}) => {
  const typeOrder = roomTypes.map((type) => type.typeId);
  const placed = partyOfRooms(rooms);
  const unplaced = unplacedOf(party, rooms);
  const addReason = cannotAddRoomReason(rooms, availability, typeOrder);
  const showPets = party.pets > 0 || placed.pets > 0;
  const typeName = (typeId) =>
    roomTypes.find((type) => type.typeId === typeId)?.name ?? 'room';

  // Keyboard and screen reader users land on the room they just added, or
  // on "Add another room" after removing one
  const [focusTarget, setFocusTarget] = useState(null);
  const [announcement, setAnnouncement] = useState('');
  useEffect(() => {
    if (!focusTarget) return;
    document
      .getElementById(
        focusTarget === 'add' ? ADD_BUTTON_ID : `${focusTarget}-type`
      )
      ?.focus();
    setFocusTarget(null);
  }, [focusTarget]);

  const updateRoom = (key, changes) =>
    onChange(
      rooms.map((room) => {
        if (room.key !== key) return room;
        const next = { ...room, ...changes };
        // Fewer spaces for children when adults are added
        next.children = Math.min(
          next.children,
          MAX_GUESTS_PER_ROOM - next.adults
        );
        return next;
      })
    );

  const addRoom = () => {
    const room = roomForRest({
      selection: rooms,
      party,
      availability,
      typeOrder,
    });
    if (!room) return;
    onChange([...rooms, room]);
    setAnnouncement(`Room ${rooms.length + 1} added.`);
    setFocusTarget(room.key);
  };

  const removeRoom = (key, index) => {
    onChange(rooms.filter((room) => room.key !== key));
    setAnnouncement(`Room ${index + 1} removed.`);
    setFocusTarget('add');
  };

  const noPetRoomsLeft =
    unplaced.pets > 0 &&
    !typeOrder.some((typeId) =>
      canUseType(rooms, availability, typeId, { withPets: true })
    );

  return (
    <div>
      <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
        <h3 id="rooms-heading" className="form-label mb-0">
          Rooms
        </h3>
        <p className="text-sm text-ink-600">
          {pluralize(rooms.length, 'room')} · {describeParty(placed)}
        </p>
      </div>

      <ol aria-labelledby="rooms-heading" className="mt-2 space-y-3">
        {rooms.map((room, index) => {
          const typeId = `${room.key}-type`;
          const adultsId = `${room.key}-adults`;
          const childrenId = `${room.key}-children`;
          const petsId = `${room.key}-pets`;
          const canHavePets = canUseType(rooms, availability, room.typeId, {
            withPets: true,
            skipKey: room.key,
          });
          const petsHint = canHavePets
            ? `Up to ${MAX_PETS_PER_ROOM}. No fee.`
            : `No pet-friendly ${typeName(room.typeId)}s left for these dates. Choose another room type for pets.`;

          return (
            <li key={room.key}>
              <fieldset className="rounded-lg border border-ink-200 p-4">
                <legend className="float-left font-semibold text-ink-900">
                  Room {index + 1}
                </legend>
                {rooms.length > 1 && (
                  <Button
                    variant="ghost"
                    icon="trash"
                    className="float-right -my-2.5 -mr-3"
                    onClick={() => removeRoom(room.key, index)}
                  >
                    Remove<span className="sr-only"> room {index + 1}</span>
                  </Button>
                )}
                <div
                  className={`clear-both grid grid-cols-1 gap-4 pt-3 ${
                    showPets ? 'sm:grid-cols-3' : 'sm:grid-cols-2'
                  }`}
                >
                  <Field
                    id={typeId}
                    label="Room type"
                    className="sm:col-span-full"
                  >
                    <select
                      id={typeId}
                      className="form-select"
                      value={room.typeId}
                      onChange={(e) =>
                        updateRoom(room.key, { typeId: e.target.value })
                      }
                    >
                      {roomTypes
                        .filter(
                          (type) =>
                            availableRooms?.[type.typeId] ||
                            type.typeId === room.typeId
                        )
                        .map((type) => {
                          const isCurrent = type.typeId === room.typeId;
                          const fits =
                            isCurrent ||
                            canUseType(rooms, availability, type.typeId, {
                              withPets: room.pets > 0,
                              skipKey: room.key,
                            });
                          const why =
                            roomsLeft(
                              rooms,
                              availability,
                              type.typeId,
                              room.key
                            ) <= 0
                              ? ' (none left)'
                              : ' (no pet-friendly rooms left)';
                          const price =
                            availableRooms?.[type.typeId]?.price ?? type.price;
                          return (
                            <option
                              key={type.typeId}
                              value={type.typeId}
                              disabled={!fits}
                            >
                              {type.name} ·{' '}
                              {formatPrice(price, { whole: true })}
                              /night{fits ? '' : why}
                            </option>
                          );
                        })}
                    </select>
                  </Field>
                  <Field
                    id={adultsId}
                    label="Adults"
                    hint={`1 to ${MAX_ADULTS_PER_ROOM}`}
                  >
                    <select
                      id={adultsId}
                      className="form-select"
                      aria-describedby={`${adultsId}-hint`}
                      value={room.adults}
                      onChange={(e) =>
                        updateRoom(room.key, { adults: Number(e.target.value) })
                      }
                    >
                      {countOptions(1, MAX_ADULTS_PER_ROOM, [
                        'adult',
                        'adults',
                      ])}
                    </select>
                  </Field>
                  <Field
                    id={childrenId}
                    label="Children"
                    hint={`${MAX_GUESTS_PER_ROOM} guests per room`}
                  >
                    <select
                      id={childrenId}
                      className="form-select"
                      aria-describedby={`${childrenId}-hint`}
                      value={room.children}
                      onChange={(e) =>
                        updateRoom(room.key, {
                          children: Number(e.target.value),
                        })
                      }
                    >
                      {countOptions(0, MAX_GUESTS_PER_ROOM - room.adults, [
                        'child',
                        'children',
                      ])}
                    </select>
                  </Field>
                  {showPets && (
                    <Field id={petsId} label="Pets" hint={petsHint}>
                      <select
                        id={petsId}
                        className="form-select"
                        aria-describedby={`${petsId}-hint`}
                        value={room.pets}
                        onChange={(e) =>
                          updateRoom(room.key, { pets: Number(e.target.value) })
                        }
                      >
                        <option value={0}>No pets</option>
                        {[...Array(MAX_PETS_PER_ROOM)].map((_, i) => (
                          <option
                            key={i + 1}
                            value={i + 1}
                            disabled={!canHavePets && room.pets === 0}
                          >
                            {pluralize(i + 1, 'pet')}
                          </option>
                        ))}
                      </select>
                    </Field>
                  )}
                </div>
              </fieldset>
            </li>
          );
        })}
      </ol>

      <div className="mt-3">
        <Button
          id={ADD_BUTTON_ID}
          variant="secondary"
          icon="plus"
          onClick={addRoom}
          disabled={Boolean(addReason)}
          aria-describedby={addReason ? 'add-room-hint' : undefined}
        >
          Add another room
        </Button>
        {addReason && (
          <p id="add-room-hint" className="form-hint">
            {addReason}
          </p>
        )}
      </div>

      {(unplaced.adults > 0 || unplaced.children > 0 || unplaced.pets > 0) && (
        <Alert
          tone="warning"
          className="mt-4"
          title={`Not everyone has a room yet: ${listOf(unplaced)}`}
        >
          {addReason
            ? 'Change who is in each room, or contact us about the rest of your group.'
            : 'Add another room, or change who is in each room.'}
          {noPetRoomsLeft &&
            ' No more pet-friendly rooms are free for these dates.'}{' '}
          Each room sleeps up to {MAX_ADULTS_PER_ROOM} adults and{' '}
          {MAX_GUESTS_PER_ROOM} guests in total.
        </Alert>
      )}

      <p role="status" className="sr-only">
        {announcement}
      </p>
    </div>
  );
};

export default RoomSelector;
