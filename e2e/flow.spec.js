import { test, expect } from '@playwright/test';

const BASE = 'http://localhost:3333';

/** Attend que __GAME__.state atteigne la valeur cible (polling). */
async function waitForState(page, expected, timeout = 3000) {
  await page.waitForFunction(
    (s) => window.__GAME__?.state === s,
    expected,
    { timeout },
  );
}

/** Lance une partie depuis le menu : menu → worldMap → playing. */
async function launchGame(page) {
  await page.goto(BASE);
  await page.waitForTimeout(500);
  await page.keyboard.press('Enter');        // menu → worldMap
  await waitForState(page, 'worldMap');
  await page.keyboard.press('Enter');        // worldMap → playing (z1-1 sélectionné)
  await waitForState(page, 'playing');
}

test.describe('Flow — menu → lancer → jouer → fin', () => {
  test('Enter depuis le menu passe en state playing', async ({ page }) => {
    await launchGame(page);
    const state = await page.evaluate(() => window.__GAME__?.state);
    expect(state).toBe('playing');
  });

  test('lancer le drone avec espace', async ({ page }) => {
    await launchGame(page);
    await page.keyboard.press('Space');
    await page.waitForTimeout(200);
    const state = await page.evaluate(() => window.__GAME__?.state);
    expect(state).toBe('playing');
  });

  test('pause / resume avec Escape', async ({ page }) => {
    await launchGame(page);

    await page.keyboard.press('Escape');
    await waitForState(page, 'paused');
    let state = await page.evaluate(() => window.__GAME__?.state);
    expect(state).toBe('paused');

    await page.keyboard.press('Escape');
    await waitForState(page, 'playing');
    state = await page.evaluate(() => window.__GAME__?.state);
    expect(state).toBe('playing');
  });

  test('le nombre de vies est cohérent au démarrage', async ({ page }) => {
    await launchGame(page);
    const lives = await page.evaluate(() => window.__GAME__?.lives);
    expect(lives).toBeGreaterThan(0);
  });

  test('des astéroïdes sont présents au démarrage', async ({ page }) => {
    await launchGame(page);
    const remaining = await page.evaluate(() => window.__GAME__?.remaining);
    expect(remaining).toBeGreaterThan(0);
  });
});

test.describe('Flow — worldMap → win → stats → carte', () => {
  test('forceWin → stats → retour carte', async ({ page }) => {
    await launchGame(page);

    // Lancer la balle puis forcer la victoire
    await page.keyboard.press('Space');
    await page.waitForTimeout(100);
    await page.evaluate(() => window.__GAME__.forceWin());

    // Le jeu détecte remaining === 0 → won → stats
    await waitForState(page, 'stats', 5000);
    const state = await page.evaluate(() => window.__GAME__?.state);
    expect(state).toBe('stats');

    // Escape depuis stats → retour carte
    await page.keyboard.press('Escape');
    await waitForState(page, 'worldMap');
    const mapState = await page.evaluate(() => window.__GAME__?.state);
    expect(mapState).toBe('worldMap');
  });
});
