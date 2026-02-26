// --- Dev Overlay : DOM panel à gauche du canvas ---
// ?dev + desktop only. Boutons power-ups + vie +/-

import { isDevMode } from '../dev-panel/index.js';
import { POWER_UPS, POWER_UP_IDS, getPowerUp } from '../../domain/power-ups.js';
import { drawIcon } from '../power-up-icons.js';
import { G } from '../../main/init.js';

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
      const gs = { ship: G.ship, drones: G.drones, session: G.session, field: G.field };
      G.puManager.activate(puId, gs);
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
}

/** L'overlay est actif si mode dev + desktop (pas mobile) */
export function isDevOverlayActive() {
  return isDevMode() && !('ontouchstart' in window);
}

// --- Dev Stats (panel droit : timer + intensité) ---
const statsContainer = document.getElementById('dev-stats');
const INTENSITY_COLORS = ['#4488ff', '#44cc88', '#ffcc00', '#ff6600', '#ff2244'];
let statsBuilt = false;
let timerEl, intensityValEl, comboEl, barSegments;
let gameStartTime = 0;
let wasPlaying = false;

function buildStats() {
  if (statsBuilt) return;
  statsBuilt = true;

  timerEl = document.createElement('div');
  timerEl.innerHTML = 'Time <span class="val">0:00</span>';
  statsContainer.appendChild(timerEl);

  const intRow = document.createElement('div');
  intRow.innerHTML = 'Intensité <span class="val">0</span>';
  intensityValEl = intRow.querySelector('.val');
  statsContainer.appendChild(intRow);

  const bar = document.createElement('div');
  bar.className = 'intensity-bar';
  barSegments = [];
  for (let i = 0; i < 5; i++) {
    const seg = document.createElement('span');
    seg.style.background = 'transparent';
    bar.appendChild(seg);
    barSegments.push(seg);
  }
  statsContainer.appendChild(bar);

  comboEl = document.createElement('div');
  comboEl.innerHTML = 'Combo <span class="val">0</span>';
  statsContainer.appendChild(comboEl);
}

function updateStats() {
  const elapsed = Math.floor((Date.now() - gameStartTime) / 1000);
  const mins = Math.floor(elapsed / 60);
  const secs = String(elapsed % 60).padStart(2, '0');
  timerEl.querySelector('.val').textContent = `${mins}:${secs}`;

  const level = G.intensityDirector.intensity;
  intensityValEl.textContent = level;
  intensityValEl.style.color = INTENSITY_COLORS[level] || '#fff';

  for (let i = 0; i < 5; i++) {
    const on = i <= level;
    barSegments[i].className = on ? 'on' : '';
    barSegments[i].style.background = on ? INTENSITY_COLORS[i] : 'transparent';
  }

  comboEl.querySelector('.val').textContent = G.intensityDirector.combo;
}

/** Affiche/masque les panels selon l'état du jeu */
export function updateDevOverlay() {
  if (!isDevOverlayActive()) {
    container.classList.remove('active');
    statsContainer.classList.remove('active');
    return;
  }
  buildButtons();
  buildStats();
  const playing = G.session.state === 'playing' || G.session.state === 'paused';
  // Reset timer au démarrage d'une partie
  if (playing && !wasPlaying) gameStartTime = Date.now();
  wasPlaying = playing;
  container.classList.toggle('active', playing);
  statsContainer.classList.toggle('active', playing);
  if (playing) updateStats();
}

function hexToRgba(hex, alpha) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}
