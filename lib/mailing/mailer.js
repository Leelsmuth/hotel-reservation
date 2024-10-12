import nodemailer from 'nodemailer';
import { ROOM_TYPES_NAMES } from '../static/roomLegend';

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
  tls: {
    rejectUnauthorized: false, // Disable certificate verification
  },
});

/**
 * Sends a booking confirmation email.
 *
 * @param {string} recipient - The customer's email address.
 * @param {Object} bookingDetails - The booking details.
 * @returns {Promise<void>} - A promise that resolves when the email is sent.
 */
export const sendBookingConfirmationEmail = async (
  recipient,
  bookingDetails
) => {
  const mailOptions = {
    from: `"Beverly Hills Hotel Admin" <${process.env.EMAIL_USER}>`,
    to: recipient,
    subject: `Booking Confirmation - ${bookingDetails.bookingId}`,
    html: `
      <h1>Booking Confirmation</h1>
      <p>Dear ${bookingDetails.contactDetails.name},</p>
      <p>Thank you for your booking. Here are your booking details:</p>
      <ul>
        <li><strong>Booking ID:</strong> ${bookingDetails.bookingId}</li>
        <li><strong>Check-in:</strong> ${
          bookingDetails.bookingDates.bookedFrom
        }</li>
        <li><strong>Check-out:</strong> ${
          bookingDetails.bookingDates.bookedUntil
        }</li>
        <li><strong>Room Type:</strong> ${
          ROOM_TYPES_NAMES[bookingDetails.roomTypeId]
        }</li>
        <li><strong>Guest Count:</strong> ${bookingDetails.guestCount}</li>
        <li><strong>Total Price:</strong> $${bookingDetails.totalPrice} CAD</li>
      </ul>
      <p>We look forward to hosting you!</p>
      <p>Best regards,<br>Beverly Hills Hotel Team</p>
    `,
  };

  await transporter.sendMail(mailOptions);
};

/**
 * Sends a reservation confirmation email.
 *
 * @param {string} recipient - The customer's email address.
 * @param {Object} bookingDetails - The reservation details.
 * @returns {Promise<void>} - A promise that resolves when the email is sent.
 */
export const sendReservationConfirmationEmail = async (
  recipient,
  bookingDetails
) => {
  const mailOptions = {
    from: `"Beverly Hills Hotel Admin" <${process.env.EMAIL_USER}>`,
    to: recipient,
    subject: `Reservation Confirmation - ${bookingDetails.bookingId}`,
    html: `
      <h1>Reservation Confirmation</h1>
      <p>Dear ${bookingDetails.contactDetails.name},</p>
      <p>Thank you for your reservation at our hotel. Here are your reservation details:</p>
      <ul>
        <li><strong>Reservation ID:</strong> ${bookingDetails.bookingId}</li>
        <li><strong>Check-in:</strong> ${
          bookingDetails.bookingDates.bookedFrom
        }</li>
        <li><strong>Check-out:</strong> ${
          bookingDetails.bookingDates.bookedUntil
        }</li>
        <li><strong>Room Type:</strong> ${
          ROOM_TYPES_NAMES[bookingDetails.roomTypeId]
        }</li>
        <li><strong>Guest Count:</strong> ${bookingDetails.guestCount}</li>
        <li><strong>Total Price:</strong> $${bookingDetails.totalPrice} CAD</li>
      </ul>
      <p>Please note reservations are valid for <strong>one (1) hour ONLY</strong>. <br>Kindly visit our site to complete your booking if you have not done so.</p>
      <p>We look forward to hosting you!</p>
      <p>Best regards,<br>Beverly Hills Hotel Team</p>
    `,
  };

  await transporter.sendMail(mailOptions);
};
