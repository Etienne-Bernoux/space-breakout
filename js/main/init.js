import { CONFIG } from '../config.js';
import { Ship } from '../domain/ship/ship.js';
import { Drone } from '../domain/drone/drone.js';
import { AsteroidField } from '../domain/asteroid/index.js';
import { GameSession } from '../use-cases/game-logic/game-session.js';
import { DropSystem } from '../use-cases/drop/drop-system.js';
import { PowerUpManager } from '../use-cases/power-up/power-up-manager.js';
import { GameIntensityDirector } from '../use-cases/intensity/game-intensity-director.js';
import { setupResize } from '../infra/resize.js';
import { spawnExplosion, spawnTrail, updateParticles } from '../infra/particles.js';
import { triggerShake, updateShake, setAmbientShake } from '../infra/screenshake.js';
import { isDevMode, getDevAsteroidConfig, isDevPanelActive, drawDevPanel, handleDevHover, handleDevTap, handleDevDrag, handleDevRelease, hideDevPanel, showDevPanel } from '../infra/dev-panel/index.js';
import { initDevOverlay, updateDevOverlay } from '../infra/dev-overlay/index.js';
import { updateStars } from '../infra/stars.js';
import { setupTouch, getTouchX, setTapHandler, setMenuTapHandler, setDragHandler, setReleaseHandler, getMousePos } from '../infra/touch.js';
import { updateMenu, updateMenuHover, handleMenuInput, handleMenuTap, handleMenuDrag, handleMenuRelease, resetMenu } from '../infra/menu/index.js';
import { drawCapsule, drawPowerUpHUD } from '../infra/power-up-render.js';
import { isMusicLabActive, drawMusicLab, handleMusicLabHover, handleMusicLabTap, handleMusicLabScroll } from '../infra/music-lab/index.js';
import { drawShip } from '../infra/renderers/ship-render.js';
import { drawDrone } from '../infra/renderers/drone-render.js';
import { drawField } from '../infra/renderers/field-render.js';
import { CollisionHandler } from '../use-cases/collision/collision-handler.js';
import { DroneManager } from '../use-cases/drone/drone-manager.js';
import { HudRenderer } from '../infra/renderers/hud-render.js';
import { GameLoop } from './loop.js';
import { InputHandler } from '../infra/input-handler.js';

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
    powerUp: null, // wired below (circular dep with droneManager)
    intensity: new GameIntensityDirector(),
    droneManager: null, // wired below
  },
  ui: { combo: 0, comboDisplay: 0, comboFadeTimer: 0, slowMoTimer: 0 },
};

// --- Wiring PowerUpManager ↔ DroneManager ---
G.systems.powerUp = new PowerUpManager({
  droneManager: null, // set after droneManager created
});
G.systems.droneManager = new DroneManager({
  clearDroneEffects: () => G.systems.powerUp.clearDroneEffects(),
});
G.systems.powerUp.droneManager = G.systems.droneManager;

// --- Utilitaires responsive ---
import { gameScale } from '../shared/responsive.js';
export { gameScale };

export function pauseBtnLayout() {
  const s = gameScale();
  const size = Math.round(40 * s);
  return { x: CONFIG.canvas.width - size - 10, y: 8, size };
}

export function pauseScreenLayout() {
  const s = gameScale();
  const cx = CONFIG.canvas.width / 2;
  const cy = CONFIG.canvas.height / 2;
  const halfW = Math.round(CONFIG.canvas.width * 0.4);
  const btnH = Math.round(44 * s);
  const gap = Math.round(16 * s);
  return {
    cx, cy, halfW, btnH, gap, s,
    resumeBtn: { x: cx - halfW, y: cy, w: halfW * 2, h: btnH },
    menuBtn:   { x: cx - halfW, y: cy + btnH + gap, w: halfW * 2, h: btnH },
  };
}

// --- Wiring dev-overlay ---
initDevOverlay({
  entities: G.entities,
  session: G.session,
  systems: G.systems,
  getGs: () => G.gs,
});

// --- Wiring des classes ---
G.collisionHandler = new CollisionHandler({
  entities: G.entities,
  session: G.session,
  systems: G.systems,
  ui: G.ui,
  config: { screenshake: CONFIG.screenshake, capsule: CONFIG.capsule },
  effects: { spawnExplosion, triggerShake },
  getGameState: () => G.gs,
  droneManager: G.systems.droneManager,
});

G.hud = new HudRenderer({
  render: G.render,
  session: G.session,
  ui: G.ui,
  canvas: CONFIG.canvas,
  gameScale,
  pauseBtnLayout,
  pauseScreenLayout,
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

// --- Infra adapters (regroupement des dépendances infra pour injection) ---
const loopInfra = {
  updateStars, getMousePos, getTouchX,
  updateMenu, updateMenuHover,
  spawnTrail, updateParticles,
  updateShake, setAmbientShake,
  drawCapsule, drawPowerUpHUD,
  isDevPanelActive, drawDevPanel, handleDevHover,
  isMusicLabActive, drawMusicLab, handleMusicLabHover,
  updateDevOverlay,
  drawShip, drawDrone, drawField,
};

const inputInfra = {
  setupTouch, setTapHandler, setMenuTapHandler, setDragHandler, setReleaseHandler,
  handleMenuInput, handleMenuTap, handleMenuDrag, handleMenuRelease, resetMenu,
  isDevPanelActive, handleDevTap, handleDevDrag, handleDevRelease, hideDevPanel, isDevMode, showDevPanel,
  isMusicLabActive, handleMusicLabTap, handleMusicLabScroll,
};

G.gameLoop = new GameLoop({
  render: G.render,
  entities: G.entities,
  session: G.session,
  systems: G.systems,
  ui: G.ui,
  canvas: CONFIG.canvas,
  hud: G.hud,
  collisionHandler: G.collisionHandler,
  infra: loopInfra,
});

G.inputHandler = new InputHandler({
  entities: G.entities,
  session: G.session,
  systems: G.systems,
  canvas: CONFIG.canvas,
  gameScale,
  pauseBtnLayout,
  pauseScreenLayout,
  startGame,
  infra: inputInfra,
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
