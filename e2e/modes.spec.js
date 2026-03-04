import { test, expect } from '@playwright/test';

const BASE = 'http://localhost:3333';

test.describe('?lab — Lab Hub', () => {
  test('charge sans erreur console avec ?lab', async ({ page }) => {
    const errors = [];
    page.on('pageerror', err => errors.push(err.message));

    await page.goto(`${BASE}?lab`);
    await page.waitForTimeout(1000);

    expect(errors).toEqual([]);
  });

  test('le lab hub est actif avec ?lab', async ({ page }) => {
    await page.goto(`${BASE}?lab`);
    await page.waitForTimeout(500);

    const labHub = await page.evaluate(() => window.__GAME__?.labHub);
    expect(labHub).toBe(true);
  });

  test('le lab hub est inactif sans param', async ({ page }) => {
    await page.goto(BASE);
    await page.waitForTimeout(500);

    const labHub = await page.evaluate(() => window.__GAME__?.labHub);
    expect(labHub).toBe(false);
  });

  test('clic Dev Panel ouvre le dev panel', async ({ page }) => {
    await page.goto(`${BASE}?lab`);
    await page.waitForTimeout(500);

    await page.click('[data-lab="dev"]');
    await page.waitForTimeout(200);

    const devPanel = await page.evaluate(() => window.__GAME__?.devPanel);
    expect(devPanel).toBe(true);

    const labHub = await page.evaluate(() => window.__GAME__?.labHub);
    expect(labHub).toBe(false);
  });

  test('clic Music Lab ouvre le music lab', async ({ page }) => {
    await page.goto(`${BASE}?lab`);
    await page.waitForTimeout(500);

    await page.click('[data-lab="music"]');
    await page.waitForTimeout(200);

    const musicLab = await page.evaluate(() => window.__GAME__?.musicLab);
    expect(musicLab).toBe(true);
  });

  test('clic Progress Lab ouvre le progress lab', async ({ page }) => {
    await page.goto(`${BASE}?lab`);
    await page.waitForTimeout(500);

    await page.click('[data-lab="progress"]');
    await page.waitForTimeout(200);

    const mineralLab = await page.evaluate(() => window.__GAME__?.mineralLab);
    expect(mineralLab).toBe(true);
  });

  test('bouton retour revient au hub', async ({ page }) => {
    await page.goto(`${BASE}?lab`);
    await page.waitForTimeout(500);

    // Ouvrir dev panel
    await page.click('[data-lab="dev"]');
    await page.waitForTimeout(200);

    // Cliquer retour
    await page.click('#dev-panel-lab .lab-back-btn');
    await page.waitForTimeout(200);

    const labHub = await page.evaluate(() => window.__GAME__?.labHub);
    expect(labHub).toBe(true);

    const devPanel = await page.evaluate(() => window.__GAME__?.devPanel);
    expect(devPanel).toBe(false);
  });

  test('expose wallet et upgrades via __GAME__', async ({ page }) => {
    await page.goto(`${BASE}?lab`);
    await page.waitForTimeout(500);

    const hasWallet = await page.evaluate(() => {
      const w = window.__GAME__?.wallet;
      return w && typeof w.get === 'function';
    });
    expect(hasWallet).toBe(true);

    const hasUpgrades = await page.evaluate(() => {
      const u = window.__GAME__?.upgrades;
      return u && typeof u.getLevel === 'function';
    });
    expect(hasUpgrades).toBe(true);
  });
});
