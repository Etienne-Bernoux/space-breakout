// --- Détection plateforme centralisée ---
// Source unique pour mobile / desktop / portrait.

let _hasTouch = null;

function hasTouch() {
  if (_hasTouch === null) _hasTouch = typeof window !== 'undefined' && 'ontouchstart' in window;
  return _hasTouch;
}

/** Vrai si l'appareil supporte le touch (mobile/tablette). */
export function isMobile() { return hasTouch(); }

/** Vrai si desktop (pas de touch natif). */
export function isDesktop() { return !hasTouch(); }

/** Vrai si le canvas est en mode portrait (hauteur > largeur). */
export function isPortrait(canvasWidth, canvasHeight) {
  return canvasHeight > canvasWidth;
}
