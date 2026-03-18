// --- Consumable Session ---
// Charges disponibles pendant une partie. Snapshot de l'inventaire au start.
// Les charges consommées sont déduites de l'inventaire via useOne().

import { CONSUMABLE_IDS, getConsumable } from '../../domain/consumables.js';

export class ConsumableSession {
  /**
   * @param {import('./consumable-inventory.js').ConsumableInventory} inventory
   */
  constructor(inventory) {
    this._inventory = inventory;
    /** @type {Map<string, number>} charges dispo cette partie */
    this._charges = new Map();
    for (const id of CONSUMABLE_IDS) {
      const stock = inventory.getStock(id);
      if (stock <= 0) { this._charges.set(id, 0); continue; }
      const def = getConsumable(id);
      // Missiles : 1 stock = N tirs
      const charges = def?.shotsPerCharge ? def.shotsPerCharge : 1;
      this._charges.set(id, charges);
    }
  }

  getCharges(id) {
    return this._charges.get(id) || 0;
  }

  hasCharge(id) {
    return this.getCharges(id) > 0;
  }

  /** Consomme 1 charge. Déduit du stock inventaire. Retourne false si plus de charge. */
  use(id) {
    const charges = this.getCharges(id);
    if (charges <= 0) return false;
    this._charges.set(id, charges - 1);
    // Déduire du stock persistant (sauf missiles qui déduisent quand toutes les shots sont épuisées)
    const def = getConsumable(id);
    if (def?.shotsPerCharge) {
      // Missiles : déduire 1 du stock quand les N tirs sont écoulés
      if (this.getCharges(id) <= 0) {
        this._inventory.useOne(id);
      }
    } else {
      this._inventory.useOne(id);
    }
    return true;
  }

  /** Liste des consommables actifs avec charges > 0 (pour le HUD). */
  getActiveConsumables() {
    const result = [];
    for (const id of CONSUMABLE_IDS) {
      const charges = this.getCharges(id);
      if (charges <= 0) continue;
      const def = getConsumable(id);
      if (def.type === 'passive') continue; // passifs pas dans le HUD boutons
      result.push({ id, charges, def });
    }
    return result;
  }
}
