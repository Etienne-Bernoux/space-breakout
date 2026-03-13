import { test as base } from 'playwright-bdd';

export const test = base.extend({
  /** Collecte les erreurs console pour assertions. */
  consoleErrors: async ({ page }, use) => {
    const errors = [];
    page.on('pageerror', err => errors.push(err.message));
    await use(errors);
  },

  /** Attend que __GAME__.state atteigne la valeur cible (polling). */
  gameHelpers: async ({ page }, use) => {
    const BASE = 'http://localhost:3333';

    const helpers = {
      BASE,

      async waitForState(expected, timeout = 3000) {
        await page.waitForFunction(
          (s) => window.__GAME__?.state === s,
          expected,
          { timeout },
        );
      },

      async getState() {
        return page.evaluate(() => window.__GAME__?.state);
      },

      async getLives() {
        return page.evaluate(() => window.__GAME__?.lives);
      },

      async getRemaining() {
        return page.evaluate(() => window.__GAME__?.remaining);
      },

      /** Lance une partie depuis le menu : menu → systemMap → worldMap → playing. */
      async launchGame() {
        await page.goto(BASE);
        await page.waitForTimeout(500);
        await page.keyboard.press('Enter');
        await helpers.waitForState('systemMap');
        await page.keyboard.press('Enter');
        await helpers.waitForState('worldMap');
        await page.keyboard.press('Enter');
        await helpers.waitForState('playing');
      },

      /**
       * Convertit des coordonnées canvas en position CSS relative au canvas,
       * puis clic souris dessus.
       */
      async clickCanvas(canvasX, canvasY) {
        const info = await page.evaluate(() => {
          const c = document.getElementById('game');
          return { cssW: parseFloat(c.style.width), internalW: c.width };
        });
        const scale = info.cssW / info.internalW;
        await page.click('#game', { position: { x: canvasX * scale, y: canvasY * scale } });
      },

      /**
       * Convertit des coordonnées canvas en position CSS relative au canvas,
       * puis tap dessus.
       */
      async tapCanvas(canvasX, canvasY) {
        const info = await page.evaluate(() => {
          const c = document.getElementById('game');
          return { cssW: parseFloat(c.style.width), internalW: c.width };
        });
        const scale = info.cssW / info.internalW;
        await page.tap('#game', { position: { x: canvasX * scale, y: canvasY * scale } });
      },

      /**
       * Cherche une hitZone par id dans __GAME__.hitZones et tap dessus.
       * Retourne true si trouvée, false sinon.
       */
      async tapHitZone(id) {
        const zone = await page.evaluate((zoneId) => {
          const zones = window.__GAME__?.hitZones || [];
          return zones.find(z => z.id === zoneId) || null;
        }, id);
        if (!zone) return false;
        await helpers.tapCanvas(zone.x, zone.y);
        return true;
      },
    };

    await use(helpers);
  },
});
