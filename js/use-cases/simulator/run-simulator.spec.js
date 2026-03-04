import { describe, it, expect, vi } from 'vitest';
import { applySimulation } from './run-simulator.js';

function makeWallet() {
  const data = { copper: 0, silver: 0, gold: 0, platinum: 0 };
  return {
    add(id, qty) { data[id] = (data[id] || 0) + qty; },
    get(id) { return data[id] || 0; },
    save: vi.fn(),
  };
}

function makeProgress() {
  const completed = {};
  return {
    complete(levelId, stars) { completed[levelId] = stars; },
    getStars(levelId) { return completed[levelId] || 0; },
    reset() { Object.keys(completed).forEach(k => delete completed[k]); },
    _completed: completed,
  };
}

describe('applySimulation', () => {
  it('victory → completes level with stars and adds minerals', () => {
    const wallet = makeWallet();
    const progress = makeProgress();
    const saveProgress = vi.fn();

    applySimulation('z1-2', {
      result: 'victory',
      stars: 2,
      minerals: { copper: 5, silver: 3, gold: 0, platinum: 0 },
      livesLost: 1,
    }, { progress, wallet, saveProgress });

    expect(progress._completed['z1-2']).toBe(2);
    expect(saveProgress).toHaveBeenCalledOnce();
    expect(wallet.get('copper')).toBe(5);
    expect(wallet.get('silver')).toBe(3);
    expect(wallet.save).toHaveBeenCalledOnce();
  });

  it('defeat → does NOT complete level but still adds minerals', () => {
    const wallet = makeWallet();
    const progress = makeProgress();
    const saveProgress = vi.fn();

    applySimulation('z1-3', {
      result: 'defeat',
      stars: 0,
      minerals: { copper: 2, gold: 1, silver: 0, platinum: 0 },
      livesLost: 3,
    }, { progress, wallet, saveProgress });

    expect(progress._completed['z1-3']).toBeUndefined();
    expect(saveProgress).not.toHaveBeenCalled();
    expect(wallet.get('copper')).toBe(2);
    expect(wallet.get('gold')).toBe(1);
    expect(wallet.save).toHaveBeenCalledOnce();
  });

  it('victory with 0 minerals → completes level, wallet unchanged', () => {
    const wallet = makeWallet();
    const progress = makeProgress();
    const saveProgress = vi.fn();

    applySimulation('z1-1', {
      result: 'victory',
      stars: 3,
      minerals: { copper: 0, silver: 0, gold: 0, platinum: 0 },
      livesLost: 0,
    }, { progress, wallet, saveProgress });

    expect(progress._completed['z1-1']).toBe(3);
    expect(wallet.get('copper')).toBe(0);
    expect(wallet.save).toHaveBeenCalledOnce();
  });

  it('multiple simulations accumulate minerals', () => {
    const wallet = makeWallet();
    const progress = makeProgress();
    const saveProgress = vi.fn();
    const deps = { progress, wallet, saveProgress };

    applySimulation('z1-1', { result: 'victory', stars: 1, minerals: { copper: 5, silver: 0, gold: 0, platinum: 0 }, livesLost: 0 }, deps);
    applySimulation('z1-2', { result: 'victory', stars: 2, minerals: { copper: 3, silver: 2, gold: 0, platinum: 0 }, livesLost: 0 }, deps);

    expect(wallet.get('copper')).toBe(8);
    expect(wallet.get('silver')).toBe(2);
    expect(progress._completed['z1-1']).toBe(1);
    expect(progress._completed['z1-2']).toBe(2);
  });
});
