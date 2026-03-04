// --- Façade progress lab (?progress) ---

import state from './state.js';
export { drawMineralLab } from './draw.js';
export { handleMineralLabKey } from './handlers.js';

/** Vérifie si ?progress est dans l'URL. */
export function isMineralLabMode() {
  return new URLSearchParams(window.location.search).has('progress');
}

export function isMineralLabActive() {
  return state.active;
}

export function showMineralLab() {
  state.active = true;
}

export function hideMineralLab() {
  state.active = false;
}
