// --- AsteroidField : état du champ + mutations + queries ---
// La construction est déléguée à field-builder.js (SRP).

import { buildRandom, buildFromPattern, makeAsteroid, pickMaterial } from './field-builder.js';
import { polarToCartesian } from '../shape/polygon-collision.js';
import { computeTentaclePoly } from '../shape/tentacle-shape.js';
import { computeCorePoly } from '../shape/core-shape.js';

export class AsteroidField {
  /**
   * @param {object} config - { rows, cols, cellW, cellH, padding, offsetTop, offsetLeft, density, colors, materials, pattern }
   */
  constructor(config) {
    const c = { ...config };

    // Calcul dynamique de cellW/cellH si la grille change
    if (!c.cellW || c._autoSize) {
      c.cellW = Math.floor((c.canvasW - 2 * c.offsetLeft - (c.cols - 1) * c.padding) / c.cols);
    }
    if (!c.cellH || c._autoSize) {
      c.cellH = Math.floor((c.areaH - c.offsetTop - (c.rows - 1) * c.padding) / c.rows);
    }

    this.config = c;

    if (c.pattern && c.pattern.lines) {
      this.grid = buildFromPattern(c);
    } else {
      this.grid = buildRandom(c);
    }

    // Cache du core pour les calculs tentacules
    this._core = this.grid.find(a => a.material?.isBoss) || null;

    // Initialiser les collisionPoly des créatures alien (avant la première frame)
    if (this._core) {
      this._core.collisionPoly = computeCorePoly(this._core);
      const coreCx = this._core.x + this._core.width / 2;
      const coreCy = this._core.y + this._core.height / 2;
      for (const a of this.grid) {
        if (a.materialKey !== 'tentacle') continue;
        const bb = { cx: a.x + a.width / 2, cy: a.y + a.height / 2, w: a.width, h: a.height };
        a.collisionPoly = computeTentaclePoly(bb, coreCx, coreCy, a.floatPhase);
      }
    }
  }

  // --- Queries ---

  /** Nombre d'astéroïdes destructibles encore vivants (exclut les optional comme les tentacules) */
  get remaining() {
    return this.grid.filter((a) => a.alive && a.destructible && !a.material?.optional).length;
  }

  /** Le champ contient-il un boss ? */
  get hasBoss() {
    return this.grid.some(a => a.material?.isBoss);
  }

  /** Le boss est-il encore vivant ? */
  get bossAlive() {
    return this.grid.some(a => a.alive && a.material?.isBoss);
  }

  /** Retourne les astéroïdes vivants adjacents (4-connecté, exclut creaturePart). */
  getGridNeighbors(asteroid) {
    const cells = new Set();
    for (let dr = 0; dr < asteroid.ch; dr++) {
      for (let dc = 0; dc < asteroid.cw; dc++) {
        cells.add(`${asteroid.gridCol + dc},${asteroid.gridRow + dr}`);
      }
    }
    // Collecter les cellules voisines (bord extérieur du bloc)
    const neighborCells = new Set();
    for (let dr = 0; dr < asteroid.ch; dr++) {
      for (let dc = 0; dc < asteroid.cw; dc++) {
        const c = asteroid.gridCol + dc;
        const r = asteroid.gridRow + dr;
        for (const [nc, nr] of [[c - 1, r], [c + 1, r], [c, r - 1], [c, r + 1]]) {
          const key = `${nc},${nr}`;
          if (!cells.has(key)) neighborCells.add(key);
        }
      }
    }
    // Trouver les astéroïdes vivants qui occupent ces cellules
    const result = new Set();
    for (const a of this.grid) {
      if (!a.alive || a === asteroid || a.material?.creaturePart) continue;
      for (let dr = 0; dr < a.ch; dr++) {
        for (let dc = 0; dc < a.cw; dc++) {
          if (neighborCells.has(`${a.gridCol + dc},${a.gridRow + dr}`)) {
            result.add(a);
          }
        }
      }
    }
    return [...result];
  }

  // --- Mutations ---

  /** Tue tous les tentacules vivants — appelé quand le core est détruit */
  killTentacles() {
    for (const a of this.grid) {
      if (a.alive && a.material?.creaturePart && !a.material?.isBoss) a.alive = false;
    }
  }

  /**
   * Fragmente un astéroïde touché. Retourne les nouveaux fragments créés.
   * - Large 2×2 : détruit la cellule touchée → 1 medium + 1 small
   * - Medium 2×1/1×2 : détruit la moitié touchée → 1 small
   * - Small 1×1 : détruit (pas de fragment)
   */
  fragment(asteroid, hitX, hitY) {
    asteroid.alive = false;
    const c = this.config;
    const { gridCol, gridRow, cw, ch } = asteroid;

    if (cw === 1 && ch === 1) return []; // small → rien
    if (asteroid.material.noFragment) return []; // ice/crystal → explose tout

    // Déterminer quelle sous-cellule est touchée
    const localX = hitX - asteroid.x;
    const localY = hitY - asteroid.y;
    const hitCol = Math.min(cw - 1, Math.max(0, Math.floor(localX / (c.cellW + c.padding))));
    const hitRow = Math.min(ch - 1, Math.max(0, Math.floor(localY / (c.cellH + c.padding))));

    const fragments = [];
    const sepForce = 3;
    const mk = asteroid.materialKey;

    if (cw === 2 && ch === 2) {
      const medRow = hitRow === 0 ? 1 : 0;
      const medFrac = hitRow === 0 ? 'top' : 'bottom';
      const med = makeAsteroid(gridCol, gridRow + medRow, 2, 1, c, mk, medFrac);
      med.fragOffsetY = (medRow - hitRow) * sepForce;
      fragments.push(med);
      const smlCol = hitCol === 0 ? 1 : 0;
      const smlFrac = hitCol === 0 ? 'left' : 'right';
      const sml = makeAsteroid(gridCol + smlCol, gridRow + hitRow, 1, 1, c, mk, smlFrac);
      sml.fragOffsetX = (smlCol - hitCol) * sepForce;
      fragments.push(sml);
    } else if (cw === 2 && ch === 1) {
      const smlCol = hitCol === 0 ? 1 : 0;
      const smlFrac = hitCol === 0 ? 'left' : 'right';
      const sml = makeAsteroid(gridCol + smlCol, gridRow, 1, 1, c, mk, smlFrac);
      sml.fragOffsetX = (smlCol - hitCol) * sepForce;
      fragments.push(sml);
    } else if (cw === 1 && ch === 2) {
      const smlRow = hitRow === 0 ? 1 : 0;
      const smlFrac = hitRow === 0 ? 'top' : 'bottom';
      const sml = makeAsteroid(gridCol, gridRow + smlRow, 1, 1, c, mk, smlFrac);
      sml.fragOffsetY = (smlRow - hitRow) * sepForce;
      fragments.push(sml);
    }

    for (const f of fragments) {
      f.color = asteroid.color;
    }

    this.grid.push(...fragments);
    return fragments;
  }

  // --- Alien fire ---

  /** Décrémente les timers aliens et retourne ceux prêts à tirer. */
  getReadyToFire(dt = 1) {
    const ready = [];
    for (const a of this.grid) {
      if (!a.alive || !a.fireRate) continue;
      a.fireTimer -= dt;
      if (a.fireTimer <= 0) {
        a.fireTimer = a.fireRate + Math.random() * a.fireRate * 0.2;
        ready.push(a);
      }
    }
    return ready;
  }

  // --- Update ---

  update(dt = 1) {
    for (const a of this.grid) {
      if (!a.alive) continue;
      a.rotation += a.rotSpeed * dt;
      a.floatPhase += a.floatFreq * dt;
      a.y = a.baseY + Math.sin(a.floatPhase) * a.floatAmp;
      const decay = Math.pow(0.9, dt);
      a.fragOffsetX *= decay;
      a.fragOffsetY *= decay;
      if (Math.abs(a.fragOffsetX) < 0.1) a.fragOffsetX = 0;
      if (Math.abs(a.fragOffsetY) < 0.1) a.fragOffsetY = 0;

      // Frost timer decay
      if (a.frost) {
        a.frost.remaining -= dt;
        if (a.frost.remaining <= 0) a.frost = null;
      }

      // Recalculer le polygone de collision world-space
      if (a.material?.isBoss) {
        // Core alien : ellipse dynamique (pulse via firePulse)
        a.collisionPoly = computeCorePoly(a, a.firePulse || 0);
      } else if (a.materialKey === 'tentacle') {
        // Tentacule : polygone effilé dynamique (ondulation)
        if (this._core && this._core.alive) {
          const bb = {
            cx: a.x + a.width / 2, cy: a.y + a.height / 2,
            w: a.width, h: a.height,
          };
          a.collisionPoly = computeTentaclePoly(
            bb,
            this._core.x + this._core.width / 2,
            this._core.y + this._core.height / 2,
            a.floatPhase,
          );
        }
      } else if (a.shape) {
        // Astéroïde normal : polygone polaire → cartésien
        const rx = a.width / 2;
        const ry = a.height / 2;
        a.collisionPoly = polarToCartesian(
          a.shape, rx, ry, a.rotation,
          a.x + rx + (a.fragOffsetX || 0),
          a.y + ry + (a.fragOffsetY || 0),
        );
      }
    }
  }

  // --- Compat : délégation vers le builder (utilisé par les tests existants) ---
  _makeAsteroid(col, row, cw, ch, c, mk, frac) { return makeAsteroid(col, row, cw, ch, c, mk, frac); }
  _pickMaterial(c) { return pickMaterial(c); }
}
