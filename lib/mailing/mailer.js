import nodemailer from 'nodemailer';
import { ROOM_TYPES_NAMES } from '../static/roomLegend';
import { describeParty, occupancyOf, sumOccupancy } from '../booking/occupancy';
import { USE_MOCKS } from '../config/mockMode';
import { logMockEmail } from '../mock/mockMailer';

// In mock mode, nodemailer's jsonTransport builds the message without sending
// it, and the email is printed to the dev server terminal instead.
const transporter = USE_MOCKS
  ? nodemailer.createTransport({ jsonTransport: true })
  : nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
      },
      tls: {
        rejectUnauthorized: false, // Disable certificate verification
      },
    });

const senderAddress = USE_MOCKS
  ? process.env.EMAIL_USER || 'no-reply@beverly-hills-hotel.mock'
  : process.env.EMAIL_USER;

/**
 * Email HTML. `html` is a template tag: every \${value} is escaped, so text
 * from guests (names, anything sent to the email endpoints) can't add links
 * or markup to an email sent from the hotel's address. Pieces built with
 * `html` themselves are inserted as they are.
 */
class SafeHtml {
  constructor(value) {
    this.value = value;
  }

  toString() {
    return this.value;
  }
}

const HTML_ESCAPES = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
};
const escapeHtml = (value) =>
  String(value ?? '').replace(/[&<>"']/g, (char) => HTML_ESCAPES[char]);

const htmlPart = (value) => {
  if (value instanceof SafeHtml) return value.value;
  if (Array.isArray(value)) return value.map(htmlPart).join('');
  return escapeHtml(value);
};

const html = (strings, ...values) =>
  new SafeHtml(
    strings.reduce(
      (out, string, index) =>
        out + string + (index < values.length ? htmlPart(values[index]) : ''),
      ''
    )
  );

/** A header value (e.g. the subject) on one line. */
const oneLine = (value) => String(value ?? '').replace(/[\r\n]+/g, ' ');

/**
 * The room lines of an email. `bookingDetails.rooms` (optional) lists each
 * room of a multi-room booking as { roomTypeId, adults, children, pets,
 * totalPrice }; `bookingDetails.totalPrice` is then the total for all of
 * them. Rooms booked before adults/children/pets were recorded only have
 * `guestCount` (counted as adults).
 */
const roomDetailsHtml = (bookingDetails) => {
  const rooms = Array.isArray(bookingDetails.rooms) ? bookingDetails.rooms : [];
  const petsLine = (pets) =>
    pets > 0 ? html` <li><strong>Pets:</strong> ${pets}</li>` : '';

  if (rooms.length <= 1) {
    const room = rooms[0] ?? bookingDetails;
    const occupancy = occupancyOf(room);
    return html` <li>
        <strong>Room Type:</strong> ${ROOM_TYPES_NAMES[room.roomTypeId]}
      </li>
      <li>
        <strong>Guests:</strong> ${describeParty({ ...occupancy, pets: 0 })}
      </li>
      ${petsLine(occupancy.pets)}`;
  }

  const occupancies = rooms.map(occupancyOf);
  const total = sumOccupancy(occupancies);
  return html` <li>
      <strong>Rooms:</strong> ${rooms.length}
      <ul>
        ${rooms.map(
          (room, index) =>
            html`<li>
              Room ${index + 1}: ${ROOM_TYPES_NAMES[room.roomTypeId]},
              ${describeParty(occupancies[index])}, $${room.totalPrice} CAD
            </li>`
        )}
      </ul>
    </li>
    <li><strong>Guests:</strong> ${describeParty({ ...total, pets: 0 })}</li>
    ${petsLine(total.pets)}`;
};

const sendMail = async (mailOptions) => {
  const message = {
    ...mailOptions,
    subject: oneLine(mailOptions.subject),
    html: String(mailOptions.html),
  };
  await transporter.sendMail(message);
  if (USE_MOCKS) {
    logMockEmail(message);
  }
};

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
    from: `"Beverly Hills Hotel Admin" <${senderAddress}>`,
    to: recipient,
    subject: `Booking Confirmation - ${bookingDetails.bookingId}`,
    html: html`
      <p>Dear ${bookingDetails.contactDetails.name},</p>
      <p>Thank you for your booking. Here are your booking details:</p>
      <ul>
        <li><strong>Booking ID:</strong> ${bookingDetails.bookingId}</li>
        <li>
          <strong>Check-in:</strong> ${bookingDetails.bookingDates.bookedFrom}
        </li>
        <li>
          <strong>Check-out:</strong> ${bookingDetails.bookingDates.bookedUntil}
        </li>
        ${roomDetailsHtml(bookingDetails)}
        <li><strong>Total Price:</strong> $${bookingDetails.totalPrice} CAD</li>
      </ul>
      <p>We look forward to hosting you!</p>
      <p>Best regards,<br />Beverly Hills Hotel Team</p>
    `,
  };

  await sendMail(mailOptions);
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
    from: `"Beverly Hills Hotel Admin" <${senderAddress}>`,
    to: recipient,
    subject: `Reservation Confirmation - ${bookingDetails.bookingId}`,
    html: html`
      <p>Dear ${bookingDetails.contactDetails.name},</p>
      <p>
        Thank you for your reservation at our hotel. Here are your reservation
        details:
      </p>
      <ul>
        <li><strong>Reservation ID:</strong> ${bookingDetails.bookingId}</li>
        <li>
          <strong>Check-in:</strong> ${bookingDetails.bookingDates.bookedFrom}
        </li>
        <li>
          <strong>Check-out:</strong> ${bookingDetails.bookingDates.bookedUntil}
        </li>
        ${roomDetailsHtml(bookingDetails)}
        <li><strong>Total Price:</strong> $${bookingDetails.totalPrice} CAD</li>
      </ul>
      <p>
        Please note reservations are valid for
        <strong>one (1) hour ONLY</strong>. <br />Kindly visit our site to
        complete your booking if you have not done so.
      </p>
      <p>We look forward to hosting you!</p>
      <p>Best regards,<br />Beverly Hills Hotel Team</p>
    `,
  };

  await sendMail(mailOptions);
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
    from: `"Beverly Hills Hotel Admin" <${senderAddress}>`,
    to: recipient,
    subject: `Booking Cancellation - ${bookingDetails.bookingId}`,
    html: html`
      <p>Dear ${bookingDetails.contactDetails.name},</p>
      <p>
        We're sorry to inform you that your booking has been successfully
        cancelled. Here are the details of your cancelled booking:
      </p>
      <ul>
        <li><strong>Booking ID:</strong> ${bookingDetails.bookingId}</li>
        <li>
          <strong>Check-in:</strong> ${bookingDetails.bookingDates.bookedFrom}
        </li>
        <li>
          <strong>Check-out:</strong> ${bookingDetails.bookingDates.bookedUntil}
        </li>
        ${roomDetailsHtml(bookingDetails)}
        <li><strong>Total Price:</strong> $${bookingDetails.totalPrice} CAD</li>
        <li>
          <strong>Amount to be refunded:</strong> $${(
            0.7 * bookingDetails.totalPrice
          ).toFixed(2)}
          CAD
        </li>
      </ul>
      <p>
        If you have any questions or need further assistance, please do not
        hesitate to contact us.
      </p>
      <p>We hope to see you again in the future!</p>
      <p>Best regards,<br />Beverly Hills Hotel Team</p>
    `,
  };

  await sendMail(mailOptions);
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
    from: `"Beverly Hills Hotel Admin" <${senderAddress}>`,
    to: recipient,
    subject: `Reservation Cancellation - ${bookingDetails.bookingId}`,
    html: html`
      <p>Dear ${bookingDetails.contactDetails.name},</p>
      <p>
        We're sorry to inform you that your reservation has been successfully
        cancelled. Here are the details of your cancelled reservation:
      </p>
      <ul>
        <li><strong>Reservation ID:</strong> ${bookingDetails.bookingId}</li>
        <li>
          <strong>Check-in:</strong> ${bookingDetails.bookingDates.bookedFrom}
        </li>
        <li>
          <strong>Check-out:</strong> ${bookingDetails.bookingDates.bookedUntil}
        </li>
        ${roomDetailsHtml(bookingDetails)}
        <li><strong>Total Price:</strong> $${bookingDetails.totalPrice} CAD</li>
      </ul>
      <p>
        If you have any questions or need further assistance, please do not
        hesitate to contact us.
      </p>
      <p>We hope to welcome you in the future!</p>
      <p>Best regards,<br />Beverly Hills Hotel Team</p>
    `,
  };

  await sendMail(mailOptions);
};

/**
 * Sends a "your reservation expired" email: it wasn't paid within the hold
 * (1 hour), so it was cancelled and its rooms released.
 *
 * @param {string} recipient - The customer's email address.
 * @param {Object} bookingDetails - The reservation details.
 */
export const sendHoldExpiredEmail = async (recipient, bookingDetails) => {
  const mailOptions = {
    from: `"Beverly Hills Hotel Admin" <${senderAddress}>`,
    to: recipient,
    subject: `Reservation Expired - ${bookingDetails.bookingId}`,
    html: html`
      <p>Dear ${bookingDetails.contactDetails.name},</p>
      <p>
        Your reservation wasn't paid within 1 hour, so it has been cancelled and
        the room${(bookingDetails.rooms?.length ?? 1) > 1 ? 's have' : ' has'}
        been released. You have not been charged.
      </p>
      <ul>
        <li><strong>Reservation ID:</strong> ${bookingDetails.bookingId}</li>
        <li>
          <strong>Check-in:</strong> ${bookingDetails.bookingDates.bookedFrom}
        </li>
        <li>
          <strong>Check-out:</strong> ${bookingDetails.bookingDates.bookedUntil}
        </li>
        ${roomDetailsHtml(bookingDetails)}
      </ul>
      <p>You're welcome to make a new reservation on our website.</p>
      <p>Best regards,<br />Beverly Hills Hotel Team</p>
    `,
  };

  await sendMail(mailOptions);
};

/**
 * Sends a "we refunded your payment" email: a payment that couldn't be used.
 * `refundReason` "expired": it finished after the reservation had expired
 * and its rooms had been booked by someone else. Otherwise the reservation
 * had changed (e.g. it was already paid, or a room was cancelled).
 *
 * @param {string} recipient - The customer's email address.
 * @param {Object} bookingDetails - The reservation details, with
 *   `refundedAmount` (dollars, as a string) and `refundReason`.
 */
export const sendPaymentRefundedEmail = async (recipient, bookingDetails) => {
  const mailOptions = {
    from: `"Beverly Hills Hotel Admin" <${senderAddress}>`,
    to: recipient,
    subject: `Payment Refunded - ${bookingDetails.bookingId}`,
    html: html`
      <p>Dear ${bookingDetails.contactDetails.name},</p>
      <p>
        ${
          bookingDetails.refundReason === 'expired'
            ? `Your payment came through after your reservation had expired, and the room${
                (bookingDetails.rooms?.length ?? 1) > 1 ? 's were' : ' was'
              } no longer available.`
            : "We couldn't use your payment because your reservation had changed in the meantime (for example, it had already been paid for or cancelled)."
        }
        We're sorry: we have refunded your payment in full.
      </p>
      <ul>
        <li><strong>Reservation ID:</strong> ${bookingDetails.bookingId}</li>
        <li>
          <strong>Amount refunded:</strong> $${bookingDetails.refundedAmount}
          CAD
        </li>
        <li>
          <strong>Check-in:</strong> ${bookingDetails.bookingDates.bookedFrom}
        </li>
        <li>
          <strong>Check-out:</strong> ${bookingDetails.bookingDates.bookedUntil}
        </li>
        ${roomDetailsHtml(bookingDetails)}
      </ul>
      <p>
        Refunds usually take 5 to 10 business days to appear on your statement.
        You're welcome to make a new reservation on our website.
      </p>
      <p>Best regards,<br />Beverly Hills Hotel Team</p>
    `,
  };

  await sendMail(mailOptions);
};
