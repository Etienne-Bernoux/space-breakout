import { test, expect, devices } from '@playwright/test';

const BASE = 'http://localhost:3333';
const iPhone = devices['iPhone 13'];

/** Attend que __GAME__.state atteigne la valeur cible (polling). */
async function waitForState(page, expected, timeout = 5000) {
  await page.waitForFunction(
    (s) => window.__GAME__?.state === s,
    expected,
    { timeout },
  );
}

/**
 * Convertit des coordonnées canvas en position CSS relative au canvas,
 * puis tap dessus.
 */
async function tapCanvas(page, canvasX, canvasY) {
  const info = await page.evaluate(() => {
    const c = document.getElementById('game');
    return { cssW: parseFloat(c.style.width), internalW: c.width };
  });
  const scale = info.cssW / info.internalW;
  await page.tap('#game', { position: { x: canvasX * scale, y: canvasY * scale } });
}

/**
 * Cherche une hitZone par id dans __GAME__.hitZones et tap dessus.
 * Retourne true si trouvée, false sinon.
 */
async function tapHitZone(page, id) {
  const zone = await page.evaluate((zoneId) => {
    const zones = window.__GAME__?.hitZones || [];
    return zones.find(z => z.id === zoneId) || null;
  }, id);
  if (!zone) return false;
  // Les hitZones sont en coordonnées canvas
  await tapCanvas(page, zone.x, zone.y);
  return true;
}

test.use({ ...iPhone, hasTouch: true });

test.describe('Audit mobile — iPhone 13', () => {
  test('parcours complet avec screenshots via hitZones', async ({ page }) => {
    await page.goto(BASE);
    await page.waitForTimeout(800);

    // 1. Menu
    await page.screenshot({ path: 'e2e/screenshots/mobile-01-menu.png' });

    // Lister les hitZones disponibles
    const menuZones = await page.evaluate(() => window.__GAME__?.hitZones);
    console.log('Menu hitZones:', JSON.stringify(menuZones));

    // 2. Tap "play" dans le menu
    const tappedPlay = await tapHitZone(page, 'play');
    console.log('Tapped play:', tappedPlay);
    await page.waitForTimeout(600);
    await page.screenshot({ path: 'e2e/screenshots/mobile-02-after-play.png' });

    const stateAfterPlay = await page.evaluate(() => window.__GAME__?.state);
    console.log('State after play:', stateAfterPlay);

    // 3. SystemMap → tap zone-0
    if (stateAfterPlay === 'systemMap') {
      await page.waitForTimeout(300);
      const sysZones = await page.evaluate(() => window.__GAME__?.hitZones);
      console.log('SystemMap hitZones:', JSON.stringify(sysZones));
      await page.screenshot({ path: 'e2e/screenshots/mobile-03-systemMap.png' });

      const tappedZone = await tapHitZone(page, 'zone-0');
      console.log('Tapped zone-0:', tappedZone);
      await page.waitForTimeout(600);
      await page.screenshot({ path: 'e2e/screenshots/mobile-04-after-zone.png' });
    }

    const stateNow = await page.evaluate(() => window.__GAME__?.state);
    console.log('State now:', stateNow);

    // 4. WorldMap → tap level-0
    if (stateNow === 'worldMap') {
      const worldZones = await page.evaluate(() => window.__GAME__?.hitZones);
      console.log('WorldMap hitZones:', JSON.stringify(worldZones));
      await page.screenshot({ path: 'e2e/screenshots/mobile-05-worldMap.png' });

      const tappedLevel = await tapHitZone(page, 'level-0');
      console.log('Tapped level-0:', tappedLevel);
      await page.waitForTimeout(600);
      await page.screenshot({ path: 'e2e/screenshots/mobile-06-after-level.png' });
    }

    const playState = await page.evaluate(() => window.__GAME__?.state);
    console.log('State before gameplay:', playState);

    // 5. Playing → screenshots du gameplay
    if (playState === 'playing') {
      await page.screenshot({ path: 'e2e/screenshots/mobile-07-playing-before-launch.png' });

      // Tap pour lancer le drone (milieu du canvas)
      const info = await page.evaluate(() => ({
        w: document.getElementById('game').width,
        h: document.getElementById('game').height,
      }));
      await tapCanvas(page, info.w / 2, info.h * 0.7);
      await page.waitForTimeout(300);
      await page.screenshot({ path: 'e2e/screenshots/mobile-08-playing-launched.png' });

      // Simuler un glissement tactile (drag horizontal)
      const box = await page.locator('#game').boundingBox();
      const startX = box.x + box.width * 0.3;
      const startY = box.y + box.height * 0.85;
      const endX = box.x + box.width * 0.7;

      await page.touchscreen.tap(startX, startY);
      await page.waitForTimeout(200);
      await page.screenshot({ path: 'e2e/screenshots/mobile-09-after-touch-move.png' });

      // Attendre quelques secondes de jeu
      await page.waitForTimeout(2000);
      await page.screenshot({ path: 'e2e/screenshots/mobile-10-playing-2s.png' });

      // Tap bouton pause (haut droit du canvas)
      await tapCanvas(page, info.w - 30, 25);
      await page.waitForTimeout(300);
      await page.screenshot({ path: 'e2e/screenshots/mobile-11-paused.png' });

      // Diagnostic complet
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
    }

    const finalState = await page.evaluate(() => window.__GAME__?.state);
    console.log('Final state:', finalState);
  });
});
