import { describe, it, expect } from 'vitest';
import { ConsumableInventory } from './consumable-inventory.js';

const mockWallet = (minerals = { copper: 999, silver: 999, gold: 999 }) => ({
  _m: { ...minerals },
  canAfford(cost) {
    return Object.entries(cost).every(([k, v]) => (this._m[k] || 0) >= v);
  },
  spend(cost) {
    if (!this.canAfford(cost)) return false;
    for (const [k, v] of Object.entries(cost)) this._m[k] -= v;
    return true;
  },
  save() {},
});

describe('ConsumableInventory', () => {
  it('stock initial à 0 pour tous', () => {
    const inv = new ConsumableInventory();
    expect(inv.getStock('safetyNet')).toBe(0);
    expect(inv.getStock('missiles')).toBe(0);
  });

  it('addStock ajoute du stock', () => {
    const inv = new ConsumableInventory();
    inv.addStock('safetyNet', 3);
    expect(inv.getStock('safetyNet')).toBe(3);
  });

  it('addStock ne dépasse pas maxStock', () => {
    const inv = new ConsumableInventory();
    inv.addStock('safetyNet', 100);
    expect(inv.getStock('safetyNet')).toBe(10);
  });

  it('useOne décrémente et retourne true', () => {
    const inv = new ConsumableInventory();
    inv.addStock('shockwave', 2);
    expect(inv.useOne('shockwave')).toBe(true);
    expect(inv.getStock('shockwave')).toBe(1);
  });

  it('useOne retourne false si stock à 0', () => {
    const inv = new ConsumableInventory();
    expect(inv.useOne('shockwave')).toBe(false);
  });

  it('buy déduit les minerais et ajoute du stock', () => {
    const inv = new ConsumableInventory();
    const wallet = mockWallet();
    expect(inv.buy('safetyNet', 2, wallet)).toBe(true);
    expect(inv.getStock('safetyNet')).toBe(2);
    // 20 copper * 2 = 40
    expect(wallet._m.copper).toBe(999 - 40);
  });

  it('buy échoue si pas assez de minerais', () => {
    const inv = new ConsumableInventory();
    const wallet = mockWallet({ copper: 0, silver: 0, gold: 0 });
    expect(inv.buy('shockwave', 1, wallet)).toBe(false);
    expect(inv.getStock('shockwave')).toBe(0);
  });

  it('buy échoue si dépasserait maxStock', () => {
    const inv = new ConsumableInventory();
    inv.addStock('safetyNet', 9);
    const wallet = mockWallet();
    expect(inv.buy('safetyNet', 2, wallet)).toBe(false);
  });

  it('sérialise et désérialise', () => {
    const inv = new ConsumableInventory();
    inv.addStock('safetyNet', 5);
    inv.addStock('missiles', 3);
    const json = inv.toJSON();
    const inv2 = new ConsumableInventory(json);
    expect(inv2.getStock('safetyNet')).toBe(5);
    expect(inv2.getStock('missiles')).toBe(3);
  });

  it('reset remet tout à 0', () => {
    const inv = new ConsumableInventory();
    inv.addStock('safetyNet', 5);
    inv.reset();
    expect(inv.getStock('safetyNet')).toBe(0);
  });
});
