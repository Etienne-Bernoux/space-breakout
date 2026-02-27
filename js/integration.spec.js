import { describe, it, expect, vi } from 'vitest';

// Stub AudioContext pour éviter les erreurs window dans Node
const mockAudioCtx = {
  createOscillator: () => ({ type: '', frequency: { setValueAtTime: vi.fn(), linearRampToValueAtTime: vi.fn() }, connect: vi.fn(), start: vi.fn(), stop: vi.fn() }),
  createGain: () => ({ gain: { value: 1, setValueAtTime: vi.fn(), exponentialRampToValueAtTime: vi.fn(), linearRampToValueAtTime: vi.fn(), cancelScheduledValues: vi.fn() }, connect: vi.fn() }),
  createBuffer: () => ({ getChannelData: () => new Float32Array(100) }),
  createBufferSource: () => ({ buffer: null, connect: vi.fn(), start: vi.fn() }),
  createBiquadFilter: () => ({ type: '', frequency: { setValueAtTime: vi.fn(), linearRampToValueAtTime: vi.fn() }, connect: vi.fn() }),
  destination: {},
  sampleRate: 44100,
  currentTime: 0,
  state: 'running',
  resume: vi.fn(),
};
globalThis.window = globalThis.window || {};
globalThis.window.AudioContext = function() { return mockAudioCtx; };

import { CONFIG } from './config.js';
import { Ship } from './domain/ship/ship.js';
import { Drone } from './domain/drone/drone.js';
import { AsteroidField } from './domain/asteroid/index.js';
import { GameSession } from './use-cases/game-logic/game-session.js';
import { DropSystem } from './use-cases/drop/drop-system.js';
import { PowerUpManager } from './use-cases/power-up/power-up-manager.js';
import { GameIntensityDirector } from './use-cases/intensity/game-intensity-director.js';
import { CollisionHandler } from './use-cases/collision/collision-handler.js';
import { DroneManager } from './use-cases/drone/drone-manager.js';

/**
 * Crée un jeu complet avec wiring réel (pas de mocks sauf effects).
 * Grille minimale : 1 seul astéroïde small pour des tests rapides.
 */
function createGame() {
  const session = new GameSession(CONFIG);
  const ship = new Ship(CONFIG.ship, CONFIG.canvas.width, CONFIG.canvas.height);
  const drone = new Drone(CONFIG.drone, ship);

  // Pattern ASCII pour garantir exactement 2 astéroïdes rock
  const field = new AsteroidField({
    rows: 2, cols: 2,
    cellW: 70, cellH: 28,
    padding: 6, offsetTop: 45, offsetLeft: 25,
    density: 1.0,
    _autoSize: false,
    pattern: { lines: ['??', '..'] },
  });

  const entities = {
    ship,
    drones: [drone],
    field,
    capsules: [],
    totalAsteroids: field.remaining,
  };

  const powerUp = new PowerUpManager();
  const droneManager = new DroneManager({
    clearDroneEffects: () => powerUp.clearDroneEffects(),
  });
  powerUp.droneManager = droneManager;
  const systems = {
    drop: new DropSystem(CONFIG.drop),
    powerUp,
    intensity: new GameIntensityDirector(),
    droneManager,
  };

  const ui = { combo: 0, comboDisplay: 0, comboFadeTimer: 0, slowMoTimer: 0 };

  const effects = {
    spawnExplosion: vi.fn(),
    triggerShake: vi.fn(),
  };

  const collisionHandler = new CollisionHandler({
    entities,
    session,
    systems,
    ui,
    config: { screenshake: CONFIG.screenshake, capsule: CONFIG.capsule },
    effects,
    getGameState: () => ({ ship: entities.ship, drones: entities.drones, session, field: entities.field }),
    droneManager,
  });

  return { session, entities, systems, ui, collisionHandler, effects };
}

describe('Intégration — flux de jeu complet', () => {
  it('menu → start → playing', () => {
    const { session } = createGame();
    expect(session.state).toBe('menu');
    session.start();
    expect(session.state).toBe('playing');
    expect(session.lives).toBe(CONFIG.lives);
    expect(session.score).toBe(0);
  });

  it('drone détruit un astéroïde et le score monte', () => {
    const { session, entities, collisionHandler, effects } = createGame();
    session.start();

    const asteroid = entities.field.grid.find(a => a.alive && a.destructible);
    if (!asteroid) return;

    // Placer le drone pile au centre de l'astéroïde
    const drone = entities.drones[0];
    drone.launched = true;
    drone.x = asteroid.x + asteroid.width / 2;
    drone.y = asteroid.y + asteroid.height / 2;
    drone.dy = -3;

    // Mettre HP à 1 pour garantir la destruction
    asteroid.hp = 1;

    collisionHandler.update();

    expect(session.score).toBeGreaterThan(0);
    expect(effects.spawnExplosion).toHaveBeenCalled();
    expect(effects.triggerShake).toHaveBeenCalled();
  });

  it('tous les astéroïdes détruits → victoire', () => {
    const { session, entities, collisionHandler, ui } = createGame();
    session.start();

    // Tuer manuellement tous les astéroïdes destructibles
    for (const a of entities.field.grid) {
      if (a.destructible) a.alive = false;
    }

    // Lancer le drone (sinon win check est fait mais field.remaining = 0)
    entities.drones[0].launched = true;

    // Pas en slow-mo
    ui.slowMoTimer = 0;

    collisionHandler.update();
    expect(session.state).toBe('won');
  });

  it('drone perdu sous le vaisseau → perte de vie', () => {
    const { session, entities, collisionHandler } = createGame();
    session.start();
    const initialLives = session.lives;

    const drone = entities.drones[0];
    drone.launched = true;
    // Placer le drone très bas, sous le vaisseau + marge
    drone.y = CONFIG.canvas.height + 100;

    collisionHandler.update();

    expect(session.lives).toBe(initialLives - 1);
  });

  it('perdre toutes les vies → gameOver', () => {
    const { session, entities, collisionHandler } = createGame();
    session.start();

    // S'assurer qu'il reste des astéroïdes vivants pour éviter la victoire
    for (const a of entities.field.grid) {
      if (a.destructible) a.hp = 999;
    }

    for (let i = 0; i < CONFIG.lives; i++) {
      const drone = entities.drones[0];
      if (!drone) break;
      drone.launched = true;
      // Placer le drone hors écran sans traverser les astéroïdes
      drone.x = 0;
      drone.y = CONFIG.canvas.height + 100;
      collisionHandler.update();
    }

    expect(session.state).toBe('gameOver');
  });

  it('combo augmente lors de destructions successives', () => {
    const { session, entities, collisionHandler, ui } = createGame();
    session.start();

    // Remplacer le field par un champ avec 3 astéroïdes
    const field = new AsteroidField({
      rows: 1, cols: 3,
      cellW: 70, cellH: 28,
      padding: 6, offsetTop: 45, offsetLeft: 25,
      density: 1.0,
      _autoSize: false,
    });
    entities.field = field;
    entities.totalAsteroids = field.remaining;

    const drone = entities.drones[0];
    drone.launched = true;

    // Détruire le premier astéroïde
    const a1 = field.grid.find(a => a.alive && a.destructible);
    if (!a1) return;
    a1.hp = 1;
    drone.x = a1.x + a1.width / 2;
    drone.y = a1.y + a1.height / 2;
    collisionHandler.update();
    expect(ui.combo).toBe(1);

    // Détruire le second immédiatement (sans reset combo)
    const a2 = field.grid.find(a => a.alive && a.destructible);
    if (!a2) return;
    a2.hp = 1;
    drone.x = a2.x + a2.width / 2;
    drone.y = a2.y + a2.height / 2;
    collisionHandler.update();
    expect(ui.combo).toBe(2);
    expect(ui.comboDisplay).toBe(2);
    expect(ui.comboFadeTimer).toBeGreaterThan(0);
  });

  it('les systèmes s\'assemblent sans erreur', () => {
    const { systems } = createGame();
    expect(() => systems.intensity.update()).not.toThrow();
    expect(systems.intensity.getEffects()).toBeDefined();
    expect(() => systems.drop.decideDrop({ materialKey: 'rock', sizeName: 'small' })).not.toThrow();
    expect(systems.powerUp.getActive()).toEqual([]);
  });

  it('GameSession → backToMenu remet l\'état', () => {
    const { session } = createGame();
    session.start();
    expect(session.state).toBe('playing');
    session.backToMenu();
    expect(session.state).toBe('menu');
  });

  it('pause et resume fonctionnent', () => {
    const { session } = createGame();
    session.start();
    session.pause();
    expect(session.state).toBe('paused');
    session.resume();
    expect(session.state).toBe('playing');
  });
});
