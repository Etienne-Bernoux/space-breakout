// --- Dev Overlay Handlers ---
// Gère les taps/clicks sur les boutons de l'overlay

import { G } from '../../main/init.js';
import state from './state.js';

/** Test si un point (x,y) est dans un bouton */
function hitTest(x, y) {
  for (const btn of state.buttons) {
    if (x >= btn.x && x <= btn.x + btn.w && y >= btn.y && y <= btn.y + btn.h) {
      return btn;
    }
  }
  return null;
}

/** Met à jour le hover */
export function handleOverlayHover(x, y) {
  const btn = hitTest(x, y);
  state.hovered = btn ? btn.id : null;
}

/** Gère un tap/click — retourne true si consommé */
export function handleOverlayTap(x, y) {
  const btn = hitTest(x, y);
  if (!btn) return false;

  if (btn.type === 'powerup') {
    const gs = { ship: G.ship, drones: G.drones, session: G.session, field: G.field };
    G.puManager.activate(btn.id, gs);
  } else if (btn.type === 'life') {
    G.session.lives = Math.max(0, G.session.lives + btn.delta);
  }
  return true;
}
