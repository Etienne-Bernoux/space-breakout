// --- AsteroidField Renderer ---
// Rendu canvas du champ d'astéroïdes, extrait de AsteroidField.draw() + _tracePath()

import { renderAsteroid } from './asteroid-render.js';

// Trace le contour lissé (courbes de Bézier quadratiques)
function tracePath(ctx, shape, rx, ry) {
  const n = shape.length;
  const pts = shape.map(({ angle, jitter }) => ({
    x: Math.cos(angle) * rx * jitter,
    y: Math.sin(angle) * ry * jitter,
  }));
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

export function drawField(ctx, field) {
  for (const a of field.grid) {
    if (!a.alive) continue;
    const cx = a.x + a.width / 2 + (a.fragOffsetX || 0);
    const cy = a.y + a.height / 2 + (a.fragOffsetY || 0);
    const rx = a.width / 2;
    const ry = a.height / 2;
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(a.rotation);
    renderAsteroid(ctx, a, rx, ry, tracePath);
    ctx.restore();
  }
}
