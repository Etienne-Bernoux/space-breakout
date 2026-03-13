import { describe, it, expect } from 'vitest';
import { MINERALS, MINERAL_IDS, getMineral } from './index.js';

describe('Minerais', () => {
  it('définit 4 types de minerais', () => {
    expect(MINERAL_IDS).toHaveLength(4);
    expect(MINERAL_IDS).toEqual(['copper', 'silver', 'gold', 'platinum']);
  });

  it('chaque minerai a les propriétés requises', () => {
    for (const id of MINERAL_IDS) {
      const m = MINERALS[id];
      expect(m).toBeDefined();
      expect(m.name).toBeTypeOf('string');
      expect(m.color).toMatch(/^#/);
      expect(m.glowColor).toMatch(/^#/);
      expect(m.rarity).toBeTypeOf('number');
      expect(['nugget', 'crystal']).toContain(m.shape);
    }
  });

  it('la rareté augmente du cuivre au platine', () => {
    expect(MINERALS.copper.rarity).toBeLessThan(MINERALS.silver.rarity);
    expect(MINERALS.silver.rarity).toBeLessThan(MINERALS.gold.rarity);
    expect(MINERALS.gold.rarity).toBeLessThan(MINERALS.platinum.rarity);
  });

  it('getMineral retourne le minerai par id ou null', () => {
    expect(getMineral('copper').name).toBe('Cuivre');
    expect(getMineral('nonexistent')).toBeNull();
  });
});
