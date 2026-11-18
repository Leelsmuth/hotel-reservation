'use client';

import { ROOM_DETAILS } from '@/lib/static/roomLegend';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import Icon from '../ui/Icon';

const SECTIONS = [
  ['popularAmenities', 'Popular amenities'],
  ['foodAndDrink', 'Food and drink'],
  ['whatToDo', 'Things to do'],
  ['workingAway', 'Working away'],
  ['services', 'Services'],
  ['facilities', 'Facilities'],
];

const RoomDetailsModal = ({
  isOpen,
  onClose,
  roomDetails = ROOM_DETAILS,
  title = 'Room & property amenities',
}) => (
  <Modal
    isOpen={isOpen}
    onClose={onClose}
    size="lg"
    title={title}
    description="Included with every room type."
    footer={
      <Button variant="secondary" onClick={onClose}>
        Close
      </Button>
    }
  >
    <div className="grid grid-cols-1 gap-x-8 gap-y-6 sm:grid-cols-2">
      {SECTIONS.map(([key, heading]) =>
        roomDetails[key]?.length ? (
          <section key={key}>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-ink-900">
              {heading}
            </h3>
            <ul className="mt-3 space-y-2">
              {roomDetails[key].map((item) => (
                <li
                  key={item}
                  className="flex items-start gap-2.5 text-sm text-ink-700"
                >
                  <Icon
                    name="check"
                    className="mt-0.5 h-4 w-4 text-gold-700"
                    strokeWidth={2}
                  />
                  {item}
                </li>
              ))}
            </ul>
          </section>
        ) : null
      )}
    </div>
  </Modal>
);

export default RoomDetailsModal;
