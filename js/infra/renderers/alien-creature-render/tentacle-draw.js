// --- Rendu d'un tentacule logique (forme effilée, ondulation, œil) ---

import { partsBBox } from './utils.js';

/**
 * Trace une forme de tentacule effilée (base large → pointe fine).
 * La tentacule part du corps (base) vers l'extérieur (pointe).
 * Ondulation sinusoïdale animée + pulse au tir.
 */
export function drawTentacle(ctx, parts, core, pulse) {
  const bb = partsBBox(parts);
  if (!core) return;

  const coreCx = core.x + core.width / 2;
  const coreCy = core.y + core.height / 2;

  // Direction : du corps vers l'extrémité du tentacule
  const dx = bb.cx - coreCx;
  const dy = bb.cy - coreCy;
  const dist = Math.hypot(dx, dy) || 1;
  const nx = dx / dist;
  const ny = dy / dist;

  // Base (côté corps) et pointe (côté opposé)
  const baseX = bb.cx - nx * (Math.abs(nx) > Math.abs(ny) ? bb.w / 2 : bb.h / 2);
  const baseY = bb.cy - ny * (Math.abs(nx) > Math.abs(ny) ? bb.w / 2 : bb.h / 2);
  const len = Math.max(bb.w, bb.h);
  const tipX = baseX + nx * len;
  const tipY = baseY + ny * len;

  // Épaisseur : large à la base, fine à la pointe
  const baseW = Math.min(bb.w, bb.h) * 0.45;
  const tipW = baseW * 0.15;

  // Perpendiculaire
  const px = -ny;
  const py = nx;

  // Animation : ondulation + firePulse
  const time = (parts[0].floatPhase || 0) * 1.5;
  const firePulse = Math.max(...parts.map(a => a.firePulse || 0));

  // Générer les points le long du tentacule (10 segments)
  const N = 10;
  const leftPts = [];
  const rightPts = [];
  for (let i = 0; i <= N; i++) {
    const t = i / N;
    const x = baseX + (tipX - baseX) * t;
    const y = baseY + (tipY - baseY) * t;
    const w = baseW * (1 - t * 0.7) + tipW * t;
    const wave = Math.sin(time + t * 4) * t * baseW * 0.25;
    const fireBoost = firePulse * (1 - t) * baseW * 0.3;
    const totalW = w + fireBoost;
    leftPts.push({ x: x + px * (totalW + wave), y: y + py * (totalW + wave) });
    rightPts.push({ x: x - px * (totalW - wave), y: y - py * (totalW - wave) });
  }

  ctx.save();

  // Forme du tentacule (courbe lissée)
  _traceTentaclePath(ctx, leftPts, rightPts, N, tipX, tipY, nx, ny, tipW);

  // Gradient le long du tentacule
  const grad = ctx.createLinearGradient(baseX, baseY, tipX, tipY);
  const fireGlow = firePulse * 0.3;
  grad.addColorStop(0, '#2a4a2a');
  grad.addColorStop(0.3, `rgba(40,${80 + fireGlow * 200},40,1)`);
  grad.addColorStop(0.7, '#1a3a1a');
  grad.addColorStop(1, '#0a2a0a');
  ctx.fillStyle = grad;
  ctx.fill();

  // Clip pour détails internes
  ctx.save();
  ctx.clip();

  _drawVeins(ctx, N, baseX, baseY, tipX, tipY, px, py, time, baseW, pulse, fireGlow);
  _drawEye(ctx, baseX, baseY, tipX, tipY, baseW, pulse, firePulse);

  ctx.restore(); // fin clip

  // Contour organique lumineux
  _traceTentaclePath(ctx, leftPts, rightPts, N, tipX, tipY, nx, ny, tipW);
  ctx.strokeStyle = `rgba(80,255,120,${0.15 + pulse * 0.3 + fireGlow})`;
  ctx.lineWidth = 1.2;
  ctx.stroke();

  // Damage overlay
  const totalHp = parts.reduce((s, a) => s + a.hp, 0);
  const totalMax = parts.reduce((s, a) => s + a.maxHp, 0);
  if (totalHp < totalMax) {
    const dmgRatio = 1 - totalHp / totalMax;
    ctx.save();
    ctx.clip();
    ctx.fillStyle = `rgba(0,0,0,${dmgRatio * 0.35})`;
    ctx.fillRect(bb.x - 5, bb.y - 5, bb.w + 10, bb.h + 10);
    ctx.restore();
  }

  // Shield
  if (parts.some((a) => a.shield)) {
    const sp = 0.6 + Math.sin((parts[0].floatPhase || 0) * 3) * 0.15;
    ctx.strokeStyle = `rgba(50,255,100,${0.3 * sp})`;
    ctx.lineWidth = 3;
    ctx.stroke();
  }

  ctx.restore();
}

// ─── Helpers internes ───

function _traceTentaclePath(ctx, leftPts, rightPts, N, tipX, tipY, nx, ny, tipW) {
  ctx.beginPath();
  ctx.moveTo(leftPts[0].x, leftPts[0].y);
  for (let i = 1; i < leftPts.length; i++) {
    const prev = leftPts[i - 1];
    const cur = leftPts[i];
    ctx.quadraticCurveTo(prev.x, prev.y, (prev.x + cur.x) / 2, (prev.y + cur.y) / 2);
  }
  ctx.lineTo(leftPts[N].x, leftPts[N].y);
  ctx.quadraticCurveTo(tipX + nx * tipW, tipY + ny * tipW, rightPts[N].x, rightPts[N].y);
  for (let i = rightPts.length - 2; i >= 0; i--) {
    const prev = rightPts[i + 1];
    const cur = rightPts[i];
    ctx.quadraticCurveTo(prev.x, prev.y, (prev.x + cur.x) / 2, (prev.y + cur.y) / 2);
  }
  ctx.closePath();
}

function _drawVeins(ctx, N, baseX, baseY, tipX, tipY, px, py, time, baseW, pulse, fireGlow) {
  // Veine centrale bioluminescente
  ctx.beginPath();
  ctx.moveTo(baseX, baseY);
  for (let i = 1; i <= N; i++) {
    const t = i / N;
    const x = baseX + (tipX - baseX) * t;
    const y = baseY + (tipY - baseY) * t;
    const wave = Math.sin(time + t * 4) * t * baseW * 0.08;
    ctx.lineTo(x + px * wave, y + py * wave);
  }
  ctx.strokeStyle = `rgba(80,255,120,${0.35 + pulse + fireGlow})`;
  ctx.lineWidth = 2.5;
  ctx.stroke();
  ctx.strokeStyle = `rgba(50,200,80,${0.12 + pulse * 0.5})`;
  ctx.lineWidth = 6;
  ctx.stroke();

  // Veines secondaires latérales
  for (let i = 2; i < N - 1; i += 2) {
    const t = i / N;
    const x = baseX + (tipX - baseX) * t;
    const y = baseY + (tipY - baseY) * t;
    const w = baseW * (1 - t * 0.6) * 0.6;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + px * w, y + py * w);
    ctx.strokeStyle = `rgba(60,200,90,${0.2 + pulse})`;
    ctx.lineWidth = 1.2;
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x - px * w, y - py * w);
    ctx.stroke();
  }
}

function _drawEye(ctx, baseX, baseY, tipX, tipY, baseW, pulse, firePulse) {
  const eyeT = 0.6;
  const eyeX = baseX + (tipX - baseX) * eyeT;
  const eyeY = baseY + (tipY - baseY) * eyeT;
  const eyeR = baseW * 0.3;
  const eyeFireBoost = firePulse * 0.4;

  ctx.beginPath();
  ctx.arc(eyeX, eyeY, eyeR * 1.2, 0, Math.PI * 2);
  ctx.fillStyle = '#0a1a0a';
  ctx.fill();

  const irisGrad = ctx.createRadialGradient(eyeX, eyeY, 0, eyeX, eyeY, eyeR);
  irisGrad.addColorStop(0, `rgba(${200 + eyeFireBoost * 55},255,100,${0.9 + pulse})`);
  irisGrad.addColorStop(0.6, `rgba(50,220,80,${0.6 + pulse + eyeFireBoost})`);
  irisGrad.addColorStop(1, 'rgba(20,80,30,0.2)');
  ctx.beginPath();
  ctx.arc(eyeX, eyeY, eyeR * (1 + eyeFireBoost * 0.3), 0, Math.PI * 2);
  ctx.fillStyle = irisGrad;
  ctx.fill();

  ctx.beginPath();
  ctx.arc(eyeX, eyeY, eyeR * 0.25, 0, Math.PI * 2);
  ctx.fillStyle = '#001a00';
  ctx.fill();

  // Fire flash — éclat lumineux au tir
  if (firePulse > 0.1) {
    const flashR = eyeR * (1 + firePulse * 2);
    const flashGrad = ctx.createRadialGradient(eyeX, eyeY, 0, eyeX, eyeY, flashR);
    flashGrad.addColorStop(0, `rgba(200,255,150,${firePulse * 0.6})`);
    flashGrad.addColorStop(0.5, `rgba(100,255,100,${firePulse * 0.3})`);
    flashGrad.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.beginPath();
    ctx.arc(eyeX, eyeY, flashR, 0, Math.PI * 2);
    ctx.fillStyle = flashGrad;
    ctx.fill();
  }
}
