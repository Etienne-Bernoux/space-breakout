import { describe, it, expect, beforeEach } from 'vitest';
import { AIPlayer, TOPOLOGY } from './ai-player.js';
import { Genome } from './genome.js';

/** Crée un gameState minimal pour les tests. */
function makeGameState(overrides = {}) {
  const ship = { x: 100, y: 500, width: 80, speed: 6 };
  const drone = { x: 200, y: 300, dx: 2, dy: -3, speed: 3, launched: true, launch: () => {} };
  const field = {
    remaining: 10,
    grid: [
      { alive: true, x: 50, y: 50, width: 30, height: 30 },
      { alive: true, x: 150, y: 80, width: 30, height: 30 },
      { alive: false, x: 250, y: 100, width: 30, height: 30 }, // mort
    ],
  };
  const session = { state: 'playing', lives: 3 };
  const canvas = { width: 800, height: 600 };

  return {
    entities: { ship, drones: [drone], field, ...overrides.entities },
    session: overrides.session || session,
    canvas: overrides.canvas || canvas,
  };
}

describe('AIPlayer', () => {
  describe('TOPOLOGY', () => {
    it('a 18 inputs, 16 hidden, 2 outputs', () => {
      expect(TOPOLOGY).toEqual([18, 16, 2]);
    });
  });

  describe('decide', () => {
    it('retourne pointerX et shouldLaunch', () => {
      const gs = makeGameState();
      const player = new AIPlayer(new Genome(TOPOLOGY), gs);
      const decision = player.decide();
      expect(decision).toHaveProperty('pointerX');
      expect(decision).toHaveProperty('shouldLaunch');
      expect(typeof decision.pointerX).toBe('number');
      expect(typeof decision.shouldLaunch).toBe('boolean');
    });

    it('pointerX est dans [0, canvasWidth]', () => {
      const gs = makeGameState();
      const player = new AIPlayer(new Genome(TOPOLOGY), gs);
      for (let i = 0; i < 10; i++) {
        const { pointerX } = player.decide();
        expect(pointerX).toBeGreaterThanOrEqual(0);
        expect(pointerX).toBeLessThanOrEqual(800);
      }
    });

    it('retourne null si ship manquant', () => {
      const gs = makeGameState();
      gs.entities.ship = null;
      const player = new AIPlayer(new Genome(TOPOLOGY), gs);
      const decision = player.decide();
      expect(decision.pointerX).toBeNull();
    });

    it('incrémente framesSurvived à chaque appel', () => {
      const gs = makeGameState();
      const player = new AIPlayer(new Genome(TOPOLOGY), gs);
      player.decide();
      player.decide();
      player.decide();
      expect(player.framesSurvived).toBe(3);
    });

    it('détecte les destructions d\'astéroïdes', () => {
      const gs = makeGameState();
      const player = new AIPlayer(new Genome(TOPOLOGY), gs);
      player.decide(); // remaining=10
      gs.entities.field.remaining = 7; // 3 détruits
      player.decide();
      expect(player.asteroidsDestroyed).toBe(3);
    });
  });

  describe('détection de rattrapage (catch)', () => {
    it('détecte un rebond quand dy passe de positif à négatif', () => {
      const gs = makeGameState();
      const drone = gs.entities.drones[0];
      const player = new AIPlayer(new Genome(TOPOLOGY), gs);

      // Frame 1 : drone descend (dy > 0)
      drone.dy = 3;
      player.decide();
      expect(player.catchCount).toBe(0);

      // Frame 2 : drone remonte (dy <= 0) → rattrapage
      drone.dy = -3;
      player.decide();
      expect(player.catchCount).toBe(1);
    });

    it('ne compte pas si drone pas lancé', () => {
      const gs = makeGameState();
      const drone = gs.entities.drones[0];
      drone.launched = false;
      const player = new AIPlayer(new Genome(TOPOLOGY), gs);

      drone.dy = 3;
      player.decide();
      drone.dy = -3;
      player.decide();
      // launched=false → prevDroneDy reste à 0
      expect(player.catchCount).toBe(0);
    });
  });

  describe('détection de perte (drop)', () => {
    it('détecte une perte de vie', () => {
      const gs = makeGameState();
      const player = new AIPlayer(new Genome(TOPOLOGY), gs);

      player.decide(); // init prevLives=3
      gs.session.lives = 2; // perte d'une vie
      player.decide();
      expect(player.dropCount).toBe(1);
    });

    it('détecte plusieurs pertes de vie d\'un coup', () => {
      const gs = makeGameState();
      const player = new AIPlayer(new Genome(TOPOLOGY), gs);

      player.decide();
      gs.session.lives = 1; // 2 vies perdues
      player.decide();
      expect(player.dropCount).toBe(2);
    });

    it('reset le rally en cours sur drop', () => {
      const gs = makeGameState();
      const player = new AIPlayer(new Genome(TOPOLOGY), gs);

      player.decide();
      gs.entities.field.remaining = 8; // 2 destructions dans le rally
      player.decide();
      expect(player.rallyDestroys).toBe(2);

      gs.session.lives = 2; // drop → rally perdu
      player.decide();
      expect(player.rallyDestroys).toBe(0);
    });
  });

  describe('rally scoring', () => {
    it('clôture un rally au rattrapage avec score logarithmique', () => {
      const gs = makeGameState();
      const drone = gs.entities.drones[0];
      const player = new AIPlayer(new Genome(TOPOLOGY), gs);

      // Simuler 3 destructions
      player.decide(); // init
      gs.entities.field.remaining = 7; // 3 détruits
      drone.dy = 3; // descend
      player.decide();
      expect(player.rallyDestroys).toBe(3);

      // Rattrapage → clôture le rally
      drone.dy = -3; // rebond
      player.decide();
      expect(player.catchCount).toBe(1);
      expect(player.rallyDestroys).toBe(0); // reset
      // Score = 10/1 + 10/2 + 10/3 ≈ 18.33
      expect(player.rallyScore).toBeCloseTo(10 + 5 + 10 / 3, 1);
    });
  });

  describe('computeFitness', () => {
    it('retourne 0 minimum (jamais négatif)', () => {
      const gs = makeGameState();
      gs.session.state = 'gameOver';
      const player = new AIPlayer(new Genome(TOPOLOGY), gs);
      player.dropCount = 100; // grosse pénalité
      expect(player.computeFitness()).toBe(0);
    });

    it('récompense les rattrapages (50 par catch)', () => {
      const gs = makeGameState();
      const player = new AIPlayer(new Genome(TOPOLOGY), gs);
      player.catchCount = 5;
      const fitness = player.computeFitness();
      expect(fitness).toBeGreaterThanOrEqual(250); // 5×50
    });

    it('ajoute un bonus de victoire', () => {
      const gs = makeGameState();
      gs.session.state = 'won';
      const player = new AIPlayer(new Genome(TOPOLOGY), gs);
      player.catchCount = 0;
      player.framesSurvived = 1800; // 50% du temps
      const fitness = player.computeFitness();
      // 500 + timeBonus(0.5) * 300 = 650
      expect(fitness).toBeCloseTo(650, 0);
    });

    it('pénalise les drops (-100 par drop)', () => {
      const gs = makeGameState();
      const player = new AIPlayer(new Genome(TOPOLOGY), gs);
      player.catchCount = 3; // +150
      player.dropCount = 2;  // -200
      const fitness = player.computeFitness();
      expect(fitness).toBe(0); // max(0, 150-200)
    });

    it('clôture le rally en cours avant le calcul', () => {
      const gs = makeGameState();
      gs.session.state = 'won';
      const player = new AIPlayer(new Genome(TOPOLOGY), gs);
      player.rallyDestroys = 2; // rally non clôturé
      player.framesSurvived = 0;
      const fitness = player.computeFitness();
      // rallyScore = 10 + 5 = 15, + victoire(500+300) = 815
      expect(fitness).toBeCloseTo(815, 0);
    });
  });
});
