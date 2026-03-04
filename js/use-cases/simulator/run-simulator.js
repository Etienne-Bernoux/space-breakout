// --- Run Simulator ---
// Applique un résultat simulé de niveau (victoire/défaite, étoiles, minerais).
// Logique pure, zéro side-effect DOM.

/**
 * @param {string} levelId
 * @param {object} result - { result: 'victory'|'defeat', stars: 1-3, minerals: {copper:N,...}, livesLost }
 * @param {object} deps - { progress, wallet, saveProgress }
 */
export function applySimulation(levelId, result, { progress, wallet, saveProgress }) {
  if (result.result === 'victory' && result.stars > 0) {
    progress.complete(levelId, result.stars);
    saveProgress(progress);
  }

  // Minerais toujours récoltés, même en défaite
  for (const [mineralId, qty] of Object.entries(result.minerals)) {
    if (qty > 0) wallet.add(mineralId, qty);
  }
  wallet.save();
}
