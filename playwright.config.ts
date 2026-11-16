import { defineConfig, devices } from '@playwright/test';

const BACKEND = process.env.BACKEND_DIR ?? '../c7-backend';
/** E2E_DEV=1 runs the suite against the Metro dev server, where React / RN dev errors
 *  (e.g. "Unexpected text node … <View>") are reported — the fixtures fail on any of them. */
const DEV = process.env.E2E_DEV === '1';
const app = DEV
  ? { command: 'npx expo start --web --port 8099', port: 8099, reuseExistingServer: false, timeout: 300_000, env: { CI: '1', EXPO_OFFLINE: '1', EXPO_PUBLIC_API_URL: 'http://localhost:4100', EXPO_PUBLIC_AUTH_MODE: 'test' } }
  : { command: 'node e2e/serve.mjs dist-e2e 8099', port: 8099, reuseExistingServer: true };
export default defineConfig({
  testDir: './e2e',
  testMatch: /.*\.spec\.ts/,
  workers: 1,
  timeout: DEV ? 120_000 : 60_000,
  expect: { timeout: 15_000 },
  globalSetup: './e2e/global-setup.ts',
  reporter: [['list'], ['html', { open: 'never', outputFolder: 'e2e-report' }]],
  use: { baseURL: 'http://localhost:8099', ...devices['Pixel 7'], trace: 'retain-on-failure', screenshot: 'only-on-failure' },
  webServer: [
    { command: `cd ${BACKEND} && npx tsx --env-file=.env.test src/server.ts`, port: 4100, reuseExistingServer: false, env: { PORT: '4100' } },
    app,
  ],
});
