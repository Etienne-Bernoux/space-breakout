// --- Géométrie de collision polygon ↔ circle ---
// Fonctions pures, zéro dépendance. Polygone = [{x, y}] en world-space.

/**
 * Convertit une forme polaire [{angle, jitter}] en polygone cartésien world-space.
 * @param {Array<{angle:number, jitter:number}>} shape - points polaires
 * @param {number} rx - demi-largeur
 * @param {number} ry - demi-hauteur
 * @param {number} rotation - rotation en radians
 * @param {number} cx - centre X world
 * @param {number} cy - centre Y world
 * @returns {Array<{x:number, y:number}>}
 */
export function polarToCartesian(shape, rx, ry, rotation, cx, cy) {
  const cos = Math.cos(rotation);
  const sin = Math.sin(rotation);
  return shape.map(({ angle, jitter }) => {
    const lx = Math.cos(angle) * rx * jitter;
    const ly = Math.sin(angle) * ry * jitter;
    return {
      x: cx + lx * cos - ly * sin,
      y: cy + lx * sin + ly * cos,
    };
  });
}

/**
 * AABB d'un polygone (broadphase).
 * @param {Array<{x:number, y:number}>} poly
 * @returns {{x:number, y:number, w:number, h:number}}
 */
export function polyBounds(poly) {
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
  for (const p of poly) {
    if (p.x < x0) x0 = p.x;
    if (p.y < y0) y0 = p.y;
    if (p.x > x1) x1 = p.x;
    if (p.y > y1) y1 = p.y;
  }
  return { x: x0, y: y0, w: x1 - x0, h: y1 - y0 };
}

/**
 * Point-in-polygon (ray casting, gère concave).
 * @param {number} px
 * @param {number} py
 * @param {Array<{x:number, y:number}>} poly
 * @returns {boolean}
 */
export function pointInPolygon(px, py, poly) {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const xi = poly[i].x, yi = poly[i].y;
    const xj = poly[j].x, yj = poly[j].y;
    if ((yi > py) !== (yj > py) &&
        px < (xj - xi) * (py - yi) / (yj - yi) + xi) {
      inside = !inside;
    }
  }
  return inside;
}

/**
 * Distance² minimale entre un point et un segment [a, b].
 */
function distSqPointToSegment(px, py, ax, ay, bx, by) {
  const dx = bx - ax;
  const dy = by - ay;
  const lenSq = dx * dx + dy * dy;
  if (lenSq === 0) return (px - ax) ** 2 + (py - ay) ** 2;
  let t = ((px - ax) * dx + (py - ay) * dy) / lenSq;
  t = Math.max(0, Math.min(1, t));
  const projX = ax + t * dx;
  const projY = ay + t * dy;
  return (px - projX) ** 2 + (py - projY) ** 2;
}

/**
 * Cercle intersecte polygone (narrowphase).
 * Vrai si : centre dans le polygone OU un edge à distance < r.
 * @param {number} cx - centre cercle X
 * @param {number} cy - centre cercle Y
 * @param {number} r  - rayon cercle
 * @param {Array<{x:number, y:number}>} poly
 * @returns {boolean}
 */
export function circleIntersectsPolygon(cx, cy, r, poly) {
  // 1. Centre dans le polygone → intersection directe
  if (pointInPolygon(cx, cy, poly)) return true;

  // 2. Un edge du polygone touche le cercle
  const rSq = r * r;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    if (distSqPointToSegment(cx, cy, poly[i].x, poly[i].y, poly[j].x, poly[j].y) <= rSq) {
      return true;
    }
  }
  return false;
}
