import {
  expect,
  fillContact,
  guestsButton,
  logIn,
  openGuests,
  payByCard,
  roomCard,
  roomValues,
  search,
  test,
} from './helpers';

test('account pages: rooms of one booking, cancel one, pay for the rest', async ({
  page,
}) => {
  await logIn(page, 'jane@example.com');
  await page.goto('/profile/reservations');
  const group = page.locator('article', { hasText: 'AZJANEGRP1' });
  await expect(group).toHaveCount(2);
  await expect(group.first()).toContainText('Room 1 of 2 in this booking');
  await expect(
    group.first().getByRole('button', { name: 'Pay for 2 rooms' })
  ).toBeVisible();
  // A single-room reservation looks as it always did
  const single = page.locator('article', { hasText: 'AZJANERES1' });
  await expect(single.getByRole('button', { name: 'Pay now' })).toBeVisible();
  await expect(single).not.toContainText('in this booking');

  await page
    .locator('article', { hasText: 'Room 2 of 2' })
    .getByRole('button', { name: /^Cancel room/ })
    .click();
  const dialog = page.getByRole('dialog');
  await expect(dialog).toContainText('Cancel this room?');
  await expect(dialog).toContainText(
    'The other rooms in this booking stay reserved.'
  );
  await dialog.getByRole('button', { name: 'Yes, cancel room' }).click();
  await expect(group).toHaveCount(1);

  await group.getByRole('button', { name: 'Pay now' }).click();
  await expect(page.locator('aside').first()).toContainText('Deluxe Room');
  await payByCard(page, '$339.00');
  await expect(
    page.getByRole('heading', { name: 'Your booking is confirmed' })
  ).toBeVisible();

  await page.goto('/profile/bookings');
  const booked = page.locator('article', { hasText: 'AZJANEGRP1' });
  await expect(booked).toContainText('Room 1 of 2 in this booking');
  await expect(
    booked.getByRole('button', { name: /^Cancel room/ })
  ).toBeVisible();
});

test('a single room works as before; a declined card can be retried', async ({
  page,
}) => {
  await search(page);
  await roomCard(page, 'Queen Room')
    .getByRole('button', { name: 'Reserve' })
    .click();
  const summary = page.locator('aside').last();
  await expect(summary).toContainText('Queen Room');
  await expect(summary).toContainText('1 room · 2 adults');
  await expect(summary).toContainText('$120.00 × 1 night');
  await expect(summary).toContainText('$135.60');
  await expect(page.getByRole('button', { name: /Remove/ })).toHaveCount(0);

  await fillContact(page);
  await page
    .getByRole('button', { name: 'Reserve room – pay on the next step' })
    .click();
  await expect(
    page.getByRole('heading', { name: 'Your room is reserved' })
  ).toBeVisible();
  expect(page.url()).not.toContain('rooms=');

  await page
    .getByRole('button', { name: 'Continue to payment as a guest' })
    .click();
  await payByCard(page, '$135.60', '4000 0000 0000 0002');
  await expect(page.getByText('Payment failed')).toBeVisible();
  await payByCard(page, '$135.60');
  await expect(page.getByText('your room is booked')).toBeVisible();
});

test.describe('on a phone', () => {
  test.use({
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
  });

  test('the picker fits, rooms stack, nothing scrolls sideways', async ({
    page,
  }) => {
    await page.goto('/make-reservation');
    const dialog = await openGuests(page);
    const box = await dialog.boundingBox();
    expect(box.x).toBeGreaterThanOrEqual(0);
    expect(box.x + box.width).toBeLessThanOrEqual(390);
    await page.keyboard.press('Escape');
    await expect(guestsButton(page)).toBeFocused();

    await search(page, { adults: 6 });
    await roomCard(page, 'King Room')
      .getByRole('button', { name: 'Reserve' })
      .click();
    expect(await roomValues(page)).toEqual([
      ['dStandard', 3, 0, 0],
      ['dStandard', 3, 0, 0],
    ]);
    const width = await page.evaluate(
      () => document.documentElement.scrollWidth
    );
    expect(width).toBeLessThanOrEqual(390);
    await expect(page.getByText('Total for 2 rooms, 1 night')).toBeVisible();
  });
});
