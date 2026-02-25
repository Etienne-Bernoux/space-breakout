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

/** Dessiner le HUD des power-ups actifs (en haut à gauche, sous le score/vies). */
export function drawPowerUpHUD(ctx, activeList, canvasWidth) {
  if (activeList.length === 0) return;

  const startY = 40;
  const h = 18;

  for (let i = 0; i < activeList.length; i++) {
    const { id, def, remaining } = activeList[i];
    const y = startY + i * h;
    const barW = 60;
    const x = canvasWidth / 2 - barW / 2;

    // Barre de fond
    ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
    ctx.fillRect(x - 2, y, barW + 4, h - 2);

    // Barre de progression
    if (remaining !== Infinity && def.duration > 0) {
      const pct = remaining / def.duration;
      ctx.fillStyle = def.color + '88';
      ctx.fillRect(x, y + 1, barW * pct, h - 4);
    } else {
      ctx.fillStyle = def.color + '66';
      ctx.fillRect(x, y + 1, barW, h - 4);
    }

    // Icône
    ctx.save();
    ctx.translate(x - 10, y + h / 2 - 1);
    drawIcon(ctx, id, 5, def.color);
    ctx.restore();

    // Texte
    ctx.fillStyle = def.color;
    ctx.font = '10px monospace';
    ctx.textAlign = 'center';
    if (remaining === Infinity) {
      ctx.fillText(def.short, x + barW / 2, y + h - 4);
    } else {
      const sec = (remaining / 1000).toFixed(1);
      ctx.fillText(`${def.short} ${sec}s`, x + barW / 2, y + h - 4);
    }
    ctx.textAlign = 'start';
  }
}
