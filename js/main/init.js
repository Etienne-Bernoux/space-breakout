import { CONFIG } from '../config.js';
import { Ship } from '../domain/ship.js';
import { Drone } from '../domain/drone.js';
import { AsteroidField } from '../domain/asteroid/index.js';
import { GameSession } from '../use-cases/game-logic.js';
import { DropSystem } from '../use-cases/drop-system.js';
import { PowerUpManager } from '../use-cases/power-up-manager.js';
import { GameIntensityDirector } from '../use-cases/game-intensity-director.js';
import { Capsule } from '../domain/capsule.js';
import { setupResize } from '../infra/resize.js';
import { isDevMode, getDevAsteroidConfig } from '../infra/dev-panel/index.js';

// --- Canvas setup ---
const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');

// --- Shared game state ---
export const G = {
  // --- Rendering ---
  render: { canvas, ctx },
  get canvas() { return this.render.canvas; },
  get ctx() { return this.render.ctx; },

  // --- Game entities ---
  session: new GameSession(CONFIG),
  ship: null,
  drones: [],
  get drone() { return this.drones[0] || null; },
  get gs() { return { ship: this.ship, drones: this.drones, session: this.session, field: this.field }; },
  field: null,
  capsules: [],
  totalAsteroids: 0,

  // --- Systems ---
  dropSystem: new DropSystem(CONFIG.drop),
  puManager: new PowerUpManager(),
  intensityDirector: new GameIntensityDirector(),

  // --- UI state ---
  ui: { combo: 0, comboDisplay: 0, comboFadeTimer: 0, slowMoTimer: 0 },
  get combo() { return this.ui.combo; },
  set combo(v) { this.ui.combo = v; },
  get comboDisplay() { return this.ui.comboDisplay; },
  set comboDisplay(v) { this.ui.comboDisplay = v; },
  get comboFadeTimer() { return this.ui.comboFadeTimer; },
  set comboFadeTimer(v) { this.ui.comboFadeTimer = v; },
  get slowMoTimer() { return this.ui.slowMoTimer; },
  set slowMoTimer(v) { this.ui.slowMoTimer = v; },
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
  // Repositionner le vaisseau en bas quand la hauteur change
  G.session.canvasHeight = CONFIG.canvas.height;
  if (G.ship) {
    if (G.ship.isMobile) {
      G.ship.bottomMargin = Math.max(60, Math.round(CONFIG.canvas.height * G.ship._mobileRatio));
    }
    G.ship.y = CONFIG.canvas.height - G.ship.height - G.ship.bottomMargin;
    G.ship.canvasWidth = CONFIG.canvas.width;
    for (const d of G.drones) { if (!d.launched) d.reset(G.ship); }
  }
});

// --- Chargement des réglages audio ---
// Courbe perceptuelle : x² pour que 50% du slider ≈ moitié du volume perçu
export function perceptualVolume(v) {
  return v * v;
}

export function startGame() {
  const isMobile = 'ontouchstart' in window;
  G.ship = new Ship(CONFIG.ship, CONFIG.canvas.width, CONFIG.canvas.height, isMobile);
  G.drones = [new Drone(CONFIG.drone, G.ship, isMobile, CONFIG.canvas.width)];
  // En mode dev, utiliser la config enrichie (matériaux + densité)
  const astConfig = isDevMode() ? getDevAsteroidConfig() : CONFIG.asteroids;
  G.field = new AsteroidField(astConfig);
  G.capsules = [];
  Object.assign(G.ui, { combo: 0, comboDisplay: 0, comboFadeTimer: 0, slowMoTimer: 0 });
  G.puManager.clear(G.gs);
  G.totalAsteroids = G.field.remaining;
  G.intensityDirector.enable();
  G.session.start();
}
