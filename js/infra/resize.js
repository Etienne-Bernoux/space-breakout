import { CONFIG } from '../config.js';

const canvas = document.getElementById('game');

export let scale = 1;

export function setupResize(onResize) {
  function resize() {
    // Déduire l'espace des panels dev s'ils sont visibles
    const devLeft = document.getElementById('dev-overlay');
    const devRight = document.getElementById('dev-stats');
    const panelW = (devLeft?.offsetWidth || 0) + (devRight?.offsetWidth || 0);
    const maxW = window.innerWidth - panelW;
    const maxH = window.innerHeight;
    const screenRatio = maxW / maxH;
    const gameRatio = CONFIG.canvas.width / CONFIG.canvas.baseHeight;

    let cssW, cssH;

    if (screenRatio < gameRatio) {
      // Portrait : le canvas prend toute la largeur ET toute la hauteur
      // On adapte la résolution interne pour matcher le ratio écran
      CONFIG.canvas.height = Math.round(CONFIG.canvas.width / screenRatio);
      cssW = maxW;
      cssH = maxH;
    } else {
      // Paysage : on garde le ratio 800x600 et on fit dans l'écran
      CONFIG.canvas.height = CONFIG.canvas.baseHeight;
      if (maxW / maxH > gameRatio) {
        cssH = maxH;
        cssW = cssH * gameRatio;
      } else {
        cssW = maxW;
        cssH = cssW / gameRatio;
      }
    }

    canvas.width = CONFIG.canvas.width;
    canvas.height = CONFIG.canvas.height;
    canvas.style.width = `${cssW}px`;
    canvas.style.height = `${cssH}px`;
    scale = cssW / CONFIG.canvas.width;

    if (onResize) onResize();
  }

  window.addEventListener('resize', resize);
  resize();
}
