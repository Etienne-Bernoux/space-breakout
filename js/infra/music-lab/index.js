// --- Music Lab Index : Public API (DOM version) ---

import { isActive, setActive } from './state.js';
import { buildMusicLab } from './build.js';
import { updateMusicLab, updateFooter } from './update.js';
import { attachMusicHandlers } from './handlers.js';

let refs = null;
let rafId = null;

// Public API
export function isMusicLabActive() {
  return isActive();
}

export function showMusicLab() {
  setActive(true);
  const root = document.getElementById('music-lab');
  if (root) root.classList.add('active');
  if (refs) updateMusicLab(refs);
  startFooterLoop();
}

export function hideMusicLab() {
  setActive(false);
  const root = document.getElementById('music-lab');
  if (root) root.classList.remove('active');
  stopFooterLoop();
}

/**
 * Initialise le music lab DOM. Construit le DOM, attache les handlers.
 */
export function initMusicLab({ onBack } = {}) {
  const root = document.getElementById('music-lab');
  if (!root) return;

  refs = buildMusicLab(root);

  const refresh = () => updateMusicLab(refs);

  attachMusicHandlers(root, refs, {
    onClose: hideMusicLab,
    onBack,
    refresh,
  });

  // Initial render
  refresh();
}

// --- Footer rAF loop (transport + activity bar updates in real time) ---
function footerLoop() {
  if (!isActive() || !refs) { rafId = null; return; }
  updateFooter(refs);
  rafId = requestAnimationFrame(footerLoop);
}

function startFooterLoop() {
  if (rafId) return;
  rafId = requestAnimationFrame(footerLoop);
}

function stopFooterLoop() {
  if (rafId) { cancelAnimationFrame(rafId); rafId = null; }
}
