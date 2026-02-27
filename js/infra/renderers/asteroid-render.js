// --- Rendu visuel des astéroïdes par matériau ---
// Chaque style reçoit (ctx, a, rx, ry, tracePath) et dessine dans le repère local.

import {
  lighten, darken,
  drawVeins, drawCraters, drawRim,
  drawFractureGlow, drawDamageOverlay,
} from './asteroid-render-helpers.js';

// Re-export pour les consommateurs existants
export { lighten, darken };

// ========== Styles par matériau ==========

function styleRock(ctx, a, rx, ry, tp) {
  tp(ctx, a.shape, rx, ry);
  const grad = ctx.createRadialGradient(-rx * 0.35, -ry * 0.35, 1, 0, 0, Math.max(rx, ry));
  grad.addColorStop(0, lighten(a.color, 55));
  grad.addColorStop(0.35, lighten(a.color, 15));
  grad.addColorStop(0.7, a.color);
  grad.addColorStop(1, darken(a.color, 50));
  ctx.fillStyle = grad;
  ctx.fill();
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
  tp(ctx, a.shape, rx, ry);
  const grad = ctx.createRadialGradient(-rx * 0.3, -ry * 0.3, 1, 0, 0, Math.max(rx, ry));
  grad.addColorStop(0, 'rgba(200,230,255,0.9)');
  grad.addColorStop(0.4, lighten(a.color, 40));
  grad.addColorStop(0.8, a.color);
  grad.addColorStop(1, darken(a.color, 30));
  ctx.fillStyle = grad;
  ctx.fill();
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
  const spec = ctx.createRadialGradient(-rx * 0.25, -ry * 0.3, 0, -rx * 0.2, -ry * 0.2, rx * 0.4);
  spec.addColorStop(0, 'rgba(255,255,255,0.5)');
  spec.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = spec;
  ctx.fillRect(-rx, -ry, rx * 2, ry * 2);
  ctx.restore();
  drawRim(ctx, tp, a, rx, ry, 0.3, 0.15);
}

function styleLava(ctx, a, rx, ry, tp) {
  tp(ctx, a.shape, rx, ry);
  const grad = ctx.createRadialGradient(-rx * 0.3, -ry * 0.3, 1, 0, 0, Math.max(rx, ry));
  grad.addColorStop(0, lighten(a.color, 60));
  grad.addColorStop(0.3, a.color);
  grad.addColorStop(0.7, darken(a.color, 30));
  grad.addColorStop(1, darken(a.color, 60));
  ctx.fillStyle = grad;
  ctx.fill();
  ctx.save();
  tp(ctx, a.shape, rx, ry);
  ctx.clip();
  drawVeins(ctx, a.veins, 'rgba(255,160,30,0.5)', 'rgba(255,220,80,0.3)');
  drawCraters(ctx, a, rx, ry);
  const pulse = 0.08 + Math.sin(a.floatPhase * 3) * 0.04;
  ctx.fillStyle = `rgba(255,100,20,${pulse})`;
  ctx.fillRect(-rx, -ry, rx * 2, ry * 2);
  ctx.restore();
  drawRim(ctx, tp, a, rx, ry, 0.1, 0.3);
  drawFractureGlow(ctx, tp, a, rx, ry, 'rgba(255,200,50,0.4)');
  drawDamageOverlay(ctx, tp, a, rx, ry);
}

function styleMetal(ctx, a, rx, ry, tp) {
  tp(ctx, a.shape, rx, ry);
  const grad = ctx.createLinearGradient(-rx, -ry, rx, ry);
  grad.addColorStop(0, lighten(a.color, 70));
  grad.addColorStop(0.3, lighten(a.color, 30));
  grad.addColorStop(0.5, a.color);
  grad.addColorStop(0.7, darken(a.color, 20));
  grad.addColorStop(1, darken(a.color, 45));
  ctx.fillStyle = grad;
  ctx.fill();
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
  drawRim(ctx, tp, a, rx, ry, 0.25, 0.35);
  drawDamageOverlay(ctx, tp, a, rx, ry);
}

function styleCrystal(ctx, a, rx, ry, tp) {
  tp(ctx, a.shape, rx, ry);
  const grad = ctx.createRadialGradient(-rx * 0.2, -ry * 0.2, 1, 0, 0, Math.max(rx, ry));
  grad.addColorStop(0, lighten(a.color, 80));
  grad.addColorStop(0.3, lighten(a.color, 30));
  grad.addColorStop(0.6, a.color);
  grad.addColorStop(1, darken(a.color, 40));
  ctx.fillStyle = grad;
  ctx.fill();
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
  tp(ctx, a.shape, rx, ry);
  const grad = ctx.createRadialGradient(-rx * 0.3, -ry * 0.3, 1, 0, 0, Math.max(rx, ry));
  grad.addColorStop(0, lighten(a.color, 25));
  grad.addColorStop(0.4, a.color);
  grad.addColorStop(1, darken(a.color, 20));
  ctx.fillStyle = grad;
  ctx.fill();
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
  drawVeins(ctx, a.veins, `rgba(140,60,220,${0.2 + pulse * 0.3})`, 'rgba(180,100,255,0.1)');
  ctx.restore();
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
