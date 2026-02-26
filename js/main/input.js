import { CONFIG } from '../config.js';
import { setupTouch, getTouchX, setTapHandler, setMenuTapHandler, setDragHandler, setReleaseHandler, getMousePos } from '../infra/touch.js';
import { handleMenuInput, handleMenuTap, handleMenuDrag, handleMenuRelease, resetMenu } from '../infra/menu/index.js';
import { isDevPanelActive, handleDevTap, handleDevDrag, handleDevRelease, hideDevPanel, isDevMode, showDevPanel } from '../infra/dev-panel/index.js';
import { isMusicLabActive, handleMusicLabTap, handleMusicLabScroll } from '../infra/music-lab/index.js';
import { isDevOverlayActive, handleOverlayTap } from '../infra/dev-overlay/index.js';
import { G, gameScale, pauseBtnLayout, startGame } from './init.js';

/** Lance tous les drones non lancés en éventail.
 *  1 drone → centre (0), 2 → [-0.4, +0.4], 3 → [-0.5, 0, +0.5], etc. */
function launchAllDrones() {
  const unlaunched = G.drones.filter(d => !d.launched);
  if (unlaunched.length === 0) return false;
  const n = unlaunched.length;
  const spread = 0.8; // amplitude totale de l'éventail (-0.4 .. +0.4 pour 2)
  unlaunched.forEach((d, i) => {
    const angle = n === 1 ? 0 : -spread / 2 + (spread * i) / (n - 1);
    d.launchAtAngle(G.ship, angle);
  });
  return true;
}

// Setup touch system
setupTouch();

// --- Handlers tactiles ---
setTapHandler((x, y) => {
  if (G.session.state === 'playing') {
    // Dev overlay intercepte les taps
    if (isDevOverlayActive() && handleOverlayTap(x, y)) return;
    // Tap sur bouton pause
    const pb = pauseBtnLayout();
    if (x >= pb.x && x <= pb.x + pb.size &&
        y >= pb.y && y <= pb.y + pb.size) {
      G.session.pause();
      G.intensityDirector.onPause();
      return;
    }
    if (launchAllDrones()) G.intensityDirector.onLaunch();
  }
  if (G.session.state === 'gameOver' || G.session.state === 'won') {
    resetMenu();
    G.session.backToMenu();
    if (isDevMode()) showDevPanel();
  }
});

setMenuTapHandler((x, y) => {
  // Music lab intercepte les taps
  if (isMusicLabActive()) {
    handleMusicLabTap(x, y);
    return;
  }
  // Dev panel intercepte les taps quand actif
  if (isDevPanelActive()) {
    const result = handleDevTap(x, y);
    if (result === 'launch') {
      hideDevPanel();
      startGame();
    }
    return;
  }
  if (G.session.state === 'menu') {
    const action = handleMenuTap(x, y);
    if (action === 'play') startGame();
  }
  if (G.session.state === 'paused') {
    const cx = CONFIG.canvas.width / 2;
    const cy = CONFIG.canvas.height / 2;
    const s = gameScale();
    const halfW = Math.round(CONFIG.canvas.width * 0.4);
    const btnH = Math.round(44 * s);
    const gap = Math.round(16 * s);
    // Bouton REPRENDRE
    if (x >= cx - halfW && x <= cx + halfW && y >= cy && y <= cy + btnH) {
      G.session.resume();
      G.intensityDirector.onResume();
    }
    // Bouton MENU
    if (x >= cx - halfW && x <= cx + halfW && y >= cy + btnH + gap && y <= cy + btnH * 2 + gap) {
      resetMenu();
      G.session.backToMenu();
      if (isDevMode()) showDevPanel();
    }
  }
});

// --- Drag slider (réglages + dev panel) ---
setDragHandler((x, y) => {
  if (isDevPanelActive()) { handleDevDrag(x, y); return; }
  if (G.session.state === 'menu') handleMenuDrag(x, y);
});

setReleaseHandler(() => {
  if (isDevPanelActive()) { handleDevRelease(); return; }
  handleMenuRelease();
});

// --- Contrôles clavier ---
document.addEventListener('keydown', (e) => {
  if (isMusicLabActive()) return;
  // Dev panel : Entrée pour lancer
  if (isDevPanelActive()) {
    if (e.key === 'Enter') { hideDevPanel(); startGame(); }
    return;
  }
  if (G.session.state === 'menu') {
    const action = handleMenuInput(e.key);
    if (action === 'play') startGame();
    return;
  }

  if (G.session.state === 'playing') {
    if (e.key === 'ArrowLeft') G.ship.movingLeft = true;
    if (e.key === 'ArrowRight') G.ship.movingRight = true;
    if (e.key === ' ') { if (launchAllDrones()) G.intensityDirector.onLaunch(); }
    if (e.key === 'Escape') { G.session.pause(); G.intensityDirector.onPause(); return; }
  }

  if (G.session.state === 'paused') {
    if (e.key === 'Escape') { G.session.resume(); G.intensityDirector.onResume(); }
    if (e.key === 'r') { resetMenu(); G.session.backToMenu(); if (isDevMode()) showDevPanel(); }
    return;
  }

  if ((G.session.state === 'gameOver' || G.session.state === 'won') && e.key === 'r') {
    resetMenu();
    G.session.backToMenu();
    if (isDevMode()) showDevPanel();
  }
});

document.addEventListener('keyup', (e) => {
  if (G.session.state === 'playing') {
    if (e.key === 'ArrowLeft') G.ship.movingLeft = false;
    if (e.key === 'ArrowRight') G.ship.movingRight = false;
  }
});

document.addEventListener('wheel', (e) => {
  if (isMusicLabActive()) {
    e.preventDefault();
    handleMusicLabScroll(e.deltaY);
  }
}, { passive: false });

export { getMousePos };
