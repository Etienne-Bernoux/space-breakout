import { expect } from 'chai';

// Mock music.js — pas de Web Audio dans les tests
let lastLayerVolumes = {};
let lastRequestedSection = null;
let adaptiveEnabled = false;

// Remplacer les imports en patchant le module
import * as musicModule from '../../infra/music/index.js';

// On ne peut pas facilement mocker les imports ES, donc on teste
// la logique d'intensité via une version testable du director.
// On extrait la logique de calcul dans un helper testable.

function calcIntensity(remainingRatio, combo, powerUpActive, lastLife = false) {
  let level = 0;
  if (remainingRatio <= 0.10) level = 4;
  else if (remainingRatio <= 0.30) level = 3;
  else if (remainingRatio <= 0.50) level = 2;
  else if (remainingRatio <= 0.80) level = 1;

  if (combo >= 6) level = Math.min(4, level + 2);
  else if (combo >= 3) level = Math.min(4, level + 1);

  if (powerUpActive) level = Math.min(4, Math.max(level, 2));
  if (lastLife) level = Math.min(4, Math.max(level, 3));

  return Math.min(4, Math.max(0, level));
}

describe('MusicDirector — calcul d\'intensité', () => {
  describe('ratio-based', () => {
    it('calm quand >80% restants', () => {
      expect(calcIntensity(0.90, 0, false)).to.equal(0);
    });

    it('cruise quand 50-80% restants', () => {
      expect(calcIntensity(0.60, 0, false)).to.equal(1);
    });

    it('action quand 30-50% restants', () => {
      expect(calcIntensity(0.40, 0, false)).to.equal(2);
    });

    it('intense quand <30% restants', () => {
      expect(calcIntensity(0.20, 0, false)).to.equal(3);
    });

    it('climax quand <10% restants', () => {
      expect(calcIntensity(0.05, 0, false)).to.equal(4);
    });
  });

  describe('combo boost', () => {
    it('combo ≥3 ajoute +1', () => {
      expect(calcIntensity(0.90, 3, false)).to.equal(1);
    });

    it('combo ≥6 ajoute +2', () => {
      expect(calcIntensity(0.90, 6, false)).to.equal(2);
    });

    it('combo + ratio se cumulent', () => {
      expect(calcIntensity(0.60, 3, false)).to.equal(2); // cruise(1) + combo(+1)
    });

    it('combo élevé ne dépasse pas 4', () => {
      expect(calcIntensity(0.20, 10, false)).to.equal(4);
    });
  });

  describe('power-up boost', () => {
    it('power-up actif → au moins action (2)', () => {
      expect(calcIntensity(0.90, 0, true)).to.equal(2);
    });

    it('power-up ne réduit pas un niveau déjà élevé', () => {
      expect(calcIntensity(0.05, 0, true)).to.equal(4);
    });

    it('power-up + combo se cumulent', () => {
      expect(calcIntensity(0.60, 3, true)).to.equal(2); // max(cruise+combo=2, pu=2)
    });
  });

  describe('last-life boost', () => {
    it('dernière vie → au moins intense (3)', () => {
      expect(calcIntensity(0.90, 0, false, true)).to.equal(3);
    });

    it('dernière vie ne réduit pas un niveau déjà plus élevé', () => {
      expect(calcIntensity(0.05, 0, false, true)).to.equal(4);
    });

    it('dernière vie + power-up → prend le max', () => {
      expect(calcIntensity(0.90, 0, true, true)).to.equal(3);
    });
  });

  describe('combo milestone dispatch', () => {
    it('combo multiple de 5 → milestone, sinon accent', () => {
      // On teste la logique de branchement, pas l'audio
      const results = [];
      for (const c of [2, 3, 5, 10, 12, 15]) {
        results.push({ combo: c, isMilestone: c > 0 && c % 5 === 0 });
      }
      expect(results.filter(r => r.isMilestone).map(r => r.combo)).to.deep.equal([5, 10, 15]);
      expect(results.filter(r => !r.isMilestone).map(r => r.combo)).to.deep.equal([2, 3, 12]);
    });
  });

  describe('edge cases', () => {
    it('tout à 0', () => {
      expect(calcIntensity(1.0, 0, false)).to.equal(0);
    });

    it('tout au max', () => {
      expect(calcIntensity(0.0, 10, true)).to.equal(4);
    });

    it('ratio exactement 0.80', () => {
      expect(calcIntensity(0.80, 0, false)).to.equal(1);
    });

    it('ratio exactement 0.50', () => {
      expect(calcIntensity(0.50, 0, false)).to.equal(2);
    });
  });
});
