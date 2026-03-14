import { describe, it, expect } from 'vitest';
import { computeRallyScore, calcFitness } from './ai-fitness.js';

describe('computeRallyScore', () => {
  it('retourne 0 si aucune destruction', () => {
    expect(computeRallyScore(0, 0)).toBe(0);
  });

  it('retourne 10 pour 1 destruction à progress 0', () => {
    expect(computeRallyScore(1, 0)).toBeCloseTo(10);
  });

  it('applique un poids croissant avec la progression', () => {
    const early = computeRallyScore(3, 0);
    const late = computeRallyScore(3, 1);
    expect(late).toBeGreaterThan(early);
    expect(late).toBeCloseTo(early * 2);
  });

  it('suit un log décroissant (destructions successives valent moins)', () => {
    const rally5 = computeRallyScore(5, 0);
    // 10/1 + 10/2 + 10/3 + 10/4 + 10/5 ≈ 22.83
    expect(rally5).toBeCloseTo(10 + 5 + 10/3 + 2.5 + 2, 1);
  });
});

describe('calcFitness', () => {
  const baseMetrics = {
    sessionState: 'playing',
    dropCount: 0,
    capsulesCaught: 0,
    framesSurvived: 600,
    progress: 0.5,
    catchCount: 5,
    rallyScore: 50,
    asteroidsDestroyed: 10,
    directionChanges: 10,
    extraRally: 0,
  };

  it('accorde un gros bonus pour une victoire', () => {
    const losing = calcFitness(baseMetrics);
    const winning = calcFitness({ ...baseMetrics, sessionState: 'won' });
    expect(winning - losing).toBeGreaterThanOrEqual(1000);
  });

  it('pénalise les pertes de vie', () => {
    const noDrop = calcFitness(baseMetrics);
    const twoDrop = calcFitness({ ...baseMetrics, dropCount: 2 });
    expect(twoDrop).toBe(noDrop - 400);
  });

  it('récompense les capsules récupérées', () => {
    const noCaps = calcFitness(baseMetrics);
    const threeCaps = calcFitness({ ...baseMetrics, capsulesCaught: 3 });
    expect(threeCaps - noCaps).toBe(90);
  });

  it('inclut un bonus quadratique de progression', () => {
    const p0 = calcFitness({ ...baseMetrics, progress: 0 });
    const p1 = calcFitness({ ...baseMetrics, progress: 1 });
    expect(p1 - p0).toBeCloseTo(400);
  });

  it('pénalise l\'oscillation excessive', () => {
    const calm = calcFitness({ ...baseMetrics, directionChanges: 10, framesSurvived: 1000 });
    const shaky = calcFitness({ ...baseMetrics, directionChanges: 500, framesSurvived: 1000 });
    expect(shaky).toBeLessThan(calm);
  });

  it('ne pénalise pas si le taux d\'oscillation est sous 0.3', () => {
    const a = calcFitness({ ...baseMetrics, directionChanges: 100, framesSurvived: 1000 });
    const b = calcFitness({ ...baseMetrics, directionChanges: 200, framesSurvived: 1000 });
    expect(a).toBe(b);
  });

  it('accorde des étoiles en fonction du temps et des vies si victoire', () => {
    // 3★ : won + 0 drops + <60s
    const threeStars = calcFitness({ ...baseMetrics, sessionState: 'won', dropCount: 0, framesSurvived: 59 * 60 });
    // 2★ : won + 0 drops + >60s
    const twoStars = calcFitness({ ...baseMetrics, sessionState: 'won', dropCount: 0, framesSurvived: 120 * 60 });
    // 1★ : won + drops
    const oneStar = calcFitness({ ...baseMetrics, sessionState: 'won', dropCount: 1, framesSurvived: 30 * 60 });
    expect(threeStars).toBeGreaterThan(twoStars);
    expect(twoStars).toBeGreaterThan(oneStar);
  });

  it('inclut extraRally dans le score', () => {
    const without = calcFitness(baseMetrics);
    const with20 = calcFitness({ ...baseMetrics, extraRally: 20 });
    expect(with20 - without).toBe(20);
  });
});
