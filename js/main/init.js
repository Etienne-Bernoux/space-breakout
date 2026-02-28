import { CONFIG } from '../config.js';
import { Ship } from '../domain/ship/ship.js';
import { Drone } from '../domain/drone/drone.js';
import { AsteroidField } from '../domain/asteroid/index.js';
import { PlayerProgress } from '../domain/progression/player-progress.js';
import { getLevel, getNextLevel, getAllLevels } from '../domain/progression/level-catalog.js';
import { computeStars } from '../domain/progression/star-rating.js';
import { loadProgress, saveProgress } from '../infra/persistence/progress-storage.js';
import { GameSession } from '../use-cases/game-logic/game-session.js';
import { DropSystem } from '../use-cases/drop/drop-system.js';
import { PowerUpManager } from '../use-cases/power-up/power-up-manager.js';
import { GameIntensityDirector } from '../use-cases/intensity/game-intensity-director.js';
import { MusicDirector } from '../infra/orchestrators/music-director.js';
import { EffectDirector } from '../infra/orchestrators/effect-director.js';
import { setupResize } from '../infra/resize.js';
import { spawnExplosion, spawnShipExplosion, spawnTrail, updateParticles } from '../infra/particles.js';
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
import { spawnDebris, updateDebris } from '../infra/renderers/debris-render.js';
import { drawWorldMap, getNodePositions } from '../infra/screens/world-map.js';
import { drawStatsScreen, getStatsButtons } from '../infra/screens/stats-screen.js';
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
    intensity: new GameIntensityDirector({
      music: new MusicDirector(),
      effects: new EffectDirector(),
    }),
    droneManager: null, // wired below
  },
  ui: { combo: 0, comboDisplay: 0, comboFadeTimer: 0, slowMoTimer: 0, deathAnimTimer: 0, winAnimTimer: 0, deathZoomCenter: null, deathDebris: null },
  progress: new PlayerProgress(loadProgress()),
  mapState: { selectedIndex: 0 },
  levelResult: null,   // { levelId, stars, timeSpent, livesLost } — set après victoire
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
  effects: { spawnExplosion, spawnShipExplosion, triggerShake, spawnDebris },
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
function spawnEntities(ent, levelAsteroids) {
  const isMobile = 'ontouchstart' in window;
  ent.ship = new Ship(CONFIG.ship, CONFIG.canvas.width, CONFIG.canvas.height, isMobile);
  ent.drones = [new Drone(CONFIG.drone, ent.ship, isMobile, CONFIG.canvas.width, CONFIG.canvas.height)];
  const astConfig = isDevMode()
    ? getDevAsteroidConfig()
    : levelAsteroids
      ? { ...CONFIG.asteroids, ...levelAsteroids, _autoSize: true }
      : CONFIG.asteroids;
  ent.field = new AsteroidField(astConfig);
  ent.capsules = [];
  ent.totalAsteroids = ent.field.remaining;
}

function resetSystems(sys) {
  Object.assign(G.ui, { combo: 0, comboDisplay: 0, comboFadeTimer: 0, slowMoTimer: 0, deathAnimTimer: 0, winAnimTimer: 0, deathZoomCenter: null, deathDebris: null });
  sys.powerUp.clear(G.gs);
  sys.intensity.enable();
}

/** Lance un niveau. Si levelId est fourni, charge sa config depuis le catalogue. */
export function startGame(levelId) {
  const level = levelId ? getLevel(levelId) : null;
  spawnEntities(G.entities, level?.asteroids);
  resetSystems(G.systems);
  G.session.start(levelId);
}

/** Transition vers la carte du monde. */
export function goToWorldMap() {
  G.session.goToWorldMap();
}

/** Appelé après victoire : calcule les étoiles, sauvegarde, passe à l'écran stats. */
export function finishLevel() {
  const levelId = G.session.currentLevelId;
  const level = getLevel(levelId);
  const timeSpent = G.session.elapsedTime;
  const livesLost = G.session.maxLives - G.session.lives;
  const stars = computeStars(livesLost, timeSpent, level?.timeTarget || 120);

  G.progress.complete(levelId, stars);
  saveProgress(G.progress);

  G.levelResult = { levelId, stars, timeSpent, livesLost, levelName: level?.name || '' };
  G.session.goToStats();
}

/** Helpers exposés pour les écrans. */
export { getLevel, getNextLevel, getAllLevels };

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
  updateDebris,
  drawWorldMap, drawStatsScreen, getAllLevels,
  finishLevel,
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
  progress: G.progress,
  mapState: G.mapState,
  getLevelResult: () => G.levelResult,
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
  goToWorldMap,
  finishLevel,
  progress: G.progress,
  mapState: G.mapState,
  infra: { ...inputInfra, getNodePositions, getStatsButtons, getAllLevels },
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
