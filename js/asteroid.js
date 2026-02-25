import { CONFIG } from './config.js';

// --- Helpers couleur ---
function parseHex(hex) {
  const h = hex.replace('#', '');
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
}
function clamp(v) { return Math.max(0, Math.min(255, Math.round(v))); }
function lighten(hex, amt) {
  const [r, g, b] = parseHex(hex);
  return `rgb(${clamp(r + amt)},${clamp(g + amt)},${clamp(b + amt)})`;
}
function darken(hex, amt) {
  const [r, g, b] = parseHex(hex);
  return `rgb(${clamp(r - amt)},${clamp(g - amt)},${clamp(b - amt)})`;
}

// Génère un polygone irrégulier (seed par astéroïde)
function generateShape(numPoints) {
  const points = [];
  for (let i = 0; i < numPoints; i++) {
    const angle = (i / numPoints) * Math.PI * 2;
    const jitter = 0.7 + Math.random() * 0.5;
    points.push({ angle, jitter });
  }
  return points;
}

// Types d'astéroïdes : nom, taille en cases, nb cratères, quota (% des cases cibles)
const SIZES = [
  { name: 'large',  cw: 2, ch: 2, craterCount: 5, shapePoints: 12, quota: 0.2 },
  { name: 'medium', cw: 2, ch: 1, craterCount: 3, shapePoints: 10, quota: 0.17 },
  { name: 'medium', cw: 1, ch: 2, craterCount: 3, shapePoints: 10, quota: 0.18 },
  { name: 'small',  cw: 1, ch: 1, craterCount: 2, shapePoints: 8,  quota: 0.45 },
];

function generateCraters(count, rx, ry) {
  const craters = [];
  for (let i = 0; i < count; i++) {
    craters.push({
      ox: (Math.random() - 0.5) * 0.6,
      oy: (Math.random() - 0.5) * 0.6,
      r: 1.5 + Math.random() * (rx > 40 ? 3 : 1.5),
    });
  }
  return craters;
}

export class AsteroidField {
  constructor(config = {}) {
    const c = CONFIG.asteroids;
    const density = config.density ?? c.density;
    this.grid = [];

    // Grille d'occupation (true = case prise)
    const occupied = Array.from({ length: c.rows }, () => Array(c.cols).fill(false));
    const totalCells = c.rows * c.cols;
    let filledCells = 0;
    const targetCells = Math.floor(totalCells * density);

    // --- Algo : place les gros d'abord, puis moyens, puis petits ---
    for (const size of SIZES) {
      const quotaCells = Math.floor(targetCells * size.quota);
      let sizeFilled = 0;
      const maxAttempts = totalCells * 10;
      for (let attempt = 0; attempt < maxAttempts && filledCells < targetCells && sizeFilled < quotaCells; attempt++) {
        const row = Math.floor(Math.random() * c.rows);
        const col = Math.floor(Math.random() * c.cols);

        // Vérifie que toutes les cases nécessaires sont libres
        if (row + size.ch > c.rows || col + size.cw > c.cols) continue;
        let fits = true;
        for (let dr = 0; dr < size.ch && fits; dr++) {
          for (let dc = 0; dc < size.cw && fits; dc++) {
            if (occupied[row + dr][col + dc]) fits = false;
          }
        }
        if (!fits) continue;

        // Marquer les cases comme occupées
        for (let dr = 0; dr < size.ch; dr++) {
          for (let dc = 0; dc < size.cw; dc++) {
            occupied[row + dr][col + dc] = true;
          }
        }
        const cellCount = size.cw * size.ch;
        filledCells += cellCount;
        sizeFilled += cellCount;

        // Calculer les dimensions pixel
        const pw = size.cw * c.cellW + (size.cw - 1) * c.padding;
        const ph = size.ch * c.cellH + (size.ch - 1) * c.padding;
        const px = c.offsetLeft + col * (c.cellW + c.padding);
        const py = c.offsetTop + row * (c.cellH + c.padding);

        this.grid.push({
          x: px, y: py, baseY: py,
          width: pw, height: ph,
          alive: true,
          sizeName: size.name,
          color: c.colors[Math.floor(Math.random() * c.colors.length)],
          shape: generateShape(size.shapePoints),
          craters: generateCraters(size.craterCount, pw / 2, ph / 2),
          rotation: 0, rotSpeed: 0,
          floatPhase: Math.random() * Math.PI * 2,
          floatAmp: 0.3 + Math.random() * 0.4,
          floatFreq: 0.012 + Math.random() * 0.008,
        });
      }
    }
  }

  get remaining() {
    return this.grid.filter((a) => a.alive).length;
  }

  update() {
    for (const a of this.grid) {
      if (!a.alive) continue;
      a.rotation += a.rotSpeed;
      a.floatPhase += a.floatFreq;
      a.y = a.baseY + Math.sin(a.floatPhase) * a.floatAmp;
    }
  }

  draw(ctx) {
    for (const a of this.grid) {
      if (!a.alive) continue;

      const cx = a.x + a.width / 2;
      const cy = a.y + a.height / 2;
      const rx = a.width / 2;
      const ry = a.height / 2;

      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(a.rotation);

      // --- Forme irrégulière (path réutilisé) ---
      ctx.beginPath();
      for (let i = 0; i < a.shape.length; i++) {
        const { angle, jitter } = a.shape[i];
        const px = Math.cos(angle) * rx * jitter;
        const py = Math.sin(angle) * ry * jitter;
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.closePath();

      // Dégradé radial (lumière haut-gauche)
      const grad = ctx.createRadialGradient(-rx * 0.3, -ry * 0.3, 2, 0, 0, rx);
      grad.addColorStop(0, lighten(a.color, 40));
      grad.addColorStop(0.6, a.color);
      grad.addColorStop(1, darken(a.color, 40));
      ctx.fillStyle = grad;
      ctx.fill();

      // Contour côté ombre (bas-droit plus sombre)
      ctx.strokeStyle = 'rgba(255,255,255,0.12)';
      ctx.lineWidth = 1;
      ctx.stroke();

      // --- Cratères avec relief ---
      for (const c of a.craters) {
        const crx = rx * c.ox;
        const cry = ry * c.oy;
        // Ombre du cratère
        ctx.fillStyle = 'rgba(0,0,0,0.35)';
        ctx.beginPath();
        ctx.arc(crx, cry, c.r, 0, Math.PI * 2);
        ctx.fill();
        // Highlight bord supérieur
        ctx.strokeStyle = 'rgba(255,255,255,0.12)';
        ctx.lineWidth = 0.8;
        ctx.beginPath();
        ctx.arc(crx, cry, c.r, Math.PI * 1.1, Math.PI * 1.9);
        ctx.stroke();
      }

      ctx.restore();
    }
  }
}
