// --- Dev Panel : config astéroïdes pour le développement ---
// Activé via ?dev=1 dans l'URL. Sauvegarde en localStorage.
// S'affiche AVANT le menu, permet de configurer puis lancer.

import { CONFIG } from '../config.js';
import { MATERIALS } from '../domain/materials.js';
import { PATTERNS, PATTERN_KEYS, GRID_PRESETS } from '../domain/patterns.js';

const STORAGE_KEY = 'space-breakout-dev';
const MAT_KEYS = Object.keys(MATERIALS);
const GRID_KEYS = Object.keys(GRID_PRESETS);

// --- Presets ---
const PRESETS = [
  { name: 'Niveau 1 — Roche',     density: 0.5, mats: { rock: 1.0 } },
  { name: 'Niveau 2 — Givre',     density: 0.5, mats: { rock: 0.6, ice: 0.3, crystal: 0.1 } },
  { name: 'Niveau 3 — Volcan',    density: 0.55, mats: { rock: 0.4, lava: 0.35, metal: 0.15, obsidian: 0.1 } },
  { name: 'Niveau 4 — Forteresse', density: 0.6, mats: { rock: 0.2, metal: 0.35, obsidian: 0.2, lava: 0.15, crystal: 0.1 } },
  { name: 'Endgame — Chaos',      density: 0.65, mats: { rock: 0.15, ice: 0.1, lava: 0.2, metal: 0.25, crystal: 0.1, obsidian: 0.2 } },
  { name: 'Cristaux purs',        density: 0.4, mats: { crystal: 0.7, ice: 0.3 } },
];

// --- State ---
let devConfig = {
  density: CONFIG.asteroids.density,
  materials: { rock: 1.0, ice: 0, lava: 0, metal: 0, crystal: 0, obsidian: 0 },
  patternKey: 'random',
  gridKey: 'small', // taille grille pour mode aléatoire
};
let active = false;
let draggingSlider = null;
let hoveredPreset = -1;
let hoveredPattern = -1;
let hoveredGrid = -1;

// --- Persistence ---
export function loadDevConfig() {
  try {
    const data = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (data) {
      devConfig.density = data.density ?? devConfig.density;
      if (data.materials) devConfig.materials = { ...devConfig.materials, ...data.materials };
      if (data.patternKey) devConfig.patternKey = data.patternKey;
      if (data.gridKey) devConfig.gridKey = data.gridKey;
    }
  } catch (_) {}
}

function saveDevConfig() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(devConfig));
}

export function isDevMode() {
  return new URLSearchParams(window.location.search).has('dev');
}

export function isDevPanelActive() { return active; }
export function showDevPanel() { active = true; }
export function hideDevPanel() { active = false; }

/** Retourne la config astéroïdes enrichie du dev panel */
export function getDevAsteroidConfig() {
  // Normaliser les poids matériaux
  const mats = { ...devConfig.materials };
  const total = Object.values(mats).reduce((s, v) => s + v, 0);
  if (total > 0) {
    for (const k of MAT_KEYS) mats[k] = (mats[k] || 0) / total;
  }
  const filtered = {};
  for (const [k, v] of Object.entries(mats)) {
    if (v > 0.001) filtered[k] = v;
  }

  // Pattern sélectionné
  const pat = PATTERNS[devConfig.patternKey];
  const hasPattern = pat && pat.lines;

  // Grille : soit celle du pattern, soit celle sélectionnée
  const gridDef = hasPattern ? pat.grid : GRID_PRESETS[devConfig.gridKey] || GRID_PRESETS.small;
  const rows = gridDef?.rows || CONFIG.asteroids.rows;
  const cols = gridDef?.cols || CONFIG.asteroids.cols;

  return {
    ...CONFIG.asteroids,
    rows,
    cols,
    _autoSize: true, // signale au constructeur de recalculer cellW/cellH
    density: devConfig.density,
    materials: Object.keys(filtered).length > 0 ? filtered : undefined,
    pattern: hasPattern ? pat : undefined,
  };
}

// --- Layout (2 colonnes : gauche = sliders, droite = patterns/grille/presets) ---
const PANEL = {
  // Colonne gauche : matériaux + densité
  sliderX: 160, sliderW: 280, trackH: 6, thumbR: 10,
  matStartY: 140, matSpacing: 36,
  densityY: 370,
  // Colonne droite : patterns + grille + presets
  rightX: 490, rightW: 280,
  patternStartY: 135, patternH: 22, patternSpacing: 26,
  gridStartY: 410, gridH: 22, gridSpacing: 26,
  // Bas
  launchY: 530,
};

// --- Draw helpers ---

function drawTrack(ctx, x, y, w, val) {
  ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
  ctx.fillRect(x, y - PANEL.trackH / 2, w, PANEL.trackH);
  ctx.fillStyle = '#ffcc00';
  ctx.fillRect(x, y - PANEL.trackH / 2, w * val, PANEL.trackH);
  const tx = x + w * val;
  ctx.beginPath();
  ctx.arc(tx, y, PANEL.thumbR, 0, Math.PI * 2);
  ctx.fillStyle = '#ffffff';
  ctx.fill();
  ctx.strokeStyle = '#ffcc00';
  ctx.lineWidth = 2;
  ctx.stroke();
}

function drawButton(ctx, x, y, w, h, label, selected, hovered, color = '#889999') {
  ctx.fillStyle = selected ? 'rgba(255, 204, 0, 0.2)' : hovered ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.03)';
  ctx.fillRect(x, y, w, h);
  ctx.strokeStyle = selected ? '#ffcc00' : hovered ? '#667788' : '#334455';
  ctx.lineWidth = 1;
  ctx.strokeRect(x, y, w, h);
  ctx.fillStyle = selected ? '#ffcc00' : hovered ? '#ccddee' : color;
  ctx.font = '11px monospace';
  ctx.fillText(label, x + 6, y + 15);
}

// --- Draw ---
export function drawDevPanel(ctx) {
  const w = CONFIG.canvas.width;
  const h = CONFIG.canvas.height;

  ctx.fillStyle = 'rgba(0, 0, 0, 0.88)';
  ctx.fillRect(0, 0, w, h);

  ctx.save();

  // Titre
  ctx.textAlign = 'center';
  ctx.fillStyle = '#ffcc00';
  ctx.font = 'bold 20px monospace';
  ctx.fillText('DEV CONFIG — ASTÉROÏDES', w / 2, 40);
  ctx.font = '10px monospace';
  ctx.fillStyle = '#556666';
  ctx.fillText('localStorage · ?dev · Entrée pour lancer', w / 2, 58);

  // ============ COLONNE GAUCHE : Matériaux + Densité ============
  ctx.textAlign = 'left';
  ctx.fillStyle = '#aabbcc';
  ctx.font = 'bold 13px monospace';
  ctx.fillText('MATÉRIAUX', 20, PANEL.matStartY - 18);

  // Indication: actif seulement en mode aléatoire ou pour les '?' du pattern
  const isPatternMode = devConfig.patternKey !== 'random';
  if (isPatternMode) {
    ctx.fillStyle = '#556666';
    ctx.font = '9px monospace';
    ctx.fillText('(pour les cases "?" du pattern)', 120, PANEL.matStartY - 18);
  }

  for (let i = 0; i < MAT_KEYS.length; i++) {
    const key = MAT_KEYS[i];
    const mat = MATERIALS[key];
    const y = PANEL.matStartY + i * PANEL.matSpacing;
    const val = devConfig.materials[key] || 0;

    ctx.fillStyle = mat.colors[0];
    ctx.fillRect(20, y - 5, 10, 10);
    ctx.fillStyle = '#ccddee';
    ctx.font = '12px monospace';
    ctx.fillText(mat.name, 36, y + 4);
    ctx.fillStyle = '#556677';
    ctx.font = '9px monospace';
    ctx.fillText(mat.hp === Infinity ? '∞HP' : `${mat.hp}HP`, 110, y + 4);

    drawTrack(ctx, PANEL.sliderX, y, PANEL.sliderW, val);

    ctx.fillStyle = '#889999';
    ctx.font = '10px monospace';
    ctx.textAlign = 'right';
    ctx.fillText(`${Math.round(val * 100)}%`, PANEL.sliderX + PANEL.sliderW + 35, y + 4);
    ctx.textAlign = 'left';
  }

  // Densité (seulement pertinent en mode aléatoire)
  ctx.fillStyle = '#aabbcc';
  ctx.font = 'bold 13px monospace';
  ctx.fillText('DENSITÉ', 20, PANEL.densityY - 15);
  if (isPatternMode) {
    ctx.fillStyle = '#556666';
    ctx.font = '9px monospace';
    ctx.fillText('(ignoré en mode pattern)', 100, PANEL.densityY - 15);
  }
  drawTrack(ctx, PANEL.sliderX, PANEL.densityY, PANEL.sliderW, devConfig.density);
  ctx.fillStyle = '#889999';
  ctx.font = '10px monospace';
  ctx.textAlign = 'right';
  ctx.fillText(`${Math.round(devConfig.density * 100)}%`, PANEL.sliderX + PANEL.sliderW + 35, PANEL.densityY + 4);
  ctx.textAlign = 'left';

  // Presets (sous la densité)
  const presetY = PANEL.densityY + 35;
  ctx.fillStyle = '#aabbcc';
  ctx.font = 'bold 13px monospace';
  ctx.fillText('PRESETS MATÉRIAUX', 20, presetY);
  for (let i = 0; i < PRESETS.length; i++) {
    const bx = 20 + (i % 3) * 155;
    const by = presetY + 10 + Math.floor(i / 3) * 28;
    drawButton(ctx, bx, by, 148, 24, PRESETS[i].name, false, i === hoveredPreset);
  }

  // ============ COLONNE DROITE : Patterns + Grille ============
  const rx = PANEL.rightX;

  // Patterns
  ctx.fillStyle = '#aabbcc';
  ctx.font = 'bold 13px monospace';
  ctx.fillText('PATTERN', rx, PANEL.patternStartY - 18);

  for (let i = 0; i < PATTERN_KEYS.length; i++) {
    const key = PATTERN_KEYS[i];
    const pat = PATTERNS[key];
    const y = PANEL.patternStartY + i * PANEL.patternSpacing;
    const selected = devConfig.patternKey === key;
    const hovered = i === hoveredPattern;
    drawButton(ctx, rx, y, PANEL.rightW, PANEL.patternH, pat.name, selected, hovered);
    // Indice de taille
    if (pat.grid) {
      ctx.fillStyle = '#556677';
      ctx.font = '9px monospace';
      ctx.fillText(`${pat.grid.cols}×${pat.grid.rows}`, rx + PANEL.rightW - 40, y + 15);
    }
  }

  // Grille (seulement en mode aléatoire)
  const gridSectionY = PANEL.gridStartY;
  ctx.fillStyle = '#aabbcc';
  ctx.font = 'bold 13px monospace';
  ctx.fillText('TAILLE GRILLE', rx, gridSectionY - 10);
  if (isPatternMode) {
    ctx.fillStyle = '#556666';
    ctx.font = '9px monospace';
    ctx.fillText('(définie par le pattern)', rx + 120, gridSectionY - 10);
  }

  for (let i = 0; i < GRID_KEYS.length; i++) {
    const key = GRID_KEYS[i];
    const g = GRID_PRESETS[key];
    const y = gridSectionY + i * PANEL.gridSpacing;
    const selected = !isPatternMode && devConfig.gridKey === key;
    const hovered = i === hoveredGrid;
    drawButton(ctx, rx, y, PANEL.rightW, PANEL.gridH, g.label, selected, hovered);
  }

  // ============ BAS : Boutons LANCER + RESET ============
  ctx.textAlign = 'center';
  // LANCER
  const launchX = w / 2 - 100;
  ctx.fillStyle = 'rgba(0, 212, 255, 0.2)';
  ctx.fillRect(launchX, PANEL.launchY, 200, 36);
  ctx.strokeStyle = '#00d4ff';
  ctx.lineWidth = 2;
  ctx.strokeRect(launchX, PANEL.launchY, 200, 36);
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 16px monospace';
  ctx.fillText('▸ LANCER', w / 2, PANEL.launchY + 25);

  // RESET
  const resetX = launchX + 220;
  ctx.fillStyle = 'rgba(255, 100, 100, 0.1)';
  ctx.fillRect(resetX, PANEL.launchY, 80, 36);
  ctx.strokeStyle = '#664444';
  ctx.lineWidth = 1;
  ctx.strokeRect(resetX, PANEL.launchY, 80, 36);
  ctx.fillStyle = '#aa6666';
  ctx.font = '12px monospace';
  ctx.fillText('RESET', resetX + 40, PANEL.launchY + 24);

  ctx.restore();
}

// --- Input handlers ---

function hitTrack(x, y, trackY) {
  return x >= PANEL.sliderX - 10 && x <= PANEL.sliderX + PANEL.sliderW + 10 &&
         y >= trackY - 16 && y <= trackY + 16;
}

function updateDragValue(x) {
  if (!draggingSlider) return;
  const val = Math.max(0, Math.min(1, (x - PANEL.sliderX) / PANEL.sliderW));
  if (draggingSlider.type === 'density') {
    devConfig.density = Math.round(val * 20) / 20;
  } else {
    devConfig.materials[draggingSlider.key] = Math.round(val * 20) / 20;
  }
  saveDevConfig();
}

export function handleDevTap(x, y) {
  const w = CONFIG.canvas.width;
  const rx = PANEL.rightX;

  // --- Patterns ---
  for (let i = 0; i < PATTERN_KEYS.length; i++) {
    const py = PANEL.patternStartY + i * PANEL.patternSpacing;
    if (x >= rx && x <= rx + PANEL.rightW && y >= py && y <= py + PANEL.patternH) {
      devConfig.patternKey = PATTERN_KEYS[i];
      saveDevConfig();
      return null;
    }
  }

  // --- Grille ---
  for (let i = 0; i < GRID_KEYS.length; i++) {
    const gy = PANEL.gridStartY + i * PANEL.gridSpacing;
    if (x >= rx && x <= rx + PANEL.rightW && y >= gy && y <= gy + PANEL.gridH) {
      devConfig.gridKey = GRID_KEYS[i];
      saveDevConfig();
      return null;
    }
  }

  // --- Presets matériaux ---
  const presetY = PANEL.densityY + 35;
  for (let i = 0; i < PRESETS.length; i++) {
    const bx = 20 + (i % 3) * 155;
    const by = presetY + 10 + Math.floor(i / 3) * 28;
    if (x >= bx && x <= bx + 148 && y >= by && y <= by + 24) {
      applyPreset(i);
      return null;
    }
  }

  // --- LANCER ---
  const launchX = w / 2 - 100;
  if (x >= launchX && x <= launchX + 200 && y >= PANEL.launchY && y <= PANEL.launchY + 36) {
    saveDevConfig();
    return 'launch';
  }

  // --- RESET ---
  const resetX = launchX + 220;
  if (x >= resetX && x <= resetX + 80 && y >= PANEL.launchY && y <= PANEL.launchY + 36) {
    devConfig.density = CONFIG.asteroids.density;
    devConfig.materials = { rock: 1.0, ice: 0, lava: 0, metal: 0, crystal: 0, obsidian: 0 };
    devConfig.patternKey = 'random';
    devConfig.gridKey = 'small';
    saveDevConfig();
    return null;
  }

  // --- Sliders matériaux ---
  for (let i = 0; i < MAT_KEYS.length; i++) {
    const sy = PANEL.matStartY + i * PANEL.matSpacing;
    if (hitTrack(x, y, sy)) {
      draggingSlider = { key: MAT_KEYS[i], type: 'mat' };
      updateDragValue(x);
      return null;
    }
  }

  // --- Slider densité ---
  if (hitTrack(x, y, PANEL.densityY)) {
    draggingSlider = { key: 'density', type: 'density' };
    updateDragValue(x);
    return null;
  }

  return null;
}

export function handleDevDrag(x, _y) {
  updateDragValue(x);
}

export function handleDevRelease() {
  draggingSlider = null;
}

export function handleDevHover(x, y) {
  hoveredPreset = -1;
  hoveredPattern = -1;
  hoveredGrid = -1;

  const rx = PANEL.rightX;

  // Patterns
  for (let i = 0; i < PATTERN_KEYS.length; i++) {
    const py = PANEL.patternStartY + i * PANEL.patternSpacing;
    if (x >= rx && x <= rx + PANEL.rightW && y >= py && y <= py + PANEL.patternH) {
      hoveredPattern = i;
      return;
    }
  }

  // Grille
  for (let i = 0; i < GRID_KEYS.length; i++) {
    const gy = PANEL.gridStartY + i * PANEL.gridSpacing;
    if (x >= rx && x <= rx + PANEL.rightW && y >= gy && y <= gy + PANEL.gridH) {
      hoveredGrid = i;
      return;
    }
  }

  // Presets matériaux
  const presetY = PANEL.densityY + 35;
  for (let i = 0; i < PRESETS.length; i++) {
    const bx = 20 + (i % 3) * 155;
    const by = presetY + 10 + Math.floor(i / 3) * 28;
    if (x >= bx && x <= bx + 148 && y >= by && y <= by + 24) {
      hoveredPreset = i;
      return;
    }
  }
}

function applyPreset(index) {
  const p = PRESETS[index];
  devConfig.density = p.density;
  for (const k of MAT_KEYS) devConfig.materials[k] = 0;
  for (const [k, v] of Object.entries(p.mats)) devConfig.materials[k] = v;
  saveDevConfig();
}
