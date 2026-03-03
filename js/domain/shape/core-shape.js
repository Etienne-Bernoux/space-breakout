// --- Forme domain du core alien (ellipse approximée en polygone) ---

/**
 * Calcule le polygone d'un core alien (ellipse ~12 points).
 * @param {{x:number, y:number, width:number, height:number}} core
 * @param {number} pulse - amplitude de pulsation (0–0.3 typique)
 * @returns {Array<{x:number, y:number}>}
 */
export function computeCorePoly(core, pulse = 0) {
  const cx = core.x + core.width / 2;
  const cy = core.y + core.height / 2;
  const rx = (core.width / 2) * (1 + pulse * 0.1);
  const ry = (core.height / 2) * (1 + pulse * 0.1);
  const N = 12;
  const poly = [];
  for (let i = 0; i < N; i++) {
    const angle = (i / N) * Math.PI * 2;
    poly.push({
      x: cx + Math.cos(angle) * rx,
      y: cy + Math.sin(angle) * ry,
    });
  }
  return poly;
}
