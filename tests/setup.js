/**
 * Runs before every test file (vitest.config.mjs): mock mode with no
 * simulated latency or webhook, fresh dummy data for every test, and emails
 * captured in tests/support/emails.js rather than printed.
 */
import { afterEach, beforeEach, vi } from 'vitest';
import { resetMockStore } from '@/lib/mock/store';
import { sentEmails } from './support/emails';

vi.mock('@/lib/mock/mockMailer', async (importOriginal) => {
  const { htmlToText } = await importOriginal();
  const { sentEmails: emails } = await import('./support/emails');
  return {
    htmlToText,
    logMockEmail: ({ to, subject, html }) =>
      emails.push({ to, subject, html, text: htmlToText(html) }),
  };
});

beforeEach(() => {
  resetMockStore();
  sentEmails.length = 0;
});

afterEach(() => {
  vi.useRealTimers();
});
