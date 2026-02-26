// --- Dev Panel State : Configuration, persistence, and mutable state ---

import { CONFIG } from '../../config.js';
import { MATERIALS } from '../../domain/materials.js';
import { PATTERNS, GRID_PRESETS } from '../../domain/patterns.js';

export const STORAGE_KEY = 'space-breakout-dev';
export const MAT_KEYS = Object.keys(MATERIALS);
export const GRID_KEYS = Object.keys(GRID_PRESETS);

// --- Presets ---
export const PRESETS = [
  { name: 'Niveau 1 — Roche',     density: 0.5, mats: { rock: 1.0 } },
  { name: 'Niveau 2 — Givre',     density: 0.5, mats: { rock: 0.6, ice: 0.3, crystal: 0.1 } },
  { name: 'Niveau 3 — Volcan',    density: 0.55, mats: { rock: 0.4, lava: 0.35, metal: 0.15, obsidian: 0.1 } },
  { name: 'Niveau 4 — Forteresse', density: 0.6, mats: { rock: 0.2, metal: 0.35, obsidian: 0.2, lava: 0.15, crystal: 0.1 } },
  { name: 'Endgame — Chaos',      density: 0.65, mats: { rock: 0.15, ice: 0.1, lava: 0.2, metal: 0.25, crystal: 0.1, obsidian: 0.2 } },
  { name: 'Cristaux purs',        density: 0.4, mats: { crystal: 0.7, ice: 0.3 } },
];

// --- State (mutable state object) ---
const state = {
  devConfig: {
    density: CONFIG.asteroids.density,
    materials: { rock: 1.0, ice: 0, lava: 0, metal: 0, crystal: 0, obsidian: 0 },
    patternKey: 'random',
    gridKey: 'small', // taille grille pour mode aléatoire
  },
  active: false,
  draggingSlider: null,
  hoveredPreset: -1,
  hoveredPattern: -1,
  hoveredGrid: -1,
};

// --- Persistence ---
export function loadDevConfig() {
  try {
    const data = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (data) {
      state.devConfig.density = data.density ?? state.devConfig.density;
      if (data.materials) state.devConfig.materials = { ...state.devConfig.materials, ...data.materials };
      if (data.patternKey) state.devConfig.patternKey = data.patternKey;
      if (data.gridKey) state.devConfig.gridKey = data.gridKey;
    }
  } catch (_) {}
}

export function saveDevConfig() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state.devConfig));
}

export default state;
