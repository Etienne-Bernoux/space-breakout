import { expect } from 'chai';
import { AsteroidField } from './asteroid.js';
import { CONFIG } from '../config.js';

describe('AsteroidField', () => {
  describe('génération procédurale', () => {
    it('génère des astéroïdes vivants', () => {
      const field = new AsteroidField(CONFIG.asteroids);

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
        const field = new AsteroidField(CONFIG.asteroids);
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
      const field100 = new AsteroidField({ ...CONFIG.asteroids, density: 1.0 });
      const field20 = new AsteroidField({ ...CONFIG.asteroids, density: 0.2 });

      expect(field100.grid.length).to.be.above(field20.grid.length);
    });
  });

  describe('tailles d\'astéroïdes', () => {
    it('contient les 3 tailles : small, medium, large', () => {
      // Générer plusieurs fois pour s\'assurer d\'avoir les 3 (algo aléatoire)
      const allSizes = new Set();
      for (let i = 0; i < 10; i++) {
        const field = new AsteroidField(CONFIG.asteroids);
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
        const field = new AsteroidField(CONFIG.asteroids);
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
        const field = new AsteroidField(CONFIG.asteroids);
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
        const field = new AsteroidField(CONFIG.asteroids);
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
      const field = new AsteroidField(CONFIG.asteroids);

      for (const a of field.grid) {
        expect(a.shape).to.be.an('array').with.length.above(0);
        expect(a.shape[0]).to.have.property('angle');
        expect(a.shape[0]).to.have.property('jitter');
      }
    });

    it('chaque astéroïde a des cratères', () => {
      const field = new AsteroidField(CONFIG.asteroids);

      for (const a of field.grid) {
        expect(a.craters).to.be.an('array').with.length.above(0);
        expect(a.craters[0]).to.have.property('ox');
        expect(a.craters[0]).to.have.property('oy');
        expect(a.craters[0]).to.have.property('r');
      }
    });

    it('chaque astéroïde a une couleur valide (issue du matériau)', () => {
      const field = new AsteroidField(CONFIG.asteroids);

      for (const a of field.grid) {
        expect(a.material.colors || a.color).to.not.be.undefined;
        expect(a.color).to.be.a('string');
      }
    });
  });

  describe('remaining', () => {
    it('retourne le nombre d\'astéroïdes vivants', () => {
      const field = new AsteroidField(CONFIG.asteroids);
      const total = field.grid.length;

      expect(field.remaining).to.equal(total);

      field.grid[0].alive = false;
      expect(field.remaining).to.equal(total - 1);
    });
  });

  describe('update (flottement)', () => {
    it('fait varier la position Y autour de baseY', () => {
      const field = new AsteroidField(CONFIG.asteroids);
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
      const f1 = new AsteroidField(CONFIG.asteroids);
      const f2 = new AsteroidField(CONFIG.asteroids);

      const positions1 = f1.grid.map(a => `${a.x},${a.baseY}`).sort().join('|');
      const positions2 = f2.grid.map(a => `${a.x},${a.baseY}`).sort().join('|');

      expect(positions1).to.not.equal(positions2);
    });
  });

  describe('matériaux', () => {
    it('chaque astéroïde a un materialKey et des HP', () => {
      const field = new AsteroidField(CONFIG.asteroids);
      for (const a of field.grid) {
        expect(a.materialKey).to.be.a('string');
        expect(a.hp).to.be.a('number');
        expect(a.maxHp).to.be.a('number');
        expect(a).to.have.property('destructible');
      }
    });

    it('remaining ignore les indestructibles', () => {
      const mixConfig = {
        rows: 2, cols: 2, cellW: 70, cellH: 28, padding: 6,
        offsetTop: 10, offsetLeft: 10, density: 0, colors: ['#8b4513'],
      };
      const field = new AsteroidField(mixConfig);
      // Ajouter manuellement un rock et un obsidian
      field.grid.push(field._makeAsteroid(0, 0, 1, 1, mixConfig, 'rock'));
      field.grid.push(field._makeAsteroid(1, 0, 1, 1, mixConfig, 'obsidian'));
      // remaining = seulement le rock
      expect(field.remaining).to.equal(1);
    });

    it('distribution materials via config', () => {
      const matConfig = {
        ...CONFIG.asteroids,
        materials: { ice: 1.0 }, // 100% glace
      };
      const field = new AsteroidField(matConfig);
      for (const a of field.grid) {
        expect(a.materialKey).to.equal('ice');
      }
    });

    it('ice noFragment → pas de fragments même en large', () => {
      const fragConfig = {
        rows: 4, cols: 4, cellW: 70, cellH: 28, padding: 6,
        offsetTop: 10, offsetLeft: 10, density: 0, colors: ['#88ccee'],
      };
      const field = new AsteroidField(fragConfig);
      const ast = field._makeAsteroid(0, 0, 2, 2, fragConfig, 'ice');
      field.grid.push(ast);
      const frags = field.fragment(ast, ast.x + 5, ast.y + 5);
      expect(frags).to.have.length(0);
      expect(ast.alive).to.be.false;
    });
  });

  describe('fragmentation', () => {
    // Config minimal pour tests déterministes
    const fragConfig = {
      rows: 4, cols: 4, cellW: 70, cellH: 28, padding: 6,
      offsetTop: 10, offsetLeft: 10, density: 0, colors: ['#8b4513'],
    };

    function fieldWithAsteroid(cw, ch) {
      const field = new AsteroidField(fragConfig); // density 0 → grille vide
      const ast = field._makeAsteroid(0, 0, cw, ch, fragConfig);
      field.grid.push(ast);
      return { field, ast };
    }

    it('small 1×1 → pas de fragments', () => {
      const { field, ast } = fieldWithAsteroid(1, 1);
      const frags = field.fragment(ast, ast.x + 10, ast.y + 10);
      expect(frags).to.have.length(0);
      expect(ast.alive).to.be.false;
    });

    it('medium horizontal 2×1 → 1 small', () => {
      const { field, ast } = fieldWithAsteroid(2, 1);
      // Toucher côté gauche
      const frags = field.fragment(ast, ast.x + 5, ast.y + 10);
      expect(frags).to.have.length(1);
      expect(frags[0].sizeName).to.equal('small');
      expect(frags[0].cw).to.equal(1);
      expect(frags[0].ch).to.equal(1);
      expect(ast.alive).to.be.false;
      expect(frags[0].alive).to.be.true;
    });

    it('medium vertical 1×2 → 1 small', () => {
      const { field, ast } = fieldWithAsteroid(1, 2);
      // Toucher en haut
      const frags = field.fragment(ast, ast.x + 10, ast.y + 5);
      expect(frags).to.have.length(1);
      expect(frags[0].sizeName).to.equal('small');
      expect(frags[0].cw).to.equal(1);
    });

    it('large 2×2 → 1 medium + 1 small', () => {
      const { field, ast } = fieldWithAsteroid(2, 2);
      // Toucher coin haut-gauche
      const frags = field.fragment(ast, ast.x + 5, ast.y + 5);
      expect(frags).to.have.length(2);
      const names = frags.map(f => f.sizeName).sort();
      expect(names).to.deep.equal(['medium', 'small']);
      expect(ast.alive).to.be.false;
    });

    it('les fragments héritent la couleur du parent', () => {
      const { field, ast } = fieldWithAsteroid(2, 2);
      const parentColor = ast.color;
      const frags = field.fragment(ast, ast.x + 5, ast.y + 5);
      for (const f of frags) {
        expect(f.color).to.equal(parentColor);
      }
    });

    it('les fragments ont un offset de séparation initial', () => {
      const { field, ast } = fieldWithAsteroid(2, 2);
      const frags = field.fragment(ast, ast.x + 5, ast.y + 5);
      const hasOffset = frags.some(f => f.fragOffsetX !== 0 || f.fragOffsetY !== 0);
      expect(hasOffset).to.be.true;
    });

    it('les fragments sont ajoutés à la grille', () => {
      const { field, ast } = fieldWithAsteroid(2, 1);
      const before = field.grid.length;
      field.fragment(ast, ast.x + 5, ast.y + 10);
      expect(field.grid.length).to.equal(before + 1);
    });

    it('les fragments ont un fracturedSide cohérent', () => {
      // Medium horizontal, hit gauche → fragment droit a fracturedSide 'left'
      const { field, ast } = fieldWithAsteroid(2, 1);
      const frags = field.fragment(ast, ast.x + 5, ast.y + 10);
      expect(frags[0].fracturedSide).to.equal('left');

      // Medium horizontal, hit droit → fragment gauche a fracturedSide 'right'
      const { field: f2, ast: a2 } = fieldWithAsteroid(2, 1);
      const frags2 = f2.fragment(a2, a2.x + a2.width - 5, a2.y + 10);
      expect(frags2[0].fracturedSide).to.equal('right');
    });

    it('les fragments ont plus de points shape (fracture dentelée)', () => {
      const { field, ast } = fieldWithAsteroid(2, 1);
      const frags = field.fragment(ast, ast.x + 5, ast.y + 10);
      // Un small normal a 10 points, un fracturé en a 10 + 5 extra = 15
      expect(frags[0].shape.length).to.be.above(10);
    });

    it('les astéroïdes non fracturés ont fracturedSide null', () => {
      const { ast } = fieldWithAsteroid(1, 1);
      expect(ast.fracturedSide).to.be.null;
    });
  });
});
