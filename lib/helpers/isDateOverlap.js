/**
 * Helper function to check if the new booking dates overlap with existing bookings
 */
export const isDateOverlap = (existingBookings, newBooking) => {
  const newStart = new Date(newBooking.bookedFrom);
  const newEnd = new Date(newBooking.bookedUntil);

  return existingBookings.some((booking) => {
    const existingStart = new Date(booking.bookedFrom);
    const existingEnd = new Date(booking.bookedUntil);

    // Check if the new booking overlaps with any existing booking dates
    return (
      (newStart >= existingStart && newStart <= existingEnd) || // New start is between an existing booking
      (newEnd >= existingStart && newEnd <= existingEnd) || // New end is between an existing booking
      (newStart <= existingStart && newEnd >= existingEnd) // New booking encompasses the entire existing booking
    );
  });
};
