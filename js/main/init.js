import { CONFIG } from '../config.js';
import { Ship } from '../domain/ship.js';
import { Drone } from '../domain/drone.js';
import { AsteroidField } from '../domain/asteroid/index.js';
import { GameSession } from '../use-cases/game-logic.js';
import { DropSystem } from '../use-cases/drop-system.js';
import { PowerUpManager } from '../use-cases/power-up-manager.js';
import { GameIntensityDirector } from '../use-cases/game-intensity-director.js';
import { setupResize } from '../infra/resize.js';
import { isDevMode, getDevAsteroidConfig } from '../infra/dev-panel/index.js';

// --- Canvas setup ---
const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');

// --- Shared game state ---
export const G = {
  // --- Rendering ---
  render: { canvas, ctx },

  // --- Game session ---
  session: new GameSession(CONFIG),

  // --- Game entities ---
  entities: {
    ship: null,
    drones: [],
    field: null,
    capsules: [],
    totalAsteroids: 0,
  },
  get gs() {
    const e = this.entities;
    return { ship: e.ship, drones: e.drones, session: this.session, field: e.field };
  },

  // --- Systems ---
  systems: {
    drop: new DropSystem(CONFIG.drop),
    powerUp: new PowerUpManager(),
    intensity: new GameIntensityDirector(),
  },

  // --- UI state ---
  ui: { combo: 0, comboDisplay: 0, comboFadeTimer: 0, slowMoTimer: 0 },
};

// --- Scale responsive pour le jeu (HUD, boutons, overlays) ---
export function gameScale() {
  return Math.min(1.0, Math.max(0.6, CONFIG.canvas.width / 500));
}

// --- Slow-motion ---
export const SLOW_MO_DURATION = 30; // frames (~0.5s à 60fps)
export const SLOW_MO_FACTOR = 0.3;

export function triggerSlowMo() {
  G.ui.slowMoTimer = SLOW_MO_DURATION;
}

export function getSlowMoFactor() {
  return G.ui.slowMoTimer > 0 ? SLOW_MO_FACTOR : 1;
}

// --- Combo counter ---
export const COMBO_FADE_DURATION = 90; // frames (~1.5s)

// --- Bouton pause (responsive) ---
export function pauseBtnLayout() {
  const s = gameScale();
  const size = Math.round(40 * s);
  return { x: CONFIG.canvas.width - size - 10, y: 8, size };
}

setupResize(() => {
  G.session.canvasHeight = CONFIG.canvas.height;
  const ship = G.entities.ship;
  if (ship) {
    if (ship.isMobile) {
      ship.bottomMargin = Math.max(60, Math.round(CONFIG.canvas.height * ship._mobileRatio));
    }
    ship.y = CONFIG.canvas.height - ship.height - ship.bottomMargin;
    ship.canvasWidth = CONFIG.canvas.width;
    for (const d of G.entities.drones) { if (!d.launched) d.reset(ship); }
  }
});

// --- Courbe perceptuelle : x² pour que 50% du slider ≈ moitié du volume perçu ---
export function perceptualVolume(v) {
  return v * v;
}

// --- Démarrage d'une partie ---
function spawnEntities(ent) {
  const isMobile = 'ontouchstart' in window;
  ent.ship = new Ship(CONFIG.ship, CONFIG.canvas.width, CONFIG.canvas.height, isMobile);
  ent.drones = [new Drone(CONFIG.drone, ent.ship, isMobile, CONFIG.canvas.width)];
  const astConfig = isDevMode() ? getDevAsteroidConfig() : CONFIG.asteroids;
  ent.field = new AsteroidField(astConfig);
  ent.capsules = [];
  ent.totalAsteroids = ent.field.remaining;
}

function resetSystems(sys) {
  Object.assign(G.ui, { combo: 0, comboDisplay: 0, comboFadeTimer: 0, slowMoTimer: 0 });
  sys.powerUp.clear(G.gs);
  sys.intensity.enable();
}

export function startGame() {
  spawnEntities(G.entities);
  resetSystems(G.systems);
  G.session.start();
}
