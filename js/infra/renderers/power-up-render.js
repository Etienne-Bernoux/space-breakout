// --- Rendu des capsules et HUD power-ups ---

import { getPowerUp } from '../../domain/power-ups.js';
import { drawIcon } from './power-up-icons.js';
import { gameScale } from '../../shared/responsive.js';

/** Dessiner une capsule qui tombe (bob, pulse, sparkles). */
export function drawCapsule(ctx, capsule) {
  if (!capsule.alive) return;
  const def = getPowerUp(capsule.powerUpId);
  if (!def) return;

  const { x, rotation, radius } = capsule;
  const isMalus = def.type === 'malus';
  const t = Date.now() * 0.001;

  // Bob vertical sinusoïdal (flottement ±3px)
  const bob = Math.sin(t * 3 + x * 0.1) * 3;
  const y = capsule.y + bob;

  ctx.save();
  ctx.translate(x, y);

  // Lueur pulsante
  const glowPulse = 1 + Math.sin(t * 4) * 0.3;
  const glow = ctx.createRadialGradient(0, 0, radius * 0.3, 0, 0, radius * 2 * glowPulse);
  glow.addColorStop(0, def.color + '50');
  glow.addColorStop(1, 'transparent');
  ctx.fillStyle = glow;
  ctx.fillRect(-radius * 2.5, -radius * 2.5, radius * 5, radius * 5);

  // Sparkles intermittents (2 mini-étincelles)
  for (let i = 0; i < 2; i++) {
    const sparkPhase = t * 5 + i * 3.14 + x;
    const sparkAlpha = Math.max(0, Math.sin(sparkPhase) * 0.8);
    if (sparkAlpha > 0.1) {
      const sx = Math.cos(sparkPhase * 1.3) * radius * 1.5;
      const sy = Math.sin(sparkPhase * 0.9) * radius * 1.5;
      ctx.fillStyle = `rgba(255, 255, 255, ${sparkAlpha})`;
      ctx.beginPath();
      ctx.arc(sx, sy, 1 + sparkAlpha, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // Capsule (hexagone arrondi)
  ctx.rotate(rotation);
  ctx.beginPath();
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2 - Math.PI / 2;
    const method = i === 0 ? 'moveTo' : 'lineTo';
    ctx[method](Math.cos(a) * radius, Math.sin(a) * radius);
  }
  ctx.closePath();
  ctx.fillStyle = isMalus ? '#331122' : '#112233';
  ctx.fill();

  // Outline pulsant (épaisseur oscille)
  const lineW = 1.5 + Math.sin(t * 5) * 0.8;
  ctx.strokeStyle = def.color;
  ctx.lineWidth = lineW;
  ctx.stroke();

  // Icône
  drawIcon(ctx, def.id, radius * 0.5, def.color);

  ctx.restore();
}

/** Dessiner le HUD des power-ups actifs (sous VIES:, même style). */
export function drawPowerUpHUD(ctx, activeList, canvasWidth = 800) {
  if (activeList.length === 0) return;

  const s = gameScale(canvasWidth);
  const fontSize = Math.round(14 * s);
  const iconSize = Math.round(5 * s);
  const pad = Math.round(15 * s);
  const startY = Math.round(42 * s);
  const lineH = Math.round(18 * s);

  ctx.font = `${fontSize}px monospace`;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';

  for (let i = 0; i < activeList.length; i++) {
    const { id, def, remaining } = activeList[i];
    const y = startY + i * lineH;

    // Icône
    ctx.save();
    ctx.translate(pad + iconSize + 2, y - iconSize * 0.5);
    drawIcon(ctx, id, iconSize, def.color);
    ctx.restore();

    // Texte : nom + timer
    ctx.fillStyle = '#ffffff';
    const textX = pad + iconSize * 2 + 6;
    if (remaining === Infinity) {
      ctx.fillText(def.short, textX, y);
    } else {
      const sec = (remaining / 1000).toFixed(0);
      ctx.fillText(`${def.short} ${sec}s`, textX, y);
    }
  }
}
