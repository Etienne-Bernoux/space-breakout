// --- Calcul de fitness pour l'IA ---
// Logique séparée : rallies (log décroissant) + fitness composite (résultats + bootstrap + anti-oscillation).

/**
 * Ferme un rally et accumule le score.
 * @param {number} rallyDestroys - destructions dans le rally courant
 * @param {number} progress - progression du niveau (0 → 1)
 * @returns {number} score du rally fermé
 */
export function computeRallyScore(rallyDestroys, progress) {
  const weight = 1 + progress;
  let score = 0;
  for (let n = 1; n <= rallyDestroys; n++) {
    score += (10 / n) * weight;
  }
  return score;
}

/**
 * Calcule la fitness composite d'un agent.
 * @param {object} metrics
 * @param {string} metrics.sessionState - état de la session ('won', 'gameOver', etc.)
 * @param {number} metrics.dropCount - nombre de pertes de vie
 * @param {number} metrics.capsulesCaught - capsules récupérées
 * @param {number} metrics.framesSurvived - frames jouées
 * @param {number} metrics.progress - progression (0 → 1)
 * @param {number} metrics.catchCount - rattrapages drone
 * @param {number} metrics.rallyScore - score cumulé des rallies
 * @param {number} metrics.asteroidsDestroyed - destructions totales
 * @param {number} metrics.directionChanges - changements de direction
 * @param {number} [metrics.extraRally=0] - score rally en cours non fermé
 */
export function calcFitness(metrics) {
  const {
    sessionState, dropCount, capsulesCaught, framesSurvived,
    progress, catchCount, rallyScore, asteroidsDestroyed,
    directionChanges, framesBeforeLaunch = 0, extraRally = 0,
  } = metrics;

  const won = sessionState === 'won';
  let fitness = 0;

  // ── Objectifs principaux (résultats) ──

  // 1. Gagner (objectif majeur)
  if (won) fitness += 1000;

  // 2. Ne pas perdre de vie
  fitness -= dropCount * 200;

  // 3. Capsules récupérées (minerais + power-ups)
  fitness += capsulesCaught * 30;

  // 4. Étoiles (temps + vies) — bonus progressif
  if (won) {
    const timeSec = framesSurvived / 60;
    const stars = dropCount > 0 ? 1
      : timeSec <= 60 ? 3
      : 2;
    fitness += stars * 200; // 1★=200, 2★=400, 3★=600
  }

  // ── Signal de bootstrap (secondaire, guide vers la victoire) ──

  // Progression : quadratique (0–400 pts) — derniers astéroïdes valent beaucoup plus
  fitness += progress * progress * 400;

  // Rattrapages : bootstrapping (signal secondaire)
  fitness += catchCount * 15;

  // Rallies : récompense les destructions entre rattrapages
  fitness += rallyScore + extraRally;

  // Pénalité rallies vides : catches sans destruction = perte de temps
  const emptyCatches = catchCount - asteroidsDestroyed;
  if (emptyCatches > 5) fitness -= (emptyCatches - 5) * 5;

  // Anti-lenteur lancement : pénalise chaque frame passée sans lancer le drone
  if (framesBeforeLaunch > 5) fitness -= (framesBeforeLaunch - 5) * 2;

  // Anti-oscillation : pénalise les vibrations excessives
  if (framesSurvived > 0) {
    const oscillationRate = directionChanges / framesSurvived;
    if (oscillationRate > 0.5) {
      fitness -= (oscillationRate - 0.5) * 200;
    }
  }

  return fitness;
}
