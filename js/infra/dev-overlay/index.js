// --- Dev Overlay : DOM panel à gauche du canvas ---
// ?dev + desktop only. Boutons power-ups + vie +/-

import { isDevMode } from '../dev-panel/index.js';
import { POWER_UP_IDS, getPowerUp } from '../../domain/power-ups.js';
import { drawIcon } from '../power-up-icons.js';
import { initDevStats, updateDevStats } from './dev-stats.js';

const container = document.getElementById('dev-overlay');
let built = false;

/** @type {{ entities, session, systems, gs: function }} */
let deps = null;

/**
 * Initialise le dev-overlay avec les dépendances injectées.
 * @param {object} d
 * @param {object} d.entities  - { field }
 * @param {object} d.session   - { state, lives }
 * @param {object} d.systems   - { powerUp, intensity }
 * @param {function} d.getGs   - () => gameState snapshot
 */
export function initDevOverlay(d) {
  deps = d;
  initDevStats({ intensity: d.systems.intensity });
}

function buildButtons() {
  if (built) return;
  built = true;

  for (const puId of POWER_UP_IDS) {
    const def = getPowerUp(puId);
    const btn = document.createElement('button');
    btn.style.background = hexToRgba(def.color, 0.55);

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
      deps.systems.powerUp.activate(puId, deps.getGs());
    });
    container.appendChild(btn);
  }

  // Boutons vie +/-
  const row = document.createElement('div');
  row.className = 'life-row';

  const btnUp = document.createElement('button');
  btnUp.textContent = 'Vie +';
  btnUp.style.background = 'rgba(100,100,100,0.55)';
  btnUp.addEventListener('click', () => { deps.session.lives++; });

  const btnDown = document.createElement('button');
  btnDown.textContent = 'Vie -';
  btnDown.style.background = 'rgba(100,100,100,0.55)';
  btnDown.addEventListener('click', () => { deps.session.lives = Math.max(0, deps.session.lives - 1); });

  row.appendChild(btnUp);
  row.appendChild(btnDown);
  container.appendChild(row);

  // Bouton Instant Win
  const btnWin = document.createElement('button');
  btnWin.textContent = '🏆 Win';
  btnWin.style.background = 'rgba(34,197,94,0.55)';
  btnWin.addEventListener('click', () => {
    for (const a of deps.entities.field.grid) a.alive = false;
  });
  container.appendChild(btnWin);

  // Bouton Asteroid HP -1
  const btnAstHp = document.createElement('button');
  btnAstHp.textContent = '☄️ Ast -1';
  btnAstHp.style.background = 'rgba(239,68,68,0.55)';
  btnAstHp.addEventListener('click', () => {
    for (const a of deps.entities.field.grid) {
      if (!a.alive || !a.destructible) continue;
      a.hp = (a.hp ?? 1) - 1;
      if (a.hp <= 0) a.alive = false;
    }
  });
  container.appendChild(btnAstHp);
}

export function isDevOverlayActive() {
  return isDevMode() && !('ontouchstart' in window);
}

let wasActive = false;

export function updateDevOverlay() {
  if (!isDevOverlayActive()) {
    container.classList.remove('active');
    wasActive = false;
    return;
  }
  buildButtons();
  const playing = deps.session.state === 'playing' || deps.session.state === 'paused';
  container.classList.toggle('active', playing);
  updateDevStats(playing);
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
