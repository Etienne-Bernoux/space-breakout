// --- AI Player ---
// Observe l'état du jeu, alimente le réseau de neurones, applique les décisions.
// Inputs (24) : ship, drone (+ position relative), capsule proche,
//   centroïde astéroïdes / ship, densité gauche/droite, 5 astéroïdes proches / drone.
// Outputs (2) : position cible du vaisseau (tanh → -1..1), lancer le drone (>0 = oui).

import { computeRallyScore, calcFitness } from '../domain/ai-fitness.js';

const INPUT_COUNT = 24;
const OUTPUT_COUNT = 2;
export const TOPOLOGY = [INPUT_COUNT, 16, 12, OUTPUT_COUNT];

export class AIPlayer {
  constructor(genome, gameState) {
    this.genome = genome;
    this.gs = gameState; // { entities, session, canvas }
    this.asteroidsDestroyed = 0;
    this.framesSurvived = 0;
    this.prevRemaining = -1;
    this.catchCount = 0;     // rebonds drone sur vaisseau
    this.prevDroneDy = 0;    // pour détecter le rebond (dy+ → dy-)
    this.prevLives = -1;     // pour détecter les pertes de vie
    this.dropCount = 0;      // nombre de fois où le drone tombe (vie perdue)
    this.rallyDestroys = 0;  // destructions dans le rally courant (entre 2 rattrapages)
    this.rallyScore = 0;     // score cumulé des rallies (log décroissant)
    this.capsulesCaught = 0; // capsules (power-up + minerai) récupérées
    this.prevPointerX = null; // pour détecter les changements de direction
    this.directionChanges = 0; // nombre de changements de direction
  }

  /** Appelé chaque frame pendant 'playing'. Retourne { pointerX, shouldLaunch }. */
  decide() {
    const { entities, session, canvas } = this.gs;
    const { ship, drones, field } = entities;
    const drone = drones[0];
    if (!ship || !drone || !field) return { pointerX: null, shouldLaunch: false };

    const W = canvas.width;
    const H = canvas.height;
    const shipCx = ship.x + ship.width / 2;

    // Tracker les destructions
    const totalAst = entities.totalAsteroids || field.remaining || 1;
    if (this.prevRemaining < 0) this.prevRemaining = field.remaining;
    const destroyed = this.prevRemaining - field.remaining;
    if (destroyed > 0) {
      this.asteroidsDestroyed += destroyed;
      this.rallyDestroys += destroyed;
    }
    this.prevRemaining = field.remaining;
    this.framesSurvived++;

    // Détecter les rattrapages (dy+ → dy- ET drone proche du vaisseau)
    if (drone.launched && this.prevDroneDy > 0 && drone.dy <= 0) {
      const shipTop = ship.y;
      const nearShip = drone.y >= shipTop - 20;
      if (nearShip) {
        this.catchCount++;
        const progress = 1 - field.remaining / totalAst; // 0 → 1
        this.#closeRally(progress);
      }
    }
    this.prevDroneDy = drone.launched ? drone.dy : 0;

    // Détecter les pertes de vie (drone tombé)
    if (this.prevLives < 0) this.prevLives = session.lives;
    if (session.lives < this.prevLives) {
      this.dropCount += this.prevLives - session.lives;
      this.prevLives = session.lives;
      this.rallyDestroys = 0;
    }

    // Détecter les capsules récupérées (flag `collected` posé par collision)
    const allCaps = [...(entities.capsules || []), ...(entities.mineralCapsules || [])];
    for (const c of allCaps) {
      if (c.collected && !c._aiCounted) {
        this.capsulesCaught++;
        c._aiCounted = true;
      }
    }

    // --- Construire les inputs ---
    const inputs = new Float32Array(INPUT_COUNT);
    let idx = 0;

    // Ship (2)
    inputs[idx++] = shipCx / W * 2 - 1;
    inputs[idx++] = ship.width / W;

    // Drone (4)
    inputs[idx++] = drone.x / W * 2 - 1;
    inputs[idx++] = drone.y / H * 2 - 1;
    inputs[idx++] = drone.launched ? drone.dx / (drone.speed || 3) : 0;
    inputs[idx++] = drone.launched ? drone.dy / (drone.speed || 3) : 0;

    // Position relative drone → vaisseau (2)
    inputs[idx++] = (drone.x - shipCx) / W * 2;
    inputs[idx++] = (drone.y - ship.y) / H * 2;

    // Capsule la plus proche du ship (2) — power-up ou minerai
    const nearestCap = this.#nearestCapsule(entities, shipCx, ship.y, W, H);
    inputs[idx++] = nearestCap.dx;
    inputs[idx++] = nearestCap.dy;

    // Centroïde des astéroïdes restants relatif au vaisseau (2) — signal "où viser"
    const centroid = this.#asteroidCentroid(field, shipCx, ship.y, W, H);
    inputs[idx++] = centroid.dx;
    inputs[idx++] = centroid.dy;

    // Densité d'astéroïdes gauche/droite du drone (2) — guide la direction
    const density = this.#asteroidDensityLR(field, drone);
    inputs[idx++] = density.left;
    inputs[idx++] = density.right;

    // 5 astéroïdes les plus proches du drone (2 chacun = 10)
    const nearest = this.#nearestAsteroids(drone, field, 5, W, H);
    for (let i = 0; i < 5; i++) {
      if (i < nearest.length) {
        inputs[idx++] = nearest[i].dx;
        inputs[idx++] = nearest[i].dy;
      } else {
        inputs[idx++] = 0;
        inputs[idx++] = 0;
      }
    }

    // --- Forward pass ---
    const outputs = this.genome.brain.forward(inputs);

    const targetX = (outputs[0] + 1) / 2 * W;
    const shouldLaunch = outputs[1] > 0;

    // Tracker les changements de direction (anti-oscillation)
    if (this.prevPointerX !== null) {
      const prevDir = Math.sign(this.prevPointerX - shipCx);
      const currDir = Math.sign(targetX - shipCx);
      if (prevDir !== 0 && currDir !== 0 && prevDir !== currDir) {
        this.directionChanges++;
      }
    }
    this.prevPointerX = targetX;

    return { pointerX: targetX, shouldLaunch };
  }

  #closeRally(progress = 0) {
    this.rallyScore += computeRallyScore(this.rallyDestroys, progress);
    this.rallyDestroys = 0;
  }

  computeFitness() {
    const progress = this.#progress();
    this.#closeRally(progress);
    return this.#buildFitness();
  }

  currentFitness() {
    const extra = computeRallyScore(this.rallyDestroys, this.#progress());
    return this.#buildFitness(extra);
  }

  #progress() {
    const field = this.gs.entities.field;
    const total = this.gs.entities.totalAsteroids || field?.remaining || 1;
    return field ? 1 - field.remaining / total : 0;
  }

  #buildFitness(extraRally = 0) {
    return calcFitness({
      sessionState: this.gs.session.state,
      dropCount: this.dropCount,
      capsulesCaught: this.capsulesCaught,
      framesSurvived: this.framesSurvived,
      progress: this.#progress(),
      catchCount: this.catchCount,
      rallyScore: this.rallyScore,
      asteroidsDestroyed: this.asteroidsDestroyed,
      directionChanges: this.directionChanges,
      extraRally,
    });
  }

  /** Trouve la capsule (power-up ou minerai) la plus proche du ship. */
  #nearestCapsule(entities, shipCx, shipY, W, H) {
    let bestDx = 0, bestDy = 0, bestDist = Infinity;
    const allCapsules = [
      ...(entities.capsules || []),
      ...(entities.mineralCapsules || []),
    ];
    for (const c of allCapsules) {
      if (!c.alive) continue;
      const cx = c.x + (c.width || 0) / 2;
      const cy = c.y + (c.height || 0) / 2;
      const dx = (cx - shipCx) / W;
      const dy = (cy - shipY) / H;
      const dist = dx * dx + dy * dy;
      if (dist < bestDist) {
        bestDist = dist;
        bestDx = dx * 2;
        bestDy = dy * 2;
      }
    }
    return { dx: bestDx, dy: bestDy };
  }

  /** Centroïde des astéroïdes restants, relatif au vaisseau (normalisé -1..1). */
  #asteroidCentroid(field, shipCx, shipY, W, H) {
    let sumX = 0, sumY = 0, count = 0;
    for (const a of field.grid) {
      if (!a.alive) continue;
      sumX += a.x + a.width / 2;
      sumY += a.y + a.height / 2;
      count++;
    }
    if (count === 0) return { dx: 0, dy: 0 };
    return {
      dx: ((sumX / count) - shipCx) / W * 2,
      dy: ((sumY / count) - shipY) / H * 2,
    };
  }

  /** Densité d'astéroïdes à gauche/droite du drone (normalisé 0..1). */
  #asteroidDensityLR(field, drone) {
    let left = 0, right = 0, total = 0;
    for (const a of field.grid) {
      if (!a.alive) continue;
      total++;
      const cx = a.x + a.width / 2;
      if (cx < drone.x) left++; else right++;
    }
    if (total === 0) return { left: 0, right: 0 };
    return { left: left / total, right: right / total };
  }

  /** Trouve les N astéroïdes vivants les plus proches du drone. */
  #nearestAsteroids(drone, field, n, W, H) {
    const results = [];
    for (const a of field.grid) {
      if (!a.alive) continue;
      const cx = a.x + a.width / 2;
      const cy = a.y + a.height / 2;
      const dx = (cx - drone.x) / W;
      const dy = (cy - drone.y) / H;
      const dist = dx * dx + dy * dy;
      results.push({ dx: dx * 2, dy: dy * 2, dist });
    }
    results.sort((a, b) => a.dist - b.dist);
    return results.slice(0, n);
  }
}
