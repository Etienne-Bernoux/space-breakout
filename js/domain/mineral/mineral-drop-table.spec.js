import { describe, it, expect } from 'vitest';
import { DROP_TABLE, getDropWeights } from './mineral-drop-table.js';

describe('Mineral drop table', () => {
  it('has entries for all 8 materials', () => {
    const materials = ['rock', 'ice', 'lava', 'metal', 'crystal', 'obsidian', 'tentacle', 'alienCore'];
    for (const m of materials) {
      expect(DROP_TABLE[m]).toBeDefined();
    }
  });

  it('obsidian drops nothing', () => {
    const w = DROP_TABLE.obsidian;
    expect(w.copper + w.silver + w.gold + w.platinum).toBe(0);
  });

  it('alienCore favors platinum', () => {
    const w = DROP_TABLE.alienCore;
    expect(w.platinum).toBeGreaterThan(w.gold);
    expect(w.platinum).toBeGreaterThan(w.copper);
  });

  it('getDropWeights returns table entry for known material', () => {
    expect(getDropWeights('rock')).toEqual(DROP_TABLE.rock);
  });

  it('getDropWeights falls back to rock for unknown material', () => {
    expect(getDropWeights('banana')).toEqual(DROP_TABLE.rock);
  });
});
