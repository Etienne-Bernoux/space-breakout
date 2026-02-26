import { CONFIG } from '../config.js';
import { setupTouch, getTouchX, setTapHandler, setMenuTapHandler, setDragHandler, setReleaseHandler, getMousePos } from '../infra/touch.js';
import { handleMenuInput, handleMenuTap, handleMenuDrag, handleMenuRelease, resetMenu } from '../infra/menu/index.js';
import { playLaunch } from '../infra/audio.js';
import { muffle, unmuffle } from '../infra/music/index.js';
import { isDevPanelActive, handleDevTap, handleDevDrag, handleDevRelease, hideDevPanel, isDevMode, showDevPanel } from '../infra/dev-panel/index.js';
import { isMusicLabActive, handleMusicLabTap, handleMusicLabScroll } from '../infra/music-lab/index.js';
import { G, gameScale, pauseBtnLayout, startGame } from './init.js';

// Setup touch system
setupTouch();

// --- Handlers tactiles ---
setTapHandler((x, y) => {
  if (G.session.state === 'playing') {
    // Tap sur bouton pause
    const pb = pauseBtnLayout();
    if (x >= pb.x && x <= pb.x + pb.size &&
        y >= pb.y && y <= pb.y + pb.size) {
      G.session.pause();
      muffle();
      return;
    }
    if (!G.drone.launched) { G.drone.launched = true; playLaunch(); }
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
      unmuffle();
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
    if (e.key === ' ' && !G.drone.launched) { G.drone.launched = true; playLaunch(); }
    if (e.key === 'Escape') { G.session.pause(); muffle(); return; }
  }

  if (G.session.state === 'paused') {
    if (e.key === 'Escape') { G.session.resume(); unmuffle(); }
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
