import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  timeout: 15000,
  retries: 0,
  use: {
    headless: true,
    viewport: { width: 800, height: 600 },
  },
  webServer: {
    command: 'npx serve . -l 3333 --no-clipboard',
    port: 3333,
    reuseExistingServer: true,
  },
});
