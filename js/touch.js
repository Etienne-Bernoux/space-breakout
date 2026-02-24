import { CONFIG } from './config.js';
import { scale } from './resize.js';

const canvas = document.getElementById('game');

let touchX = null;
let onTap = null;
let onMenuTap = null;

// Convertit les coords écran → coords canvas
function toCanvasX(clientX) {
  const rect = canvas.getBoundingClientRect();
  return (clientX - rect.left) / scale;
}

function toCanvasY(clientY) {
  const rect = canvas.getBoundingClientRect();
  return (clientY - rect.top) / scale;
}

export function getTouchX() {
  return touchX;
}

export function setTapHandler(fn) {
  onTap = fn;
}

export function setMenuTapHandler(fn) {
  onMenuTap = fn;
}

export function setupTouch() {
  canvas.addEventListener('touchstart', (e) => {
    e.preventDefault();
    const t = e.touches[0];
    touchX = toCanvasX(t.clientX);

    if (onTap) onTap(toCanvasX(t.clientX), toCanvasY(t.clientY));
    if (onMenuTap) onMenuTap(toCanvasX(t.clientX), toCanvasY(t.clientY));
  }, { passive: false });

  canvas.addEventListener('touchmove', (e) => {
    e.preventDefault();
    const t = e.touches[0];
    touchX = toCanvasX(t.clientX);
  }, { passive: false });

  canvas.addEventListener('touchend', (e) => {
    e.preventDefault();
    touchX = null;
  }, { passive: false });
}
