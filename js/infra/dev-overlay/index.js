// --- Dev Overlay Index : Public API ---
// Overlay in-game (?dev, desktop only) pour activer les power-ups

import { isDevMode } from '../dev-panel/index.js';
import { drawDevOverlay } from './draw.js';
import { handleOverlayTap, handleOverlayHover } from './handlers.js';

/** L'overlay est actif si mode dev + desktop (pas mobile) */
export function isDevOverlayActive() {
  return isDevMode() && !('ontouchstart' in window);
}

export { drawDevOverlay, handleOverlayTap, handleOverlayHover };
