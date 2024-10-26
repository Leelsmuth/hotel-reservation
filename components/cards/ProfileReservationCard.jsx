import { RESERVATION_STATUS } from '@/lib/static/roomLegend';
import StyledButton from '../ui/StyledButton';
import AltStyledButton from '../ui/AltStyledButton';
import { Fragment, useState } from 'react';
import ConfirmationModal from '../toast/ConfirmationModal ';

const ProfileReservationCard = ({ res, bookingHandler, cancelReservation }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const isBooking =
    res.bookingStatus === RESERVATION_STATUS.BOOKED ? true : false;

  const openModal = () => setIsModalOpen(true);
  const closeModal = () => setIsModalOpen(false);

  return (
    <Fragment>
      <div className="shadow-md bg-primary/30 px-5 py-3">
        <div className="text-center text-xl text-primary font-semibold">
          {res.bookingId}
        </div>
        <div>
          Checkin:{' '}
          <span className="text-xl font-bold">
            {res.bookingDates.bookedFrom}
          </span>
        </div>
        <div>
          Checkout:{' '}
          <span className="text-xl font-bold">
            {res.bookingDates.bookedUntil}
          </span>
        </div>
        <div>
          Room Type:{' '}
          <span className="text-xl font-bold">
            {res.bookingDates.bookedUntil}
          </span>
        </div>
        {res.bookingStatus === RESERVATION_STATUS.RESERVED && (
          <div>
            Amount Due:{' '}
            <span className="text-xl font-bold">
              ${res?.totalPrice.toFixed(2)}
            </span>
          </div>
        )}
        {res.bookingStatus === RESERVATION_STATUS.BOOKED && (
          <div>
            Amount Paid:{' '}
            <span className="text-xl font-bold">
              ${res?.totalPrice.toFixed(2)}
            </span>
          </div>
        )}
        <div className="flex gap-6 mt-5">
          <StyledButton
            btnText="Cancel"
            clickHandler={() => openModal(isBooking)}
          />
          {res.bookingStatus === RESERVATION_STATUS.RESERVED && (
            <AltStyledButton
              btnText="Book"
              clickHandler={() => bookingHandler(res)}
            />
          )}
        </div>
      </div>
      <ConfirmationModal
        isOpen={isModalOpen}
        onClose={closeModal}
        onConfirm={() => cancelReservation(res)}
        isBooking={isBooking}
      />
    </Fragment>
  );
};

export default ProfileReservationCard;
