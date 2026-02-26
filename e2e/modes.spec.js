import { test, expect } from '@playwright/test';

const BASE = 'http://localhost:3333';

test.describe('?dev — Dev Panel', () => {
  test('charge sans erreur console avec ?dev', async ({ page }) => {
    const errors = [];
    page.on('pageerror', err => errors.push(err.message));

    await page.goto(`${BASE}?dev`);
    await page.waitForTimeout(1000);

    expect(errors).toEqual([]);
  });

  test('le dev panel est actif avec ?dev', async ({ page }) => {
    await page.goto(`${BASE}?dev`);
    await page.waitForTimeout(500);

    const devPanel = await page.evaluate(() => window.__GAME__?.devPanel);
    expect(devPanel).toBe(true);
  });

  test('le dev panel est inactif sans ?dev', async ({ page }) => {
    await page.goto(BASE);
    await page.waitForTimeout(500);

    const devPanel = await page.evaluate(() => window.__GAME__?.devPanel);
    expect(devPanel).toBe(false);
  });
});

test.describe('?mus — Music Lab', () => {
  test('charge sans erreur console avec ?mus', async ({ page }) => {
    const errors = [];
    page.on('pageerror', err => errors.push(err.message));

    await page.goto(`${BASE}?mus`);
    await page.waitForTimeout(1000);

    expect(errors).toEqual([]);
  });

  test('le music lab est actif avec ?mus', async ({ page }) => {
    await page.goto(`${BASE}?mus`);
    await page.waitForTimeout(500);

    const musicLab = await page.evaluate(() => window.__GAME__?.musicLab);
    expect(musicLab).toBe(true);
  });

  test('le music lab est actif avec ?music', async ({ page }) => {
    await page.goto(`${BASE}?music`);
    await page.waitForTimeout(500);

    const musicLab = await page.evaluate(() => window.__GAME__?.musicLab);
    expect(musicLab).toBe(true);
  });

  test('le music lab est inactif sans param', async ({ page }) => {
    await page.goto(BASE);
    await page.waitForTimeout(500);

    const musicLab = await page.evaluate(() => window.__GAME__?.musicLab);
    expect(musicLab).toBe(false);
  });
});
