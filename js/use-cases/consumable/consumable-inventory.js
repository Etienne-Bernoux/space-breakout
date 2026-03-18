// --- Consumable Inventory ---
// Stock persistant de consommables. Achat avec minerais, déduction à l'usage.
// Pattern identique à MineralWallet.

import { CONSUMABLE_IDS, getConsumable } from '../../domain/consumables.js';

const STORAGE_KEY = 'space-breakout-consumables';

export class ConsumableInventory {
  constructor(data = null) {
    /** @type {Map<string, number>} consumableId → stock */
    this._stock = new Map();
    for (const id of CONSUMABLE_IDS) this._stock.set(id, 0);
    if (data) this.fromJSON(data);
  }

  getStock(id) {
    return this._stock.get(id) || 0;
  }

  addStock(id, qty) {
    const def = getConsumable(id);
    if (!def) return;
    const current = this.getStock(id);
    this._stock.set(id, Math.min(current + qty, def.maxStock));
  }

  /** Consomme 1 unité. Retourne false si stock à 0. */
  useOne(id) {
    const current = this.getStock(id);
    if (current <= 0) return false;
    this._stock.set(id, current - 1);
    this.save();
    return true;
  }

  canBuy(id, qty, wallet) {
    const def = getConsumable(id);
    if (!def) return false;
    if (this.getStock(id) + qty > def.maxStock) return false;
    const totalCost = {};
    for (const [mineral, amount] of Object.entries(def.cost)) {
      totalCost[mineral] = amount * qty;
    }
    return wallet.canAfford(totalCost);
  }

  buy(id, qty, wallet) {
    if (!this.canBuy(id, qty, wallet)) return false;
    const def = getConsumable(id);
    const totalCost = {};
    for (const [mineral, amount] of Object.entries(def.cost)) {
      totalCost[mineral] = amount * qty;
    }
    if (!wallet.spend(totalCost)) return false;
    this.addStock(id, qty);
    this.save();
    wallet.save();
    return true;
  }

  reset() {
    for (const id of CONSUMABLE_IDS) this._stock.set(id, 0);
  }

  toJSON() {
    return Object.fromEntries(this._stock);
  }

  fromJSON(data) {
    if (!data || typeof data !== 'object') return;
    for (const id of CONSUMABLE_IDS) {
      this._stock.set(id, typeof data[id] === 'number' ? data[id] : 0);
    }
  }

  save() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.toJSON()));
    } catch { /* quota exceeded — silent */ }
  }

  static load() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return new ConsumableInventory(raw ? JSON.parse(raw) : null);
    } catch {
      return new ConsumableInventory();
    }
  }
}
