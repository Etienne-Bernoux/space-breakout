import { describe, it, expect, vi } from 'vitest';
import { MineralDropSystem } from './mineral-drop-system.js';

describe('MineralDropSystem', () => {
  it('returns null for obsidian (all weights zero)', () => {
    const sys = new MineralDropSystem({ baseRate: 1.0 });
    const result = sys.decideDrop({ materialKey: 'obsidian', sizeName: 'medium' });
    expect(result).toBeNull();
  });

  it('returns a mineral drop with high baseRate on rock', () => {
    const sys = new MineralDropSystem({ baseRate: 100 }); // guaranteed drop
    const result = sys.decideDrop({ materialKey: 'rock', sizeName: 'medium' });
    expect(result).not.toBeNull();
    expect(result.mineralKey).toBeTypeOf('string');
    expect(result.quantity).toBe(1);
  });

  it('respects size multiplier (large = higher chance)', () => {
    const sys = new MineralDropSystem({ baseRate: 0.08 });
    let largeDrops = 0, smallDrops = 0;
    const N = 5000;
    for (let i = 0; i < N; i++) {
      if (sys.decideDrop({ materialKey: 'metal', sizeName: 'large' })) largeDrops++;
      if (sys.decideDrop({ materialKey: 'metal', sizeName: 'small' })) smallDrops++;
    }
    // large (1.6x) should drop more than small (0.5x)
    expect(largeDrops).toBeGreaterThan(smallDrops);
  });

  it('falls back to rock weights for unknown material', () => {
    const sys = new MineralDropSystem({ baseRate: 100 });
    const result = sys.decideDrop({ materialKey: 'banana', sizeName: 'medium' });
    // getDropWeights falls back to rock → will drop something
    expect(result).not.toBeNull();
  });

  it('alienCore favors platinum over gold', () => {
    // Use moderate baseRate so cumul doesn't always cap at first mineral
    const sys = new MineralDropSystem({ baseRate: 0.5 });
    const counts = { copper: 0, silver: 0, gold: 0, platinum: 0 };
    for (let i = 0; i < 10000; i++) {
      const r = sys.decideDrop({ materialKey: 'alienCore', sizeName: 'large' });
      if (r) counts[r.mineralKey]++;
    }
    // alienCore: gold=2, platinum=5 → platinum should drop more
    expect(counts.platinum).toBeGreaterThan(counts.gold);
  });
});
