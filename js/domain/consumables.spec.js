import { describe, it, expect } from 'vitest';
import { CONSUMABLES, CONSUMABLE_IDS, getConsumable } from './consumables.js';

describe('Consumables catalog', () => {
  it('définit 4 consommables', () => {
    expect(CONSUMABLE_IDS).toHaveLength(4);
  });

  it('chaque consommable a les champs requis', () => {
    for (const id of CONSUMABLE_IDS) {
      const c = CONSUMABLES[id];
      expect(c.id).toBe(id);
      expect(c.name).toBeTruthy();
      expect(c.short).toBeTruthy();
      expect(c.type).toMatch(/^(passive|active)$/);
      expect(c.color).toMatch(/^#/);
      expect(c.cost).toBeTypeOf('object');
      expect(c.maxStock).toBeGreaterThan(0);
    }
  });

  it('les actifs ont une touche clavier', () => {
    for (const id of CONSUMABLE_IDS) {
      const c = CONSUMABLES[id];
      if (c.type === 'active') expect(c.key).toBeTruthy();
    }
  });

  it('getConsumable retourne le bon objet ou null', () => {
    expect(getConsumable('safetyNet').id).toBe('safetyNet');
    expect(getConsumable('unknown')).toBeNull();
  });
});
