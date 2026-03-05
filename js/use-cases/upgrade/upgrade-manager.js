// --- Upgrade Manager ---
// Gère les niveaux achetés, l'achat, et les effets actifs.
// Persistence localStorage.

import { UPGRADES, UPGRADE_IDS } from './upgrade-catalog.js';

const STORAGE_KEY = 'space-breakout-upgrades';

export class UpgradeManager {
  constructor(data = null) {
    /** @type {Map<string, number>} upgradeId → level (0 = pas acheté) */
    this._levels = new Map();
    for (const id of UPGRADE_IDS) this._levels.set(id, 0);
    if (data) this.fromJSON(data);
  }

  /** Niveau actuel d'un upgrade (0 = non acheté). */
  getLevel(upgradeId) {
    return this._levels.get(upgradeId) || 0;
  }

  /** Coût du prochain palier, ou null si max. */
  getNextCost(upgradeId) {
    const upgrade = UPGRADES[upgradeId];
    if (!upgrade) return null;
    const level = this.getLevel(upgradeId);
    if (level >= upgrade.maxLevel) return null;
    return upgrade.costs[level] || null;
  }

  /** Peut-on acheter le prochain palier ? */
  canBuy(upgradeId, wallet) {
    const cost = this.getNextCost(upgradeId);
    if (!cost) return false;
    return wallet.canAfford(cost);
  }

  /** Achète le prochain palier. Retourne true si succès. */
  buy(upgradeId, wallet) {
    const cost = this.getNextCost(upgradeId);
    if (!cost) return false;
    if (!wallet.spend(cost)) return false;
    this._levels.set(upgradeId, (this._levels.get(upgradeId) || 0) + 1);
    this.save();
    wallet.save();
    return true;
  }

  /** Retourne le facteur actif pour un upgrade (1.0 si non acheté). */
  getEffectFactor(upgradeId) {
    const upgrade = UPGRADES[upgradeId];
    if (!upgrade) return 1;
    const level = this.getLevel(upgradeId);
    if (level === 0) return 1;
    return upgrade.effect.factors[level - 1] || 1;
  }

  /**
   * Retourne tous les effets actifs groupés par target.
   * Ex: { ship: { speed: 1.3, width: 1.1 }, drone: { speed: 1.15 }, ... }
   */
  getActiveEffects() {
    const effects = {};
    for (const id of UPGRADE_IDS) {
      const level = this.getLevel(id);
      if (level === 0) continue;
      const upgrade = UPGRADES[id];
      const { target, prop, factors } = upgrade.effect;
      if (!effects[target]) effects[target] = {};
      effects[target][prop] = factors[level - 1];
    }
    return effects;
  }

  /** Force le niveau d'un upgrade (usage dev/progress lab). */
  setLevel(upgradeId, level) {
    const upgrade = UPGRADES[upgradeId];
    if (!upgrade) return;
    this._levels.set(upgradeId, Math.max(0, Math.min(level, upgrade.maxLevel)));
  }

  /** Est-ce que l'upgrade est au max ? */
  isMaxed(upgradeId) {
    const upgrade = UPGRADES[upgradeId];
    if (!upgrade) return true;
    return this.getLevel(upgradeId) >= upgrade.maxLevel;
  }

  /** Reset complet. */
  reset() {
    for (const id of UPGRADE_IDS) this._levels.set(id, 0);
  }

  // --- Persistence ---

  toJSON() {
    return Object.fromEntries(this._levels);
  }

  fromJSON(data) {
    if (!data || typeof data !== 'object') return;
    for (const id of UPGRADE_IDS) {
      this._levels.set(id, typeof data[id] === 'number' ? data[id] : 0);
    }
  }

  save() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.toJSON()));
    } catch { /* quota exceeded — silent fail */ }
  }

  static load() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return new UpgradeManager(raw ? JSON.parse(raw) : null);
    } catch {
      return new UpgradeManager();
    }
  }
}
