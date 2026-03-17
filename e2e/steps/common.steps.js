import { createBdd } from 'playwright-bdd';
import { expect } from '@playwright/test';
import { test } from './fixtures.js';

const { Given, When, Then, Step } = createBdd(test);

// ── Navigation ──────────────────────────────────────────────

Given('je suis sur la page d\'accueil', async ({ page, gameHelpers }) => {
  await page.goto(gameHelpers.BASE);
  await page.waitForTimeout(500);
});

Given('je suis sur la page {string}', async ({ page, gameHelpers }, path) => {
  await page.goto(`${gameHelpers.BASE}${path}`);
  await page.waitForTimeout(500);
});

Given('une partie est lancée', async ({ gameHelpers }) => {
  await gameHelpers.launchGame();
});

// ── Actions clavier ─────────────────────────────────────────

When('j\'appuie sur {string}', async ({ page }, key) => {
  await page.keyboard.press(key);
});

// ── Actions souris / DOM ────────────────────────────────────

When('je clique sur {string}', async ({ page }, selector) => {
  await page.click(selector);
});

// ── Attente ─────────────────────────────────────────────────

When('j\'attends {int}ms', async ({ page }, ms) => {
  await page.waitForTimeout(ms);
});

// ── Game logic ──────────────────────────────────────────────

When('je force la victoire', async ({ page }) => {
  await page.evaluate(() => window.__GAME__.forceWin());
  await page.waitForFunction(
    () => window.__GAME__?.state === 'stats',
    null,
    { timeout: 5000 },
  );
});

When('je lance le niveau {string}', async ({ page, gameHelpers }, levelId) => {
  await page.evaluate((id) => window.__GAME__.startLevel(id), levelId);
  await gameHelpers.waitForState('playing');
});

When('j\'accélère le jeu x{int}', async ({ page }, factor) => {
  await page.evaluate((f) => { window.__GAME__.timeScale = f; }, factor);
});

When('je remets la vitesse normale', async ({ page }) => {
  await page.evaluate(() => { window.__GAME__.timeScale = 1; });
});

// ── Assertions état ─────────────────────────────────────────

Then('l\'état du jeu est {string}', async ({ page, gameHelpers }, expected) => {
  await gameHelpers.waitForState(expected);
  const state = await gameHelpers.getState();
  expect(state).toBe(expected);
});

Then('le canvas {string} est visible', async ({ page }, selector) => {
  const canvas = page.locator(selector);
  await expect(canvas).toBeVisible();
});

Then('l\'élément {string} est visible', async ({ page }, selector) => {
  await expect(page.locator(selector)).toBeVisible();
});

Then('le nombre de vies est supérieur à {int}', async ({ gameHelpers }, min) => {
  const lives = await gameHelpers.getLives();
  expect(lives).toBeGreaterThan(min);
});

Then('le nombre d\'astéroïdes est supérieur à {int}', async ({ gameHelpers }, min) => {
  const remaining = await gameHelpers.getRemaining();
  expect(remaining).toBeGreaterThan(min);
});

// ── Screenshots ─────────────────────────────────────────────

Step('je capture {string}', async ({ page }, filename) => {
  await page.screenshot({ path: `e2e/screenshots/${filename}` });
});
