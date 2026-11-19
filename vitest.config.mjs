import { defineConfig } from 'vitest/config';

/**
 * `npm test`: logic and API tests. API tests call the route handlers
 * directly in mock mode (no server, no Firebase/Stripe). Browser tests are
 * separate: `npm run test:e2e` (playwright.config.mjs).
 */
export default defineConfig({
  resolve: { alias: { '@': import.meta.dirname } },
  test: {
    include: ['tests/{unit,api,firestore}/**/*.test.js'],
    environment: 'node',
    setupFiles: ['tests/setup.js'],
    env: {
      NEXT_PUBLIC_USE_MOCKS: 'true',
      MOCK_LATENCY_MS: '0',
      // Tests send webhooks themselves
      MOCK_WEBHOOK_DELAY_MS: '-1',
    },
  },
});
