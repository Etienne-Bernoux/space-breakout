import { layout } from './draw-menu.js';

export function creditsBackBtnLayout() {
  const { w, cx, h, scale } = layout();
  const btnW = Math.round(w * 0.5);
  const btnH = Math.round(42 * scale);
  const btnY = h * 0.65;
  return { cx, btnX: cx - btnW / 2, btnY, btnW, btnH, scale };
}

export function drawCreditsScreen(ctx) {
  const { cx, h, scale } = layout();
  const { btnX, btnY, btnW, btnH } = creditsBackBtnLayout();

  ctx.save();
  ctx.textAlign = 'center';

  ctx.fillStyle = '#00d4ff';
  ctx.font = `bold ${Math.round(24 * scale)}px monospace`;
  ctx.fillText('CRÉDITS', cx, h * 0.22);

  ctx.fillStyle = '#aabbcc';
  ctx.font = `${Math.round(16 * scale)}px monospace`;
  ctx.fillText('Développé par Etienne Bernoux', cx, h * 0.37);

  ctx.fillStyle = '#667788';
  ctx.font = `${Math.round(14 * scale)}px monospace`;
  ctx.fillText('Inspiré du casse-briques d\'Adibou', cx, h * 0.44);
  ctx.fillText('Construit avec Canvas API', cx, h * 0.49);

  // Bouton retour
  ctx.fillStyle = 'rgba(0, 212, 255, 0.1)';
  ctx.fillRect(btnX, btnY, btnW, btnH);
  ctx.strokeStyle = '#334455';
  ctx.lineWidth = 1;
  ctx.strokeRect(btnX, btnY, btnW, btnH);
  ctx.font = `${Math.round(14 * scale)}px monospace`;
  ctx.fillStyle = '#667788';
  ctx.fillText('RETOUR', cx, btnY + btnH * 0.65);

  ctx.restore();
}
