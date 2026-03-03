import { expect } from 'chai';
import { buildFromPattern, buildRandom, makeAsteroid, pickMaterial } from './field-builder.js';

const BASE_CFG = {
  rows: 4, cols: 6,
  cellW: 70, cellH: 28,
  padding: 6, offsetTop: 45, offsetLeft: 25,
  density: 1.0,
  _autoSize: false,
};

describe('field-builder', () => {
  // --- pickMaterial ---
  describe('pickMaterial', () => {
    it('retourne rock sans distribution', () => {
      expect(pickMaterial({})).to.equal('rock');
    });

    it('retourne le seul matériau quand poids = 1', () => {
      expect(pickMaterial({ materials: { ice: 1.0 } })).to.equal('ice');
    });

    it('retourne rock en fallback si cumul < random', () => {
      // materials qui ne couvrent pas tout l'espace [0,1)
      const result = pickMaterial({ materials: { ice: 0 } });
      expect(result).to.equal('rock');
    });
  });

  // --- makeAsteroid ---
  describe('makeAsteroid', () => {
    it('crée un astéroïde 1×1 avec les bonnes propriétés', () => {
      const a = makeAsteroid(2, 3, 1, 1, BASE_CFG, 'rock');
      expect(a.alive).to.be.true;
      expect(a.gridCol).to.equal(2);
      expect(a.gridRow).to.equal(3);
      expect(a.cw).to.equal(1);
      expect(a.ch).to.equal(1);
      expect(a.sizeName).to.equal('small');
      expect(a.materialKey).to.equal('rock');
      expect(a.hp).to.be.a('number');
      expect(a.shape).to.be.an('array');
      expect(a.craters).to.be.an('array');
    });

    it('calcule correctement la position pixel', () => {
      const a = makeAsteroid(1, 2, 1, 1, BASE_CFG);
      expect(a.x).to.equal(BASE_CFG.offsetLeft + 1 * (BASE_CFG.cellW + BASE_CFG.padding));
      expect(a.y).to.equal(BASE_CFG.offsetTop + 2 * (BASE_CFG.cellH + BASE_CFG.padding));
    });

    it('crée un bloc 2×2 large', () => {
      const a = makeAsteroid(0, 0, 2, 2, BASE_CFG, 'rock');
      expect(a.sizeName).to.equal('large');
      expect(a.width).to.equal(2 * BASE_CFG.cellW + BASE_CFG.padding);
      expect(a.height).to.equal(2 * BASE_CFG.cellH + BASE_CFG.padding);
    });

    it('ajoute fireRate pour les matériaux alien', () => {
      const a = makeAsteroid(0, 0, 1, 1, BASE_CFG, 'tentacle');
      expect(a.fireRate).to.be.a('number');
      expect(a.fireTimer).to.be.a('number');
      expect(a.projectileSpeed).to.be.a('number');
    });

    it('n\'ajoute pas fireRate pour rock', () => {
      const a = makeAsteroid(0, 0, 1, 1, BASE_CFG, 'rock');
      expect(a.fireRate).to.be.undefined;
    });

    it('gère fracturedSide', () => {
      const a = makeAsteroid(0, 0, 1, 1, BASE_CFG, 'rock', 'left');
      expect(a.fracturedSide).to.equal('left');
    });
  });

  // --- buildFromPattern : merge glouton ---
  describe('buildFromPattern merge', () => {
    it('merge 2×2 pour 4 cellules identiques', () => {
      const grid = buildFromPattern({
        ...BASE_CFG, rows: 2, cols: 2,
        pattern: { lines: ['RR', 'RR'] },
      });
      expect(grid).to.have.length(1);
      expect(grid[0].cw).to.equal(2);
      expect(grid[0].ch).to.equal(2);
    });

    it('merge 3×1 horizontal', () => {
      const grid = buildFromPattern({
        ...BASE_CFG, rows: 1, cols: 3,
        pattern: { lines: ['RRR'] },
      });
      expect(grid).to.have.length(1);
      expect(grid[0].cw).to.equal(3);
      expect(grid[0].ch).to.equal(1);
    });

    it('merge 1×3 vertical', () => {
      const grid = buildFromPattern({
        ...BASE_CFG, rows: 3, cols: 1,
        pattern: { lines: ['R', 'R', 'R'] },
      });
      expect(grid).to.have.length(1);
      expect(grid[0].cw).to.equal(1);
      expect(grid[0].ch).to.equal(3);
    });

    it('merge 2×1 horizontal', () => {
      const grid = buildFromPattern({
        ...BASE_CFG, rows: 1, cols: 2,
        pattern: { lines: ['RR'] },
      });
      expect(grid).to.have.length(1);
      expect(grid[0].cw).to.equal(2);
      expect(grid[0].ch).to.equal(1);
    });

    it('merge 1×2 vertical', () => {
      const grid = buildFromPattern({
        ...BASE_CFG, rows: 2, cols: 1,
        pattern: { lines: ['R', 'R'] },
      });
      expect(grid).to.have.length(1);
      expect(grid[0].cw).to.equal(1);
      expect(grid[0].ch).to.equal(2);
    });

    it('ne merge pas des matériaux différents', () => {
      const grid = buildFromPattern({
        ...BASE_CFG, rows: 1, cols: 3,
        pattern: { lines: ['RIR'] },
      });
      expect(grid).to.have.length(3);
    });

    it('2×2 a priorité sur 3×1', () => {
      // RRRR  → 2×2 à gauche + 2×1 à droite (pas 3×1 + 1×1)
      // RR..
      const grid = buildFromPattern({
        ...BASE_CFG, rows: 2, cols: 4,
        pattern: { lines: ['RRRR', 'RR..'] },
      });
      const large = grid.find(a => a.cw === 2 && a.ch === 2);
      expect(large).to.not.be.undefined;
    });

    it('3×1 a priorité sur 2×1', () => {
      const grid = buildFromPattern({
        ...BASE_CFG, rows: 1, cols: 3,
        pattern: { lines: ['MMM'] },
      });
      expect(grid).to.have.length(1);
      expect(grid[0].cw).to.equal(3);
    });

    it('1×3 a priorité sur 1×2', () => {
      const grid = buildFromPattern({
        ...BASE_CFG, rows: 3, cols: 1,
        pattern: { lines: ['M', 'M', 'M'] },
      });
      expect(grid).to.have.length(1);
      expect(grid[0].ch).to.equal(3);
    });

    it('ignore les cellules vides (.)', () => {
      const grid = buildFromPattern({
        ...BASE_CFG, rows: 1, cols: 3,
        pattern: { lines: ['R.R'] },
      });
      expect(grid).to.have.length(2);
    });

    it('résout les ? en matériau selon la distribution', () => {
      const grid = buildFromPattern({
        ...BASE_CFG, rows: 1, cols: 2,
        materials: { ice: 1.0 },
        pattern: { lines: ['??'] },
      });
      expect(grid.every(a => a.materialKey === 'ice')).to.be.true;
    });

    it('tentacules 1×3 vertical merge en un seul bloc', () => {
      const grid = buildFromPattern({
        ...BASE_CFG, rows: 3, cols: 1,
        pattern: { lines: ['A', 'A', 'A'] },
      });
      expect(grid).to.have.length(1);
      expect(grid[0].cw).to.equal(1);
      expect(grid[0].ch).to.equal(3);
      expect(grid[0].materialKey).to.equal('tentacle');
    });
  });

  // --- buildRandom ---
  describe('buildRandom', () => {
    it('crée des astéroïdes avec density > 0', () => {
      const grid = buildRandom({ ...BASE_CFG, density: 0.5 });
      expect(grid.length).to.be.greaterThan(0);
    });

    it('crée rien avec density = 0', () => {
      const grid = buildRandom({ ...BASE_CFG, density: 0 });
      expect(grid).to.have.length(0);
    });

    it('utilise la distribution materials', () => {
      const grid = buildRandom({ ...BASE_CFG, density: 1.0, materials: { ice: 1.0 } });
      expect(grid.every(a => a.materialKey === 'ice')).to.be.true;
    });
  });
});
