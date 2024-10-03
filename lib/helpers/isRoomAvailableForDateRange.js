export const isRoomAvailableForDateRange = (bookings, startDate, endDate) => {
  if (!bookings || bookings.length === 0) return true;

  for (const booking of bookings) {
    const bookedFrom = new Date(booking.bookedFrom);
    const bookedUntil = new Date(booking.bookedUntil);

    // Check if the desired date range overlaps with an existing booking
    if (
      (startDate <= bookedUntil && startDate >= bookedFrom) || // Overlaps start
      (endDate >= bookedFrom && endDate <= bookedUntil) || // Overlaps end
      (startDate <= bookedFrom && endDate >= bookedUntil) // Encompasses existing booking
    ) {
      return false;
    }
  }
  return true;
};
