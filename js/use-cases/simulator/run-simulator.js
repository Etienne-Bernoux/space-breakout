// --- Run Simulator ---
// Applique un résultat simulé de niveau (victoire/défaite, étoiles, minerais).
// Logique pure, zéro side-effect DOM.

import { getNextLevel, getZoneForLevel } from '../../domain/progression/level-catalog.js';

/**
 * @param {string} levelId
 * @param {object} result - { result: 'victory'|'defeat', stars: 1-3, minerals: {copper:N,...}, livesLost }
 * @param {object} deps - { progress, wallet, saveProgress }
 * @returns {{ zoneUnlocked: string|null }} info sur la zone débloquée
 */
export function applySimulation(levelId, result, { progress, wallet, saveProgress }) {
  let zoneUnlocked = null;

  if (result.result === 'victory' && result.stars > 0) {
    progress.complete(levelId, result.stars);

    // Dernier niveau de la zone → débloquer la zone suivante (si pas déjà fait)
    if (!getNextLevel(levelId)) {
      const zoneId = getZoneForLevel(levelId);
      if (zoneId) {
        const before = progress.unlockedZoneUpTo;
        progress.completeZone(zoneId);
        if (progress.unlockedZoneUpTo !== before) {
          zoneUnlocked = progress.unlockedZoneUpTo;
        }
      }
    }

    saveProgress(progress);
  }

  // Minerais toujours récoltés, même en défaite
  for (const [mineralId, qty] of Object.entries(result.minerals)) {
    if (qty > 0) wallet.add(mineralId, qty);
  }
  wallet.save();

  return { zoneUnlocked };
}
