// Music Lab - Main module with public API re-exports

import { CONFIG } from '../config.js';
import { isActive, setActive, getScrollY, getCurrentTab, setScrollY } from './state.js';
import { drawHeader, HEADER_H } from './draw-header.js';
import { drawFooter, FOOTER_H } from './draw-footer.js';
import { drawTabSons } from './tab-sons.js';
import { drawTabGameplay } from './tab-gameplay.js';
import { drawTabMix } from './tab-mix.js';
import { handleMusicLabTap, handleMusicLabHover, handleMusicLabScroll } from './handlers.js';
import { getActiveLoopSection } from './loop-tracker.js';

// Public API
export function isMusicLab() {
  const p = new URLSearchParams(window.location.search);
  return p.has('music') || p.has('mus');
}

export function isMusicLabActive() {
  return isActive();
}

export function showMusicLab() {
  setActive(true);
}

// Main draw function
export function drawMusicLab(ctx) {
  const W = CONFIG.canvas.width;
  const H = CONFIG.canvas.height;

  // Fond complet
  ctx.fillStyle = 'rgba(0, 0, 0, 0.92)';
  ctx.fillRect(0, 0, W, H);

  // Header (fixe)
  drawHeader(ctx, W);

  // Zone de contenu scrollable
  const contentTop = HEADER_H;
  const contentBottom = H - FOOTER_H;
  const contentH = contentBottom - contentTop;

  ctx.save();
  ctx.beginPath();
  ctx.rect(0, contentTop, W, contentH);
  ctx.clip();
  const scrollY = getScrollY();
  ctx.translate(0, contentTop - scrollY);

  const col1 = 20;
  const startY = 16;
  let endY = startY;

  const currentTab = getCurrentTab();
  const activeSec = getActiveLoopSection();
  if (currentTab === 0) endY = drawTabSons(ctx, col1, startY, W, activeSec);
  else if (currentTab === 1) endY = drawTabGameplay(ctx, col1, startY, W);
  else if (currentTab === 2) endY = drawTabMix(ctx, col1, startY, W);

  const totalContentH = endY + 8;
  ctx.restore();

  // Footer (fixe)
  drawFooter(ctx, W, H);

  // Clamp scroll
  const maxScroll = Math.max(0, totalContentH - contentH);
  const clampedScroll = Math.min(maxScroll, Math.max(0, scrollY));
  if (clampedScroll !== scrollY) {
    setScrollY(clampedScroll);
  }

  // Scrollbar
  if (maxScroll > 0) {
    const sbH = Math.max(20, contentH * (contentH / totalContentH));
    const sbY = contentTop + (scrollY / maxScroll) * (contentH - sbH);
    ctx.fillStyle = 'rgba(255,255,255,0.12)';
    ctx.fillRect(W - 6, sbY, 4, sbH);
  }
}

// Re-export handlers
export { handleMusicLabTap, handleMusicLabHover, handleMusicLabScroll };
