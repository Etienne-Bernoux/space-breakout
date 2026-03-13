// --- AI Player ---
// Observe l'état du jeu, alimente le réseau de neurones, applique les décisions.
// Inputs (20) : ship, drone (+ position relative), capsule la plus proche, 5 astéroïdes proches.
// Outputs (2) : position cible du vaisseau (tanh → -1..1), lancer le drone (>0 = oui).

const INPUT_COUNT = 20;
const OUTPUT_COUNT = 2;
export const TOPOLOGY = [INPUT_COUNT, 16, OUTPUT_COUNT];

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
    this.trackingScore = 0;  // bonus continu d'alignement X quand le drone descend
    this.trackingFrames = 0; // frames où le tracking est mesuré
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

    // Tracking continu : bonus quand le ship est aligné sous le drone (drone descend)
    if (drone.launched && drone.dy > 0) {
      const dist = Math.abs(drone.x - shipCx) / W;
      this.trackingScore += 1 - dist;
      this.trackingFrames++;
    }

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
    // Pondération : 1× au début du niveau, 2× quand il ne reste presque rien
    const weight = 1 + progress;
    for (let n = 1; n <= this.rallyDestroys; n++) {
      this.rallyScore += (10 / n) * weight;
    }
    this.rallyDestroys = 0;
  }

  computeFitness() {
    const progress = this.#progress();
    this.#closeRally(progress);
    return this.#calcFitness();
  }

  currentFitness() {
    const weight = 1 + this.#progress();
    let pendingRally = 0;
    for (let n = 1; n <= this.rallyDestroys; n++) pendingRally += (10 / n) * weight;
    return this.#calcFitness(pendingRally);
  }

  #progress() {
    const field = this.gs.entities.field;
    const total = this.gs.entities.totalAsteroids || field?.remaining || 1;
    return field ? 1 - field.remaining / total : 0;
  }

  #calcFitness(extraRally = 0) {
    const won = this.gs.session.state === 'won';

    let fitness = 0;
    // Tracking : alignement moyen sous le drone (0–30 pts)
    if (this.trackingFrames > 0) {
      fitness += (this.trackingScore / this.trackingFrames) * 30;
    }
    // Rattrapage du drone (signal principal)
    fitness += this.catchCount * 50;
    // Rallies : destructions entre rattrapages (log décroissant)
    fitness += this.rallyScore + extraRally;
    // Capsules récupérées (power-ups + minerais)
    fitness += this.capsulesCaught * 20;
    // Victoire + bonus temps
    if (won) {
      const timeBonus = Math.max(0, 1 - this.framesSurvived / 10800);
      fitness += 500 + timeBonus * 300;
    }
    // Pénalité pertes de vie
    fitness -= this.dropCount * 100;
    // Pénalité oscillation (changements de direction excessifs)
    if (this.framesSurvived > 0) {
      const oscillationRate = this.directionChanges / this.framesSurvived;
      // Taux normal ~0.1–0.3, au-delà c'est de la vibration
      if (oscillationRate > 0.3) {
        fitness -= (oscillationRate - 0.3) * 100;
      }
    }
    return fitness;
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
