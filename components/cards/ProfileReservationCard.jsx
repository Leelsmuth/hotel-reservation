import { RESERVATION_STATUS } from '@/lib/static/roomLegend';
import StyledButton from '../ui/StyledButton';
import AltStyledButton from '../ui/AltStyledButton';
import { Fragment, useState } from 'react';
import ConfirmationModal from '../toast/ConfirmationModal ';

const ProfileReservationCard = ({ res, bookingHandler }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const isBooking =
    res.bookingStatus === RESERVATION_STATUS.BOOKED ? true : false;

  const openModal = () => setIsModalOpen(true);
  const closeModal = () => setIsModalOpen(false);

  return (
    <Fragment>
      <div>
        <div>{res.bookingId}</div>
        <div>Checkin: {res.bookingDates.bookedFrom}</div>
        <div>Checkout: {res.bookingDates.bookedUntil}</div>
        <div>Room Type: {res.bookingDates.bookedUntil}</div>
        {res.bookingStatus === RESERVATION_STATUS.RESERVED && (
          <div>Amount Due: {res?.totalPrice.toFixed(2)}</div>
        )}
        {res.bookingStatus === RESERVATION_STATUS.BOOKED && (
          <div>Amount Paid: {res?.totalPrice.toFixed(2)}</div>
        )}
        <div>
          <StyledButton
            btnText="Cancel"
            clickHandler={() => openModal(isBooking)}
          />
          <AltStyledButton
            btnText="Book"
            clickHandler={() => bookingHandler(res)}
          />
        </div>
      </div>
      <ConfirmationModal
        isOpen={isModalOpen}
        onClose={closeModal}
        onConfirm={cancelReservation}
        isBooking={isBooking}
      />
    </Fragment>
  );
};

export default ProfileReservationCard;
