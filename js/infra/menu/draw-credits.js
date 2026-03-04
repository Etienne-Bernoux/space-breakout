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
  const t = Date.now() * 0.001;

  ctx.save();
  ctx.textAlign = 'center';

  // Titre avec glow pulsant
  ctx.shadowColor = '#00d4ff';
  ctx.shadowBlur = 12 + Math.sin(t * 2) * 4;
  ctx.fillStyle = '#00d4ff';
  ctx.font = `bold ${Math.round(24 * scale)}px monospace`;
  ctx.fillText('CRÉDITS', cx, h * 0.22);
  ctx.shadowBlur = 0;

  ctx.fillStyle = '#aabbcc';
  ctx.font = `${Math.round(16 * scale)}px monospace`;
  ctx.fillText('Développé par Etienne Bernoux', cx, h * 0.37);

  ctx.fillStyle = '#667788';
  ctx.font = `${Math.round(14 * scale)}px monospace`;
  ctx.fillText('Mission : sécuriser les zones infestées', cx, h * 0.44);
  ctx.fillText('Construit avec Canvas API', cx, h * 0.49);

  // Bouton retour avec glow subtil
  ctx.fillStyle = 'rgba(0, 212, 255, 0.08)';
  ctx.fillRect(btnX, btnY, btnW, btnH);
  ctx.shadowColor = '#00d4ff';
  ctx.shadowBlur = 4;
  ctx.strokeStyle = '#445566';
  ctx.lineWidth = 1;
  ctx.strokeRect(btnX, btnY, btnW, btnH);
  ctx.shadowBlur = 0;
  ctx.font = `${Math.round(14 * scale)}px monospace`;
  ctx.fillStyle = '#8899aa';
  ctx.fillText('RETOUR', cx, btnY + btnH * 0.65);

  ctx.restore();
}
