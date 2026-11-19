/**
 * Shared steps for the browser tests. `test` resets the dummy data before
 * every test, so tests don't depend on each other.
 */
import { test as base, expect } from '@playwright/test';

export const test = base.extend({
  resetData: [
    async ({ request }, use) => {
      const response = await request.post('/api/mock/reset');
      expect(response.ok()).toBe(true);
      await use();
    },
    { auto: true },
  ],
});
export { expect };

const pad = (n) => String(n).padStart(2, '0');
const ymd = (date) =>
  `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;

/** "yyyy-MM-dd", `days` from today (local time, like the app). */
export const day = (days) => {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return ymd(date);
};

/** "Mon 18 Nov"-style label used on the page for `yyyy-MM-dd`. */
export const dayLabel = (isoDate) =>
  new Date(`${isoDate}T12:00:00`)
    .toLocaleDateString('en-GB', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
    })
    .replace(',', '');

// --- The search form ---------------------------------------------------------

export const guestsButton = (page) =>
  page.locator('button[aria-controls$="-panel"]').first();

export const openGuests = async (page) => {
  const button = guestsButton(page);
  if ((await button.getAttribute('aria-expanded')) !== 'true')
    await button.click();
  return page.getByRole('dialog', { name: 'Guests and pets' });
};

const countIn = async (dialog, label) =>
  Number(
    (
      await dialog
        .getByRole('group', { name: label })
        .locator('span[aria-live]')
        .innerText()
    ).split(/\s/)[0]
  );

/** Sets adults, children and pets with the − / + buttons, then closes the picker. */
export const setParty = async (
  page,
  { adults = 2, children = 0, pets = 0 } = {}
) => {
  const dialog = await openGuests(page);
  for (const [label, unit, wanted] of [
    ['Adults', 'adults', adults],
    ['Children', 'children', children],
    ['Pets', 'pets', pets],
  ]) {
    for (let i = 0; i < 60; i += 1) {
      const current = await countIn(dialog, label);
      if (current === wanted) break;
      await dialog
        .getByRole('button', {
          name: `${current < wanted ? 'More' : 'Fewer'} ${unit}`,
        })
        .click();
    }
  }
  await dialog.getByRole('button', { name: 'Done' }).click();
};

/** Types the stay into the calendar's check-in / check-out fields. */
export const setDates = async (page, from, to) => {
  await page
    .locator('button[aria-haspopup="dialog"][aria-controls$="-calendar"]')
    .click();
  await page.locator('input[type=date]').nth(0).fill(from);
  await page.locator('input[type=date]').nth(1).fill(to);
  await page.getByRole('button', { name: 'Done' }).click();
};

/**
 * Opens /make-reservation and searches. Waits until the results are for
 * this search (the search is written to the web address once they load).
 */
export const search = async (
  page,
  { from, to, adults = 2, children = 0, pets = 0 } = {}
) => {
  await page.goto('/make-reservation');
  await expect(
    page.getByRole('heading', { name: /room types available/ })
  ).toBeVisible();
  if (from) await setDates(page, from, to);
  await setParty(page, { adults, children, pets });
  await page.getByRole('button', { name: 'Check availability' }).click();
  const party = new RegExp(
    `adults=${adults}${children ? `&children=${children}` : ''}${pets ? `&pets=${pets}` : ''}$`
  );
  await expect(page).toHaveURL(
    from ? new RegExp(`from=${from}&to=${to}&.*${party.source}`) : party
  );
  await expect(
    page.getByRole('heading', { name: /room types available/ })
  ).toBeVisible();
};

/** The card of a room type in the results. */
export const roomCard = (page, name) =>
  page.locator('article', { hasText: name });

// --- The reservation form ----------------------------------------------------

/** Each room on "Your details": [typeId, adults, children, pets]. */
export const roomValues = async (page) => {
  const types = page.locator('select[id$="-type"]');
  const rows = [];
  for (let i = 0; i < (await types.count()); i += 1) {
    const pets = page.locator('select[id$="-pets"]');
    rows.push([
      await types.nth(i).inputValue(),
      Number(await page.locator('select[id$="-adults"]').nth(i).inputValue()),
      Number(await page.locator('select[id$="-children"]').nth(i).inputValue()),
      (await pets.count()) ? Number(await pets.nth(i).inputValue()) : 0,
    ]);
  }
  return rows;
};

export const fillContact = async (
  page,
  { name = 'Test Guest', email = 'test.guest@example.com' } = {}
) => {
  await page.fill('#contact-name', name);
  await page.fill('#contact-email', email);
  await page.fill('#contact-phone', '4165550100');
};

/** Fills the mock card form and pays; `amount` is the Pay button's amount, e.g. "$305.10". */
export const payByCard = async (page, amount, card = '4242 4242 4242 4242') => {
  const payButton = page.getByRole('button', { name: `Pay ${amount}` });
  await expect(payButton).toBeVisible();
  await page.fill('#mock-card-number', card);
  await page.fill('#mock-card-expiry', '12 / 34');
  await page.fill('#mock-card-cvc', '123');
  await payButton.click();
};

/** The booking ID in the current page's address (bId=…). */
export const bookingIdInUrl = (page) =>
  new URL(page.url()).searchParams.get('bId');

// --- Elsewhere -----------------------------------------------------------------

export const logIn = async (page, email, password = 'Password123') => {
  await page.goto('/login');
  await page.fill('#login-email', email);
  await page.fill('#login-password', password);
  await page
    .getByRole('button', { name: /^Log in/i })
    .last()
    .click();
  await expect(page).not.toHaveURL(/\/login/);
};

/** Looks a booking up on /manage-reservation. */
export const lookUpBooking = async (page, bookingId, email) => {
  if (!page.url().endsWith('/manage-reservation'))
    await page.goto('/manage-reservation');
  await page.fill('#lookup-booking-id', bookingId);
  await page.fill('#lookup-email', email);
  await page.getByRole('button', { name: 'Find booking' }).click();
};

/** Reserves through the API (to set up a test quickly). */
export const reserveByApi = async (
  request,
  rooms,
  { from = day(400), to = day(402), email = 'api.guest@example.com' } = {}
) => {
  const response = await request.post('/api/rooms/reserve', {
    data: {
      bookingDates: { bookedFrom: from, bookedUntil: to },
      contactDetails: { name: 'Api Guest', email, phone: '+14165550123' },
      rooms,
    },
  });
  expect(response.ok()).toBe(true);
  return response.json();
};

export const freeRooms = async (request, from, to) =>
  (
    await (
      await request.get(`/api/rooms/available?startDate=${from}&endDate=${to}`)
    ).json()
  ).availableCounts;
