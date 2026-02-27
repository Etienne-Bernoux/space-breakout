import { expect } from 'chai';
import { AsteroidField } from './asteroid-field.js';

const BASE_CFG = {
  rows: 4, cols: 4,
  cellW: 70, cellH: 28,
  padding: 6, offsetTop: 45, offsetLeft: 25,
  density: 1.0,
  _autoSize: false,
};

describe('AsteroidField', () => {
  // --- Pattern-based generation ---
  describe('pattern generation', () => {
    it('crée le bon nombre d\'astéroïdes pour un pattern simple', () => {
      const field = new AsteroidField({
        ...BASE_CFG,
        rows: 2, cols: 2,
        pattern: { lines: ['??', '??'] },
      });
      // 4 cellules, merger tentera un 2×2 si même matériau, sinon mix
      expect(field.grid.length).to.be.greaterThan(0);
      expect(field.grid.length).to.be.at.most(4);
    });

    it('ignore les cellules vides (.)', () => {
      const field = new AsteroidField({
        ...BASE_CFG,
        rows: 2, cols: 2,
        pattern: { lines: ['R.', '.R'] },
      });
      expect(field.grid).to.have.length(2);
      expect(field.grid.every(a => a.materialKey === 'rock')).to.be.true;
    });

    it('merge 2×2 quand 4 cellules adjacentes même matériau', () => {
      const field = new AsteroidField({
        ...BASE_CFG,
        rows: 2, cols: 2,
        pattern: { lines: ['RR', 'RR'] },
      });
      expect(field.grid).to.have.length(1);
      expect(field.grid[0].cw).to.equal(2);
      expect(field.grid[0].ch).to.equal(2);
      expect(field.grid[0].sizeName).to.equal('large');
    });

    it('merge 2×1 horizontal pour matériaux identiques', () => {
      const field = new AsteroidField({
        ...BASE_CFG,
        rows: 1, cols: 2,
        pattern: { lines: ['RR'] },
      });
      expect(field.grid).to.have.length(1);
      expect(field.grid[0].cw).to.equal(2);
      expect(field.grid[0].ch).to.equal(1);
    });

    it('merge 1×2 vertical pour matériaux identiques', () => {
      const field = new AsteroidField({
        ...BASE_CFG,
        rows: 2, cols: 1,
        pattern: { lines: ['R', 'R'] },
      });
      expect(field.grid).to.have.length(1);
      expect(field.grid[0].cw).to.equal(1);
      expect(field.grid[0].ch).to.equal(2);
    });

    it('ne merge pas des matériaux différents', () => {
      const field = new AsteroidField({
        ...BASE_CFG,
        rows: 1, cols: 2,
        pattern: { lines: ['RI'] },
      });
      expect(field.grid).to.have.length(2);
      expect(field.grid[0].materialKey).to.equal('rock');
      expect(field.grid[1].materialKey).to.equal('ice');
    });

    it('mappe tous les caractères matériaux (R,I,L,M,C,O)', () => {
      const field = new AsteroidField({
        ...BASE_CFG,
        rows: 1, cols: 6,
        pattern: { lines: ['RILMCO'] },
      });
      const keys = field.grid.map(a => a.materialKey).sort();
      expect(keys).to.deep.equal(['crystal', 'ice', 'lava', 'metal', 'obsidian', 'rock']);
    });
  });

  // --- Random generation ---
  describe('random generation', () => {
    it('crée des astéroïdes sans pattern', () => {
      const field = new AsteroidField({ ...BASE_CFG, density: 0.5 });
      expect(field.grid.length).to.be.greaterThan(0);
    });

    it('respecte density = 0 → aucun astéroïde', () => {
      const field = new AsteroidField({ ...BASE_CFG, density: 0 });
      expect(field.grid).to.have.length(0);
    });

    it('utilise la distribution materials si fournie', () => {
      const field = new AsteroidField({
        ...BASE_CFG,
        density: 1.0,
        materials: { ice: 1.0 },
      });
      expect(field.grid.every(a => a.materialKey === 'ice')).to.be.true;
    });
  });

  // --- remaining ---
  describe('remaining', () => {
    it('compte uniquement les destructibles vivants', () => {
      const field = new AsteroidField({
        ...BASE_CFG,
        rows: 1, cols: 3,
        pattern: { lines: ['RRO'] },
      });
      const totalAlive = field.grid.filter(a => a.alive).length;
      const destructible = field.grid.filter(a => a.alive && a.destructible).length;
      expect(field.remaining).to.equal(destructible);
      expect(field.remaining).to.be.lessThan(totalAlive);
    });

    it('décrémente quand un astéroïde meurt', () => {
      const field = new AsteroidField({
        ...BASE_CFG,
        rows: 1, cols: 2,
        pattern: { lines: ['RR'] },
      });
      const before = field.remaining;
      field.grid[0].alive = false;
      expect(field.remaining).to.equal(before - 1);
    });
  });

  // --- fragment ---
  describe('fragment', () => {
    it('small 1×1 → aucun fragment', () => {
      const field = new AsteroidField({
        ...BASE_CFG,
        rows: 1, cols: 1,
        pattern: { lines: ['R'] },
      });
      const a = field.grid[0];
      const frags = field.fragment(a, a.x + 5, a.y + 5);
      expect(frags).to.have.length(0);
      expect(a.alive).to.be.false;
    });

    it('medium 2×1 → 1 fragment small', () => {
      const field = new AsteroidField({
        ...BASE_CFG,
        rows: 1, cols: 2,
        pattern: { lines: ['RR'] },
      });
      const a = field.grid[0];
      expect(a.cw).to.equal(2);
      const frags = field.fragment(a, a.x + 5, a.y + 5);
      expect(frags).to.have.length(1);
      expect(frags[0].cw).to.equal(1);
      expect(frags[0].ch).to.equal(1);
      expect(a.alive).to.be.false;
    });

    it('large 2×2 → 2 fragments (medium + small)', () => {
      const field = new AsteroidField({
        ...BASE_CFG,
        rows: 2, cols: 2,
        pattern: { lines: ['RR', 'RR'] },
      });
      const a = field.grid[0];
      expect(a.cw).to.equal(2);
      expect(a.ch).to.equal(2);
      const frags = field.fragment(a, a.x + 5, a.y + 5);
      expect(frags).to.have.length(2);
      expect(a.alive).to.be.false;
      // Les fragments sont ajoutés à la grille
      expect(field.grid.length).to.equal(3); // original + 2 fragments
    });

    it('ice (noFragment) → pas de fragments', () => {
      const field = new AsteroidField({
        ...BASE_CFG,
        rows: 1, cols: 2,
        pattern: { lines: ['II'] },
      });
      const a = field.grid[0];
      const frags = field.fragment(a, a.x + 5, a.y + 5);
      expect(frags).to.have.length(0);
      expect(a.alive).to.be.false;
    });

    it('fragments héritent la couleur du parent', () => {
      const field = new AsteroidField({
        ...BASE_CFG,
        rows: 1, cols: 2,
        pattern: { lines: ['RR'] },
      });
      const a = field.grid[0];
      a.color = '#custom';
      const frags = field.fragment(a, a.x + 5, a.y + 5);
      expect(frags[0].color).to.equal('#custom');
    });
  });

  // --- update ---
  describe('update', () => {
    it('fait flotter les astéroïdes vivants (y change)', () => {
      const field = new AsteroidField({
        ...BASE_CFG,
        rows: 1, cols: 1,
        pattern: { lines: ['R'] },
      });
      const a = field.grid[0];
      a.floatAmp = 2;
      a.floatFreq = 1;
      const yBefore = a.y;
      field.update();
      // y should have changed due to float
      expect(a.y).to.not.equal(yBefore);
    });

    it('décroît fragOffset vers 0', () => {
      const field = new AsteroidField({
        ...BASE_CFG,
        rows: 1, cols: 1,
        pattern: { lines: ['R'] },
      });
      const a = field.grid[0];
      a.fragOffsetX = 3;
      a.fragOffsetY = -3;
      field.update();
      expect(Math.abs(a.fragOffsetX)).to.be.lessThan(3);
      expect(Math.abs(a.fragOffsetY)).to.be.lessThan(3);
    });
  });

  // --- _pickMaterial ---
  describe('_pickMaterial', () => {
    it('retourne rock sans distribution', () => {
      const field = new AsteroidField({ ...BASE_CFG, density: 0 });
      expect(field._pickMaterial({})).to.equal('rock');
    });

    it('retourne le matériau correspondant à la distribution', () => {
      const field = new AsteroidField({ ...BASE_CFG, density: 0 });
      const mat = field._pickMaterial({ materials: { ice: 1.0 } });
      expect(mat).to.equal('ice');
    });
  });
});
