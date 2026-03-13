import { createBdd } from 'playwright-bdd';
import { test } from './fixtures.js';

const { When, Then } = createBdd(test);

// ── Desktop audit steps ─────────────────────────────────────

When('je déplace la souris horizontalement sur le vaisseau', async ({ page }) => {
  const box = await page.locator('#game').boundingBox();
  const shipY = box.y + box.height * 0.85;
  await page.mouse.move(box.x + box.width * 0.3, shipY);
  await page.waitForTimeout(100);
  await page.mouse.move(box.x + box.width * 0.7, shipY, { steps: 10 });
});

Then('je log le diagnostic desktop', async ({ page }) => {
  const diag = await page.evaluate(() => {
    const g = window.__GAME__;
    const c = document.getElementById('game');
    return {
      state: g?.state,
      canvasWidth: c?.width,
      canvasHeight: c?.height,
      cssWidth: c?.style.width,
      cssHeight: c?.style.height,
      viewportWidth: window.innerWidth,
      viewportHeight: window.innerHeight,
      isMobile: 'ontouchstart' in window,
      devicePixelRatio: window.devicePixelRatio,
    };
  });
  console.log('Desktop diagnostic:', JSON.stringify(diag, null, 2));
});

// ── Mobile audit steps ──────────────────────────────────────

When('je tap la hitZone {string}', async ({ gameHelpers }, id) => {
  await gameHelpers.tapHitZone(id);
});

When('je tap le centre du canvas', async ({ page, gameHelpers }) => {
  const info = await page.evaluate(() => ({
    w: document.getElementById('game').width,
    h: document.getElementById('game').height,
  }));
  await gameHelpers.tapCanvas(info.w / 2, info.h * 0.7);
});

When('je simule un glissement tactile horizontal', async ({ page }) => {
  const box = await page.locator('#game').boundingBox();
  const startX = box.x + box.width * 0.3;
  const startY = box.y + box.height * 0.85;
  await page.touchscreen.tap(startX, startY);
});

When('je tap le bouton pause', async ({ page, gameHelpers }) => {
  const info = await page.evaluate(() => ({
    w: document.getElementById('game').width,
    h: document.getElementById('game').height,
  }));
  await gameHelpers.tapCanvas(info.w - 30, 25);
});

Then('je log le diagnostic mobile', async ({ page }) => {
  const diag = await page.evaluate(() => {
    const g = window.__GAME__;
    const c = document.getElementById('game');
    return {
      state: g?.state,
      canvasWidth: c?.width,
      canvasHeight: c?.height,
      cssWidth: c?.style.width,
      cssHeight: c?.style.height,
      viewportWidth: window.innerWidth,
      viewportHeight: window.innerHeight,
      isMobile: 'ontouchstart' in window,
      devicePixelRatio: window.devicePixelRatio,
    };
  });
  console.log('Mobile diagnostic:', JSON.stringify(diag, null, 2));
});
