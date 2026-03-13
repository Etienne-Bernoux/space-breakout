import { createBdd } from 'playwright-bdd';
import { expect } from '@playwright/test';
import { test } from './fixtures.js';

const { Then } = createBdd(test);

// ── Flags __GAME__ ──────────────────────────────────────────

Then('le flag {string} est true', async ({ page }, path) => {
  const prop = path.replace('__GAME__.', '');
  const value = await page.evaluate((p) => window.__GAME__?.[p], prop);
  expect(value).toBe(true);
});

Then('le flag {string} est false', async ({ page }, path) => {
  const prop = path.replace('__GAME__.', '');
  const value = await page.evaluate((p) => window.__GAME__?.[p], prop);
  expect(value).toBe(false);
});

// ── Méthodes exposées ───────────────────────────────────────

Then('__GAME__.wallet expose une méthode {string}', async ({ page }, method) => {
  const has = await page.evaluate((m) => {
    const w = window.__GAME__?.wallet;
    return w && typeof w[m] === 'function';
  }, method);
  expect(has).toBe(true);
});

Then('__GAME__.upgrades expose une méthode {string}', async ({ page }, method) => {
  const has = await page.evaluate((m) => {
    const u = window.__GAME__?.upgrades;
    return u && typeof u[m] === 'function';
  }, method);
  expect(has).toBe(true);
});
