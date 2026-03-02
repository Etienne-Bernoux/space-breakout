// --- Utilitaires géométriques pour le rendu alien ---

/** Deux astéroïdes sont adjacents si leurs cellules grille se touchent */
export function isAdjacent(a, b) {
  const aRight = a.gridCol + a.cw;
  const aBottom = a.gridRow + a.ch;
  const bRight = b.gridCol + b.cw;
  const bBottom = b.gridRow + b.ch;
  const vOverlap = a.gridRow < bBottom && b.gridRow < aBottom;
  const hOverlap = a.gridCol < bRight && b.gridCol < aRight;
  const hAdj = aRight === b.gridCol || bRight === a.gridCol;
  const vAdj = aBottom === b.gridRow || bBottom === a.gridRow;
  return (vOverlap && hAdj) || (hOverlap && vAdj);
}

/** Bounding box d'un ensemble de parties */
export function partsBBox(parts) {
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
  for (const p of parts) {
    x0 = Math.min(x0, p.x);
    y0 = Math.min(y0, p.y);
    x1 = Math.max(x1, p.x + p.width);
    y1 = Math.max(y1, p.y + p.height);
  }
  return { x: x0, y: y0, w: x1 - x0, h: y1 - y0, cx: (x0 + x1) / 2, cy: (y0 + y1) / 2 };
}
