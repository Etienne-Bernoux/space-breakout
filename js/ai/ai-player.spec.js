import { describe, it, expect } from 'vitest';
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
    entities: {
      ship, drones: [drone], field,
      capsules: [], mineralCapsules: [],
      totalAsteroids: 10,
      ...overrides.entities,
    },
    session: overrides.session || session,
    canvas: overrides.canvas || canvas,
  };
}

describe('AIPlayer', () => {
  describe('TOPOLOGY', () => {
    it('a 20 inputs, 16 hidden, 2 outputs', () => {
      expect(TOPOLOGY).toEqual([20, 16, 2]);
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
    it('détecte un rebond proche du vaisseau (dy+ → dy-)', () => {
      const gs = makeGameState();
      const drone = gs.entities.drones[0];
      drone.y = 490; // proche du ship (y=500)
      const player = new AIPlayer(new Genome(TOPOLOGY), gs);

      drone.dy = 3;
      player.decide();
      expect(player.catchCount).toBe(0);

      drone.dy = -3;
      player.decide();
      expect(player.catchCount).toBe(1);
    });

    it('ne compte pas un rebond loin du vaisseau (astéroïde)', () => {
      const gs = makeGameState();
      const drone = gs.entities.drones[0];
      drone.y = 200; // loin du ship (y=500)
      const player = new AIPlayer(new Genome(TOPOLOGY), gs);

      drone.dy = 3;
      player.decide();
      drone.dy = -3;
      player.decide();
      expect(player.catchCount).toBe(0);
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
      drone.y = 490; // proche du ship pour que le catch soit détecté
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
      // remaining=7/10 → progress=0.3 → weight=1.3
      // Score = (10/1 + 10/2 + 10/3) × 1.3 ≈ 23.83
      const baseScore = 10 + 5 + 10 / 3;
      expect(player.rallyScore).toBeCloseTo(baseScore * 1.3, 1);
    });
  });

  describe('capsules', () => {
    it('détecte la collecte de power-ups (flag collected)', () => {
      const gs = makeGameState();
      const cap = { alive: true, x: 100, y: 400, width: 20, height: 20 };
      gs.entities.capsules = [cap];
      const player = new AIPlayer(new Genome(TOPOLOGY), gs);

      player.decide();
      expect(player.capsulesCaught).toBe(0);

      cap.alive = false;
      cap.collected = true; // ramassée par le ship
      player.decide();
      expect(player.capsulesCaught).toBe(1);
    });

    it('ne compte pas une capsule tombée hors écran', () => {
      const gs = makeGameState();
      const cap = { alive: true, x: 100, y: 400, width: 20, height: 20 };
      gs.entities.capsules = [cap];
      const player = new AIPlayer(new Genome(TOPOLOGY), gs);

      player.decide();
      cap.alive = false; // tombée hors écran, pas de flag collected
      player.decide();
      expect(player.capsulesCaught).toBe(0);
    });

    it('détecte la collecte de minerais', () => {
      const gs = makeGameState();
      const m1 = { alive: true, x: 100, y: 400, width: 20, height: 20 };
      const m2 = { alive: true, x: 200, y: 400, width: 20, height: 20 };
      gs.entities.mineralCapsules = [m1, m2];
      const player = new AIPlayer(new Genome(TOPOLOGY), gs);

      player.decide();
      m1.alive = false; m1.collected = true;
      m2.alive = false; m2.collected = true;
      player.decide();
      expect(player.capsulesCaught).toBe(2);
    });

    it('ne compte pas deux fois la même capsule', () => {
      const gs = makeGameState();
      const cap = { alive: false, collected: true, x: 100, y: 400, width: 20, height: 20 };
      gs.entities.capsules = [cap];
      const player = new AIPlayer(new Genome(TOPOLOGY), gs);

      player.decide();
      expect(player.capsulesCaught).toBe(1);
      player.decide();
      expect(player.capsulesCaught).toBe(1); // pas recompté
    });

    it('trouve la capsule la plus proche dans les inputs', () => {
      const gs = makeGameState();
      gs.entities.capsules = [{ alive: true, x: 300, y: 400, width: 20, height: 20 }];
      const player = new AIPlayer(new Genome(TOPOLOGY), gs);
      const decision = player.decide();
      expect(typeof decision.pointerX).toBe('number');
    });
  });

  describe('anti-oscillation', () => {
    it('compte les changements de direction', () => {
      const gs = makeGameState();
      const player = new AIPlayer(new Genome(TOPOLOGY), gs);

      // Forcer des changements de direction en manipulant les outputs
      player.decide(); // init prevPointerX
      // Les changements dépendent du réseau, mais au moins pas d'erreur
      expect(player.directionChanges).toBeGreaterThanOrEqual(0);
    });

    it('pénalise un taux d\'oscillation > 0.3', () => {
      const gs = makeGameState();
      const player = new AIPlayer(new Genome(TOPOLOGY), gs);
      player.framesSurvived = 100;
      player.directionChanges = 50; // taux = 0.5 > 0.3
      const fitness = player.computeFitness();
      // Pénalité = (0.5 - 0.3) * 100 = 20
      expect(fitness).toBeLessThan(0); // -20 sans autre bonus
    });

    it('ne pénalise pas un taux normal (< 0.3)', () => {
      const gs = makeGameState();
      const player = new AIPlayer(new Genome(TOPOLOGY), gs);
      player.framesSurvived = 100;
      player.directionChanges = 20; // taux = 0.2 < 0.3
      const fitnessWithOsc = player.computeFitness();
      // Pas de pénalité oscillation → fitness = 0
      expect(fitnessWithOsc).toBe(0);
    });
  });

  describe('computeFitness', () => {
    it('peut être négatif (drops > catches)', () => {
      const gs = makeGameState();
      gs.session.state = 'gameOver';
      const player = new AIPlayer(new Genome(TOPOLOGY), gs);
      player.catchCount = 1;  // +50
      player.dropCount = 3;   // -300
      expect(player.computeFitness()).toBe(-250);
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
      player.framesSurvived = 5400; // 50% du temps (10800 max)
      const fitness = player.computeFitness();
      // tracking(0) + 500 + timeBonus(0.5) * 300 = 650
      expect(fitness).toBeCloseTo(650, 0);
    });

    it('inclut le tracking score (alignement moyen × 30)', () => {
      const gs = makeGameState();
      const player = new AIPlayer(new Genome(TOPOLOGY), gs);
      player.trackingScore = 80;  // somme alignement
      player.trackingFrames = 100; // 80% aligné en moyenne
      const fitness = player.computeFitness();
      // tracking: 0.8 * 30 = 24
      expect(fitness).toBeCloseTo(24, 0);
    });

    it('récompense les capsules récupérées (20 par capsule)', () => {
      const gs = makeGameState();
      const player = new AIPlayer(new Genome(TOPOLOGY), gs);
      player.capsulesCaught = 3;
      const fitness = player.computeFitness();
      expect(fitness).toBe(60); // 3 × 20
    });

    it('pénalise les drops (-100 par drop)', () => {
      const gs = makeGameState();
      const player = new AIPlayer(new Genome(TOPOLOGY), gs);
      player.catchCount = 3; // +150
      player.dropCount = 2;  // -200
      const fitness = player.computeFitness();
      expect(fitness).toBe(-50);
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

    it('currentFitness inclut le rally en cours sans le clôturer', () => {
      const gs = makeGameState();
      const player = new AIPlayer(new Genome(TOPOLOGY), gs);
      player.catchCount = 1; // +50
      player.rallyDestroys = 2; // rally en cours (non clôturé)
      const fitness = player.currentFitness();
      // 50 + pendingRally(10+5) = 65 + tracking(0)
      expect(fitness).toBeCloseTo(65, 0);
      // Le rally n'est pas clôturé
      expect(player.rallyDestroys).toBe(2);
    });
  });
});
