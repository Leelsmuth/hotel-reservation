const ManageReservation = () => {
  async function getReservationDetails(bookingId, email) {
    try {
      const response = await fetch(
        `/api/rooms/reserve?bookingId=${bookingId}&email=${email}`,
        {
          method: 'GET',
        }
      );

      if (!response.ok) {
        throw new Error(`Error: ${response.statusText}`);
      }

      const data = await response.json();
      console.log('Reservation Details:', data);
    } catch (error) {
      console.error('Failed to fetch reservation:', error);
    }
  }

  return <div>ManageReservation</div>;
};

export default ManageReservation;
