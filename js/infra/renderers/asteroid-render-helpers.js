// --- Helpers partagés pour le rendu des astéroïdes ---
// Couleurs, veines, cratères, rim, fracture glow, damage overlay.

// --- Helpers couleur ---
function parseHex(hex) {
  const h = hex.replace('#', '');
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
}
function clamp(v) { return Math.max(0, Math.min(255, Math.round(v))); }
export function lighten(hex, amt) {
  const [r, g, b] = parseHex(hex);
  return `rgb(${clamp(r + amt)},${clamp(g + amt)},${clamp(b + amt)})`;
}
export function darken(hex, amt) {
  const [r, g, b] = parseHex(hex);
  return `rgb(${clamp(r - amt)},${clamp(g - amt)},${clamp(b - amt)})`;
}

// --- Parties communes ---

/** Veines de surface (ombres + highlight) */
export function drawVeins(ctx, veins, veinColor = 'rgba(0,0,0,0.15)', hlColor = 'rgba(255,255,255,0.06)') {
  for (const v of veins) {
    ctx.beginPath();
    ctx.moveTo(v.x1, v.y1);
    ctx.quadraticCurveTo(v.cpx, v.cpy, v.x2, v.y2);
    ctx.strokeStyle = veinColor;
    ctx.lineWidth = v.width;
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(v.x1 - 0.5, v.y1 - 0.5);
    ctx.quadraticCurveTo(v.cpx - 0.5, v.cpy - 0.5, v.x2 - 0.5, v.y2 - 0.5);
    ctx.strokeStyle = hlColor;
    ctx.lineWidth = v.width * 0.6;
    ctx.stroke();
  }
}

/** Cratères classiques (ombre + dégradé + rebord) */
export function drawCraters(ctx, a, rx, ry) {
  for (const c of a.craters) {
    const crx = rx * c.ox;
    const cry = ry * c.oy;
    const cr = c.r;
    ctx.fillStyle = 'rgba(0,0,0,0.2)';
    ctx.beginPath();
    ctx.arc(crx + 1, cry + 1, cr + 0.5, 0, Math.PI * 2);
    ctx.fill();
    const cGrad = ctx.createRadialGradient(crx - cr * 0.2, cry - cr * 0.2, 0, crx, cry, cr);
    cGrad.addColorStop(0, darken(a.color, 40 + c.depth * 60));
    cGrad.addColorStop(0.6, darken(a.color, 20 + c.depth * 30));
    cGrad.addColorStop(1, a.color);
    ctx.fillStyle = cGrad;
    ctx.beginPath();
    ctx.arc(crx, cry, cr, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = `rgba(255,255,255,${0.1 + c.depth * 0.15})`;
    ctx.lineWidth = 0.8;
    ctx.beginPath();
    ctx.arc(crx, cry, cr, Math.PI * 0.9, Math.PI * 1.7);
    ctx.stroke();
  }
}

/** Rim lighting standard */
export function drawRim(ctx, tracePath, a, rx, ry, hlAlpha = 0.15, shAlpha = 0.25) {
  tracePath(ctx, a.shape, rx, ry);
  ctx.strokeStyle = `rgba(255,255,255,${hlAlpha})`;
  ctx.lineWidth = 1.2;
  ctx.setLineDash([]);
  ctx.stroke();
  tracePath(ctx, a.shape, rx * 0.98, ry * 0.98);
  ctx.strokeStyle = `rgba(0,0,0,${shAlpha})`;
  ctx.lineWidth = 1.5;
  ctx.stroke();
}

/** Lueur de fracture */
export function drawFractureGlow(ctx, tracePath, a, rx, ry, glowColor = 'rgba(255,140,40,0.35)') {
  if (!a.fracturedSide) return;
  ctx.save();
  tracePath(ctx, a.shape, rx, ry);
  ctx.clip();
  const dir = {
    left: [-rx, 0], right: [rx, 0], top: [0, -ry], bottom: [0, ry],
  }[a.fracturedSide];
  const glow = ctx.createRadialGradient(
    dir[0] * 0.8, dir[1] * 0.8, 0,
    dir[0] * 0.8, dir[1] * 0.8, Math.max(rx, ry) * 0.6
  );
  glow.addColorStop(0, glowColor);
  glow.addColorStop(0.5, glowColor.replace(/[\d.]+\)$/, '0.12)'));
  glow.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = glow;
  ctx.fillRect(-rx, -ry, rx * 2, ry * 2);
  ctx.restore();
}

/** Indicateur de dégât (fissure assombrie proportionnelle aux HP perdus) */
export function drawDamageOverlay(ctx, tracePath, a, rx, ry) {
  if (a.hp >= a.maxHp || !a.destructible) return;
  const dmgRatio = 1 - a.hp / a.maxHp;
  ctx.save();
  tracePath(ctx, a.shape, rx, ry);
  ctx.clip();
  ctx.fillStyle = `rgba(0,0,0,${dmgRatio * 0.3})`;
  ctx.fillRect(-rx, -ry, rx * 2, ry * 2);
  const cracks = Math.floor(dmgRatio * 5) + 1;
  ctx.strokeStyle = `rgba(0,0,0,${0.3 + dmgRatio * 0.4})`;
  ctx.lineWidth = 0.8 + dmgRatio;
  for (let i = 0; i < cracks; i++) {
    const angle = (i / cracks) * Math.PI * 2 + 0.5;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    const len = (0.3 + dmgRatio * 0.5) * Math.min(rx, ry);
    const midA = angle + (Math.random() - 0.5) * 0.4;
    ctx.quadraticCurveTo(
      Math.cos(midA) * len * 0.6, Math.sin(midA) * len * 0.6,
      Math.cos(angle) * len, Math.sin(angle) * len
    );
    ctx.stroke();
  }
  ctx.restore();
}
