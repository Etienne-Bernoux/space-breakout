// --- Forme domain d'un tentacule (polygone effilé, ondulation) ---
// Calcule le polygone world-space qui sert à la collision ET guide le rendu.
// Miroir de la logique dans tentacle-draw.js (base large → pointe fine + wave).

/**
 * Calcule le polygone d'un tentacule.
 * @param {{cx:number, cy:number, w:number, h:number}} bb - bounding box du tentacule
 * @param {number} coreCx - centre X du core
 * @param {number} coreCy - centre Y du core
 * @param {number} floatPhase - phase d'animation
 * @returns {Array<{x:number, y:number}>} polygone fermé (gauche → pointe → droite inversé)
 */
export function computeTentaclePoly(bb, coreCx, coreCy, floatPhase) {
  const dx = bb.cx - coreCx;
  const dy = bb.cy - coreCy;
  const dist = Math.hypot(dx, dy) || 1;
  const nx = dx / dist;
  const ny = dy / dist;

  const isHoriz = Math.abs(nx) > Math.abs(ny);
  const halfSpan = isHoriz ? bb.w / 2 : bb.h / 2;
  const baseX = bb.cx - nx * halfSpan;
  const baseY = bb.cy - ny * halfSpan;
  const len = Math.max(bb.w, bb.h);
  const tipX = baseX + nx * len;
  const tipY = baseY + ny * len;

  const baseW = Math.min(bb.w, bb.h) * 0.45;
  const tipW = baseW * 0.15;
  const px = -ny;
  const py = nx;

  const time = floatPhase * 1.5;
  const N = 10;
  const left = [];
  const right = [];

  for (let i = 0; i <= N; i++) {
    const t = i / N;
    const x = baseX + (tipX - baseX) * t;
    const y = baseY + (tipY - baseY) * t;
    const w = baseW * (1 - t * 0.7) + tipW * t;
    const wave = Math.sin(time + t * 4) * t * baseW * 0.25;
    left.push({ x: x + px * (w + wave), y: y + py * (w + wave) });
    right.push({ x: x - px * (w - wave), y: y - py * (w - wave) });
  }

  // Polygone : côté gauche → pointe → côté droit inversé
  const poly = [...left];
  for (let i = right.length - 1; i >= 0; i--) poly.push(right[i]);
  return poly;
}
