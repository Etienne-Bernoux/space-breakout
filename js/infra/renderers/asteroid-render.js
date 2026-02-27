// --- Rendu visuel des astéroïdes par matériau ---
// Chaque style reçoit (ctx, a, rx, ry, tracePath) et dessine dans le repère local.

// --- Helpers couleur (partagés) ---
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

// ========== Parties communes ==========

/** Veines de surface (ombres + highlight) */
function drawVeins(ctx, veins, veinColor = 'rgba(0,0,0,0.15)', hlColor = 'rgba(255,255,255,0.06)') {
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
function drawCraters(ctx, a, rx, ry) {
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
function drawRim(ctx, tracePath, a, rx, ry, hlAlpha = 0.15, shAlpha = 0.25) {
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
function drawFractureGlow(ctx, tracePath, a, rx, ry, glowColor = 'rgba(255,140,40,0.35)') {
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
function drawDamageOverlay(ctx, tracePath, a, rx, ry) {
  if (a.hp >= a.maxHp || !a.destructible) return;
  const dmgRatio = 1 - a.hp / a.maxHp; // 0 = neuf, 1 = presque mort
  ctx.save();
  tracePath(ctx, a.shape, rx, ry);
  ctx.clip();
  // Assombrissement global
  ctx.fillStyle = `rgba(0,0,0,${dmgRatio * 0.3})`;
  ctx.fillRect(-rx, -ry, rx * 2, ry * 2);
  // Fissures radiales
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

// ========== Styles par matériau ==========

function styleRock(ctx, a, rx, ry, tp) {
  // Dégradé radial classique
  tp(ctx, a.shape, rx, ry);
  const grad = ctx.createRadialGradient(-rx * 0.35, -ry * 0.35, 1, 0, 0, Math.max(rx, ry));
  grad.addColorStop(0, lighten(a.color, 55));
  grad.addColorStop(0.35, lighten(a.color, 15));
  grad.addColorStop(0.7, a.color);
  grad.addColorStop(1, darken(a.color, 50));
  ctx.fillStyle = grad;
  ctx.fill();
  // Détails clippés
  ctx.save();
  tp(ctx, a.shape, rx, ry);
  ctx.clip();
  drawVeins(ctx, a.veins);
  drawCraters(ctx, a, rx, ry);
  ctx.restore();
  drawRim(ctx, tp, a, rx, ry);
  drawFractureGlow(ctx, tp, a, rx, ry);
  drawDamageOverlay(ctx, tp, a, rx, ry);
}

function styleIce(ctx, a, rx, ry, tp) {
  // Base translucide bleu
  tp(ctx, a.shape, rx, ry);
  const grad = ctx.createRadialGradient(-rx * 0.3, -ry * 0.3, 1, 0, 0, Math.max(rx, ry));
  grad.addColorStop(0, 'rgba(200,230,255,0.9)');
  grad.addColorStop(0.4, lighten(a.color, 40));
  grad.addColorStop(0.8, a.color);
  grad.addColorStop(1, darken(a.color, 30));
  ctx.fillStyle = grad;
  ctx.fill();
  // Reflets internes (cristaux)
  ctx.save();
  tp(ctx, a.shape, rx, ry);
  ctx.clip();
  for (const v of a.veins) {
    ctx.beginPath();
    ctx.moveTo(v.x1, v.y1);
    ctx.lineTo(v.x2, v.y2);
    ctx.strokeStyle = 'rgba(255,255,255,0.35)';
    ctx.lineWidth = v.width * 0.8;
    ctx.stroke();
  }
  // Éclat spéculaire central
  const spec = ctx.createRadialGradient(-rx * 0.25, -ry * 0.3, 0, -rx * 0.2, -ry * 0.2, rx * 0.4);
  spec.addColorStop(0, 'rgba(255,255,255,0.5)');
  spec.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = spec;
  ctx.fillRect(-rx, -ry, rx * 2, ry * 2);
  ctx.restore();
  // Rim glacé brillant
  drawRim(ctx, tp, a, rx, ry, 0.3, 0.15);
}

function styleLava(ctx, a, rx, ry, tp) {
  // Base roche sombre avec lueur chaude
  tp(ctx, a.shape, rx, ry);
  const grad = ctx.createRadialGradient(-rx * 0.3, -ry * 0.3, 1, 0, 0, Math.max(rx, ry));
  grad.addColorStop(0, lighten(a.color, 60));
  grad.addColorStop(0.3, a.color);
  grad.addColorStop(0.7, darken(a.color, 30));
  grad.addColorStop(1, darken(a.color, 60));
  ctx.fillStyle = grad;
  ctx.fill();
  // Veines incandescentes (orange/jaune)
  ctx.save();
  tp(ctx, a.shape, rx, ry);
  ctx.clip();
  drawVeins(ctx, a.veins, 'rgba(255,160,30,0.5)', 'rgba(255,220,80,0.3)');
  drawCraters(ctx, a, rx, ry);
  // Lueur pulsante globale
  const pulse = 0.08 + Math.sin(a.floatPhase * 3) * 0.04;
  ctx.fillStyle = `rgba(255,100,20,${pulse})`;
  ctx.fillRect(-rx, -ry, rx * 2, ry * 2);
  ctx.restore();
  drawRim(ctx, tp, a, rx, ry, 0.1, 0.3);
  drawFractureGlow(ctx, tp, a, rx, ry, 'rgba(255,200,50,0.4)');
  drawDamageOverlay(ctx, tp, a, rx, ry);
}

function styleMetal(ctx, a, rx, ry, tp) {
  // Base métallique avec reflet spéculaire fort
  tp(ctx, a.shape, rx, ry);
  const grad = ctx.createLinearGradient(-rx, -ry, rx, ry);
  grad.addColorStop(0, lighten(a.color, 70));
  grad.addColorStop(0.3, lighten(a.color, 30));
  grad.addColorStop(0.5, a.color);
  grad.addColorStop(0.7, darken(a.color, 20));
  grad.addColorStop(1, darken(a.color, 45));
  ctx.fillStyle = grad;
  ctx.fill();
  // Reflet spéculaire (highlight blanc net)
  ctx.save();
  tp(ctx, a.shape, rx, ry);
  ctx.clip();
  const spec = ctx.createRadialGradient(-rx * 0.3, -ry * 0.4, 0, -rx * 0.2, -ry * 0.3, rx * 0.35);
  spec.addColorStop(0, 'rgba(255,255,255,0.45)');
  spec.addColorStop(0.5, 'rgba(255,255,255,0.1)');
  spec.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = spec;
  ctx.fillRect(-rx, -ry, rx * 2, ry * 2);
  ctx.restore();
  // Rim métallique prononcé
  drawRim(ctx, tp, a, rx, ry, 0.25, 0.35);
  drawDamageOverlay(ctx, tp, a, rx, ry);
}

function styleCrystal(ctx, a, rx, ry, tp) {
  // Base cristalline avec facettes
  tp(ctx, a.shape, rx, ry);
  const grad = ctx.createRadialGradient(-rx * 0.2, -ry * 0.2, 1, 0, 0, Math.max(rx, ry));
  grad.addColorStop(0, lighten(a.color, 80));
  grad.addColorStop(0.3, lighten(a.color, 30));
  grad.addColorStop(0.6, a.color);
  grad.addColorStop(1, darken(a.color, 40));
  ctx.fillStyle = grad;
  ctx.fill();
  // Facettes internes (lignes droites angulaires)
  ctx.save();
  tp(ctx, a.shape, rx, ry);
  ctx.clip();
  const n = a.shape.length;
  for (let i = 0; i < n; i += 2) {
    const p = a.shape[i];
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(Math.cos(p.angle) * rx * p.jitter, Math.sin(p.angle) * ry * p.jitter);
    ctx.strokeStyle = 'rgba(255,255,255,0.2)';
    ctx.lineWidth = 0.6;
    ctx.stroke();
  }
  // Double éclat spéculaire
  const s1 = ctx.createRadialGradient(-rx * 0.3, -ry * 0.35, 0, 0, 0, rx * 0.5);
  s1.addColorStop(0, 'rgba(255,255,255,0.55)');
  s1.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = s1;
  ctx.fillRect(-rx, -ry, rx * 2, ry * 2);
  const s2 = ctx.createRadialGradient(rx * 0.2, ry * 0.15, 0, rx * 0.2, ry * 0.15, rx * 0.3);
  s2.addColorStop(0, 'rgba(255,200,255,0.3)');
  s2.addColorStop(1, 'rgba(255,200,255,0)');
  ctx.fillStyle = s2;
  ctx.fillRect(-rx, -ry, rx * 2, ry * 2);
  ctx.restore();
  drawRim(ctx, tp, a, rx, ry, 0.3, 0.15);
}

function styleObsidian(ctx, a, rx, ry, tp) {
  // Base noire profonde
  tp(ctx, a.shape, rx, ry);
  const grad = ctx.createRadialGradient(-rx * 0.3, -ry * 0.3, 1, 0, 0, Math.max(rx, ry));
  grad.addColorStop(0, lighten(a.color, 25));
  grad.addColorStop(0.4, a.color);
  grad.addColorStop(1, darken(a.color, 20));
  ctx.fillStyle = grad;
  ctx.fill();
  // Lueur violette inquiétante
  ctx.save();
  tp(ctx, a.shape, rx, ry);
  ctx.clip();
  const pulse = 0.15 + Math.sin(a.floatPhase * 2) * 0.06;
  const glow = ctx.createRadialGradient(0, 0, 0, 0, 0, Math.max(rx, ry) * 0.8);
  glow.addColorStop(0, `rgba(120,40,200,${pulse})`);
  glow.addColorStop(0.6, `rgba(80,20,160,${pulse * 0.4})`);
  glow.addColorStop(1, 'rgba(60,10,120,0)');
  ctx.fillStyle = glow;
  ctx.fillRect(-rx, -ry, rx * 2, ry * 2);
  // Veines violettes
  drawVeins(ctx, a.veins, `rgba(140,60,220,${0.2 + pulse * 0.3})`, 'rgba(180,100,255,0.1)');
  ctx.restore();
  // Rim sombre avec lueur
  tp(ctx, a.shape, rx, ry);
  ctx.strokeStyle = `rgba(120,50,200,${0.2 + pulse * 0.2})`;
  ctx.lineWidth = 1.5;
  ctx.stroke();
}

// ========== Dispatch ==========

const STYLE_MAP = {
  rock: styleRock,
  ice: styleIce,
  lava: styleLava,
  metal: styleMetal,
  crystal: styleCrystal,
  obsidian: styleObsidian,
};

/** Dessine un astéroïde selon son matériau */
export function renderAsteroid(ctx, a, rx, ry, tracePath) {
  const styleFn = STYLE_MAP[a.materialKey] || styleRock;
  styleFn(ctx, a, rx, ry, tracePath);
}
