import { describe, it, expect } from 'vitest';
import { DROP_TABLE, getDropWeights } from './mineral-drop-table.js';

describe('Table de drop minerai', () => {
  it('couvre les 8 matériaux', () => {
    const materials = ['rock', 'ice', 'lava', 'metal', 'crystal', 'obsidian', 'tentacle', 'alienCore'];
    for (const m of materials) {
      expect(DROP_TABLE[m]).toBeDefined();
    }
  });

  it('obsidienne ne drop rien', () => {
    const w = DROP_TABLE.obsidian;
    expect(w.copper + w.silver + w.gold + w.platinum).toBe(0);
  });

  it('noyau alien favorise le platine', () => {
    const w = DROP_TABLE.alienCore;
    expect(w.platinum).toBeGreaterThan(w.gold);
    expect(w.platinum).toBeGreaterThan(w.copper);
  });

  it('retourne les poids pour un matériau connu', () => {
    expect(getDropWeights('rock')).toEqual(DROP_TABLE.rock);
  });

  it('retourne les poids de rock en fallback pour un matériau inconnu', () => {
    expect(getDropWeights('banana')).toEqual(DROP_TABLE.rock);
  });
});
