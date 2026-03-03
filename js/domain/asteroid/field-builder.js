// --- FieldBuilder : construction et merge glouton d'astéroïdes ---
// Responsabilité unique : transformer une config (random ou pattern) en tableau d'astéroïdes.

import { getMaterial } from '../materials.js';
import { parsePattern } from '../patterns.js';
import { generateShape, generateCraters, generateVeins } from './shape.js';
import { polarToCartesian } from '../shape/polygon-collision.js';

// Types d'astéroïdes : nom, taille en cases, nb cratères, quota (% des cases cibles)
const SIZES = [
  { name: 'large',  cw: 2, ch: 2, craterCount: 6, shapePoints: 16, veinCount: 5, quota: 0.2 },
  { name: 'large',  cw: 3, ch: 1, craterCount: 5, shapePoints: 18, veinCount: 4, quota: 0 },
  { name: 'large',  cw: 1, ch: 3, craterCount: 5, shapePoints: 18, veinCount: 4, quota: 0 },
  { name: 'medium', cw: 2, ch: 1, craterCount: 4, shapePoints: 14, veinCount: 3, quota: 0.17 },
  { name: 'medium', cw: 1, ch: 2, craterCount: 4, shapePoints: 14, veinCount: 3, quota: 0.18 },
  { name: 'small',  cw: 1, ch: 1, craterCount: 2, shapePoints: 10, veinCount: 1, quota: 0.45 },
];

/** Trouve la définition de taille pour un cw×ch donné (fallback → small) */
function findSizeDef(cw, ch) {
  return SIZES.find(s => s.cw === cw && s.ch === ch) || SIZES[3];
}

/** Choisit un matériau selon la distribution du niveau.
 *  Format attendu : { rock: 0.6, ice: 0.2, lava: 0.1, ... }
 *  Si absent, 100% rock.
 */
export function pickMaterial(config) {
  const dist = config.materials;
  if (!dist) return 'rock';
  const r = Math.random();
  let cumul = 0;
  for (const [key, weight] of Object.entries(dist)) {
    cumul += weight;
    if (r < cumul) return key;
  }
  return 'rock'; // fallback
}

/** Fabrique un astéroïde à partir de ses coordonnées grille */
export function makeAsteroid(col, row, cw, ch, c, materialKey = 'rock', fracturedSide = null) {
  const pw = cw * c.cellW + (cw - 1) * c.padding;
  const ph = ch * c.cellH + (ch - 1) * c.padding;
  const px = c.offsetLeft + col * (c.cellW + c.padding);
  const py = c.offsetTop + row * (c.cellH + c.padding);
  const sizeDef = findSizeDef(cw, ch);
  const mat = getMaterial(materialKey);
  const shape = generateShape(sizeDef.shapePoints, fracturedSide);
  const rx = pw / 2;
  const ry = ph / 2;
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
    shape,
    // Polygone de collision world-space (recalculé chaque frame dans update())
    collisionPoly: polarToCartesian(shape, rx, ry, 0, px + rx, py + ry),
    craters: generateCraters(fracturedSide ? Math.max(1, sizeDef.craterCount - 1) : sizeDef.craterCount, pw / 2, ph / 2),
    veins: generateVeins(sizeDef.veinCount, pw / 2, ph / 2),
    rotation: 0, rotSpeed: 0,
    floatPhase: Math.random() * Math.PI * 2,
    floatAmp: 0.3 + Math.random() * 0.4,
    floatFreq: 0.012 + Math.random() * 0.008,
    fragOffsetX: 0, fragOffsetY: 0,
    // Alien : timer de tir (seulement si le matériau a fireRate)
    ...(mat.fireRate ? {
      fireRate: mat.fireRate,
      fireTimer: mat.fireRate * (0.5 + Math.random() * 0.5),
      projectileSpeed: mat.projectileSpeed || 1.5,
    } : {}),
  };
}

/** Génération aléatoire (algo original : gros d'abord) */
export function buildRandom(c) {
  const grid = [];
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
      grid.push(makeAsteroid(col, row, size.cw, size.ch, c, pickMaterial(c)));
    }
  }
  return grid;
}

/** Génération depuis un pattern ASCII : résoudre → merger glouton → créer */
export function buildFromPattern(c) {
  const grid = [];
  const matrix = parsePattern(c.pattern.lines);
  const rows = Math.min(matrix.length, c.rows);
  const cols = Math.min(matrix[0]?.length || 0, c.cols);

  // 1. Résoudre les '?' en matériau aléatoire
  const resolved = Array.from({ length: rows }, (_, r) =>
    Array.from({ length: cols }, (_, col) => {
      const cell = matrix[r]?.[col];
      if (!cell) return null;
      if (cell === '?') return pickMaterial(c);
      return cell;
    })
  );

  // 2. Merger glouton : 2×2, 3×1, 1×3, 2×1, 1×2, 1×1
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
        grid.push(makeAsteroid(col, r, 2, 2, c, m));
      }
    }
  }

  // Passe 3×1 (horizontal)
  for (let r = 0; r < rows; r++) {
    for (let col = 0; col < cols - 2; col++) {
      if (used[r][col]) continue;
      const m = resolved[r][col];
      if (!m) continue;
      if (resolved[r][col + 1] === m && resolved[r][col + 2] === m
          && !used[r][col + 1] && !used[r][col + 2]) {
        used[r][col] = used[r][col + 1] = used[r][col + 2] = true;
        grid.push(makeAsteroid(col, r, 3, 1, c, m));
      }
    }
  }

  // Passe 1×3 (vertical)
  for (let r = 0; r < rows - 2; r++) {
    for (let col = 0; col < cols; col++) {
      if (used[r][col]) continue;
      const m = resolved[r][col];
      if (!m) continue;
      if (resolved[r + 1][col] === m && resolved[r + 2][col] === m
          && !used[r + 1][col] && !used[r + 2][col]) {
        used[r][col] = used[r + 1][col] = used[r + 2][col] = true;
        grid.push(makeAsteroid(col, r, 1, 3, c, m));
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
        grid.push(makeAsteroid(col, r, 2, 1, c, m));
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
        grid.push(makeAsteroid(col, r, 1, 2, c, m));
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
      grid.push(makeAsteroid(col, r, 1, 1, c, m));
    }
  }

  return grid;
}
