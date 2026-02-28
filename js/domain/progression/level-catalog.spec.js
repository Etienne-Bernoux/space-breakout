import { describe, it, expect } from 'vitest';
import { ZONE_1, getLevel, getLevelIndex, getNextLevel, getAllLevels } from './level-catalog.js';

describe('level-catalog', () => {
  it('ZONE_1 has 6 levels', () => {
    expect(ZONE_1.levels).toHaveLength(6);
  });

  it('getLevel returns the correct level', () => {
    const l = getLevel('z1-3');
    expect(l.name).toBe('Ceinture dense');
    expect(l.asteroids.rows).toBe(6);
  });

  it('getLevel returns null for unknown id', () => {
    expect(getLevel('nope')).toBeNull();
  });

  it('getLevelIndex returns 0-based index', () => {
    expect(getLevelIndex('z1-1')).toBe(0);
    expect(getLevelIndex('z1-6')).toBe(5);
    expect(getLevelIndex('nope')).toBe(-1);
  });

  it('getNextLevel returns the next level', () => {
    expect(getNextLevel('z1-1').id).toBe('z1-2');
    expect(getNextLevel('z1-5').id).toBe('z1-6');
  });

  it('getNextLevel returns null for last level', () => {
    expect(getNextLevel('z1-6')).toBeNull();
  });

  it('getAllLevels returns all levels', () => {
    expect(getAllLevels()).toHaveLength(6);
  });

  it('each level has required fields', () => {
    for (const l of getAllLevels()) {
      expect(l).toHaveProperty('id');
      expect(l).toHaveProperty('name');
      expect(l).toHaveProperty('asteroids');
      expect(l).toHaveProperty('timeTarget');
      expect(l.asteroids).toHaveProperty('rows');
      expect(l.asteroids).toHaveProperty('cols');
      expect(l.asteroids).toHaveProperty('density');
      expect(l.asteroids).toHaveProperty('materials');
    }
  });
});
