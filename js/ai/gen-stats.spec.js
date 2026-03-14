import { describe, it, expect } from 'vitest';
import { computeGenStats, formatGenStats, genStatsHeader, genStatsSeparator } from './gen-stats.js';

describe('gen-stats', () => {
  const genomes = [
    { fitness: 100, _details: { catches: 5, destroys: 8, rallyScore: 15, drops: 1, capsules: 2, stars: 1, won: true } },
    { fitness: 50,  _details: { catches: 2, destroys: 4, rallyScore: 5, drops: 2, capsules: 0, stars: 0, won: false } },
    { fitness: -30, _details: { catches: 0, destroys: 1, rallyScore: 0, drops: 3, capsules: 0, stars: 0, won: false } },
  ];

  describe('computeGenStats', () => {
    it('retourne les stats du meilleur et la moyenne', () => {
      const s = computeGenStats(genomes, 7);
      expect(s.gen).toBe(7);
      expect(s.bestFitness).toBe(100);
      expect(s.avg).toBe(40); // (100+50-30)/3
      expect(s.catches).toBe(5);
      expect(s.destroys).toBe(8);
      expect(s.drops).toBe(1);
      expect(s.capsules).toBe(2);
      expect(s.stars).toBe(1);
      expect(s.winCount).toBe(1);
    });
  });

  describe('formatGenStats', () => {
    it('produit une ligne formatée avec étoiles', () => {
      const s = computeGenStats(genomes, 7);
      const line = formatGenStats(s);
      expect(line).toContain('7');
      expect(line).toContain('100');
      expect(line).toContain('40');
      expect(line).toContain('1★');
    });
  });

  describe('genStatsHeader / genStatsSeparator', () => {
    it('contient les noms de colonnes', () => {
      const h = genStatsHeader();
      expect(h).toContain('Gen');
      expect(h).toContain('Best');
      expect(h).toContain('Stars');
      expect(h).toContain('Caps');
      expect(h).toContain('Wins');
    });

    it('le séparateur est une ligne de tirets', () => {
      expect(genStatsSeparator()).toMatch(/^-+$/);
    });
  });
});
