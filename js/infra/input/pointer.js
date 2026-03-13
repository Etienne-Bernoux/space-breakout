// --- Pointer : abstraction unifiée touch + souris ---
// Expose getPointerX() (position du pointeur en coords canvas),
// getMousePos() (hover), callbacks (tap, drag, release).
// State-aware : en state 'playing', la souris trackle vaisseau sans clic.

import { scale } from './resize.js';

const canvas = document.getElementById('game');

let pointerX = null;
let onTap = null;
let onMenuTap = null;
let onDrag = null;
let onRelease = null;
let mouseActive = false;
let gameState = 'menu';       // état courant du jeu (pour le comportement souris)

// Position souris pour le hover (menu)
let mouseCanvasX = null;
let mouseCanvasY = null;

// --- Conversion écran → canvas ---

function toCanvasX(clientX) {
  const rect = canvas.getBoundingClientRect();
  return (clientX - rect.left) / scale;
}

function toCanvasY(clientY) {
  const rect = canvas.getBoundingClientRect();
  return (clientY - rect.top) / scale;
}

// --- API publique ---

/** Position X du pointeur en coords canvas (touch ou souris). null si inactif. */
export function getPointerX() { return pointerX; }

/** Position souris en coords canvas (pour hover menu). */
export function getMousePos() { return { x: mouseCanvasX, y: mouseCanvasY }; }

/** Met à jour l'état courant du jeu (conditionne le comportement souris). */
export function setGameState(state) {
  const wasPlaying = gameState === 'playing';
  gameState = state;
  // Quand on quitte playing, reset le pointer pour éviter un vaisseau "collé"
  if (wasPlaying && state !== 'playing') pointerX = null;
}

export function setTapHandler(fn) { onTap = fn; }
export function setMenuTapHandler(fn) { onMenuTap = fn; }
export function setDragHandler(fn) { onDrag = fn; }
export function setReleaseHandler(fn) { onRelease = fn; }

// --- Setup listeners ---

export function setupPointer() {
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
    } else if (gameState === 'playing') {
      // Desktop gameplay : le vaisseau suit la souris sans clic
      pointerX = toCanvasX(e.clientX);
    }
  });

  canvas.addEventListener('mouseup', () => {
    mouseActive = false;
    if (gameState !== 'playing') pointerX = null;
    if (onRelease) onRelease();
  });

  canvas.addEventListener('mouseleave', () => {
    mouseActive = false;
    pointerX = null;
    mouseCanvasX = null;
    mouseCanvasY = null;
  });
}
