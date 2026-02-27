// --- Dev Stats : panel droit (timer + intensité + combo) ---

import { G } from '../../main/init.js';

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

function updateStatsDisplay() {
  const elapsed = Math.floor((Date.now() - gameStartTime) / 1000);
  const mins = Math.floor(elapsed / 60);
  const secs = String(elapsed % 60).padStart(2, '0');
  timerEl.querySelector('.val').textContent = `${mins}:${secs}`;

  const level = G.systems.intensity.intensity;
  intensityValEl.textContent = level;
  intensityValEl.style.color = INTENSITY_COLORS[level] || '#fff';

  for (let i = 0; i < 5; i++) {
    const on = i <= level;
    barSegments[i].className = on ? 'on' : '';
    barSegments[i].style.background = on ? INTENSITY_COLORS[i] : 'transparent';
  }

  comboEl.querySelector('.val').textContent = G.systems.intensity.combo;
}

export function updateDevStats(playing) {
  buildStats();
  if (playing && !wasPlaying) gameStartTime = Date.now();
  wasPlaying = playing;
  statsContainer.classList.toggle('active', playing);
  if (playing) updateStatsDisplay();
}
