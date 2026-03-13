import { describe, it, expect } from 'vitest';
import { ZONE_1, getLevel, getLevelIndex, getNextLevel, getAllLevels, getZoneForLevel } from './level-catalog.js';

describe('Catalogue de niveaux', () => {
  it('la zone 1 contient 6 niveaux', () => {
    expect(ZONE_1.levels).toHaveLength(6);
  });

  it('getLevel retourne le bon niveau', () => {
    const l = getLevel('z1-3');
    expect(l.name).toBe('Ceinture dense');
    expect(l.asteroids.rows).toBe(6);
  });

  it('getLevel retourne null pour un id inconnu', () => {
    expect(getLevel('nope')).toBeNull();
  });

  it('getLevelIndex retourne l\'index 0-based', () => {
    expect(getLevelIndex('z1-1')).toBe(0);
    expect(getLevelIndex('z1-6')).toBe(5);
    expect(getLevelIndex('nope')).toBe(-1);
  });

  it('getNextLevel retourne le niveau suivant', () => {
    expect(getNextLevel('z1-1').id).toBe('z1-2');
    expect(getNextLevel('z1-5').id).toBe('z1-6');
  });

  it('getNextLevel retourne null pour le dernier niveau', () => {
    expect(getNextLevel('z1-6')).toBeNull();
  });

  it('getAllLevels retourne tous les niveaux', () => {
    expect(getAllLevels()).toHaveLength(6);
  });

  it('getZoneForLevel retourne l\'id de la zone', () => {
    expect(getZoneForLevel('z1-1')).toBe('zone1');
    expect(getZoneForLevel('z1-6')).toBe('zone1');
  });

  it('getZoneForLevel retourne null pour un niveau inconnu', () => {
    expect(getZoneForLevel('nope')).toBeNull();
  });

  it('chaque niveau a les champs requis', () => {
    for (const l of getAllLevels()) {
      expect(l).toHaveProperty('id');
      expect(l).toHaveProperty('name');
      expect(l).toHaveProperty('asteroids');
      expect(l).toHaveProperty('timeTarget');
      expect(l.asteroids).toHaveProperty('rows');
      expect(l.asteroids).toHaveProperty('cols');
      expect(l.asteroids).toHaveProperty('materials');
      // density obligatoire sauf pour les niveaux à pattern
      if (!l.asteroids.pattern) {
        expect(l.asteroids).toHaveProperty('density');
      }
    }
  });
});
