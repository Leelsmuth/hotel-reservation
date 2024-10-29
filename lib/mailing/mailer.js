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

/**
 * Sends a booking cancellation email.
 *
 * @param {string} recipient - The customer's email address.
 * @param {Object} bookingDetails - The booking details.
 * @returns {Promise<void>} - A promise that resolves when the email is sent.
 */
export const sendBookingCancellationEmail = async (
  recipient,
  bookingDetails
) => {
  const mailOptions = {
    from: `"Beverly Hills Hotel Admin" <${process.env.EMAIL_USER}>`,
    to: recipient,
    subject: `Booking Cancellation - ${bookingDetails.bookingId}`,
    html: `
      <p>Dear ${bookingDetails.contactDetails.name},</p>
      <p>We're sorry to inform you that your booking has been successfully cancelled. Here are the details of your cancelled booking:</p>
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
        <li><strong>Amount to be refunded:</strong> $${(
          0.7 * bookingDetails.totalPrice
        ).toFixed(2)} CAD</li>
      </ul>
      <p>If you have any questions or need further assistance, please do not hesitate to contact us.</p>
      <p>We hope to see you again in the future!</p>
      <p>Best regards,<br>Beverly Hills Hotel Team</p>
    `,
  };

  await transporter.sendMail(mailOptions);
};

/**
 * Sends a reservation cancellation email.
 *
 * @param {string} recipient - The customer's email address.
 * @param {Object} bookingDetails - The reservation details.
 * @returns {Promise<void>} - A promise that resolves when the email is sent.
 */
export const sendReservationCancellationEmail = async (
  recipient,
  bookingDetails
) => {
  const mailOptions = {
    from: `"Beverly Hills Hotel Admin" <${process.env.EMAIL_USER}>`,
    to: recipient,
    subject: `Reservation Cancellation - ${bookingDetails.bookingId}`,
    html: `
      <p>Dear ${bookingDetails.contactDetails.name},</p>
      <p>We're sorry to inform you that your reservation has been successfully cancelled. Here are the details of your cancelled reservation:</p>
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
      <p>If you have any questions or need further assistance, please do not hesitate to contact us.</p>
      <p>We hope to welcome you in the future!</p>
      <p>Best regards,<br>Beverly Hills Hotel Team</p>
    `,
  };

  await transporter.sendMail(mailOptions);
};
