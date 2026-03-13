// --- AI Player ---
// Observe l'état du jeu, alimente le réseau de neurones, applique les décisions.
// Inputs (18) : ship, drone (+ position relative drone/ship), 5 astéroïdes proches.
// Outputs (2) : position cible du vaisseau (tanh → -1..1), lancer le drone (>0 = oui).

const INPUT_COUNT = 18;
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
        // Clôturer le rally : score log décroissant (10 + 5 + 3.3 + 2.5 + ...)
        this.#closeRally();
      }
    }
    this.prevDroneDy = drone.launched ? drone.dy : 0;

    // Tracking continu : bonus quand le ship est aligné sous le drone (drone descend)
    if (drone.launched && drone.dy > 0) {
      const dist = Math.abs(drone.x - shipCx) / W; // 0 = parfait, 1 = opposé
      this.trackingScore += 1 - dist; // 1 si parfait, 0 si à l'opposé
      this.trackingFrames++;
    }

    // Détecter les pertes de vie (drone tombé)
    if (this.prevLives < 0) this.prevLives = session.lives;
    if (session.lives < this.prevLives) {
      this.dropCount += this.prevLives - session.lives;
      this.prevLives = session.lives;
      this.rallyDestroys = 0; // rally perdu, pas de score
    }

    // --- Construire les inputs ---
    const inputs = new Float32Array(INPUT_COUNT);
    let idx = 0;

    // Ship (2)
    inputs[idx++] = shipCx / W * 2 - 1;  // position X [-1, 1]
    inputs[idx++] = ship.width / W;        // taille relative

    // Drone (4)
    inputs[idx++] = drone.x / W * 2 - 1;
    inputs[idx++] = drone.y / H * 2 - 1;
    inputs[idx++] = drone.launched ? drone.dx / (drone.speed || 3) : 0;
    inputs[idx++] = drone.launched ? drone.dy / (drone.speed || 3) : 0;

    // Position relative drone → vaisseau (2) — signal clé pour apprendre à suivre
    inputs[idx++] = (drone.x - shipCx) / W * 2;  // écart X : >0 = drone à droite du ship
    inputs[idx++] = (drone.y - ship.y) / H * 2;   // écart Y : <0 = drone au-dessus du ship

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

    // Output 0 : position cible du vaisseau (tanh → -1..1 → 0..W)
    const targetX = (outputs[0] + 1) / 2 * W;
    // Output 1 : lancer le drone (> 0 = oui)
    const shouldLaunch = outputs[1] > 0;

    return { pointerX: targetX, shouldLaunch };
  }

  /** Clôture le rally en cours : score = somme de 10/n pour chaque destruction n. */
  #closeRally() {
    for (let n = 1; n <= this.rallyDestroys; n++) {
      this.rallyScore += 10 / n; // 10 + 5 + 3.3 + 2.5 + 2 + ...
    }
    this.rallyDestroys = 0;
  }

  /** Calcule la fitness finale (clôture le rally en cours — appel unique en fin de partie). */
  computeFitness() {
    this.#closeRally();
    return this.#calcFitness();
  }

  /** Fitness courante sans effets de bord (safe pour appel chaque frame). */
  currentFitness() {
    // Simuler le rally en cours sans le clôturer
    let pendingRally = 0;
    for (let n = 1; n <= this.rallyDestroys; n++) pendingRally += 10 / n;
    return this.#calcFitness(pendingRally);
  }

  #calcFitness(extraRally = 0) {
    const won = this.gs.session.state === 'won';

    let fitness = 0;
    // Tracking : alignement moyen sous le drone (0–30 pts, guide l'apprentissage)
    if (this.trackingFrames > 0) {
      fitness += (this.trackingScore / this.trackingFrames) * 30;
    }
    // Rattrapage du drone (signal principal)
    fitness += this.catchCount * 50;
    // Rallies : destructions entre rattrapages (log décroissant)
    fitness += this.rallyScore + extraRally;
    // Victoire + bonus temps (finir vite = mieux)
    if (won) {
      const timeBonus = Math.max(0, 1 - this.framesSurvived / 10800);
      fitness += 500 + timeBonus * 300;
    }
    // Pénalité forte quand le drone tombe (vie perdue)
    fitness -= this.dropCount * 100;
    return fitness;
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
