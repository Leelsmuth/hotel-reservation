import Image from 'next/image';
import { Fragment, useState } from 'react';
import { RESERVATION_STATUS, ROOM_TYPES_NAMES } from '@/lib/static/roomLegend';
import { getRoomByType } from '@/lib/static/roomCatalog';
import {
  formatPrice,
  formatStayDate,
  pluralize,
} from '@/lib/helpers/formatters';
import { describeParty, occupancyOf } from '@/lib/booking/occupancy';
import ConfirmationModal from '../toast/ConfirmationModal ';
import Badge from '../ui/Badge';
import Button from '../ui/Button';
import Icon from '../ui/Icon';

/**
 * One room on the account pages. A room from a booking with several rooms
 * says which room it is; `roomsToPay` is how many rooms of its booking are
 * awaiting payment (they're paid for together).
 */
const ProfileReservationCard = ({
  res,
  bookingHandler,
  cancelReservation,
  roomsToPay = 1,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const bookingRoomIds = Array.isArray(res.groupReservationIds)
    ? res.groupReservationIds
    : [];
  const isMultiRoom = bookingRoomIds.length > 1;
  const isBooking = res.bookingStatus === RESERVATION_STATUS.BOOKED;
  const isReserved = res.bookingStatus === RESERVATION_STATUS.RESERVED;
  const room = getRoomByType(res.roomTypeId);
  const roomName = room?.name ?? ROOM_TYPES_NAMES[res.roomTypeId];
  const titleId = `res-${res.id}`;

  const openModal = () => setIsModalOpen(true);
  const closeModal = () => setIsModalOpen(false);

  return (
    <Fragment>
      <article
        aria-labelledby={titleId}
        className="card flex h-full flex-col overflow-hidden"
      >
        {room?.image && (
          <div className="relative aspect-[5/2] bg-ink-100">
            <Image
              src={room.image}
              alt=""
              fill
              sizes="(min-width: 1280px) 320px, (min-width: 640px) 50vw, 100vw"
              className="object-cover"
            />
            <div className="absolute left-3 top-3">
              {isReserved ? (
                <Badge tone="warning" className="shadow-sm">
                  Awaiting payment
                </Badge>
              ) : isBooking ? (
                <Badge tone="success" className="shadow-sm">
                  <Icon
                    name="check"
                    className="h-3.5 w-3.5"
                    strokeWidth={2.5}
                  />
                  Confirmed
                </Badge>
              ) : null}
            </div>
          </div>
        )}
        <div className="flex flex-1 flex-col p-5">
          <h3
            id={titleId}
            className="font-display text-xl font-semibold text-ink-900"
          >
            {roomName}
          </h3>
          <p className="mt-0.5 font-mono text-sm tracking-wider text-ink-600">
            <span className="sr-only">Booking ID </span>
            {res.bookingId}
          </p>
          {isMultiRoom && (
            <p className="mt-1 text-sm text-ink-600">
              Room {bookingRoomIds.indexOf(res.id) + 1} of{' '}
              {bookingRoomIds.length} in this booking
            </p>
          )}

          <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
            <div>
              <dt className="text-ink-600">Check-in</dt>
              <dd className="font-semibold text-ink-900">
                {formatStayDate(res.bookingDates.bookedFrom, 'EEE d MMM yyyy')}
              </dd>
            </div>
            <div>
              <dt className="text-ink-600">Check-out</dt>
              <dd className="font-semibold text-ink-900">
                {formatStayDate(res.bookingDates.bookedUntil, 'EEE d MMM yyyy')}
              </dd>
            </div>
            <div>
              <dt className="text-ink-600">Stay</dt>
              <dd className="font-semibold text-ink-900">
                {pluralize(Number(res.nightsCount) || 0, 'night')} ·{' '}
                {describeParty(occupancyOf(res))}
              </dd>
            </div>
            <div>
              <dt className="text-ink-600">
                {isBooking ? 'Amount paid' : 'Amount due'}
              </dt>
              <dd className="font-semibold tabular-nums text-ink-900">
                {formatPrice(res?.totalPrice)}
              </dd>
            </div>
          </dl>

          <div className="mt-auto flex flex-wrap gap-3 pt-5">
            {isReserved && bookingHandler && (
              <Button
                onClick={() => bookingHandler(res)}
                iconRight="arrow-right"
                className="flex-1"
              >
                {roomsToPay > 1 ? `Pay for ${roomsToPay} rooms` : 'Pay now'}
              </Button>
            )}
            <Button
              variant="danger-outline"
              onClick={openModal}
              className={isReserved ? '' : 'flex-1'}
            >
              {isMultiRoom
                ? 'Cancel room'
                : `Cancel${isReserved ? '' : ' booking'}`}
              <span className="sr-only">
                {' '}
                {roomName} {res.bookingId}
              </span>
            </Button>
          </div>
        </div>
      </article>
      <ConfirmationModal
        isOpen={isModalOpen}
        onClose={closeModal}
        onConfirm={() => {
          closeModal();
          cancelReservation(res);
        }}
        isBooking={isBooking}
        price={res?.totalPrice}
        roomOnly={isMultiRoom}
      />
    </Fragment>
  );
};

export default ProfileReservationCard;
