// --- Dev Panel Index : Public API re-exports ---

import { CONFIG } from '../../config.js';
import { PATTERNS, GRID_PRESETS } from '../../domain/patterns.js';
import state, { MAT_KEYS, loadDevConfig, saveDevConfig } from './state.js';
import { drawDevPanel } from './draw.js';
import { handleDevTap, handleDevDrag, handleDevRelease, handleDevHover } from './handlers.js';

// --- Public API: Mode and visibility ---
export function isDevMode() {
  return new URLSearchParams(window.location.search).has('dev');
}

export function isDevPanelActive() {
  return state.active;
}

export function showDevPanel() {
  state.active = true;
}

export function hideDevPanel() {
  state.active = false;
}

// --- Public API: Config ---
export { loadDevConfig, saveDevConfig };

/** Retourne la config astéroïdes enrichie du dev panel */
export function getDevAsteroidConfig() {
  // Normaliser les poids matériaux
  const mats = { ...state.devConfig.materials };
  const total = Object.values(mats).reduce((s, v) => s + v, 0);
  if (total > 0) {
    for (const k of MAT_KEYS) mats[k] = (mats[k] || 0) / total;
  }
  const filtered = {};
  for (const [k, v] of Object.entries(mats)) {
    if (v > 0.001) filtered[k] = v;
  }

  // Pattern sélectionné
  const pat = PATTERNS[state.devConfig.patternKey];
  const hasPattern = pat && pat.lines;

  // Grille : soit celle du pattern, soit celle sélectionnée
  const gridDef = hasPattern ? pat.grid : GRID_PRESETS[state.devConfig.gridKey] || GRID_PRESETS.small;
  const rows = gridDef?.rows || CONFIG.asteroids.rows;
  const cols = gridDef?.cols || CONFIG.asteroids.cols;

  return {
    ...CONFIG.asteroids,
    rows,
    cols,
    _autoSize: true, // signale au constructeur de recalculer cellW/cellH
    density: state.devConfig.density,
    materials: Object.keys(filtered).length > 0 ? filtered : undefined,
    pattern: hasPattern ? pat : undefined,
  };
}

// --- Public API: Drawing ---
export { drawDevPanel };

// --- Public API: Input handlers ---
export { handleDevTap, handleDevDrag, handleDevRelease, handleDevHover };
