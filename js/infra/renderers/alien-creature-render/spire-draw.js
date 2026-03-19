// --- Rendu d'un éperon de glace (prisme cristallin angulaire) ---

import { partsBBox } from './utils.js';

/**
 * Dessine un éperon de glace (groupe de parts iceSpire).
 * Forme prismatique effilée, rigide (pas d'ondulation), semi-translucide.
 */
export function drawIceSpire(ctx, parts, core, pulse) {
  const bb = partsBBox(parts);
  if (!core) return;

  const coreCx = core.x + core.width / 2;
  const coreCy = core.y + core.height / 2;

  // Direction : axe long de la bounding box (forme > direction core)
  const dx = bb.cx - coreCx;
  const dy = bb.cy - coreCy;
  // Orientation par direction core→S : latéral si |dx|>|dy|, vertical sinon
  const shapeIsVertical = Math.abs(dy) >= Math.abs(dx);
  const nx = shapeIsVertical ? 0 : (dx >= 0 ? 1 : -1);
  const ny = shapeIsVertical ? (dy < -bb.h ? -1 : 1) : 0;
  const isHoriz = !shapeIsVertical;
  const halfSpan = isHoriz ? bb.w / 2 : bb.h / 2;
  const baseX = bb.cx - nx * halfSpan;
  const baseY = bb.cy - ny * halfSpan;
  const len = Math.max(bb.w, bb.h);
  const baseW = Math.min(bb.w, bb.h) * 0.45;
  const px = -ny;
  const py = nx;

  const firePulse = Math.max(...parts.map(a => a.firePulse || 0));
  const phase = parts[0].floatPhase || 0;
  const fireGlow = firePulse * 0.4;

  // Animation de cristallisation (regen) : croissance de la base vers la pointe
  const regenProgress = Math.min(...parts.map(a => a.regenProgress ?? 1));
  const growLen = len * regenProgress;
  const growTipX = baseX + nx * growLen;
  const growTipY = baseY + ny * growLen;

  ctx.save();
  if (regenProgress < 1) ctx.globalAlpha = 0.4 + regenProgress * 0.6;

  // Forme prismatique (hexagonal effilé)
  const facets = _buildFacets(baseX, baseY, growTipX, growTipY, nx, ny, px, py, growLen, baseW);

  // Tracer la forme externe
  _traceSpirePath(ctx, facets);

  // Gradient cristallin
  const grad = ctx.createLinearGradient(baseX, baseY, growTipX, growTipY);
  grad.addColorStop(0, `rgba(51,153,204,${0.7 + fireGlow})`);
  grad.addColorStop(0.3, `rgba(91,192,235,${0.6 + fireGlow})`);
  grad.addColorStop(0.6, `rgba(136,221,255,${0.5 + fireGlow})`);
  grad.addColorStop(1, `rgba(170,238,255,${0.35})`);
  ctx.fillStyle = grad;
  ctx.fill();

  // Glow à la pointe en cours de croissance
  if (regenProgress < 1) {
    const tipGlow = ctx.createRadialGradient(growTipX, growTipY, 0, growTipX, growTipY, baseW * 1.5);
    tipGlow.addColorStop(0, `rgba(220,245,255,${0.7 * (1 - regenProgress)})`);
    tipGlow.addColorStop(1, 'rgba(91,192,235,0)');
    ctx.fillStyle = tipGlow;
    ctx.beginPath();
    ctx.arc(growTipX, growTipY, baseW * 1.5, 0, Math.PI * 2);
    ctx.fill();
  }

  // Clip pour détails internes
  ctx.save();
  ctx.clip();

  // Refraction lines internes (arêtes cristallines)
  _drawRefractionLines(ctx, baseX, baseY, growTipX, growTipY, nx, ny, px, py, growLen, baseW, phase, pulse);

  // Glow au centre du prisme
  const midX = baseX + nx * growLen * 0.4;
  const midY = baseY + ny * growLen * 0.4;
  const glowR = baseW * 0.6;
  const innerGlow = ctx.createRadialGradient(midX, midY, 0, midX, midY, glowR);
  const glowAlpha = 0.25 + Math.sin(phase * 2) * 0.1 + pulse * 0.15;
  innerGlow.addColorStop(0, `rgba(220,240,255,${Math.min(glowAlpha, 0.6)})`);
  innerGlow.addColorStop(0.5, `rgba(91,192,235,${Math.min(glowAlpha * 0.4, 0.3)})`);
  innerGlow.addColorStop(1, 'rgba(51,153,204,0)');
  ctx.fillStyle = innerGlow;
  ctx.beginPath();
  ctx.arc(midX, midY, glowR, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore(); // fin clip

  // Contour cristallin (arêtes vives)
  _traceSpirePath(ctx, facets);
  ctx.strokeStyle = `rgba(170,221,255,${0.3 + pulse * 0.2 + fireGlow})`;
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // Facette highlight (reflet spéculaire sur un côté)
  const highlightAlpha = 0.15 + Math.sin(phase * 1.5) * 0.08;
  ctx.beginPath();
  ctx.moveTo(facets[0].x, facets[0].y);
  ctx.lineTo(facets[1].x, facets[1].y);
  ctx.lineTo(facets[2].x, facets[2].y);
  ctx.lineTo(baseX, baseY);
  ctx.closePath();
  ctx.fillStyle = `rgba(255,255,255,${Math.min(highlightAlpha, 0.25)})`;
  ctx.fill();

  // Fire flash — éclat blanc-bleu avant tir
  if (firePulse > 0.1) {
    const flashX = baseX + nx * growLen * 0.8;
    const flashY = baseY + ny * growLen * 0.8;
    const flashR = baseW * (0.5 + firePulse * 1.5);
    const flashGrad = ctx.createRadialGradient(flashX, flashY, 0, flashX, flashY, flashR);
    flashGrad.addColorStop(0, `rgba(220,240,255,${firePulse * 0.7})`);
    flashGrad.addColorStop(0.4, `rgba(91,192,235,${firePulse * 0.4})`);
    flashGrad.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = flashGrad;
    ctx.beginPath();
    ctx.arc(flashX, flashY, flashR, 0, Math.PI * 2);
    ctx.fill();
  }

  // Damage overlay
  const totalHp = parts.reduce((s, a) => s + a.hp, 0);
  const totalMax = parts.reduce((s, a) => s + a.maxHp, 0);
  if (totalHp < totalMax) {
    const dmgRatio = 1 - totalHp / totalMax;
    ctx.save();
    _traceSpirePath(ctx, facets);
    ctx.clip();
    ctx.fillStyle = `rgba(0,0,20,${dmgRatio * 0.3})`;
    ctx.fillRect(bb.x - 5, bb.y - 5, bb.w + 10, bb.h + 10);
    // Fractures dans le cristal
    const cracks = Math.floor(dmgRatio * 3) + 1;
    ctx.strokeStyle = `rgba(200,230,255,${0.2 + dmgRatio * 0.3})`;
    ctx.lineWidth = 0.8;
    for (let i = 0; i < cracks; i++) {
      const t = 0.2 + (i / cracks) * 0.6;
      const crackX = baseX + nx * growLen * t;
      const crackY = baseY + ny * growLen * t;
      const crackLen = baseW * (0.3 + dmgRatio * 0.5);
      ctx.beginPath();
      ctx.moveTo(crackX - px * crackLen, crackY - py * crackLen);
      ctx.lineTo(crackX + px * crackLen, crackY + py * crackLen);
      ctx.stroke();
    }
    ctx.restore();
  }

  // Shield givré
  if (parts.some(a => a.shield)) {
    const sp = 0.6 + Math.sin(phase * 3) * 0.15;
    _traceSpirePath(ctx, facets);
    ctx.strokeStyle = `rgba(91,192,235,${0.3 * sp})`;
    ctx.lineWidth = 3;
    ctx.stroke();
  }

  ctx.restore();
}

// ─── Helpers ───

function _buildFacets(baseX, baseY, tipX, tipY, nx, ny, px, py, len, baseW) {
  return [
    { x: baseX + px * baseW, y: baseY + py * baseW },
    { x: baseX + nx * len * 0.15 + px * baseW * 1.05, y: baseY + ny * len * 0.15 + py * baseW * 1.05 },
    { x: baseX + nx * len * 0.4 + px * baseW * 0.7, y: baseY + ny * len * 0.4 + py * baseW * 0.7 },
    { x: baseX + nx * len * 0.7 + px * baseW * 0.3, y: baseY + ny * len * 0.7 + py * baseW * 0.3 },
    { x: tipX, y: tipY },
    { x: baseX + nx * len * 0.7 - px * baseW * 0.3, y: baseY + ny * len * 0.7 - py * baseW * 0.3 },
    { x: baseX + nx * len * 0.4 - px * baseW * 0.7, y: baseY + ny * len * 0.4 - py * baseW * 0.7 },
    { x: baseX + nx * len * 0.15 - px * baseW * 1.05, y: baseY + ny * len * 0.15 - py * baseW * 1.05 },
    { x: baseX - px * baseW, y: baseY - py * baseW },
  ];
}

function _traceSpirePath(ctx, facets) {
  ctx.beginPath();
  ctx.moveTo(facets[0].x, facets[0].y);
  for (let i = 1; i < facets.length; i++) {
    ctx.lineTo(facets[i].x, facets[i].y);
  }
  ctx.closePath();
}

function _drawRefractionLines(ctx, baseX, baseY, tipX, tipY, nx, ny, px, py, len, baseW, phase, pulse) {
  // Arête centrale lumineuse
  ctx.beginPath();
  ctx.moveTo(baseX, baseY);
  ctx.lineTo(tipX, tipY);
  ctx.strokeStyle = `rgba(170,221,255,${0.25 + pulse * 0.15})`;
  ctx.lineWidth = 1.8;
  ctx.stroke();
  ctx.strokeStyle = `rgba(91,192,235,${0.1 + pulse * 0.1})`;
  ctx.lineWidth = 4;
  ctx.stroke();

  // Lignes de réfraction diagonales (facettes internes)
  for (let i = 1; i <= 3; i++) {
    const t = i * 0.22;
    const ox = baseX + nx * len * t;
    const oy = baseY + ny * len * t;
    const w = baseW * (1 - t * 0.7);
    const refAlpha = 0.12 + Math.sin(phase * 2.5 + i * 1.5) * 0.08;
    ctx.beginPath();
    ctx.moveTo(ox + px * w, oy + py * w);
    ctx.lineTo(ox - px * w, oy - py * w);
    ctx.strokeStyle = `rgba(200,235,255,${Math.min(refAlpha, 0.25)})`;
    ctx.lineWidth = 0.8;
    ctx.stroke();
  }
}
