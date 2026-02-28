// Écran de résultat après un niveau — étoiles, temps, boutons.

import { gameScale } from '../../shared/responsive.js';

/** Retourne les hitboxes des deux boutons. */
export function getStatsButtons(W, H) {
  const s = gameScale(W);
  const btnW = Math.round(180 * s);
  const btnH = Math.round(40 * s);
  const gap = Math.round(20 * s);
  const cx = W / 2;
  const baseY = H * 0.72;
  return {
    next: { x: cx - btnW / 2, y: baseY, w: btnW, h: btnH },
    map:  { x: cx - btnW / 2, y: baseY + btnH + gap, w: btnW, h: btnH },
  };
}

/** Dessine l'écran stats. */
export function drawStatsScreen(ctx, W, H, result, animPhase) {
  const s = gameScale(W);

  // Overlay sombre
  ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
  ctx.fillRect(0, 0, W, H);

  ctx.textAlign = 'center';

  // --- Nom du niveau ---
  ctx.fillStyle = '#8b6914';
  ctx.font = `bold ${Math.round(14 * s)}px monospace`;
  ctx.fillText(result.levelName || 'Niveau terminé', W / 2, H * 0.2);

  // --- VICTOIRE ---
  ctx.fillStyle = '#00d4ff';
  ctx.font = `bold ${Math.round(28 * s)}px monospace`;
  ctx.fillText('ZONE NETTOYÉE !', W / 2, H * 0.3);

  // --- Étoiles animées ---
  const starY = H * 0.42;
  const starGap = 40 * s;
  for (let i = 0; i < 3; i++) {
    const earned = i < result.stars;
    // Animation : chaque étoile apparaît avec un délai
    const delay = i * 20;
    const visible = animPhase > delay;
    if (!visible) continue;
    const scale = Math.min(1, (animPhase - delay) / 15);
    ctx.save();
    ctx.translate(W / 2 + (i - 1) * starGap, starY);
    ctx.scale(scale, scale);
    ctx.fillStyle = earned ? '#ffd700' : 'rgba(255,255,255,0.2)';
    ctx.font = `${Math.round(30 * s)}px monospace`;
    ctx.textBaseline = 'middle';
    ctx.fillText('★', 0, 0);
    ctx.restore();
  }

  // --- Stats ---
  ctx.fillStyle = 'rgba(255,255,255,0.7)';
  ctx.font = `${Math.round(13 * s)}px monospace`;
  ctx.textBaseline = 'alphabetic';
  const m = Math.floor(result.timeSpent / 60);
  const sec = result.timeSpent % 60;
  ctx.fillText(`Temps : ${m}:${String(sec).padStart(2, '0')}`, W / 2, H * 0.54);
  ctx.fillText(`Vies perdues : ${result.livesLost}`, W / 2, H * 0.60);

  // --- Boutons ---
  const btns = getStatsButtons(W, H);
  _drawButton(ctx, btns.next, 'NIVEAU SUIVANT', '#00d4ff', s);
  _drawButton(ctx, btns.map, 'CARTE', '#8b6914', s);
}

function _drawButton(ctx, btn, label, color, s) {
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  ctx.strokeRect(btn.x, btn.y, btn.w, btn.h);
  ctx.fillStyle = color;
  ctx.font = `bold ${Math.round(14 * s)}px monospace`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(label, btn.x + btn.w / 2, btn.y + btn.h / 2);
}
