import { test as base } from 'playwright-bdd';

/** Script injecté avant chaque page pour neutraliser Web Audio (pas de son en e2e). */
/** Stub complet Web Audio : crée un vrai AudioContext mais coupe la destination. */
const MUTE_AUDIO_SCRIPT = `
  const OrigAudioContext = window.AudioContext || window.webkitAudioContext;
  if (OrigAudioContext) {
    const _origProto = OrigAudioContext.prototype;
    const _origCreateGain = _origProto.createGain;
    window.AudioContext = function(...args) {
      const ctx = new OrigAudioContext(...args);
      // Couper le master gain en interceptant destination
      try {
        const silence = _origCreateGain.call(ctx);
        silence.gain.value = 0;
        silence.connect(ctx.destination);
        // Override destination pour que tout soit routé vers le gain muet
        Object.defineProperty(ctx, '_mutedDest', { value: silence });
        const origConnect = AudioNode.prototype.connect;
        const dest = ctx.destination;
        AudioNode.prototype.connect = function(target, ...rest) {
          if (target === dest) return origConnect.call(this, silence, ...rest);
          return origConnect.call(this, target, ...rest);
        };
      } catch(e) {}
      return ctx;
    };
    window.AudioContext.prototype = _origProto;
    window.webkitAudioContext = window.AudioContext;
  }
`;

export const test = base.extend({
  /** Neutralise Web Audio avant chaque navigation. */
  page: async ({ page }, use) => {
    await page.addInitScript(MUTE_AUDIO_SCRIPT);
    await use(page);
  },

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

      async waitForState(expected, timeout = 5000) {
        await page.waitForFunction(
          (s) => typeof window.__GAME__ !== 'undefined' && window.__GAME__?.state === s,
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
      /** Attend que le hook __GAME__ soit disponible (jeu initialisé). */
      async waitForGame(timeout = 10000) {
        await page.waitForFunction(
          () => typeof window.__GAME__ !== 'undefined' && window.__GAME__?.state != null,
          null,
          { timeout },
        );
      },

      async launchGame() {
        await page.goto(BASE);
        await helpers.waitForGame();
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
        if (!zone) throw new Error(`hitZone "${id}" not found in current state`);
        await helpers.tapCanvas(zone.x, zone.y);
      },
    };

    await use(helpers);
  },
});
