import { describe, it, expect, vi } from 'vitest';
import { simulateAgent } from './simulation.js';
import { Genome } from '../domain/genome.js';

const TOPOLOGY = [24, 16, 2];

describe('simulateAgent', () => {
  /** Crée un environnement minimal de simulation. */
  function makeEnv() {
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
    const gameState = { entities, session, canvas };

    let tickCount = 0;
    const startGame = vi.fn(() => {
      tickCount = 0;
      session.state = 'playing';
    });
    const tick = vi.fn(() => {
      tickCount++;
      // Simule une victoire après 100 ticks
      if (tickCount >= 100) {
        session.state = 'won';
        field.remaining = 0;
      }
    });

    return { gameState, startGame, tick };
  }

  it('retourne un objet résultat avec toutes les propriétés', () => {
    const { gameState, startGame, tick } = makeEnv();
    const genome = new Genome(TOPOLOGY);
    const result = simulateAgent(genome, gameState, startGame, tick, 'z1-1');

    expect(result).toHaveProperty('fitness');
    expect(result).toHaveProperty('catches');
    expect(result).toHaveProperty('destroys');
    expect(result).toHaveProperty('drops');
    expect(result).toHaveProperty('rallyScore');
    expect(result).toHaveProperty('capsules');
    expect(result).toHaveProperty('stars');
    expect(result).toHaveProperty('won');
    expect(typeof result.fitness).toBe('number');
  });

  it('appelle startGame avec le levelId', () => {
    const { gameState, startGame, tick } = makeEnv();
    const genome = new Genome(TOPOLOGY);
    simulateAgent(genome, gameState, startGame, tick, 'z1-3');
    expect(startGame).toHaveBeenCalledWith('z1-3');
  });

  it('lance le drone dans les 60 premières frames', () => {
    const { gameState, startGame, tick } = makeEnv();
    const genome = new Genome(TOPOLOGY);
    simulateAgent(genome, gameState, startGame, tick, 'z1-1');
    expect(gameState.entities.drones[0].launch).toHaveBeenCalled();
  });

  it('détecte une victoire', () => {
    const { gameState, startGame, tick } = makeEnv();
    const genome = new Genome(TOPOLOGY);
    const result = simulateAgent(genome, gameState, startGame, tick, 'z1-1');
    expect(result.won).toBe(true);
  });

  it('s\'arrête quand la session est terminée (won ou gameOver)', () => {
    const { gameState, startGame, tick } = makeEnv();
    const genome = new Genome(TOPOLOGY);
    simulateAgent(genome, gameState, startGame, tick, 'z1-1');
    // tick simule won après 100 frames, donc bien moins que MAX_FRAMES (10800)
    expect(tick).toHaveBeenCalledTimes(100);
  });

  it('calcule les étoiles : 3★ pour victoire rapide sans perte', () => {
    const { gameState, startGame, tick } = makeEnv();
    const genome = new Genome(TOPOLOGY);
    const result = simulateAgent(genome, gameState, startGame, tick, 'z1-1');
    // 100 frames ≈ 1.7s < 60s, 0 drops → 3 stars
    expect(result.stars).toBe(3);
  });
});
