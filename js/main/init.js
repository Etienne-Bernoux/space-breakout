import { CONFIG } from '../config.js';
import { Ship } from '../domain/ship/ship.js';
import { Drone } from '../domain/drone/drone.js';
import { AsteroidField } from '../domain/asteroid/index.js';
import { PlayerProgress } from '../domain/progression/player-progress.js';
import { getLevel, getNextLevel, getAllLevels, getZoneForLevel } from '../domain/progression/level-catalog.js';
import { computeStars } from '../domain/progression/star-rating.js';
import { loadProgress, saveProgress } from '../infra/persistence/progress-storage.js';
import { GameSession } from '../use-cases/game-logic/game-session.js';
import { DropSystem } from '../use-cases/drop/drop-system.js';
import { PowerUpManager } from '../use-cases/power-up/power-up-manager.js';
import { MineralDropSystem } from '../mineral/use-cases/mineral-drop-system.js';
import { MineralWallet } from '../mineral/use-cases/mineral-wallet.js';
import { UpgradeManager } from '../use-cases/upgrade/upgrade-manager.js';
import { GameIntensityDirector } from '../audio/use-cases/intensity/game-intensity-director.js';
import { MusicDirector } from '../audio/infra/orchestrators/music-director.js';
import { EffectDirector } from '../audio/infra/orchestrators/effect-director.js';
import { setupResize } from '../infra/input/resize.js';
import { playAlienShoot } from '../audio/infra/sfx/audio.js';
import { getDevAsteroidConfig } from '../infra/lab/dev-panel/index.js';
import { isLabMode } from '../infra/lab/hub/index.js';
import { initDevOverlay, updateDevOverlay } from '../infra/dev-overlay/index.js';
import { CollisionHandler } from '../use-cases/collision/collision-handler.js';
import { AlienCombatManager } from '../use-cases/alien-combat/alien-combat-manager.js';
import { AlienProjectile } from '../domain/projectile/index.js';
import { DroneManager } from '../use-cases/drone/drone-manager.js';
import { HudRenderer } from '../infra/renderers/hud-render.js';
import { GameLoop } from './loop.js';
import { InputHandler } from '../infra/input/input-handler/index.js';
import { loopInfra, inputInfra, collisionEffects, resetMineralSessionGains } from './adapters.js';
import { initMineralHUD } from '../mineral/infra/mineral-render.js';

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
    mineralCapsules: [],
    projectiles: [],
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
    mineralDrop: new MineralDropSystem(CONFIG.mineralDrop),
  },
  wallet: MineralWallet.load(),
  upgrades: UpgradeManager.load(),
  ui: { combo: 0, comboDisplay: 0, comboFadeTimer: 0, slowMoTimer: 0, deathAnimTimer: 0, winAnimTimer: 0, deathZoomCenter: null, deathDebris: null, mapTransition: null },
  progress: new PlayerProgress(loadProgress()),
  mapState: { selectedIndex: 0 },
  systemMapState: { selectedZone: 0 },
  levelResult: null,   // { levelId, stars, timeSpent, livesLost } — set après victoire
};

// --- Wiring mineral HUD ---
initMineralHUD(G.wallet);

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
import { isMobile } from '../shared/platform.js';
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
    resumeBtn: { x: cx - halfW, y: cy + 10 * s, w: halfW * 2, h: btnH },
    mapBtn:    { x: cx - halfW, y: cy + 10 * s + btnH + gap, w: halfW * 2, h: btnH },
    menuBtn:   { x: cx - halfW, y: cy + 10 * s + (btnH + gap) * 2, w: halfW * 2, h: btnH },
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
  config: { screenshake: CONFIG.screenshake, capsule: CONFIG.capsule, mineralCapsule: CONFIG.mineralCapsule, combo: CONFIG.combo },
  wallet: G.wallet,
  effects: collisionEffects,
  getGameState: () => G.gs,
  droneManager: G.systems.droneManager,
});

G.hud = new HudRenderer({
  render: G.render,
  session: G.session,
  ui: G.ui,
  canvas: CONFIG.canvas,
  config: CONFIG,
  gameScale,
  pauseBtnLayout,
  pauseScreenLayout,
  getLevel,
  isDevMode: isLabMode,
});

// startGame déclaré avant GameLoop/InputHandler car injecté en dépendance
function spawnEntities(ent, levelAsteroids) {
  const mobile = isMobile();
  ent.ship = new Ship(CONFIG.ship, CONFIG.canvas.width, CONFIG.canvas.height, mobile);
  ent.drones = [new Drone(CONFIG.drone, ent.ship, mobile, CONFIG.canvas.width, CONFIG.canvas.height)];
  let astConfig = levelAsteroids
    ? { ...CONFIG.asteroids, ...levelAsteroids, _autoSize: true }
    : isLabMode()
      ? getDevAsteroidConfig()
      : { ...CONFIG.asteroids };
  // Portrait : agrandir la zone du champ pour des cellules plus carrées
  if (CONFIG.canvas.height > CONFIG.canvas.baseHeight) {
    const portraitRatio = Math.min(CONFIG.canvas.height / CONFIG.canvas.baseHeight, 1.5);
    astConfig = {
      ...astConfig,
      areaH: Math.round((astConfig.areaH || CONFIG.asteroids.areaH) * portraitRatio),
    };
  }
  ent.field = new AsteroidField(astConfig);
  ent.capsules = [];
  ent.mineralCapsules = [];
  ent.projectiles = [];
  ent.totalAsteroids = ent.field.remaining;
}

function resetSystems(sys) {
  Object.assign(G.ui, { combo: 0, comboDisplay: 0, comboFadeTimer: 0, slowMoTimer: 0, deathAnimTimer: 0, winAnimTimer: 0, deathZoomCenter: null, deathDebris: null });
  sys.powerUp.clear(G.gs);
  const hasBoss = G.entities.field.grid.some(a => a.material?.isBoss);
  sys.intensity.enable({ boss: hasBoss });
}

/** Lance un niveau. Si levelId est fourni, charge sa config depuis le catalogue.
 *  @param {string} [levelId]
 *  @param {{ skipUpgrades?: boolean }} [opts]
 */
export function startGame(levelId, opts) {
  const level = levelId ? getLevel(levelId) : null;
  spawnEntities(G.entities, level?.asteroids);
  resetSystems(G.systems);
  resetMineralSessionGains();
  if (!opts?.skipUpgrades) applyUpgradeEffects();
  G.session.start(levelId);
}

/** Applique les effets d'upgrade actifs aux entités / systèmes. */
function applyUpgradeEffects() {
  const effects = G.upgrades.getActiveEffects();
  const ship = G.entities.ship;
  const drone = G.entities.drones[0];

  // Ship upgrades
  if (effects.ship) {
    if (effects.ship.speed) ship.speed *= effects.ship.speed;
    if (effects.ship.width) {
      const cx = ship.x + ship.width / 2;
      ship.width = Math.round(ship.width * effects.ship.width);
      ship.x = Math.min(cx - ship.width / 2, ship.canvasWidth - ship.width);
    }
  }
  // Drone upgrades
  if (effects.drone && drone) {
    if (effects.drone.speed) {
      drone._baseSpeed *= effects.drone.speed;
      drone.speed = drone._baseSpeed;
      drone.dy = -drone.speed;
      drone.speedBoost = effects.drone.speed;
    }
    if (effects.drone.damage) drone.damage = effects.drone.damage;
  }
  // Power-up upgrades
  if (effects.powerUp) {
    if (effects.powerUp.durationMult) G.systems.powerUp.durationMult = effects.powerUp.durationMult;
    if (effects.powerUp.dropRateMult) {
      G.systems.drop.baseRate *= effects.powerUp.dropRateMult;
    }
  }
  // Session upgrades (bonus lives)
  if (effects.session) {
    if (effects.session.bonusLives) G.session.lives += effects.session.bonusLives;
  }
}

/** Transition vers la carte du système planétaire (avec zoom-out si depuis worldMap). */
export function goToSystemMap() {
  if (G.session.state === 'worldMap') {
    G.ui.mapTransition = { type: 'zoomOut', frame: 0, duration: 40, zoneIdx: G.systemMapState.selectedZone };
  }
  G.session.goToSystemMap();
}

/** Transition vers la carte du monde (avec zoom-in si depuis systemMap). */
export function goToWorldMap() {
  if (G.session.state === 'systemMap') {
    G.ui.mapTransition = { type: 'zoomIn', frame: 0, duration: 40, zoneIdx: G.systemMapState.selectedZone };
  }
  G.session.goToWorldMap();
  G.systems.intensity.onEnterWorldMap();
}

/** Transition vers l'écran d'upgrade. */
export function goToUpgrade() {
  G.session.goToUpgrade();
  G.systems.intensity.onEnterUpgrade();
}

/** Appelé après victoire : calcule les étoiles, sauvegarde, passe à l'écran stats. */
export function finishLevel() {
  const levelId = G.session.currentLevelId;
  const level = getLevel(levelId);
  const timeSpent = G.session.elapsedTime;
  const livesLost = G.session.maxLives - G.session.lives;
  const stars = computeStars(livesLost, timeSpent, level?.timeTarget || 120);

  G.progress.complete(levelId, stars);

  // Dernier niveau de la zone → débloquer la zone suivante (si pas déjà fait)
  let zoneUnlocked = null;
  if (!getNextLevel(levelId)) {
    const zoneId = getZoneForLevel(levelId);
    if (zoneId) {
      const before = G.progress.unlockedZoneUpTo;
      G.progress.completeZone(zoneId);  // no-op si déjà débloquée
      if (G.progress.unlockedZoneUpTo !== before) {
        zoneUnlocked = G.progress.unlockedZoneUpTo;
      }
    }
  }
  saveProgress(G.progress);

  G.levelResult = { levelId, stars, timeSpent, livesLost, levelName: level?.name || '', zoneUnlocked };
  G.session.goToStats();
}

/** Helpers exposés pour les écrans. */
export { getLevel, getNextLevel, getAllLevels };

G.alienCombat = new AlienCombatManager({
  createProjectile: (px, py, target, opts) => new AlienProjectile(px, py, target, opts),
  onShoot: playAlienShoot,
});

G.gameLoop = new GameLoop({
  render: G.render,
  entities: G.entities,
  session: G.session,
  systems: G.systems,
  ui: G.ui,
  canvas: CONFIG.canvas,
  hud: G.hud,
  collisionHandler: G.collisionHandler,
  infra: { ...loopInfra, finishLevel, updateDevOverlay },
  progress: G.progress,
  mapState: G.mapState,
  systemMapState: G.systemMapState,
  getLevelResult: () => G.levelResult,
  alienCombat: G.alienCombat,
  wallet: G.wallet,
  upgrades: G.upgrades,
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
  nav: { goToWorldMap, goToUpgrade, goToSystemMap, finishLevel },
  progression: { progress: G.progress, mapState: G.mapState, systemMapState: G.systemMapState, wallet: G.wallet, upgrades: G.upgrades },
  infra: inputInfra,
  getLevelResult: () => G.levelResult,
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
