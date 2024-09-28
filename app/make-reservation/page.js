'use client';

import RoomReservation from '@/components/cards/RoomReservation';
import CustomDateRangePicker from '@/components/forms/CustomDateRangePicker';
import Container from '@/components/layout/Container';
import StyledButton from '@/components/ui/StyledButton';
import { ROOM_TYPES_IDS } from '@/lib/static/roomLegend';
import { Fragment, useState } from 'react';

const MakeReservation = () => {
  const [showingRoom, setShowingRoom] = useState(ROOM_TYPES_IDS.EXECUTIVE);
  const [showingSection, setShowingSection] = useState(1);

  // check query for checkin/checkout date otherwise use today + tomorrow value to search

  const handleReservation = (roomTypeId) => {
    console.log(roomTypeId);
  };

  return (
    <div>
      <Container>
        {showingSection === 1 && (
          <Fragment>
            <div className="my-5">
              <CustomDateRangePicker />
            </div>
            <div>
              <h1>Available Rooms</h1>
              <div className="text-xl font-bold flex gap-6 my-4">
                <StyledButton
                  btnText="Executive Suite"
                  clickHandler={() => setShowingRoom(ROOM_TYPES_IDS.EXECUTIVE)}
                />
                <StyledButton
                  btnText="Premium Suite"
                  clickHandler={() => setShowingRoom(ROOM_TYPES_IDS.PREMIUM)}
                />
                <StyledButton
                  btnText="Double Standard"
                  clickHandler={() => setShowingRoom(ROOM_TYPES_IDS.DOUBLE)}
                />
                <StyledButton
                  btnText="Standard Suite"
                  clickHandler={() => setShowingRoom(ROOM_TYPES_IDS.STANDARD)}
                />
              </div>
              <RoomReservation
                roomTypeId={showingRoom}
                reservationHandler={handleReservation}
              />
            </div>
          </Fragment>
        )}
        {showingSection === 2 && (
          <Fragment>
            <div>Reservation form</div>
            <form>
              <div className="grid grid-cols-1 md:grid-cols-2 mb-3">
                <div>
                  <label>Check in</label>
                  <input type="text" />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 mb-3"></div>
              <div className="grid grid-cols-1 md:grid-cols-2 mb-3"></div>
              <div className="grid grid-cols-1 md:grid-cols-2 mb-3"></div>
            </form>
          </Fragment>
        )}
      </Container>
    </div>
  );
};

export default MakeReservation;
