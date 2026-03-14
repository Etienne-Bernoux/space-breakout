import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AITrainer } from './ai-trainer.js';
import { nullStorageAdapter } from '../infra/population-storage.js';

// Monkey-patch Population pour utiliser nullStorage dans les tests
vi.mock('../infra/population-storage.js', () => ({
  localStorageAdapter: {
    save: vi.fn(),
    load: vi.fn(() => null),
  },
  nullStorageAdapter: {
    save: vi.fn(),
    load: vi.fn(() => null),
  },
}));

describe('AITrainer', () => {
  let trainer;
  let startGame;
  let tick;
  let scheduleCallbacks;

  function makeTrainer(overrides = {}) {
    const ship = { x: 100, y: 500, width: 80, speed: 6 };
    const drone = {
      x: 200, y: 300, dx: 2, dy: -3, speed: 3,
      launched: false, launch: vi.fn(),
    };
    const field = {
      remaining: 2,
      grid: [
        { alive: true, x: 50, y: 50, width: 30, height: 30 },
        { alive: true, x: 150, y: 80, width: 30, height: 30 },
      ],
    };
    const session = { state: 'playing', lives: 3 };
    const entities = {
      ship, drones: [drone], field,
      capsules: [], mineralCapsules: [],
      totalAsteroids: 2,
    };
    const canvas = { width: 800, height: 600 };

    scheduleCallbacks = [];
    startGame = vi.fn(() => { session.state = 'playing'; });

    let tickCount = 0;
    tick = vi.fn(() => {
      tickCount++;
      if (tickCount >= 50) {
        session.state = 'won';
        field.remaining = 0;
      }
    });

    return new AITrainer({
      startGame, tick, entities, session, canvas,
      levelId: 'z1-1',
      schedule: (cb) => { scheduleCallbacks.push(cb); return scheduleCallbacks.length; },
      unschedule: vi.fn(),
      delay: vi.fn(),
      ...overrides,
    });
  }

  beforeEach(() => {
    trainer = makeTrainer();
  });

  it('démarre inactif', () => {
    expect(trainer.active).toBe(false);
    expect(trainer.watchBest).toBe(false);
  });

  it('passe actif après start()', () => {
    trainer.start();
    expect(trainer.active).toBe(true);
  });

  it('repasse inactif après stop()', () => {
    trainer.start();
    trainer.stop();
    expect(trainer.active).toBe(false);
    expect(trainer.currentPlayer).toBeNull();
  });

  it('planifie le batch suivant via schedule injecté', () => {
    trainer.start();
    expect(scheduleCallbacks.length).toBeGreaterThan(0);
  });

  it('incrémente stats.agent pendant le batch', () => {
    trainer.start();
    // Le premier batch simule AGENTS_PER_CHUNK agents
    expect(trainer.stats.agent).toBeGreaterThan(0);
  });

  it('appelle onGenerationEnd après une génération complète', () => {
    const onEnd = vi.fn();
    trainer.onGenerationEnd = onEnd;
    trainer.start();

    // Exécuter les callbacks schedule jusqu'à ce qu'une gen soit finie
    let safety = 0;
    while (scheduleCallbacks.length > 0 && safety < 100) {
      const cb = scheduleCallbacks.shift();
      cb();
      safety++;
    }

    expect(onEnd).toHaveBeenCalled();
  });

  it('accumule l\'historique des générations', () => {
    trainer.start();
    let safety = 0;
    while (scheduleCallbacks.length > 0 && safety < 100) {
      const cb = scheduleCallbacks.shift();
      cb();
      safety++;
    }
    expect(trainer.genHistory.length).toBeGreaterThan(0);
  });

  describe('mode watch', () => {
    it('update() retourne null si pas en mode watch', () => {
      trainer.start();
      expect(trainer.update()).toBeNull();
    });
  });
});
