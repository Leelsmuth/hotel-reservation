import {
  bookingIdInUrl,
  day,
  expect,
  fillContact,
  freeRooms,
  lookUpBooking,
  payByCard,
  reserveByApi,
  roomCard,
  roomValues,
  search,
  setDates,
  test,
} from './helpers';

const details = (page) => page.getByRole('heading', { name: 'Your details' });
const rooms = (page) =>
  page.locator('fieldset legend', { hasText: /^Room \d/ });

test('a group of 8: rooms added for everyone, adjustable, extendable from the results', async ({
  page,
}) => {
  await search(page, { adults: 8 });
  await expect(
    page.getByText('Your group needs at least 2 rooms')
  ).toBeVisible();

  await roomCard(page, 'King Room')
    .getByRole('button', { name: 'Reserve' })
    .click();
  await expect(details(page)).toBeVisible();
  expect(await roomValues(page)).toEqual([
    ['dStandard', 4, 0, 0],
    ['dStandard', 4, 0, 0],
  ]);
  await expect(
    page.getByText("We've added 2 rooms for your 8 adults")
  ).toBeVisible();
  await expect(page.locator('aside').last()).toContainText('$305.10');

  // Fewer adults in room 2: warning
  await page.locator('select[id$="-adults"]').nth(1).selectOption('2');
  await expect(
    page.getByText('Not everyone has a room yet: 2 adults')
  ).toBeVisible();

  // Back to the results: add a Queen Room for the other 2
  await page.getByRole('button', { name: 'Back to rooms' }).click();
  await expect(
    page.getByText('Your booking so far: 2 rooms · 6 adults')
  ).toBeVisible();
  await expect(
    page.getByRole('button', { name: 'Add to booking' })
  ).toHaveCount(4);
  await roomCard(page, 'Queen Room')
    .getByRole('button', { name: 'Add to booking' })
    .click();
  await expect(details(page)).toBeVisible();
  expect((await roomValues(page))[2]).toEqual(['sSuite', 2, 0, 0]);
  await expect(page.getByText('Not everyone has a room yet')).toHaveCount(0);

  // Removing a room: focus moves to "Add another room", and it's announced
  await page.getByRole('button', { name: 'Remove room 2' }).click();
  await expect(rooms(page)).toHaveText(['Room 1', 'Room 2']);
  await expect(page.locator('#add-room-button')).toBeFocused();
  await expect(
    page.getByRole('status').filter({ hasText: 'Room 2 removed.' })
  ).toHaveCount(1);

  // Adding a room: focus moves to its room type
  await page.getByRole('button', { name: 'Add another room' }).click();
  await expect(page.locator('select[id$="-type"]').last()).toBeFocused();
});

test("4 adults who don't share: Deluxe + King, paid once, then cancelled together", async ({
  page,
}) => {
  await search(page, { adults: 4 });
  await expect(page.getByText('Your group needs at least')).toHaveCount(0);
  await roomCard(page, 'Deluxe Room')
    .getByRole('button', { name: 'Reserve' })
    .click();
  await expect(details(page)).toBeVisible();
  expect(await roomValues(page)).toEqual([['pSuite', 4, 0, 0]]);

  await page.getByRole('button', { name: 'Add another room' }).click();
  await page.locator('select[id$="-type"]').nth(1).selectOption('dStandard');
  await page.locator('select[id$="-adults"]').nth(0).selectOption('2');
  await page.locator('select[id$="-adults"]').nth(1).selectOption('2');
  const summary = page.locator('aside').last();
  await expect(summary).toContainText('2 rooms · 4 adults');
  await expect(summary).toContainText('$322.05'); // 169.50 + 152.55

  await fillContact(page, { email: 'bea@example.com' });
  await page.getByRole('button', { name: /Reserve 2 rooms/ }).click();
  await expect(
    page.getByRole('heading', { name: 'Your 2 rooms are reserved' })
  ).toBeVisible();
  const bookingId = bookingIdInUrl(page);

  await page
    .getByRole('button', { name: 'Continue to payment as a guest' })
    .click();
  const checkout = page.locator('aside').first();
  await expect(checkout).toContainText('Room 1: $150.00 × 1 night');
  await expect(checkout).toContainText('Room 2: $135.00 × 1 night');
  await payByCard(page, '$322.05');
  await expect(page.getByText('2 rooms are booked')).toBeVisible();

  await lookUpBooking(page, bookingId, 'bea@example.com');
  await expect(page.getByText('Paid & confirmed')).toBeVisible();
  await expect(
    page.getByText('All 2 rooms are cancelled together.')
  ).toBeVisible();
  await page.getByRole('button', { name: 'Cancel booking' }).click();
  const dialog = page.getByRole('dialog');
  await expect(dialog).toContainText(
    'All 2 rooms in this booking will be cancelled'
  );
  await expect(dialog).toContainText('$225.44'); // 70% of 322.05
  await dialog.getByRole('button', { name: 'Yes, cancel booking' }).click();
  await expect(page).toHaveURL('/');
});

test('only as many rooms as are free, and at most 10', async ({ page }) => {
  await search(page, { adults: 8 });
  await roomCard(page, 'Presidential Suite')
    .getByRole('button', { name: 'Reserve' })
    .click();
  await expect(details(page)).toBeVisible();
  const add = page.getByRole('button', { name: 'Add another room' });
  await add.click();
  await add.click();
  // All 4 suites used: the next room is a Queen, suites can't be picked
  await add.click();
  expect((await roomValues(page)).map((r) => r[0])).toEqual([
    'eSuite',
    'eSuite',
    'eSuite',
    'eSuite',
    'sSuite',
  ]);
  const suite = page
    .locator('select[id$="-type"]')
    .last()
    .locator('option[value="eSuite"]');
  await expect(suite).toBeDisabled();
  await expect(suite).toContainText('(none left)');

  await page.getByRole('button', { name: 'Back to rooms' }).click();
  await expect(roomCard(page, 'Presidential Suite')).toContainText(
    'Every free Presidential Suite is already in your booking.'
  );

  await page.getByRole('button', { name: 'Start over' }).click();
  await search(page, { adults: 30 });
  await roomCard(page, 'Queen Room')
    .getByRole('button', { name: 'Reserve' })
    .click();
  await expect(rooms(page)).toHaveCount(8);
  while (await add.isEnabled()) await add.click();
  await expect(rooms(page)).toHaveCount(10);
  await expect(
    page.getByText(
      'You can book up to 10 rooms online. For larger groups, please contact us.'
    )
  ).toBeVisible();
});

test("changing dates drops rooms that aren't free then", async ({ page }) => {
  await search(page, { adults: 8 });
  await roomCard(page, 'Presidential Suite')
    .getByRole('button', { name: 'Reserve' })
    .click();
  await page.getByRole('button', { name: 'Add another room' }).click();
  await page.locator('select[id$="-type"]').nth(2).selectOption('sSuite');
  await page.getByRole('button', { name: 'Change dates' }).click();

  // Every suite is taken from today+14 to today+17 (demo data)
  await setDates(page, day(14), day(17));
  await page.getByRole('button', { name: 'Check availability' }).click();
  await expect(
    page.getByText("2 rooms you picked aren't free for these dates")
  ).toBeVisible();
  await expect(page.getByText('Your booking so far: 1 room')).toBeVisible();
});

test('someone else takes the rooms first: explained, and the rest kept', async ({
  page,
  request,
}) => {
  const from = day(500);
  const to = day(501);
  await search(page, { from, to, adults: 8 });
  await roomCard(page, 'Presidential Suite')
    .getByRole('button', { name: 'Reserve' })
    .click();
  await page.getByRole('button', { name: 'Add another room' }).click();
  await page.locator('select[id$="-type"]').nth(2).selectOption('eSuite');
  expect((await roomValues(page)).map((r) => r[0])).toEqual([
    'eSuite',
    'eSuite',
    'eSuite',
  ]);

  // Another guest books 3 of the 4 suites
  await reserveByApi(request, Array(3).fill({ typeId: 'eSuite', adults: 1 }), {
    from,
    to,
  });

  await fillContact(page);
  await page.getByRole('button', { name: /Reserve 3 rooms/ }).click();
  await expect(page.getByText("We couldn't reserve your rooms")).toBeVisible();
  await expect(
    page
      .getByText(
        'Only 1 Presidential Suite is available for these dates, not 3.'
      )
      .first()
  ).toBeVisible();
  await expect(
    page.getByText("2 rooms you picked aren't free for these dates")
  ).toBeVisible();
  await expect(rooms(page)).toHaveCount(1);

  await page.getByRole('button', { name: /Reserve room/ }).click();
  await expect(
    page.getByRole('heading', { name: 'Your room is reserved' })
  ).toBeVisible();
  expect((await freeRooms(request, from, to)).eSuite).toBe(0);
});
