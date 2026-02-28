import { describe, it, expect } from 'vitest';
import { computeStars } from './star-rating.js';

describe('computeStars', () => {
  it('returns 1 star when lives were lost', () => {
    expect(computeStars(1, 50, 90)).toBe(1);
    expect(computeStars(2, 30, 90)).toBe(1);
  });

  it('returns 2 stars when no lives lost but over time target', () => {
    expect(computeStars(0, 100, 90)).toBe(2);
    expect(computeStars(0, 91, 90)).toBe(2);
  });

  it('returns 3 stars when no lives lost and under time target', () => {
    expect(computeStars(0, 89, 90)).toBe(3);
    expect(computeStars(0, 50, 90)).toBe(3);
  });

  it('returns 3 stars when exactly at time target', () => {
    expect(computeStars(0, 90, 90)).toBe(3);
  });
});
