import { CONFIG } from '../config.js';
import { Ship } from '../domain/ship.js';
import { Drone } from '../domain/drone.js';
import { AsteroidField } from '../domain/asteroid/index.js';
import { GameSession } from '../use-cases/game-logic/game-session.js';
import { DropSystem } from '../use-cases/drop/drop-system.js';
import { PowerUpManager } from '../use-cases/power-up/power-up-manager.js';
import { GameIntensityDirector } from '../use-cases/intensity/game-intensity-director.js';
import { setupResize } from '../infra/resize.js';
import { spawnExplosion } from '../infra/particles.js';
import { triggerShake } from '../infra/screenshake.js';
import { isDevMode, getDevAsteroidConfig } from '../infra/dev-panel/index.js';
import { CollisionHandler } from '../use-cases/collision/collision-handler.js';
import { HudRenderer } from './hud.js';
import { GameLoop } from './loop.js';
import { InputHandler } from './input.js';

// --- Canvas setup ---
const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');

// --- Shared game state ---
export const G = {
  render: { canvas, ctx },
  session: new GameSession(CONFIG),
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
  systems: {
    drop: new DropSystem(CONFIG.drop),
    powerUp: new PowerUpManager(),
    intensity: new GameIntensityDirector(),
  },
  ui: { combo: 0, comboDisplay: 0, comboFadeTimer: 0, slowMoTimer: 0 },
};

// --- Utilitaires responsive ---
export function gameScale() {
  return Math.min(1.0, Math.max(0.6, CONFIG.canvas.width / 500));
}

export function pauseBtnLayout() {
  const s = gameScale();
  const size = Math.round(40 * s);
  return { x: CONFIG.canvas.width - size - 10, y: 8, size };
}

// --- Slow-motion ---
const SLOW_MO_FACTOR = 0.3;
export function getSlowMoFactor() {
  return G.ui.slowMoTimer > 0 ? SLOW_MO_FACTOR : 1;
}

// --- Audio ---
export function perceptualVolume(v) {
  return v * v;
}

// --- Wiring des classes ---
G.collisionHandler = new CollisionHandler({
  entities: G.entities,
  session: G.session,
  systems: G.systems,
  ui: G.ui,
  config: { screenshake: CONFIG.screenshake, capsule: CONFIG.capsule },
  effects: { spawnExplosion, triggerShake },
});

G.hud = new HudRenderer({
  render: G.render,
  session: G.session,
  ui: G.ui,
  canvas: CONFIG.canvas,
  gameScale,
  pauseBtnLayout,
});

// startGame déclaré avant GameLoop/InputHandler car injecté en dépendance
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

G.gameLoop = new GameLoop({
  render: G.render,
  entities: G.entities,
  session: G.session,
  systems: G.systems,
  ui: G.ui,
  canvas: CONFIG.canvas,
  hud: G.hud,
  collisionHandler: G.collisionHandler,
});

G.inputHandler = new InputHandler({
  entities: G.entities,
  session: G.session,
  systems: G.systems,
  canvas: CONFIG.canvas,
  gameScale,
  pauseBtnLayout,
  startGame,
});

// --- Resize handler ---
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
