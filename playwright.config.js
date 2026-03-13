import { defineConfig, devices } from '@playwright/test';
import { defineBddConfig } from 'playwright-bdd';

const bddDesktop = defineBddConfig({
  outputDir: '.features-gen/desktop',
  features: 'e2e/features/*.feature',
  steps: 'e2e/steps/**/*.js',

  tags: 'not @mobile',
});

const bddMobile = defineBddConfig({
  outputDir: '.features-gen/mobile',
  features: 'e2e/features/mobile-audit.feature',
  steps: 'e2e/steps/**/*.js',

  tags: '@mobile',
});

export default defineConfig({
  timeout: 15000,
  retries: 0,
  projects: [
    {
      name: 'desktop',
      testDir: bddDesktop,
      use: {
        headless: true,
        viewport: { width: 800, height: 600 },
      },
    },
    {
      name: 'mobile',
      testDir: bddMobile,
      use: {
        ...devices['iPhone 13'],
        hasTouch: true,
        headless: true,
      },
    },
  ],
  webServer: {
    command: 'npx serve . -l 3333 --no-clipboard',
    port: 3333,
    reuseExistingServer: true,
  },
});
