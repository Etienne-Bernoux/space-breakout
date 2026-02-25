import { CONFIG } from '../config.js';
import { scale } from './resize.js';

const canvas = document.getElementById('game');

let pointerX = null;
let onTap = null;
let onMenuTap = null;
let onDrag = null;
let onRelease = null;
let mouseActive = false;

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
  return pointerX;
}

export function setTapHandler(fn) {
  onTap = fn;
}

export function setMenuTapHandler(fn) {
  onMenuTap = fn;
}

export function setDragHandler(fn) { onDrag = fn; }
export function setReleaseHandler(fn) { onRelease = fn; }

export function setupTouch() {
  // --- Touch ---
  canvas.addEventListener('touchstart', (e) => {
    e.preventDefault();
    const t = e.touches[0];
    pointerX = toCanvasX(t.clientX);
    if (onTap) onTap(toCanvasX(t.clientX), toCanvasY(t.clientY));
    if (onMenuTap) onMenuTap(toCanvasX(t.clientX), toCanvasY(t.clientY));
  }, { passive: false });

  canvas.addEventListener('touchmove', (e) => {
    e.preventDefault();
    const t = e.touches[0];
    pointerX = toCanvasX(t.clientX);
    if (onDrag) onDrag(toCanvasX(t.clientX), toCanvasY(t.clientY));
  }, { passive: false });

  canvas.addEventListener('touchend', (e) => {
    e.preventDefault();
    pointerX = null;
    if (onRelease) onRelease();
  }, { passive: false });

  // --- Souris ---
  canvas.addEventListener('mousedown', (e) => {
    mouseActive = true;
    pointerX = toCanvasX(e.clientX);
    if (onTap) onTap(toCanvasX(e.clientX), toCanvasY(e.clientY));
    if (onMenuTap) onMenuTap(toCanvasX(e.clientX), toCanvasY(e.clientY));
  });

  canvas.addEventListener('mousemove', (e) => {
    mouseCanvasX = toCanvasX(e.clientX);
    mouseCanvasY = toCanvasY(e.clientY);
    if (mouseActive) {
      pointerX = toCanvasX(e.clientX);
      if (onDrag) onDrag(mouseCanvasX, mouseCanvasY);
    }
  });

  canvas.addEventListener('mouseup', () => {
    mouseActive = false;
    pointerX = null;
    if (onRelease) onRelease();
  });

  canvas.addEventListener('mouseleave', () => {
    mouseActive = false;
    pointerX = null;
    mouseCanvasX = null;
    mouseCanvasY = null;
  });
}

// Position souris pour le hover (menu)
let mouseCanvasX = null;
let mouseCanvasY = null;

export function getMousePos() {
  return { x: mouseCanvasX, y: mouseCanvasY };
}
