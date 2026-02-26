// --- Rendu des capsules et HUD power-ups ---

import { getPowerUp } from '../domain/power-ups.js';
import { drawIcon } from './power-up-icons.js';

/** Dessiner une capsule qui tombe. */
export function drawCapsule(ctx, capsule) {
  if (!capsule.alive) return;
  const def = getPowerUp(capsule.powerUpId);
  if (!def) return;

  const { x, y, rotation, radius } = capsule;
  const isMalus = def.type === 'malus';

  ctx.save();
  ctx.translate(x, y);

  // Lueur
  const glow = ctx.createRadialGradient(0, 0, radius * 0.3, 0, 0, radius * 2);
  glow.addColorStop(0, def.color + '40');
  glow.addColorStop(1, 'transparent');
  ctx.fillStyle = glow;
  ctx.fillRect(-radius * 2, -radius * 2, radius * 4, radius * 4);

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
  ctx.strokeStyle = def.color;
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // Icône
  drawIcon(ctx, def.id, radius * 0.5, def.color);

  ctx.restore();
}

/** Dessiner le HUD des power-ups actifs (sous VIES:, même style). */
export function drawPowerUpHUD(ctx, activeList, canvasWidth = 800) {
  if (activeList.length === 0) return;

  const s = Math.min(1.0, Math.max(0.6, canvasWidth / 500));
  const fontSize = Math.round(14 * s);
  const iconSize = Math.round(5 * s);
  const pad = Math.round(15 * s);
  const startY = Math.round(42 * s);
  const lineH = Math.round(18 * s);

  ctx.font = `${fontSize}px monospace`;

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
