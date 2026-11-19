import {
  day,
  expect,
  guestsButton,
  openGuests,
  search,
  setParty,
  test,
} from './helpers';

test.describe('the Guests picker', () => {
  test('starts at 2 adults; limits follow the adults; Escape closes it', async ({
    page,
  }) => {
    await page.goto('/');
    const button = guestsButton(page);
    await expect(button).toHaveText('2 adults');

    const dialog = await openGuests(page);
    await expect(dialog).toContainText(
      "Service animals are welcome in every room and aren't counted as pets."
    );
    await dialog.getByRole('button', { name: 'Fewer adults' }).click();
    for (let i = 0; i < 5; i += 1)
      await dialog.getByRole('button', { name: 'More children' }).click();
    for (let i = 0; i < 2; i += 1)
      await dialog.getByRole('button', { name: 'More pets' }).click();
    // 1 adult: at most 5 children and 2 pets
    await expect(
      dialog.getByRole('button', { name: 'More children' })
    ).toHaveAttribute('aria-disabled', 'true');
    await dialog
      .getByRole('button', { name: 'More pets' })
      .click({ force: true });
    await expect(button).toHaveText('1 adult, 5 children, 2 pets');
    // Focus stays on a button at its limit
    await expect(
      dialog.getByRole('button', { name: 'More pets' })
    ).toBeFocused();

    await dialog.getByRole('button', { name: 'More adults' }).click();
    await dialog.getByRole('button', { name: 'More adults' }).click();
    await dialog.getByRole('button', { name: 'More children' }).click();
    await dialog.getByRole('button', { name: 'More children' }).click();
    await expect(button).toHaveText('3 adults, 7 children, 2 pets');
    await expect(
      page.getByText("You'll need at least 2 rooms.").first()
    ).toBeVisible();

    // Fewer adults: children and pets come down to fit
    await dialog.getByRole('button', { name: 'Fewer adults' }).click();
    await dialog.getByRole('button', { name: 'Fewer adults' }).click();
    await expect(button).toHaveText('1 adult, 5 children, 2 pets');

    await page.keyboard.press('Escape');
    await expect(dialog).toBeHidden();
    await expect(button).toBeFocused();
  });

  test('works with the keyboard', async ({ page }) => {
    await page.goto('/make-reservation');
    await guestsButton(page).focus();
    await page.keyboard.press('Enter');
    await page.keyboard.press('Tab');
    await expect(
      page.getByRole('button', { name: 'Fewer adults' })
    ).toBeFocused();
    await page.keyboard.press('Tab');
    await page.keyboard.press('Enter');
    await page.keyboard.press('Space');
    await expect(guestsButton(page)).toHaveText('4 adults');
  });
});

test.describe('the search in the web address', () => {
  const from = day(40);
  const to = day(43);

  test('a shared link opens that search', async ({ page }) => {
    await page.goto(
      `/make-reservation?from=${from}&to=${to}&adults=3&children=1&pets=1`
    );
    await expect(guestsButton(page)).toHaveText('3 adults, 1 child, 1 pet');
    await expect(page.getByRole('main')).toContainText('3 nights');
    await expect(page.getByText(/pet-friendly room/).first()).toBeVisible();
  });

  test('a new search is written to the address and survives a refresh', async ({
    page,
  }) => {
    await search(page, { from, to, adults: 2 });
    expect(new URL(page.url()).search).toBe(`?from=${from}&to=${to}&adults=2`);
    await page.reload();
    await expect(guestsButton(page)).toHaveText('2 adults');
    await expect(page.getByRole('main')).toContainText('3 nights');
  });

  test('the home page search opens the results for it', async ({ page }) => {
    await page.goto('/');
    await setParty(page, { adults: 5, children: 2 });
    await page
      .getByRole('button', { name: 'Check availability' })
      .last()
      .click();
    await expect(page).toHaveURL(
      /\/make-reservation\?from=.*&adults=5&children=2$/
    );
    await expect(
      page.getByText('Your group needs at least 2 rooms')
    ).toBeVisible();
  });

  test('bad or old links fall back to sensible values', async ({ page }) => {
    await page.goto(
      '/make-reservation?from=2020-01-10&to=2020-01-12&adults=99&children=-4&pets=abc'
    );
    await expect(page).toHaveURL(
      `/make-reservation?from=${day(0)}&to=${day(2)}&adults=30`
    );
    await expect(guestsButton(page)).toHaveText('30 adults');

    await page.goto('/make-reservation?from=garbage&adults=1');
    await expect(page).toHaveURL(
      `/make-reservation?from=${day(0)}&to=${day(1)}&adults=1`
    );
  });

  test('Back leaves the page rather than stepping through searches', async ({
    page,
  }) => {
    await page.goto('/rooms');
    await search(page, { from, to, adults: 1 });
    await search(page, { from, to, adults: 3 });
    await page.goBack();
    await page.goBack();
    await expect(page).toHaveURL(/\/rooms$/);
  });
});
