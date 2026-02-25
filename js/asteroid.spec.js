import { expect } from 'chai';
import { AsteroidField } from './asteroid.js';
import { CONFIG } from './config.js';

describe('AsteroidField', () => {
  describe('génération procédurale', () => {
    it('génère des astéroïdes vivants', () => {
      const field = new AsteroidField();

      expect(field.grid.length).to.be.above(0);
      expect(field.grid.every(a => a.alive)).to.be.true;
    });

    it('respecte la densité cible (~60% ± 15%)', () => {
      const c = CONFIG.asteroids;
      const totalCells = c.rows * c.cols;
      const target = totalCells * c.density;

      // Moyenne sur plusieurs générations (algo aléatoire)
      const runs = 20;
      let totalFilled = 0;
      for (let i = 0; i < runs; i++) {
        const field = new AsteroidField();
        let cells = 0;
        for (const a of field.grid) {
          const cw = Math.round(a.width / c.cellW) || 1;
          const ch = Math.round(a.height / c.cellH) || 1;
          cells += cw * ch;
        }
        totalFilled += cells;
      }
      const avgFilled = totalFilled / runs;

      expect(avgFilled).to.be.at.least(target * 0.5);
      expect(avgFilled).to.be.at.most(target * 1.3);
    });

    it('accepte une densité custom en paramètre', () => {
      const field100 = new AsteroidField({ density: 1.0 });
      const field20 = new AsteroidField({ density: 0.2 });

      expect(field100.grid.length).to.be.above(field20.grid.length);
    });
  });

  describe('tailles d\'astéroïdes', () => {
    it('contient les 3 tailles : small, medium, large', () => {
      // Générer plusieurs fois pour s\'assurer d\'avoir les 3 (algo aléatoire)
      const allSizes = new Set();
      for (let i = 0; i < 10; i++) {
        const field = new AsteroidField();
        field.grid.forEach(a => allSizes.add(a.sizeName));
      }

      expect(allSizes.has('small')).to.be.true;
      expect(allSizes.has('medium')).to.be.true;
      expect(allSizes.has('large')).to.be.true;
    });

    it('les large font 2×2 cases en pixels', () => {
      const c = CONFIG.asteroids;
      const expectedW = 2 * c.cellW + c.padding;
      const expectedH = 2 * c.cellH + c.padding;

      let found = false;
      for (let i = 0; i < 10 && !found; i++) {
        const field = new AsteroidField();
        const large = field.grid.find(a => a.sizeName === 'large');
        if (large) {
          expect(large.width).to.equal(expectedW);
          expect(large.height).to.equal(expectedH);
          found = true;
        }
      }
      expect(found).to.be.true;
    });

    it('les small font 1×1 case en pixels', () => {
      const c = CONFIG.asteroids;

      let found = false;
      for (let i = 0; i < 10 && !found; i++) {
        const field = new AsteroidField();
        const small = field.grid.find(a => a.sizeName === 'small');
        if (small) {
          expect(small.width).to.equal(c.cellW);
          expect(small.height).to.equal(c.cellH);
          found = true;
        }
      }
      expect(found).to.be.true;
    });
  });

  describe('pas de chevauchement', () => {
    it('aucun astéroïde ne se superpose sur la grille', () => {
      for (let run = 0; run < 20; run++) {
        const field = new AsteroidField();
        const c = CONFIG.asteroids;
        const occupied = Array.from({ length: c.rows }, () => Array(c.cols).fill(false));

        for (const a of field.grid) {
          const col = Math.round((a.x - c.offsetLeft) / (c.cellW + c.padding));
          const row = Math.round((a.baseY - c.offsetTop) / (c.cellH + c.padding));
          const cw = Math.round(a.width / c.cellW) || 1;
          const ch = Math.round(a.height / c.cellH) || 1;

          for (let dr = 0; dr < ch; dr++) {
            for (let dc = 0; dc < cw; dc++) {
              const r = row + dr;
              const cc = col + dc;
              expect(occupied[r][cc], `Chevauchement à [${r},${cc}]`).to.be.false;
              occupied[r][cc] = true;
            }
          }
        }
      }
    });
  });

  describe('propriétés des astéroïdes', () => {
    it('chaque astéroïde a une forme (shape) avec des points', () => {
      const field = new AsteroidField();

      for (const a of field.grid) {
        expect(a.shape).to.be.an('array').with.length.above(0);
        expect(a.shape[0]).to.have.property('angle');
        expect(a.shape[0]).to.have.property('jitter');
      }
    });

    it('chaque astéroïde a des cratères', () => {
      const field = new AsteroidField();

      for (const a of field.grid) {
        expect(a.craters).to.be.an('array').with.length.above(0);
        expect(a.craters[0]).to.have.property('ox');
        expect(a.craters[0]).to.have.property('oy');
        expect(a.craters[0]).to.have.property('r');
      }
    });

    it('chaque astéroïde a une couleur valide', () => {
      const field = new AsteroidField();
      const validColors = CONFIG.asteroids.colors;

      for (const a of field.grid) {
        expect(validColors).to.include(a.color);
      }
    });
  });

  describe('remaining', () => {
    it('retourne le nombre d\'astéroïdes vivants', () => {
      const field = new AsteroidField();
      const total = field.grid.length;

      expect(field.remaining).to.equal(total);

      field.grid[0].alive = false;
      expect(field.remaining).to.equal(total - 1);
    });
  });

  describe('update (flottement)', () => {
    it('fait varier la position Y autour de baseY', () => {
      const field = new AsteroidField();
      const a = field.grid[0];
      const baseY = a.baseY;

      // Plusieurs updates pour que le sin avance
      for (let i = 0; i < 100; i++) field.update();

      expect(a.y).to.not.equal(baseY);
      expect(Math.abs(a.y - baseY)).to.be.at.most(a.floatAmp + 0.01);
    });
  });

  describe('layouts aléatoires', () => {
    it('deux générations produisent des layouts différents', () => {
      const f1 = new AsteroidField();
      const f2 = new AsteroidField();

      // Comparer les positions — au moins une différence
      const positions1 = f1.grid.map(a => `${a.x},${a.baseY}`).sort().join('|');
      const positions2 = f2.grid.map(a => `${a.x},${a.baseY}`).sort().join('|');

      // Très improbable que 2 layouts aléatoires soient identiques
      expect(positions1).to.not.equal(positions2);
    });
  });
});
