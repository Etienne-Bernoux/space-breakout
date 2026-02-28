import { getLevelIndex, getNextLevel } from './level-catalog.js';

export class PlayerProgress {
  /**
   * @param {object} [data] - données sérialisées (depuis localStorage)
   * @param {Array}  [data.stars] - entrées [levelId, starCount]
   * @param {string} [data.unlockedUpTo] - id du dernier niveau débloqué
   */
  constructor(data) {
    this.stars = new Map(data?.stars || []);
    this.unlockedUpTo = data?.unlockedUpTo || 'z1-1';
  }

  isUnlocked(levelId) {
    return getLevelIndex(levelId) <= getLevelIndex(this.unlockedUpTo);
  }

  getStars(levelId) {
    return this.stars.get(levelId) || 0;
  }

  /** Enregistre la complétion, garde le meilleur score, débloque le suivant. */
  complete(levelId, newStars) {
    const prev = this.getStars(levelId);
    if (newStars > prev) this.stars.set(levelId, newStars);

    const next = getNextLevel(levelId);
    if (next && !this.isUnlocked(next.id)) {
      this.unlockedUpTo = next.id;
    }
  }

  toJSON() {
    return {
      stars: Array.from(this.stars.entries()),
      unlockedUpTo: this.unlockedUpTo,
    };
  }
}
