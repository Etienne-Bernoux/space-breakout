import { describe, it, expect } from 'vitest';
import { MineralCapsule } from './mineral-capsule.js';

describe('MineralCapsule', () => {
  const defaults = { speedY: 1.8, radius: 7, bobSpeed: 0.05, bobAmplitude: 0.3, rotationSpeed: 0.04 };

  it('se crée avec un minerai et une position', () => {
    const c = new MineralCapsule('copper', 1, 100, 50, defaults);
    expect(c.mineralKey).toBe('copper');
    expect(c.quantity).toBe(1);
    expect(c.x).toBe(100);
    expect(c.y).toBe(50);
    expect(c.alive).toBe(true);
  });

  it('descend à chaque frame', () => {
    const c = new MineralCapsule('silver', 1, 100, 50, defaults);
    const y0 = c.y;
    c.update(600, 1);
    expect(c.y).toBeGreaterThan(y0);
  });

  it('meurt quand elle sort du canvas', () => {
    const c = new MineralCapsule('gold', 1, 100, 590, defaults);
    for (let i = 0; i < 20; i++) c.update(600, 1);
    expect(c.alive).toBe(false);
  });

  it('tourne au fil du temps', () => {
    const c = new MineralCapsule('platinum', 1, 100, 50, defaults);
    const r0 = c.rotation;
    c.update(600, 1);
    expect(c.rotation).not.toBe(r0);
  });
});
