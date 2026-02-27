// --- Dev Stats : panel droit (timer + intensité + combo) ---

const statsContainer = document.getElementById('dev-stats');
const INTENSITY_COLORS = ['#4488ff', '#44cc88', '#ffcc00', '#ff6600', '#ff2244'];
let statsBuilt = false;
let timerEl, intensityValEl, comboEl, fpsEl, ftEl, barSegments;
let gameStartTime = 0;
let wasPlaying = false;
let frameCount = 0;
let lastFpsTime = 0;
let currentFps = 0;
let lastFrameTime = 0;
let currentFt = 0;

/** @type {{ intensity: number, combo: number }} */
let intensityRef = null;

export function initDevStats(deps) {
  intensityRef = deps.intensity;
}

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

  fpsEl = document.createElement('div');
  fpsEl.innerHTML = 'FPS <span class="val">--</span>';
  statsContainer.appendChild(fpsEl);

  ftEl = document.createElement('div');
  ftEl.innerHTML = 'Frame <span class="val">--</span><span style="opacity:0.5"> ms</span>';
  statsContainer.appendChild(ftEl);
}

function updateStatsDisplay() {
  const elapsed = Math.floor((Date.now() - gameStartTime) / 1000);
  const mins = Math.floor(elapsed / 60);
  const secs = String(elapsed % 60).padStart(2, '0');
  timerEl.querySelector('.val').textContent = `${mins}:${secs}`;

  const level = intensityRef.intensity;
  intensityValEl.textContent = level;
  intensityValEl.style.color = INTENSITY_COLORS[level] || '#fff';

  for (let i = 0; i < 5; i++) {
    const on = i <= level;
    barSegments[i].className = on ? 'on' : '';
    barSegments[i].style.background = on ? INTENSITY_COLORS[i] : 'transparent';
  }

  comboEl.querySelector('.val').textContent = intensityRef.combo;

  frameCount++;
  const now = performance.now();
  if (now - lastFpsTime >= 500) {
    currentFps = Math.round(frameCount / ((now - lastFpsTime) / 1000));
    frameCount = 0;
    lastFpsTime = now;
  }
  const fpsValEl = fpsEl.querySelector('.val');
  fpsValEl.textContent = currentFps;
  fpsValEl.style.color = currentFps >= 55 ? '#44cc88' : currentFps >= 30 ? '#ffcc00' : '#ff2244';

  currentFt = now - lastFrameTime;
  lastFrameTime = now;
  const ftValEl = ftEl.querySelector('.val');
  ftValEl.textContent = currentFt.toFixed(1);
  ftValEl.style.color = currentFt <= 10 ? '#44cc88' : currentFt <= 14 ? '#ffcc00' : '#ff2244';
}

export function updateDevStats(playing) {
  buildStats();
  if (playing && !wasPlaying) gameStartTime = Date.now();
  wasPlaying = playing;
  statsContainer.classList.toggle('active', playing);
  if (playing) updateStatsDisplay();
}
