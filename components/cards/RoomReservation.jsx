import React from 'react';
import Gallery from '../carousel/Gallery';
import { ROOM_TYPES } from '@/lib/static/roomTypes';
import StyledButton from '../ui/StyledButton';

const RoomReservation = ({ roomTypeId, reservationHandler }) => {
  const { typeId, amenities, name, desc, discounts, price, tags } =
    ROOM_TYPES.find((roomType) => roomType.typeId === roomTypeId);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
      <div>
        <Gallery typeId={roomTypeId} />
      </div>
      <div>
        <h2>{name}</h2>
        <p>$ {price}/night</p>
        <p>{desc}</p>
        <div>
          <StyledButton
            btnText="Reserve"
            clickHandler={() => reservationHandler(roomTypeId)}
          />
        </div>
      </div>
    </div>
  );
};

export default RoomReservation;
