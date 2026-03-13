import { describe, it, expect } from 'vitest';
import { computeStars } from './star-rating.js';

describe('computeStars', () => {
  it('donne 1 étoile quand des vies ont été perdues', () => {
    expect(computeStars(1, 50, 90)).toBe(1);
    expect(computeStars(2, 30, 90)).toBe(1);
  });

  it('donne 2 étoiles sans perte de vie mais temps dépassé', () => {
    expect(computeStars(0, 100, 90)).toBe(2);
    expect(computeStars(0, 91, 90)).toBe(2);
  });

  it('donne 3 étoiles sans perte de vie et sous le temps cible', () => {
    expect(computeStars(0, 89, 90)).toBe(3);
    expect(computeStars(0, 50, 90)).toBe(3);
  });

  it('donne 3 étoiles quand le temps est exactement au seuil', () => {
    expect(computeStars(0, 90, 90)).toBe(3);
  });
});
