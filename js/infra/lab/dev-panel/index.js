// --- Dev Panel Index : Public API (DOM version) ---

import { CONFIG } from '../../../config.js';
import { PATTERNS, GRID_PRESETS } from '../../../domain/patterns.js';
import state, { SLIDER_MAT_KEYS, loadDevConfig, saveDevConfig } from './state.js';
import { buildDevPanel } from './build.js';
import { updateDevPanel } from './update.js';
import { attachDevHandlers } from './handlers.js';
import { loadCommittedModel } from '../ai-lab/models/model-storage.js';

let refs = null;
let onLaunchCb = null;

// --- Public API: visibility ---
export function isDevPanelActive() {
  return state.active;
}

export function showDevPanel() {
  state.active = true;
  const root = document.getElementById('dev-panel-lab');
  if (root) root.classList.add('active');
  if (refs) updateDevPanel(refs);
}

export function hideDevPanel() {
  state.active = false;
  const root = document.getElementById('dev-panel-lab');
  if (root) root.classList.remove('active');
}

// --- Public API: Config ---
export { loadDevConfig, saveDevConfig };

/** L'IA doit-elle jouer à la place du joueur ? */
export function isAIPlayEnabled() {
  return state.devConfig.aiPlay;
}

/** Retourne le levelId sélectionné (null = mode sandbox/pattern). */
export function getSelectedLevelId() {
  return state.devConfig.levelId || null;
}

/** Retourne la config astéroïdes enrichie du dev panel */
export function getDevAsteroidConfig() {
  // Normaliser les poids matériaux (tentacle/alienCore exclus — placement manuel uniquement)
  const mats = { ...state.devConfig.materials };
  delete mats.tentacle;
  delete mats.alienCore;
  const total = Object.values(mats).reduce((s, v) => s + v, 0);
  if (total > 0) {
    for (const k of SLIDER_MAT_KEYS) mats[k] = (mats[k] || 0) / total;
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
    _autoSize: true,
    density: state.devConfig.density,
    materials: Object.keys(filtered).length > 0 ? filtered : undefined,
    pattern: hasPattern ? pat : undefined,
  };
}

/**
 * Initialise le dev panel DOM. Construit le DOM, attache les handlers.
 * @param {object} opts - { onLaunch: function }
 */
export function initDevPanel({ onLaunch, onBack }) {
  onLaunchCb = onLaunch;
  loadCommittedModel(); // preload best.json → localStorage (fire-and-forget)
  const root = document.getElementById('dev-panel-lab');
  if (!root) return;

  refs = buildDevPanel(root);
  updateDevPanel(refs);

  attachDevHandlers(root, refs, {
    onLaunch: () => {
      hideDevPanel();
      if (onLaunchCb) onLaunchCb();
    },
    onBack,
  });
}
