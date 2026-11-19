import { defineConfig, devices } from '@playwright/test';

/**
 * `npm run test:e2e`: browser tests (tests/e2e) against the app in mock
 * mode. Every test starts from fresh dummy data (POST /api/mock/reset).
 *
 * It builds the app and runs the production server on E2E_PORT (default
 * 3200), in .next-e2e so it doesn't clash with a dev server you already
 * have running. A production server compiles nothing while the tests run,
 * which keeps them fast and reliable, also on small CI machines.
 * `E2E_DEV=1 npm run test:e2e` uses the dev server instead (no build step,
 * handy while writing tests).
 *
 * First time: `npx playwright install chromium`.
 */
const PORT = Number(process.env.E2E_PORT ?? 3200);
const baseURL = `http://localhost:${PORT}`;
const useDevServer = process.env.E2E_DEV === '1';

export default defineConfig({
  testDir: 'tests/e2e',
  // One server with one set of dummy data: one test at a time
  workers: 1,
  fullyParallel: false,
  timeout: 90_000,
  expect: { timeout: 15_000 },
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [['list'], ['html', { open: 'never' }]] : 'list',
  globalSetup: './tests/e2e/warmUp.mjs',
  use: {
    baseURL,
    navigationTimeout: 60_000,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    command: useDevServer
      ? `node scripts/dev-mock.mjs -p ${PORT}`
      : `npm run build && npm run start -- -p ${PORT}`,
    url: `${baseURL}/api/rooms/available?startDate=2030-01-01&endDate=2030-01-02`,
    reuseExistingServer: !process.env.CI,
    timeout: 300_000,
    env: {
      // Mock mode has to be on when building (NEXT_PUBLIC_ settings are
      // built into the app)
      NEXT_PUBLIC_USE_MOCKS: 'true',
      MOCK_LATENCY_MS: '0',
      NEXT_DIST_DIR: '.next-e2e',
    },
  },
});
