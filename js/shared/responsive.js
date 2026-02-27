// --- Responsive scaling ---
// Formule unique pour le scale responsive, clampé à [0.6, 1.0].
// Sur petit écran (400px) : 400/500 = 0.8 → textes lisibles.
// Sur grand écran (800px+) : clampé à 1.0 → pas de surdimensionnement.

import { CONFIG } from '../config.js';

export function gameScale(width = CONFIG.canvas.width) {
  return Math.min(1.0, Math.max(0.6, width / 500));
}
