// --- Setup jeu headless (sans rendu) ---
// Partagé entre train-cli.js (Node) et potentiellement d'autres outils.

import { CONFIG } from '../../config.js';
import { Ship } from '../../domain/ship/ship.js';
import { Drone } from '../../domain/drone/drone.js';
import { AsteroidField } from '../../domain/asteroid/index.js';
import { GameSession } from '../../use-cases/game-logic/game-session.js';
import { CollisionHandler } from '../../use-cases/collision/collision-handler.js';
import { DropSystem } from '../../use-cases/drop/drop-system.js';
import { PowerUpManager } from '../../use-cases/power-up/power-up-manager.js';
import { MineralDropSystem } from '../../mineral/use-cases/mineral-drop-system.js';
import { DroneManager } from '../../use-cases/drone/drone-manager.js';
import { getLevel } from '../../domain/progression/level-catalog.js';

const noop = () => {};
const noopEffects = {
  spawnExplosion: noop, triggerShake: noop, spawnComboSparkle: noop,
  spawnAlienExplosion: noop, spawnBossExplosion: noop, spawnDebris: () => null,
  spawnShipExplosion: noop, spawnBounceFlash: noop,
};

/**
 * Crée un environnement de jeu headless complet.
 * @returns {{ session, entities, ui, startGame, tick, gameState }}
 */
export function createHeadlessGame() {
  const session = new GameSession(CONFIG);
  const entities = {
    ship: null, drones: [], field: null,
    capsules: [], mineralCapsules: [], projectiles: [], totalAsteroids: 0,
  };
  const ui = {
    combo: 0, comboDisplay: 0, comboFadeTimer: 0,
    slowMoTimer: 0, deathAnimTimer: 0, winAnimTimer: 0,
    deathZoomCenter: null, deathDebris: null,
  };

  const droneManager = new DroneManager({ clearDroneEffects: noop });
  const powerUp = new PowerUpManager({ droneManager });
  powerUp.droneManager = droneManager;
  const drop = new DropSystem(CONFIG.drop);
  const mineralDrop = new MineralDropSystem(CONFIG.mineralDrop);
  const intensity = {
    update: noop, onBounce: noop, onAsteroidHit: noop, onAsteroidDestroyed: noop,
    onPowerUpActivated: noop, onPowerUpExpired: noop, onLifeChanged: noop,
    onGameOver: noop, onWin: noop, onBossDestroyed: noop, enable: noop,
  };
  const systems = { drop, powerUp, intensity, mineralDrop, droneManager };

  const getGameState = () => ({
    ship: entities.ship, drones: entities.drones, session, field: entities.field,
  });

  let collisionHandler;

  function startGame(levelId) {
    const level = getLevel(levelId);
    const astConfig = level?.asteroids
      ? { ...CONFIG.asteroids, ...level.asteroids, _autoSize: true }
      : { ...CONFIG.asteroids };

    entities.ship = new Ship(CONFIG.ship, CONFIG.canvas.width, CONFIG.canvas.height, false);
    entities.drones = [new Drone(CONFIG.drone, entities.ship, false, CONFIG.canvas.width, CONFIG.canvas.height)];
    entities.field = new AsteroidField(astConfig);
    entities.capsules = [];
    entities.mineralCapsules = [];
    entities.projectiles = [];
    entities.totalAsteroids = entities.field.remaining;

    Object.assign(ui, {
      combo: 0, comboDisplay: 0, comboFadeTimer: 0,
      slowMoTimer: 0, deathAnimTimer: 0, winAnimTimer: 0,
      deathZoomCenter: null, deathDebris: null,
    });
    powerUp.clear(getGameState());

    collisionHandler = new CollisionHandler({
      entities, session, systems, ui,
      config: {
        screenshake: CONFIG.screenshake, capsule: CONFIG.capsule,
        mineralCapsule: CONFIG.mineralCapsule, combo: CONFIG.combo,
      },
      effects: noopEffects,
      getGameState, droneManager, wallet: null,
    });

    session.start(levelId);
  }

  function tick(pointerX) {
    const { ship, drones, field } = entities;
    if (ui.slowMoTimer > 0) ui.slowMoTimer -= 1;
    field.update(1);
    ship.update(pointerX, 1);
    for (const d of drones) d.update(ship, CONFIG.canvas.width, 1);
    for (const c of entities.capsules) c.update(CONFIG.canvas.height, 1);
    entities.capsules = entities.capsules.filter(c => c.alive);
    for (const mc of entities.mineralCapsules) mc.update(CONFIG.canvas.height, 1);
    entities.mineralCapsules = entities.mineralCapsules.filter(mc => mc.alive);
    collisionHandler.update();
  }

  const gameState = { entities, session, canvas: CONFIG.canvas };

  return { session, entities, ui, startGame, tick, gameState };
}
