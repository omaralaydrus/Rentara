import { test, expect, type APIRequestContext } from '@playwright/test';
import { randomUUID } from 'node:crypto';
const origin = 'http://127.0.0.1:3122';
const headers = { Origin: origin };
async function signup(ctx: APIRequestContext, name = 'Test Renter') {
  const email = `${randomUUID()}@example.test`;
  const response = await ctx.post('/api/auth', {
    headers,
    data: { action: 'register', name, email, password: 'TestPassword123!' },
  });
  expect(response.status()).toBe(200);
  return { email, ...(await response.json()) };
}
const homeData = {
  title: 'A real workflow test home',
  city: 'Test City',
  area: 'Test Neighbourhood',
  address: '123 Test Avenue',
  description: 'A comfortable home used to verify the complete rental request workflow.',
  type: 'Apartment',
  rent: 2200,
  beds: 2,
  baths: 1,
  sqft: 900,
  depositMonths: 2,
  available: '2026-01-01',
  furnished: true,
  pets: false,
  parking: true,
};
const future = new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10);
test('search, filters, details, saving and persistence', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('.home-card')).toHaveCount(6);
  await page.getByLabel('Search location').fill('Kuala Lumpur');
  await page.getByLabel('Monthly budget').selectOption('2000');
  await page
    .getByRole('region', { name: 'Search rental homes' })
    .getByRole('button', { name: 'Find a home', exact: true })
    .click();
  await expect(page.locator('.home-card')).toHaveCount(2);
  await page.getByLabel('Minimum bedrooms').selectOption('2');
  await expect(page.locator('.home-card')).toHaveCount(1);
  await page.getByRole('button', { name: 'Your corner of the skyline', exact: true }).click();
  const dialog = page.getByRole('dialog');
  await expect(dialog).toContainText('fictional sample home');
  await expect(dialog).toContainText('RM 5,700');
  await dialog.getByRole('button', { name: 'Save this home' }).click();
  await page.keyboard.press('Escape');
  await page.reload();
  await page.getByRole('button', { name: /Saved homes/ }).click();
  await expect(page.locator('.home-card')).toHaveCount(1);
  await page.getByRole('button', { name: 'Unsave Your corner of the skyline' }).click();
  await expect(
    page.getByRole('heading', { name: 'Your next home might be a heart away.' }),
  ).toBeVisible();
});
test('empty search has a recovery path', async ({ page }) => {
  await page.goto('/');
  await page.getByLabel('Search location').fill('Atlantis');
  await page
    .getByRole('region', { name: 'Search rental homes' })
    .getByRole('button', { name: 'Find a home', exact: true })
    .click();
  await expect(page.getByText('No homes match your search yet.')).toBeVisible();
  await page.getByRole('button', { name: 'Clear filters' }).click();
  await expect(page.locator('.home-card')).toHaveCount(6);
});
test('dialog padding preserves form input and backdrop dismissal restores focus', async ({
  page,
}) => {
  await page.goto('/');
  const signIn = page.getByRole('button', { name: 'Sign in', exact: true });
  await signIn.click();
  const dialog = page.getByRole('dialog');
  await dialog.getByLabel('Email address').fill('renter@example.test');
  await dialog.click({ position: { x: 8, y: 8 } });
  await expect(dialog).toBeVisible();
  await expect(dialog.getByLabel('Email address')).toHaveValue('renter@example.test');
  await page.mouse.click(2, 2);
  await expect(dialog).toHaveCount(0);
  await expect(signIn).toBeFocused();
  await signIn.click();
  await page.keyboard.press('Escape');
  await expect(dialog).toHaveCount(0);
  await expect(signIn).toBeFocused();
});
test('sign up, submit a demo rental request, cancel it and sign out', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'The light-filled city retreat', exact: true }).click();
  await page.getByRole('button', { name: 'Request to rent' }).click();
  await page.getByRole('button', { name: 'New here? Create an account' }).click();
  await page.getByLabel('Your name').fill('Demo Renter');
  await page.getByLabel('Email address').fill(`${randomUUID()}@example.test`);
  await page.getByLabel('Password', { exact: true }).fill('TestPassword123!');
  await page.getByRole('button', { name: 'Create account', exact: true }).click();
  await page.getByLabel('Preferred move-in date').fill(future);
  await page.getByLabel('A little about you').fill('I would like to explore this sample home.');
  await page.getByRole('button', { name: 'Submit demo request' }).click();
  await expect(page.locator('.request-item')).toContainText('Demo request');
  await page.getByRole('button', { name: 'Cancel request' }).click();
  await expect(page.locator('.status')).toContainText('cancelled');
  await page.getByRole('button', { name: 'Sign out', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Sign in', exact: true })).toBeVisible();
});
test('owner can publish and pause a listing from the UI', async ({ page }) => {
  await signup(page.request, 'Owner Test');
  await page.goto('/');
  await page.getByRole('button', { name: 'List your property', exact: true }).first().click();
  const dialog = page.getByRole('dialog');
  await dialog.getByLabel('Listing title').fill('UI test property');
  await dialog.getByLabel('City', { exact: true }).fill('Test City');
  await dialog.getByLabel('Neighbourhood').fill('Test Area');
  await dialog.getByLabel('Property address').fill('123 Test Road');
  await dialog.getByLabel('Monthly rent (RM)').fill('2300');
  await dialog
    .getByLabel('Tell renters about the home')
    .fill('A spacious test home with plenty of light and an open living room.');
  await dialog.getByRole('button', { name: 'Publish home' }).click();
  await page.getByRole('button', { name: 'My properties', exact: true }).click();
  await expect(page.locator('.dashboard-item')).toContainText('UI test property');
  await page.getByRole('button', { name: 'Pause listing' }).click();
  await expect(page.locator('.status')).toContainText('Paused');
});
test('real API enforces ownership, private dashboards and request state transitions', async ({
  playwright,
}) => {
  const owner = await playwright.request.newContext({ baseURL: origin });
  const tenant = await playwright.request.newContext({ baseURL: origin });
  const stranger = await playwright.request.newContext({ baseURL: origin });
  try {
    const ownerAccount = await signup(owner, 'Property Owner');
    await signup(tenant, 'Applicant');
    await signup(stranger, 'Unrelated User');
    const created = await owner.post('/api/rentals/homes', { headers, data: homeData });
    expect(created.status()).toBe(201);
    const home = await created.json();
    expect(
      (
        await stranger.patch('/api/rentals/homes', {
          headers,
          data: { id: home.id, published: false },
        })
      ).status(),
    ).toBe(403);
    expect(
      (
        await owner.post('/api/rentals/requests', {
          headers,
          data: { homeId: home.id, moveIn: future, months: 12 },
        })
      ).status(),
    ).toBe(400);
    const applied = await tenant.post('/api/rentals/requests', {
      headers,
      data: { homeId: home.id, moveIn: future, months: 12, message: 'Happy to arrange a viewing.' },
    });
    expect(applied.status()).toBe(201);
    const application = await applied.json();
    expect(
      (
        await tenant.post('/api/rentals/requests', {
          headers,
          data: { homeId: home.id, moveIn: future, months: 12 },
        })
      ).status(),
    ).toBe(409);
    expect(
      (
        await stranger.patch('/api/rentals/requests', {
          headers,
          data: { id: application.id, status: 'accepted' },
        })
      ).status(),
    ).toBe(403);
    expect((await stranger.get('/api/rentals/dashboard')).ok()).toBeTruthy();
    expect((await (await stranger.get('/api/rentals/dashboard')).json()).incoming).toEqual([]);
    const incoming = await (await owner.get('/api/rentals/dashboard')).json();
    expect(incoming.incoming[0].tenantName).toBe('Applicant');
    expect(
      (
        await owner.patch('/api/rentals/requests', {
          headers,
          data: { id: application.id, status: 'accepted' },
        })
      ).status(),
    ).toBe(200);
    expect(
      (
        await owner.patch('/api/rentals/requests', {
          headers,
          data: { id: application.id, status: 'declined' },
        })
      ).status(),
    ).toBe(409);
    const outgoing = await (await tenant.get('/api/rentals/dashboard')).json();
    expect(outgoing.outgoing[0].status).toBe('accepted');
    expect(outgoing.outgoing[0].ownerEmail).toBe(ownerAccount.email);
    expect(
      (
        await tenant.patch('/api/rentals/requests', {
          headers,
          data: { id: application.id, status: 'cancelled' },
        })
      ).status(),
    ).toBe(200);
    await owner.patch('/api/rentals/homes', { headers, data: { id: home.id, published: false } });
    expect(
      (
        await tenant.post('/api/rentals/requests', {
          headers,
          data: { homeId: home.id, moveIn: future, months: 12 },
        })
      ).status(),
    ).toBe(409);
  } finally {
    await owner.dispose();
    await tenant.dispose();
    await stranger.dispose();
  }
});
test('auth, CSRF, invalid inputs and sandbox allowlist are enforced', async ({ request }) => {
  expect((await request.get('/api/rentals/dashboard')).status()).toBe(401);
  expect((await request.post('/api/rentals/homes', { headers, data: homeData })).status()).toBe(
    401,
  );
  expect(
    (
      await request.post('/api/auth', {
        headers: { Origin: 'https://evil.example' },
        data: { action: 'register' },
      })
    ).status(),
  ).toBe(403);
  expect(
    (
      await request.post('/api/auth', {
        headers,
        data: { action: 'register', name: 'Test', email: 'bad', password: 'short' },
      })
    ).status(),
  ).toBe(400);
  const account = await signup(request);
  await request.post('/api/auth', { headers, data: { action: 'logout' } });
  expect((await request.get('/api/rentals/dashboard')).status()).toBe(401);
  expect(
    (
      await request.post('/api/auth', {
        headers,
        data: { action: 'login', email: account.email, password: 'WrongPassword123' },
      })
    ).status(),
  ).toBe(401);
  expect(
    (
      await request.post('/api/auth', {
        headers,
        data: { action: 'login', email: account.email, password: 'TestPassword123!' },
      })
    ).status(),
  ).toBe(200);
  expect(
    (
      await request.post('/api/rentals/homes', { headers, data: { ...homeData, rent: -1 } })
    ).status(),
  ).toBe(400);
  expect((await request.get('/api/sandbox/not-allowed')).status()).toBe(404);
  expect((await request.get('/api/sandbox/zones?limit=500')).status()).toBe(400);
});
test('Rebana references load and display unclassified risk honestly', async ({ page }) => {
  await page.route('**/api/sandbox/**', (route) => {
    const u = route.request().url();
    return route.fulfill({
      json: u.includes('/ping')
        ? { app: 'license', sandbox: true }
        : u.includes('/zones')
          ? [{ zoneCode: 'Z1', nameMs: 'Pusat', nameEn: 'Central', dunCode: 'D1' }]
          : u.includes('/license-types')
            ? [
                {
                  code: 'L1',
                  name: 'Lesen',
                  nameEn: 'Business licence',
                  family: 'LICENSE',
                  riskCategory: null,
                },
              ]
            : [
                {
                  code: 'A1',
                  name: 'Perniagaan',
                  nameEn: 'Business activity',
                  tier: 3,
                  selectable: true,
                },
              ],
    });
  });
  await page.goto('/');
  await page.getByRole('button', { name: 'Owner resources', exact: true }).first().click();
  await page.getByRole('button', { name: 'Connect to Rebana' }).click();
  await expect(page.getByRole('cell', { name: 'Central', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Licence types', exact: true }).click();
  await expect(page.getByRole('cell', { name: /Unclassified risk/ })).toBeVisible();
});
test('mobile layout fits and menu navigation works', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  await expect(page.locator('.home-card')).toHaveCount(6);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.getByRole('button', { name: 'Toggle navigation' }).click();
  await page.getByRole('button', { name: 'How it works', exact: true }).click();
  await expect(
    page.getByRole('heading', { name: 'Your next move, one step at a time.' }),
  ).toBeVisible();
});
