import { defineConfig, devices } from '@playwright/test';
export default defineConfig({
  testDir: 'tests/e2e',
  workers: 1,
  fullyParallel: false,
  use: { baseURL: 'http://127.0.0.1:3122', trace: 'retain-on-failure' },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    command: 'npx next dev -p 3122',
    url: 'http://127.0.0.1:3122',
    reuseExistingServer: false,
    timeout: 120000,
    env: { RENTARA_DB_PATH: './data/e2e.db' },
  },
});
