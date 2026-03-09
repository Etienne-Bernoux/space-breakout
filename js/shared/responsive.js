// --- Responsive scaling ---
// Formule unique pour le scale responsive, clampé à [0.6, 1.0].
// En portrait (mobile), le canvas interne (800px) est CSS-scalé à ~390px,
// donc on applique un multiplicateur pour que les HUD/textes restent lisibles.

import { CONFIG } from '../config.js';

export function gameScale(width = CONFIG.canvas.width) {
  const base = Math.min(1.0, Math.max(0.6, width / 500));
  const portrait = CONFIG.canvas.height > CONFIG.canvas.width;
  return portrait ? base * 1.5 : base;
}
