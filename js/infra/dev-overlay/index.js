// --- Dev Overlay : DOM panel à gauche du canvas ---
// ?dev + desktop only. Boutons power-ups + vie +/-

import { isDevMode } from '../dev-panel/index.js';
import { POWER_UP_IDS, getPowerUp } from '../../domain/power-ups.js';
import { drawIcon } from '../power-up-icons.js';
import { G } from '../../main/init.js';
import { updateDevStats } from './dev-stats.js';

const container = document.getElementById('dev-overlay');
let built = false;

/** Construit les boutons DOM une seule fois */
function buildButtons() {
  if (built) return;
  built = true;

  for (const puId of POWER_UP_IDS) {
    const def = getPowerUp(puId);
    const btn = document.createElement('button');
    btn.style.background = hexToRgba(def.color, 0.55);

    // Mini canvas icône
    const ico = document.createElement('canvas');
    ico.width = 16;
    ico.height = 16;
    ico.style.cssText = 'vertical-align:middle;margin-right:4px;';
    const ictx = ico.getContext('2d');
    ictx.save();
    ictx.translate(8, 8);
    drawIcon(ictx, puId, 6, '#fff');
    ictx.restore();
    btn.appendChild(ico);

    btn.appendChild(document.createTextNode(def.short));
    btn.addEventListener('click', () => {
      G.puManager.activate(puId, G.gs);
    });
    container.appendChild(btn);
  }

  // Boutons vie +/-
  const row = document.createElement('div');
  row.className = 'life-row';

  const btnUp = document.createElement('button');
  btnUp.textContent = 'Vie +';
  btnUp.style.background = 'rgba(100,100,100,0.55)';
  btnUp.addEventListener('click', () => { G.session.lives++; });

  const btnDown = document.createElement('button');
  btnDown.textContent = 'Vie -';
  btnDown.style.background = 'rgba(100,100,100,0.55)';
  btnDown.addEventListener('click', () => { G.session.lives = Math.max(0, G.session.lives - 1); });

  row.appendChild(btnUp);
  row.appendChild(btnDown);
  container.appendChild(row);

  // Bouton Instant Win
  const btnWin = document.createElement('button');
  btnWin.textContent = '🏆 Win';
  btnWin.style.background = 'rgba(34,197,94,0.55)';
  btnWin.addEventListener('click', () => {
    for (const a of G.field.grid) a.alive = false;
  });
  container.appendChild(btnWin);

  // Bouton Asteroid HP -1
  const btnAstHp = document.createElement('button');
  btnAstHp.textContent = '☄️ Ast -1';
  btnAstHp.style.background = 'rgba(239,68,68,0.55)';
  btnAstHp.addEventListener('click', () => {
    for (const a of G.field.grid) {
      if (!a.alive || !a.destructible) continue;
      a.hp = (a.hp ?? 1) - 1;
      if (a.hp <= 0) a.alive = false;
    }
  });
  container.appendChild(btnAstHp);
}

/** L'overlay est actif si mode dev + desktop (pas mobile) */
export function isDevOverlayActive() {
  return isDevMode() && !('ontouchstart' in window);
}

let wasActive = false;

/** Affiche/masque les panels selon l'état du jeu */
export function updateDevOverlay() {
  if (!isDevOverlayActive()) {
    container.classList.remove('active');
    wasActive = false;
    return;
  }
  buildButtons();
  const playing = G.session.state === 'playing' || G.session.state === 'paused';
  container.classList.toggle('active', playing);
  updateDevStats(playing);
  // Trigger resize quand les panels apparaissent/disparaissent
  if (playing !== wasActive) {
    wasActive = playing;
    window.dispatchEvent(new Event('resize'));
  }
}

function hexToRgba(hex, alpha) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}
