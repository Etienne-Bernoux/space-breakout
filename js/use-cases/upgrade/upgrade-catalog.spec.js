import { describe, it, expect } from 'vitest';
import { UPGRADES, UPGRADE_IDS, UPGRADE_CATEGORIES, getUpgrade, getUpgradesByCategory } from './upgrade-catalog.js';

describe('Catalogue d\'upgrades', () => {
  it('définit 7 upgrades', () => {
    expect(UPGRADE_IDS).toHaveLength(7);
  });

  it('chaque upgrade a les champs requis', () => {
    for (const id of UPGRADE_IDS) {
      const u = UPGRADES[id];
      expect(u.id).toBe(id);
      expect(u.name).toBeTypeOf('string');
      expect(u.description).toBeTypeOf('string');
      expect(Object.keys(UPGRADE_CATEGORIES)).toContain(u.category);
      expect(u.maxLevel).toBeGreaterThan(0);
      expect(u.costs).toHaveLength(u.maxLevel);
      expect(u.effect.factors).toHaveLength(u.maxLevel);
    }
  });

  it('les coûts sont des objets avec des clés minerai', () => {
    for (const id of UPGRADE_IDS) {
      for (const cost of UPGRADES[id].costs) {
        expect(typeof cost).toBe('object');
        for (const key of Object.keys(cost)) {
          expect(['copper', 'silver', 'gold', 'platinum']).toContain(key);
        }
      }
    }
  });

  it('getUpgrade retourne par id ou null', () => {
    expect(getUpgrade('shipSpeed').name).toBe('Propulseurs');
    expect(getUpgrade('nope')).toBeNull();
  });

  it('getUpgradesByCategory filtre correctement', () => {
    const ship = getUpgradesByCategory('ship');
    expect(ship.length).toBeGreaterThanOrEqual(2);
    for (const u of ship) expect(u.category).toBe('ship');
  });

  it('contient 4 catégories', () => {
    expect(Object.keys(UPGRADE_CATEGORIES)).toHaveLength(4);
  });
});
