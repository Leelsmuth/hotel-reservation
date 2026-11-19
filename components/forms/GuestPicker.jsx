'use client';

import { useEffect, useId, useRef, useState } from 'react';
import Button from '../ui/Button';
import Icon from '../ui/Icon';
import {
  MAX_ADULTS_PER_ROOM,
  MAX_GUESTS_PER_ROOM,
  MAX_PETS_PER_ROOM,
  describeParty,
  partyLimits,
  roomsNeededFor,
} from '@/lib/booking/occupancy';
import { pluralize } from '@/lib/helpers/formatters';

const STEP_BUTTON =
  'flex h-11 w-11 items-center justify-center rounded-full border border-ink-400 text-ink-900 transition-colors hover:border-ink-900 hover:bg-ink-50 aria-disabled:cursor-not-allowed aria-disabled:border-ink-200 aria-disabled:text-ink-400 aria-disabled:hover:bg-transparent';

/**
 * A count with − / + buttons. The buttons use aria-disabled rather than
 * disabled at the limits, so keyboard focus isn't lost when a limit is hit.
 */
const Stepper = ({ id, label, hint, value, min, max, onChange, unit }) => {
  const [singular, plural] = unit;
  const change = (next) => {
    if (next >= min && next <= max) onChange(next);
  };

  return (
    <div className="flex items-center justify-between gap-4 py-3">
      <div>
        <p id={`${id}-label`} className="font-medium text-ink-900">
          {label}
        </p>
        {hint && (
          <p id={`${id}-hint`} className="text-xs text-ink-600">
            {hint}
          </p>
        )}
      </div>
      <div
        role="group"
        aria-labelledby={`${id}-label`}
        aria-describedby={hint ? `${id}-hint` : undefined}
        className="flex shrink-0 items-center gap-3"
      >
        <button
          type="button"
          className={STEP_BUTTON}
          aria-label={`Fewer ${plural}`}
          aria-disabled={value <= min || undefined}
          onClick={() => change(value - 1)}
        >
          <Icon name="minus" className="h-4 w-4" strokeWidth={2} />
        </button>
        <span
          className="w-6 text-center text-lg font-semibold tabular-nums text-ink-900"
          aria-live="polite"
        >
          {value}
          <span className="sr-only"> {value === 1 ? singular : plural}</span>
        </span>
        <button
          type="button"
          className={STEP_BUTTON}
          aria-label={`More ${plural}`}
          aria-disabled={value >= max || undefined}
          onClick={() => change(value + 1)}
        >
          <Icon name="plus" className="h-4 w-4" strokeWidth={2} />
        </button>
      </div>
    </div>
  );
};

/**
 * Who's travelling: adults, children and pets, in a popover. Escape or a
 * click outside closes it.
 *
 * @param {{ adults, children, pets }} party
 * @param {(party) => void} onChange
 */
const GuestPicker = ({ party, onChange }) => {
  const idBase = useId();
  const labelId = `${idBase}-label`;
  const valueId = `${idBase}-value`;
  const hintId = `${idBase}-hint`;
  const panelId = `${idBase}-panel`;

  const [isOpen, setIsOpen] = useState(false);
  const rootRef = useRef(null);
  const triggerRef = useRef(null);

  const limits = partyLimits(party);
  const roomsNeeded = roomsNeededFor(party);

  // Fewer adults can mean fewer children and pets are allowed
  const update = (changes) => {
    const next = { ...party, ...changes };
    const nextLimits = partyLimits(next);
    onChange({
      ...next,
      children: Math.min(next.children, nextLimits.children.max),
      pets: Math.min(next.pets, nextLimits.pets.max),
    });
  };

  const close = () => {
    setIsOpen(false);
    triggerRef.current?.focus();
  };

  useEffect(() => {
    if (!isOpen) return undefined;
    const onPointerDown = (event) => {
      if (!rootRef.current?.contains(event.target)) setIsOpen(false);
    };
    const onKeyDown = (event) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
        triggerRef.current?.focus();
      }
    };
    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [isOpen]);

  return (
    <div className="relative" ref={rootRef}>
      <span id={labelId} className="form-label">
        Guests
      </span>
      <button
        ref={triggerRef}
        type="button"
        className="form-input flex items-center gap-3 text-left"
        aria-haspopup="dialog"
        aria-expanded={isOpen}
        aria-controls={panelId}
        aria-labelledby={`${labelId} ${valueId}`}
        aria-describedby={roomsNeeded > 1 ? hintId : undefined}
        onClick={() => setIsOpen((open) => !open)}
      >
        <Icon name="users" className="h-5 w-5 text-gold-700" />
        <span id={valueId} className="flex-1 truncate font-medium">
          {describeParty(party)}
        </span>
        <Icon name="chevron-down" className="h-4 w-4 text-ink-600" />
      </button>

      {roomsNeeded > 1 && (
        <p id={hintId} className="form-hint">
          You'll need at least {roomsNeeded} rooms.
        </p>
      )}

      {isOpen && (
        <div
          id={panelId}
          role="dialog"
          aria-label="Guests and pets"
          className="absolute right-0 top-full z-30 mt-2 w-full min-w-[18.5rem] animate-fade-in rounded-2xl border border-ink-100 bg-white px-4 pb-4 pt-1 shadow-popover sm:w-[22rem]"
        >
          <div className="divide-y divide-ink-100">
            <Stepper
              id={`${idBase}-adults`}
              label="Adults"
              hint="Age 18 or over"
              value={party.adults}
              {...limits.adults}
              unit={['adult', 'adults']}
              onChange={(adults) => update({ adults })}
            />
            <Stepper
              id={`${idBase}-children`}
              label="Children"
              hint="Age 0 to 17"
              value={party.children}
              {...limits.children}
              unit={['child', 'children']}
              onChange={(children) => update({ children })}
            />
            <Stepper
              id={`${idBase}-pets`}
              label="Pets"
              hint={`No fee. Up to ${MAX_PETS_PER_ROOM} per room, in pet-friendly rooms.`}
              value={party.pets}
              {...limits.pets}
              unit={['pet', 'pets']}
              onChange={(pets) => update({ pets })}
            />
          </div>
          <p className="mt-1 flex gap-2 rounded-lg bg-sand-50 p-3 text-xs text-ink-700">
            <Icon name="info" className="h-4 w-4 text-ink-500" />
            <span>
              Service animals are welcome in every room and aren't counted as
              pets.
            </span>
          </p>
          <div className="mt-3 flex items-center justify-between gap-3">
            <p className="text-xs text-ink-600">
              Each room: up to {MAX_ADULTS_PER_ROOM} adults,{' '}
              {MAX_GUESTS_PER_ROOM} guests in total.
              {roomsNeeded > 1 && (
                <> You'll need at least {pluralize(roomsNeeded, 'room')}.</>
              )}
            </p>
            <Button size="sm" variant="dark" onClick={close}>
              Done
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default GuestPicker;
