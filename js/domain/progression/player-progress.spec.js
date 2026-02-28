import { describe, it, expect } from 'vitest';
import { PlayerProgress } from './player-progress.js';

describe('PlayerProgress', () => {
  it('starts with z1-1 unlocked by default', () => {
    const p = new PlayerProgress();
    expect(p.isUnlocked('z1-1')).toBe(true);
    expect(p.isUnlocked('z1-2')).toBe(false);
  });

  it('restores from serialized data', () => {
    const p = new PlayerProgress({
      stars: [['z1-1', 3], ['z1-2', 1]],
      unlockedUpTo: 'z1-3',
    });
    expect(p.getStars('z1-1')).toBe(3);
    expect(p.getStars('z1-2')).toBe(1);
    expect(p.isUnlocked('z1-3')).toBe(true);
    expect(p.isUnlocked('z1-4')).toBe(false);
  });

  it('getStars returns 0 for unplayed level', () => {
    const p = new PlayerProgress();
    expect(p.getStars('z1-5')).toBe(0);
  });

  it('complete unlocks the next level', () => {
    const p = new PlayerProgress();
    p.complete('z1-1', 2);
    expect(p.getStars('z1-1')).toBe(2);
    expect(p.isUnlocked('z1-2')).toBe(true);
    expect(p.isUnlocked('z1-3')).toBe(false);
  });

  it('complete keeps the best star rating', () => {
    const p = new PlayerProgress();
    p.complete('z1-1', 3);
    p.complete('z1-1', 1);
    expect(p.getStars('z1-1')).toBe(3);
  });

  it('complete with better score overwrites', () => {
    const p = new PlayerProgress();
    p.complete('z1-1', 1);
    p.complete('z1-1', 3);
    expect(p.getStars('z1-1')).toBe(3);
  });

  it('complete on last level does not crash', () => {
    const p = new PlayerProgress({ unlockedUpTo: 'z1-6' });
    p.complete('z1-6', 2);
    expect(p.getStars('z1-6')).toBe(2);
  });

  it('toJSON round-trips correctly', () => {
    const p = new PlayerProgress();
    p.complete('z1-1', 3);
    p.complete('z1-2', 2);
    const json = p.toJSON();
    const restored = new PlayerProgress(json);
    expect(restored.getStars('z1-1')).toBe(3);
    expect(restored.getStars('z1-2')).toBe(2);
    expect(restored.isUnlocked('z1-3')).toBe(true);
  });
});
