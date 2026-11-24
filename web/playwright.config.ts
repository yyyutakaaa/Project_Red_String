import { defineConfig, devices } from '@playwright/test';

// End-to-end playthrough of case 1 with the interrogate endpoint mocked (see tests/e2e).
export default defineConfig({
  testDir: './tests/e2e',
  timeout: 120_000,
  expect: { timeout: 10_000 },
  fullyParallel: false,
  retries: 0,
  reporter: [['list']],
  use: {
    baseURL: 'http://127.0.0.1:4173',
    viewport: { width: 1280, height: 800 },
    trace: 'retain-on-failure',
  },
  projects: [
    { name: 'desktop-chromium', use: { ...devices['Desktop Chrome'], viewport: { width: 1280, height: 800 } } },
    // A tablet held sideways: the game needs at least 960 x 560 (the desktop window cannot get smaller than 960 x 600).
    { name: 'tablet-chromium', use: { ...devices['Desktop Chrome'], viewport: { width: 1180, height: 820 }, hasTouch: true } },
    { name: 'smallest-window', use: { ...devices['Desktop Chrome'], viewport: { width: 960, height: 560 } } },
  ],
  webServer: {
    // Production mode loads .env.production, so the backend counts as configured; tests mock every call.
    command: 'npx vite --mode production --host 127.0.0.1 --port 4173 --strictPort',
    url: 'http://127.0.0.1:4173',
    reuseExistingServer: true,
    timeout: 120_000,
  },
});
