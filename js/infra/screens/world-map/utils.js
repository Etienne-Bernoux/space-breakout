// Utilitaires géométriques pour la carte du monde.

/** RNG déterministe (seed → nombre entre 0 et 1). */
export function seededRng(seed) {
  let s = seed;
  return () => { s = (s * 16807 + 0) % 2147483647; return (s & 0x7fffffff) / 0x7fffffff; };
}

/** Génère un polygone irrégulier (forme d'astéroïde) autour de (0,0). */
export function asteroidShape(seed, r, points = 8) {
  const rng = seededRng(seed);
  const pts = [];
  for (let i = 0; i < points; i++) {
    const angle = (i / points) * Math.PI * 2;
    const jitter = 0.7 + rng() * 0.5;
    pts.push({ x: Math.cos(angle) * r * jitter, y: Math.sin(angle) * r * jitter });
  }
  return pts;
}

/** Trace un polygone fermé sur le canvas. */
export function tracePoly(ctx, pts, ox, oy) {
  ctx.beginPath();
  ctx.moveTo(ox + pts[0].x, oy + pts[0].y);
  for (let i = 1; i < pts.length; i++) ctx.lineTo(ox + pts[i].x, oy + pts[i].y);
  ctx.closePath();
}
