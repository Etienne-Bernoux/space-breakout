import { test, expect } from '@playwright/test';

const BASE = 'http://localhost:3333';

test.describe('Smoke — démarrage sans erreur', () => {
  test('la page charge sans erreur console', async ({ page }) => {
    const errors = [];
    page.on('pageerror', err => errors.push(err.message));

    await page.goto(BASE);
    // Laisser le temps au module tree de se charger
    await page.waitForTimeout(1000);

    expect(errors).toEqual([]);
  });

  test('le canvas game existe', async ({ page }) => {
    await page.goto(BASE);
    const canvas = page.locator('#game');
    await expect(canvas).toBeVisible();
  });

  test('le hook __GAME__ est exposé avec state=menu', async ({ page }) => {
    await page.goto(BASE);
    await page.waitForTimeout(500);
    const state = await page.evaluate(() => window.__GAME__?.state);
    expect(state).toBe('menu');
  });
});
