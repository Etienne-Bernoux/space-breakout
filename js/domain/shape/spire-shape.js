// --- Forme domain d'un éperon de glace (prisme hexagonal effilé) ---
// Polygone world-space statique (pas d'ondulation) pour collision + guide rendu.
// Base large (hexagonale) côté core → pointe fine côté opposé.

/**
 * Calcule le polygone d'un éperon de glace.
 * @param {{cx:number, cy:number, w:number, h:number}} bb - bounding box de l'éperon
 * @param {number} coreCx - centre X du core
 * @param {number} coreCy - centre Y du core
 * @param {number} _floatPhase - ignoré (forme statique, pas d'ondulation)
 * @returns {Array<{x:number, y:number}>} polygone fermé
 */
export function computeSpirePoly(bb, coreCx, coreCy, _floatPhase) {
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
  const px = -ny;
  const py = nx;

  // Prisme effilé : base hexagonale (3 points par côté) → pointe
  const pts = [
    // Côté gauche : base large → mi-hauteur → pointe
    { x: baseX + px * baseW, y: baseY + py * baseW },
    { x: baseX + nx * len * 0.15 + px * baseW * 1.05, y: baseY + ny * len * 0.15 + py * baseW * 1.05 },
    { x: baseX + nx * len * 0.4 + px * baseW * 0.7, y: baseY + ny * len * 0.4 + py * baseW * 0.7 },
    { x: baseX + nx * len * 0.7 + px * baseW * 0.3, y: baseY + ny * len * 0.7 + py * baseW * 0.3 },
    // Pointe
    { x: tipX, y: tipY },
    // Côté droit (symétrique inversé)
    { x: baseX + nx * len * 0.7 - px * baseW * 0.3, y: baseY + ny * len * 0.7 - py * baseW * 0.3 },
    { x: baseX + nx * len * 0.4 - px * baseW * 0.7, y: baseY + ny * len * 0.4 - py * baseW * 0.7 },
    { x: baseX + nx * len * 0.15 - px * baseW * 1.05, y: baseY + ny * len * 0.15 - py * baseW * 1.05 },
    { x: baseX - px * baseW, y: baseY - py * baseW },
  ];
  return pts;
}
