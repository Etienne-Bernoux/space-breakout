import { describe, it, expect } from 'vitest';
import { PropModifier } from './prop-modifier.js';

describe('PropModifier', () => {
  it('retourne la base sans facteurs', () => {
    const m = new PropModifier(100);
    expect(m.current).toBe(100);
  });

  it('applique un facteur', () => {
    const m = new PropModifier(100);
    m.set('wide', 1.5);
    expect(m.current).toBe(150);
  });

  it('applique plusieurs facteurs multiplicativement', () => {
    const m = new PropModifier(100);
    m.set('wide', 1.5);
    m.set('narrow', 0.6);
    expect(m.current).toBe(90); // 100 × 1.5 × 0.6
  });

  it('remove retire un facteur', () => {
    const m = new PropModifier(100);
    m.set('wide', 1.5);
    m.set('narrow', 0.6);
    m.remove('wide');
    expect(m.current).toBe(60); // 100 × 0.6
  });

  it('clear retire tous les facteurs', () => {
    const m = new PropModifier(100);
    m.set('wide', 1.5);
    m.set('narrow', 0.6);
    m.clear();
    expect(m.current).toBe(100);
  });

  it('set remplace un facteur existant', () => {
    const m = new PropModifier(100);
    m.set('wide', 1.5);
    m.set('wide', 2.0); // re-set
    expect(m.current).toBe(200);
  });

  it('currentRaw ne arrondit pas', () => {
    const m = new PropModifier(3);
    m.set('fast', 1.8);
    expect(m.currentRaw).toBeCloseTo(5.4);
    expect(m.current).toBe(5); // arrondi
  });

  it('copyFrom copie les facteurs', () => {
    const m1 = new PropModifier(100);
    m1.set('wide', 1.5);
    const m2 = new PropModifier(100);
    m2.copyFrom(m1);
    expect(m2.current).toBe(150);
    m1.remove('wide');
    expect(m2.current).toBe(150); // indépendant
  });

  it('modifier base change le résultat', () => {
    const m = new PropModifier(100);
    m.set('wide', 1.5);
    m.base = 200;
    expect(m.current).toBe(300);
  });
});
