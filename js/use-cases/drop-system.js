// --- Drop System ---
// Décide quel power-up tombe quand un astéroïde est détruit.
// Proba cumulative : dropWeight par matériau × multiplicateur taille.

import { POWER_UPS, POWER_UP_IDS } from '../domain/power-ups.js';

const DEFAULT_SIZE_MULT = { large: 1.4, medium: 1.0, small: 0.6 };

export class DropSystem {
  constructor(config = {}) {
    this.baseRate = config.baseRate ?? 0.012;
    this.sizeMult = config.sizeMult || DEFAULT_SIZE_MULT;
    // Future : config.locked = Set de powerUpId verrouillés
  }

  /**
   * @param {{ materialKey: string, sizeName: string }} asteroid
   * @returns {string|null} powerUpId ou null
   */
  decideDrop(asteroid) {
    const mat = asteroid.materialKey || 'rock';
    const sizeMult = this.sizeMult[asteroid.sizeName] || 1;
    const rand = Math.random();

    let cumul = 0;
    for (const id of POWER_UP_IDS) {
      const pu = POWER_UPS[id];
      const weight = (pu.dropWeight[mat] || 0) * this.baseRate * sizeMult;
      cumul += weight;
      if (rand < cumul) return id;
    }
    return null;
  }
}
