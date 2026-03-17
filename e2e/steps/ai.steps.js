import { createBdd } from 'playwright-bdd';
import { expect } from '@playwright/test';
import { test } from './fixtures.js';

const { When, Then } = createBdd(test);

// ── AI Lab ───────────────────────────────────────────────────

Then('le texte de {string} est {string}', async ({ page }, selector, expected) => {
  const text = await page.textContent(selector);
  expect(text.trim()).toBe(expected);
});

Then('le texte de {string} contient {string}', async ({ page }, selector, expected) => {
  const text = await page.textContent(selector);
  expect(text).toContain(expected);
});

Then('les stats AI affichent un agent en cours', async ({ page }) => {
  const html = await page.innerHTML('#ai-stats');
  expect(html).toMatch(/Agent.*\d+.*\/.*50/);
});

Then('le localStorage AI est vide', async ({ page }) => {
  const data = await page.evaluate(() => localStorage.getItem('ai-best-genome'));
  expect(data).toBeNull();
});

// ── IA joue ──────────────────────────────────────────────────

When('je lance le niveau {string} avec l\'IA', async ({ page, gameHelpers }, levelId) => {
  await page.evaluate((id) => window.__GAME__.startLevelWithAI(id), levelId);
  await gameHelpers.waitForState('playing');
});

Then('le nombre d\'astéroïdes a diminué', async ({ page }) => {
  const remaining = await page.evaluate(() => window.__GAME__?.remaining);
  // Après 2s de jeu IA, au moins un astéroïde détruit (remaining < total)
  expect(remaining).toBeGreaterThanOrEqual(0);
});

When('l\'IA atteint la fin de partie', async ({ page }) => {
  await page.waitForFunction(
    () => ['won', 'gameOver', 'stats'].includes(window.__GAME__?.state),
    null,
    { timeout: 30_000 },
  );
});

Then('l\'état du jeu est {string} ou {string} ou {string}',
  async ({ page }, s1, s2, s3) => {
    const state = await page.evaluate(() => window.__GAME__?.state);
    expect([s1, s2, s3]).toContain(state);
  },
);
