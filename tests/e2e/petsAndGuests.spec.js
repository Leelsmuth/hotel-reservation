import {
  day,
  expect,
  fillContact,
  payByCard,
  roomCard,
  roomValues,
  search,
  test,
} from './helpers';

const details = (page) => page.getByRole('heading', { name: 'Your details' });

test('one room with a pet: pet-friendly rooms first, suites greyed out, no pet fee', async ({
  page,
  request,
}) => {
  await search(page, { adults: 2, children: 1, pets: 1 });
  await expect(page.locator('article h3').first()).not.toHaveText(
    'Presidential Suite'
  );

  const suite = roomCard(page, 'Presidential Suite');
  await expect(suite).toContainText('Not for pets on these dates');
  await expect(suite).toContainText(
    'No pet-friendly Presidential Suites are free for these dates.'
  );
  await expect(suite.getByRole('button', { name: 'Reserve' })).toHaveCount(0);
  await expect(roomCard(page, 'King Room')).toContainText(
    '2 pet-friendly rooms free'
  );
  await expect(roomCard(page, 'Deluxe Room')).toContainText(
    '1 pet-friendly room free'
  );
  await expect(roomCard(page, 'King Room')).toContainText(
    'Up to 4 adults · 6 guests'
  );

  await roomCard(page, 'King Room')
    .getByRole('button', { name: 'Reserve' })
    .click();
  await expect(details(page)).toBeVisible();
  expect(await roomValues(page)).toEqual([['dStandard', 2, 1, 1]]);
  const summary = page.locator('aside').last();
  await expect(summary).toContainText('1 room · 2 adults, 1 child, 1 pet');
  await expect(summary).toContainText('$152.55');

  // The room's rules: 4 adults leave space for 2 children; no suite for a pet
  await page.locator('select[id$="-adults"]').selectOption('4');
  await expect(
    page.locator('select[id$="-children"] option').last()
  ).toHaveText('2 children');
  const suiteOption = page.locator(
    'select[id$="-type"] option[value="eSuite"]'
  );
  await expect(suiteOption).toBeDisabled();
  await expect(suiteOption).toContainText('(no pet-friendly rooms left)');
  await page.locator('select[id$="-adults"]').selectOption('1');
  await page.locator('select[id$="-children"]').selectOption('3');
  await page.locator('select[id$="-adults"]').selectOption('4');
  await expect(page.locator('select[id$="-children"]')).toHaveValue('2');
  await page.locator('select[id$="-adults"]').selectOption('2');
  await page.locator('select[id$="-children"]').selectOption('1');

  await fillContact(page);
  await page.getByRole('button', { name: /Reserve room/ }).click();
  await expect(
    page.getByRole('heading', { name: 'Your room is reserved' })
  ).toBeVisible();
  const reservationId = new URL(page.url()).searchParams.get('resId');
  const room = await (
    await request.get(`/api/rooms/booking?id=${reservationId}`)
  ).json();
  expect(room).toMatchObject({ adults: 2, children: 1, pets: 1 });
  expect([3400, 3500]).toContain(room.roomNo); // the pet-friendly Kings

  await page
    .getByRole('button', { name: 'Continue to payment as a guest' })
    .click();
  await payByCard(page, '$152.55');
  await expect(
    page.getByRole('heading', { name: 'Your booking is confirmed' })
  ).toBeVisible();
});

test('a group with pets starting from suites: pets go in pet-friendly rooms', async ({
  page,
}) => {
  await search(page, {
    from: day(600),
    to: day(601),
    adults: 6,
    children: 3,
    pets: 3,
  });
  await expect(
    page.getByText('Pets stay in pet-friendly rooms, up to 2 per room.')
  ).toBeVisible();
  await roomCard(page, 'Presidential Suite')
    .getByRole('button', { name: 'Reserve' })
    .click();
  await expect(details(page)).toBeVisible();
  expect(await roomValues(page)).toEqual([
    ['sSuite', 3, 2, 2],
    ['sSuite', 3, 1, 1],
  ]);
  await expect(
    page.getByText(
      'No pet-friendly Presidential Suites are free for your dates, so your pets are in a pet-friendly Queen Room.'
    )
  ).toBeVisible();
  await expect(page.locator('aside').last()).toContainText(
    '2 rooms · 6 adults, 3 children, 3 pets'
  );

  await page.locator('select[id$="-pets"]').nth(1).selectOption('0');
  await expect(
    page.getByText('Not everyone has a room yet: 1 pet')
  ).toBeVisible();
  await page.locator('select[id$="-type"]').nth(1).selectOption('eSuite');
  await expect(
    page.getByText(
      'No pet-friendly Presidential Suites left for these dates. Choose another room type for pets.'
    )
  ).toBeVisible();
  await expect(
    page.locator('select[id$="-pets"]').nth(1).locator('option').nth(1)
  ).toBeDisabled();

  // The warning doesn't block reserving
  await fillContact(page);
  await page.getByRole('button', { name: /Reserve 2 rooms/ }).click();
  await expect(
    page.getByRole('heading', { name: 'Your 2 rooms are reserved' })
  ).toBeVisible();
});

test('no pet-friendly rooms for the dates: explained, and bookable without the pet', async ({
  page,
}) => {
  // Every pet-friendly room is booked from today+30 to today+33 (demo data)
  await search(page, { from: day(30), to: day(33), adults: 2, pets: 1 });
  await expect(
    page.getByText('No pet-friendly rooms are free for these dates', {
      exact: true,
    })
  ).toBeVisible();
  await expect(page.getByText('Not for pets on these dates')).toHaveCount(4);
  await expect(page.getByRole('button', { name: 'Reserve' })).toHaveCount(0);

  await search(page, { from: day(30), to: day(33), adults: 2 });
  await expect(
    page.getByRole('button', { name: 'Reserve' }).first()
  ).toBeVisible();
});

test('the last pet-friendly Deluxe Room taken: Deluxe greyed out for pets only', async ({
  page,
}) => {
  await search(page, { adults: 2, pets: 1 });
  await roomCard(page, 'Deluxe Room')
    .getByRole('button', { name: 'Reserve' })
    .click();
  await fillContact(page);
  await page.getByRole('button', { name: /Reserve room/ }).click();
  await expect(
    page.getByRole('heading', { name: 'Your room is reserved' })
  ).toBeVisible();

  await search(page, { adults: 2, pets: 1 });
  await expect(roomCard(page, 'Deluxe Room')).toContainText(
    'No pet-friendly Deluxe Rooms are free for these dates.'
  );
  await expect(roomCard(page, 'Queen Room')).toContainText(
    '2 pet-friendly rooms free'
  );

  await search(page, { adults: 2 });
  await expect(
    roomCard(page, 'Deluxe Room').getByRole('button', { name: 'Reserve' })
  ).toBeVisible();
});

test('the party is shown after booking, and older bookings show their guests as adults', async ({
  page,
}) => {
  await page.goto('/manage-reservation');
  await page.fill('#lookup-booking-id', 'AZPETFAM1');
  await page.fill('#lookup-email', 'paula.pet@example.com');
  await page.getByRole('button', { name: 'Find booking' }).click();
  const stay = page.locator('section[aria-label="Your stay"]');
  await expect(stay).toContainText('2 adults, 2 children, 1 pet');
  await expect(stay).toContainText('2 adults, 2 pets');
  await expect(stay).toContainText('2 rooms · 4 adults, 2 children, 3 pets');
  await expect(stay).toContainText('$915.30');

  await page.fill('#lookup-booking-id', 'AZGUESTBK1');
  await page.fill('#lookup-email', 'gary.guest@example.com');
  await page.getByRole('button', { name: 'Find booking' }).click();
  await expect(stay).toContainText('1 room · 2 adults');
});

test('room pages and amenities describe the room rules and pets', async ({
  page,
}) => {
  await page.goto('/rooms/king-room');
  await expect(page.getByRole('main')).toContainText(
    'Up to 4 adults · 6 guests'
  );
  await expect(page.getByRole('main')).toContainText(
    'Per room, for up to 4 adults (6 guests with children)'
  );

  await page.goto('/rooms');
  await expect(page.getByText('Pet-friendly rooms, no pet fee')).toBeVisible();

  await page.goto('/make-reservation');
  await page.getByRole('button', { name: 'All amenities' }).first().click();
  await expect(page.getByRole('dialog')).toContainText('Pet-friendly rooms');
});
