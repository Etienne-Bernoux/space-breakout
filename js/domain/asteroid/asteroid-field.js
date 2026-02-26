import { getMaterial } from '../materials.js';
import { renderAsteroid } from '../asteroid-render.js';
import { parsePattern } from '../patterns.js';
import { generateShape, generateCraters, generateVeins } from './shape.js';

// Types d'astéroïdes : nom, taille en cases, nb cratères, quota (% des cases cibles)
const SIZES = [
  { name: 'large',  cw: 2, ch: 2, craterCount: 6, shapePoints: 16, veinCount: 5, quota: 0.2 },
  { name: 'medium', cw: 2, ch: 1, craterCount: 4, shapePoints: 14, veinCount: 3, quota: 0.17 },
  { name: 'medium', cw: 1, ch: 2, craterCount: 4, shapePoints: 14, veinCount: 3, quota: 0.18 },
  { name: 'small',  cw: 1, ch: 1, craterCount: 2, shapePoints: 10, veinCount: 1, quota: 0.45 },
];

export class AsteroidField {
  /**
   * @param {object} config - { rows, cols, cellW, cellH, padding, offsetTop, offsetLeft, density, colors, materials, pattern }
   *   pattern : { lines: string[] } — optionnel, ASCII art du niveau
   *   Si rows/cols changent, cellW/cellH sont recalculés pour rentrer dans le canvas (800×~400).
   */
  constructor(config) {
    const c = { ...config };

    // --- Calcul dynamique de cellW/cellH si la grille change ---
    const canvasW = 800;
    const areaH = 400; // zone dédiée aux astéroïdes (haut du canvas)
    if (!c.cellW || c._autoSize) {
      c.cellW = Math.floor((canvasW - 2 * c.offsetLeft - (c.cols - 1) * c.padding) / c.cols);
    }
    if (!c.cellH || c._autoSize) {
      c.cellH = Math.floor((areaH - c.offsetTop - (c.rows - 1) * c.padding) / c.rows);
    }

    this.config = c;
    this.grid = [];

    if (c.pattern && c.pattern.lines) {
      this._buildFromPattern(c);
    } else {
      this._buildRandom(c);
    }
  }

  /** Génération aléatoire (algo original : gros d'abord) */
  _buildRandom(c) {
    const density = c.density;
    const occupied = Array.from({ length: c.rows }, () => Array(c.cols).fill(false));
    const totalCells = c.rows * c.cols;
    let filledCells = 0;
    const targetCells = Math.floor(totalCells * density);

    for (const size of SIZES) {
      const quotaCells = Math.floor(targetCells * size.quota);
      let sizeFilled = 0;
      const maxAttempts = totalCells * 10;
      for (let attempt = 0; attempt < maxAttempts && filledCells < targetCells && sizeFilled < quotaCells; attempt++) {
        const row = Math.floor(Math.random() * c.rows);
        const col = Math.floor(Math.random() * c.cols);
        if (row + size.ch > c.rows || col + size.cw > c.cols) continue;
        let fits = true;
        for (let dr = 0; dr < size.ch && fits; dr++) {
          for (let dc = 0; dc < size.cw && fits; dc++) {
            if (occupied[row + dr][col + dc]) fits = false;
          }
        }
        if (!fits) continue;
        for (let dr = 0; dr < size.ch; dr++) {
          for (let dc = 0; dc < size.cw; dc++) {
            occupied[row + dr][col + dc] = true;
          }
        }
        filledCells += size.cw * size.ch;
        sizeFilled += size.cw * size.ch;
        const matKey = this._pickMaterial(c);
        this.grid.push(this._makeAsteroid(col, row, size.cw, size.ch, c, matKey));
      }
    }
  }

  /** Génération depuis un pattern ASCII : résoudre → merger → créer */
  _buildFromPattern(c) {
    const matrix = parsePattern(c.pattern.lines);
    const rows = Math.min(matrix.length, c.rows);
    const cols = Math.min(matrix[0]?.length || 0, c.cols);

    // 1. Résoudre les '?' en matériau aléatoire
    const resolved = Array.from({ length: rows }, (_, r) =>
      Array.from({ length: cols }, (_, col) => {
        const cell = matrix[r]?.[col];
        if (!cell) return null;
        if (cell === '?') return this._pickMaterial(c);
        return cell;
      })
    );

    // 2. Merger glouton : 2×2, puis 2×1/1×2, puis 1×1
    const used = Array.from({ length: rows }, () => Array(cols).fill(false));

    // Passe 2×2
    for (let r = 0; r < rows - 1; r++) {
      for (let col = 0; col < cols - 1; col++) {
        if (used[r][col]) continue;
        const m = resolved[r][col];
        if (!m) continue;
        if (resolved[r][col + 1] === m && resolved[r + 1][col] === m && resolved[r + 1][col + 1] === m
            && !used[r][col + 1] && !used[r + 1][col] && !used[r + 1][col + 1]) {
          used[r][col] = used[r][col + 1] = used[r + 1][col] = used[r + 1][col + 1] = true;
          this.grid.push(this._makeAsteroid(col, r, 2, 2, c, m));
        }
      }
    }

    // Passe 2×1 (horizontal)
    for (let r = 0; r < rows; r++) {
      for (let col = 0; col < cols - 1; col++) {
        if (used[r][col]) continue;
        const m = resolved[r][col];
        if (!m) continue;
        if (resolved[r][col + 1] === m && !used[r][col + 1]) {
          used[r][col] = used[r][col + 1] = true;
          this.grid.push(this._makeAsteroid(col, r, 2, 1, c, m));
        }
      }
    }

    // Passe 1×2 (vertical)
    for (let r = 0; r < rows - 1; r++) {
      for (let col = 0; col < cols; col++) {
        if (used[r][col]) continue;
        const m = resolved[r][col];
        if (!m) continue;
        if (resolved[r + 1][col] === m && !used[r + 1][col]) {
          used[r][col] = used[r + 1][col] = true;
          this.grid.push(this._makeAsteroid(col, r, 1, 2, c, m));
        }
      }
    }

    // Passe 1×1 (restants)
    for (let r = 0; r < rows; r++) {
      for (let col = 0; col < cols; col++) {
        if (used[r][col]) continue;
        const m = resolved[r][col];
        if (!m) continue;
        used[r][col] = true;
        this.grid.push(this._makeAsteroid(col, r, 1, 1, c, m));
      }
    }
  }

  /** Fabrique un astéroïde à partir de ses coordonnées grille
   *  @param {string} materialKey - clé du matériau ('rock','ice',…)
   *  @param {string|null} fracturedSide - 'left'|'right'|'top'|'bottom' ou null
   */
  _makeAsteroid(col, row, cw, ch, c, materialKey = 'rock', fracturedSide = null) {
    const pw = cw * c.cellW + (cw - 1) * c.padding;
    const ph = ch * c.cellH + (ch - 1) * c.padding;
    const px = c.offsetLeft + col * (c.cellW + c.padding);
    const py = c.offsetTop + row * (c.cellH + c.padding);
    const sizeDef = SIZES.find(s => s.cw === cw && s.ch === ch) || SIZES[3];
    const mat = getMaterial(materialKey);
    return {
      x: px, y: py, baseY: py,
      width: pw, height: ph,
      gridCol: col, gridRow: row, cw, ch,
      alive: true,
      sizeName: sizeDef.name,
      materialKey,
      material: mat,
      hp: mat.hp,
      maxHp: mat.hp,
      destructible: mat.destructible,
      fracturedSide,
      color: mat.colors[Math.floor(Math.random() * mat.colors.length)],
      shape: generateShape(sizeDef.shapePoints, fracturedSide),
      craters: generateCraters(fracturedSide ? Math.max(1, sizeDef.craterCount - 1) : sizeDef.craterCount, pw / 2, ph / 2),
      veins: generateVeins(sizeDef.veinCount, pw / 2, ph / 2),
      rotation: 0, rotSpeed: 0,
      floatPhase: Math.random() * Math.PI * 2,
      floatAmp: 0.3 + Math.random() * 0.4,
      floatFreq: 0.012 + Math.random() * 0.008,
      fragOffsetX: 0, fragOffsetY: 0,
    };
  }

  /** Choisit un matériau selon la distribution du niveau (config.materials)
   *  Format attendu : { rock: 0.6, ice: 0.2, lava: 0.1, ... }
   *  Si absent, 100% rock.
   */
  _pickMaterial(c) {
    const dist = c.materials;
    if (!dist) return 'rock';
    const r = Math.random();
    let cumul = 0;
    for (const [key, weight] of Object.entries(dist)) {
      cumul += weight;
      if (r < cumul) return key;
    }
    return 'rock'; // fallback
  }

  /** Nombre d'astéroïdes destructibles encore vivants */
  get remaining() {
    return this.grid.filter((a) => a.alive && a.destructible).length;
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
    const sepForce = 3; // force de séparation initiale

    const mk = asteroid.materialKey;

    if (cw === 2 && ch === 2) {
      // Large 2×2 → medium (2×1) + small (1×1)
      const medRow = hitRow === 0 ? 1 : 0;
      const medFrac = hitRow === 0 ? 'top' : 'bottom';
      const med = this._makeAsteroid(gridCol, gridRow + medRow, 2, 1, c, mk, medFrac);
      med.fragOffsetY = (medRow - hitRow) * sepForce;
      fragments.push(med);
      const smlCol = hitCol === 0 ? 1 : 0;
      const smlFrac = hitCol === 0 ? 'left' : 'right';
      const sml = this._makeAsteroid(gridCol + smlCol, gridRow + hitRow, 1, 1, c, mk, smlFrac);
      sml.fragOffsetX = (smlCol - hitCol) * sepForce;
      fragments.push(sml);
    } else if (cw === 2 && ch === 1) {
      const smlCol = hitCol === 0 ? 1 : 0;
      const smlFrac = hitCol === 0 ? 'left' : 'right';
      const sml = this._makeAsteroid(gridCol + smlCol, gridRow, 1, 1, c, mk, smlFrac);
      sml.fragOffsetX = (smlCol - hitCol) * sepForce;
      fragments.push(sml);
    } else if (cw === 1 && ch === 2) {
      const smlRow = hitRow === 0 ? 1 : 0;
      const smlFrac = hitRow === 0 ? 'top' : 'bottom';
      const sml = this._makeAsteroid(gridCol, gridRow + smlRow, 1, 1, c, mk, smlFrac);
      sml.fragOffsetY = (smlRow - hitRow) * sepForce;
      fragments.push(sml);
    }

    // Hériter la couleur du parent
    for (const f of fragments) {
      f.color = asteroid.color;
    }

    this.grid.push(...fragments);
    return fragments;
  }

  update() {
    for (const a of this.grid) {
      if (!a.alive) continue;
      a.rotation += a.rotSpeed;
      a.floatPhase += a.floatFreq;
      a.y = a.baseY + Math.sin(a.floatPhase) * a.floatAmp;
      // Décroissance de l'offset de fragmentation
      a.fragOffsetX *= 0.9;
      a.fragOffsetY *= 0.9;
      if (Math.abs(a.fragOffsetX) < 0.1) a.fragOffsetX = 0;
      if (Math.abs(a.fragOffsetY) < 0.1) a.fragOffsetY = 0;
    }
  }

  // Trace le contour lissé (courbes de Bézier quadratiques)
  _tracePath(ctx, shape, rx, ry) {
    const n = shape.length;
    const pts = shape.map(({ angle, jitter }) => ({
      x: Math.cos(angle) * rx * jitter,
      y: Math.sin(angle) * ry * jitter,
    }));
    // Point milieu entre le dernier et le premier
    const mx = (pts[n - 1].x + pts[0].x) / 2;
    const my = (pts[n - 1].y + pts[0].y) / 2;
    ctx.beginPath();
    ctx.moveTo(mx, my);
    for (let i = 0; i < n; i++) {
      const next = pts[(i + 1) % n];
      const midX = (pts[i].x + next.x) / 2;
      const midY = (pts[i].y + next.y) / 2;
      ctx.quadraticCurveTo(pts[i].x, pts[i].y, midX, midY);
    }
    ctx.closePath();
  }

  draw(ctx) {
    const tp = this._tracePath.bind(this);
    for (const a of this.grid) {
      if (!a.alive) continue;
      const cx = a.x + a.width / 2 + (a.fragOffsetX || 0);
      const cy = a.y + a.height / 2 + (a.fragOffsetY || 0);
      const rx = a.width / 2;
      const ry = a.height / 2;
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(a.rotation);
      renderAsteroid(ctx, a, rx, ry, tp);
      ctx.restore();
    }
  }
}
