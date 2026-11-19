/**
 * Emails "sent" during a test (mock mode builds them but doesn't send them;
 * tests/setup.js captures them here instead of printing them).
 *
 * Each entry: { to, subject, html, text }
 */
export const sentEmails = [];

/** Emails whose subject contains `text` (e.g. a booking ID). */
export const emailsAbout = (text) =>
  sentEmails.filter((email) => email.subject.includes(text));
