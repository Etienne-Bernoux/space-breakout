// --- Mineral Wallet ---
// Portefeuille persistant de minerais. add / spend / canAfford.
// Persistence localStorage via toJSON / fromJSON.

import { MINERAL_IDS } from '../../domain/minerals/index.js';

const STORAGE_KEY = 'space-breakout-minerals';

export class MineralWallet {
  constructor(data = null) {
    /** @type {Map<string, number>} */
    this._minerals = new Map();
    for (const id of MINERAL_IDS) this._minerals.set(id, 0);
    if (data) this.fromJSON(data);
  }

  /** Ajoute des minerais au portefeuille. */
  add(mineralKey, quantity = 1) {
    const current = this._minerals.get(mineralKey) || 0;
    this._minerals.set(mineralKey, current + quantity);
  }

  /** Retourne la quantité d'un minerai. */
  get(mineralKey) {
    return this._minerals.get(mineralKey) || 0;
  }

  /** Vérifie si on peut payer un coût { copper: 10, silver: 5, ... }. */
  canAfford(cost) {
    for (const [key, amount] of Object.entries(cost)) {
      if ((this._minerals.get(key) || 0) < amount) return false;
    }
    return true;
  }

  /** Dépense des minerais. Retourne true si succès, false si insuffisant. */
  spend(cost) {
    if (!this.canAfford(cost)) return false;
    for (const [key, amount] of Object.entries(cost)) {
      this._minerals.set(key, (this._minerals.get(key) || 0) - amount);
    }
    return true;
  }

  /** Retourne tous les minerais comme objet { copper: n, silver: n, ... }. */
  getAll() {
    const result = {};
    for (const [key, val] of this._minerals) result[key] = val;
    return result;
  }

  /** Reset complet. */
  reset() {
    for (const id of MINERAL_IDS) this._minerals.set(id, 0);
  }

  // --- Persistence ---

  toJSON() {
    return Object.fromEntries(this._minerals);
  }

  fromJSON(data) {
    if (!data || typeof data !== 'object') return;
    for (const id of MINERAL_IDS) {
      this._minerals.set(id, typeof data[id] === 'number' ? data[id] : 0);
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
      return new MineralWallet(raw ? JSON.parse(raw) : null);
    } catch {
      return new MineralWallet();
    }
  }
}
