// --- Dev Overlay Draw ---
// Dessine les boutons power-up + vie par-dessus le jeu

import { getPowerUp } from '../../domain/power-ups.js';
import state from './state.js';

export function drawDevOverlay(ctx) {
  ctx.save();
  ctx.font = '11px monospace';
  ctx.textBaseline = 'middle';

  for (const btn of state.buttons) {
    const hovered = state.hovered === btn.id;
    const alpha = hovered ? 0.85 : 0.55;

    // Fond du bouton
    if (btn.type === 'powerup') {
      const def = getPowerUp(btn.id);
      ctx.fillStyle = hexToRgba(def?.color || '#888', alpha);
    } else {
      ctx.fillStyle = `rgba(100,100,100,${alpha})`;
    }
    ctx.fillRect(btn.x, btn.y, btn.w, btn.h);

    // Bordure
    ctx.strokeStyle = hovered ? '#fff' : 'rgba(255,255,255,0.3)';
    ctx.lineWidth = 1;
    ctx.strokeRect(btn.x, btn.y, btn.w, btn.h);

    // Texte
    ctx.fillStyle = '#fff';
    const label = btn.type === 'powerup'
      ? (getPowerUp(btn.id)?.short || btn.id)
      : btn.label;
    ctx.fillText(label, btn.x + 4, btn.y + btn.h / 2);
  }

  ctx.restore();
}

function hexToRgba(hex, alpha) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}
