// --- Mineral Drop System ---
// Décide quel minerai tombe quand un astéroïde est détruit.
// Même pattern que DropSystem : probabilité cumulative.

import { MINERAL_IDS } from '../domain/index.js';
import { getDropWeights } from '../domain/index.js';

const DEFAULT_SIZE_MULT = { large: 1.6, medium: 1.0, small: 0.5 };

export class MineralDropSystem {
  /**
   * @param {object} config
   * @param {number} config.baseRate  - proba globale de drop minerai (ex: 0.08)
   * @param {object} config.sizeMult  - { large, medium, small }
   */
  constructor(config = {}) {
    this.baseRate = config.baseRate ?? 0.08;
    this.sizeMult = config.sizeMult || DEFAULT_SIZE_MULT;
  }

  /**
   * @param {{ materialKey: string, sizeName: string }} asteroid
   * @returns {{ mineralKey: string, quantity: number } | null}
   */
  decideDrop(asteroid) {
    const mat = asteroid.materialKey || 'rock';
    const sizeMult = this.sizeMult[asteroid.sizeName] || 1;
    const weights = getDropWeights(mat);

    // Somme des poids pour normaliser
    let totalWeight = 0;
    for (const id of MINERAL_IDS) {
      totalWeight += weights[id] || 0;
    }
    if (totalWeight === 0) return null;

    const rand = Math.random();
    let cumul = 0;

    for (const id of MINERAL_IDS) {
      const w = weights[id] || 0;
      if (w === 0) continue;
      // Proba = (poids normalisé) × baseRate × sizeMult
      const prob = (w / totalWeight) * this.baseRate * sizeMult;
      cumul += prob;
      if (rand < cumul) {
        return { mineralKey: id, quantity: 1 };
      }
    }
    return null;
  }
}
