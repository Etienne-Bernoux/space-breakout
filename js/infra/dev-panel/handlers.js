// --- Dev Panel Input Handlers : User input processing ---

import { CONFIG } from '../../config.js';
import { PATTERNS, PATTERN_KEYS, GRID_PRESETS } from '../../domain/patterns.js';
import state, { MAT_KEYS, GRID_KEYS, PRESETS, saveDevConfig } from './state.js';
import { PANEL } from './draw.js';

// --- Input handlers ---

function hitTrack(x, y, trackY) {
  return x >= PANEL.sliderX - 10 && x <= PANEL.sliderX + PANEL.sliderW + 10 &&
         y >= trackY - 16 && y <= trackY + 16;
}

function updateDragValue(x) {
  if (!state.draggingSlider) return;
  const val = Math.max(0, Math.min(1, (x - PANEL.sliderX) / PANEL.sliderW));
  if (state.draggingSlider.type === 'density') {
    state.devConfig.density = Math.round(val * 20) / 20;
  } else {
    state.devConfig.materials[state.draggingSlider.key] = Math.round(val * 20) / 20;
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
      state.devConfig.patternKey = PATTERN_KEYS[i];
      saveDevConfig();
      return null;
    }
  }

  // --- Grille ---
  for (let i = 0; i < GRID_KEYS.length; i++) {
    const gy = PANEL.gridStartY + i * PANEL.gridSpacing;
    if (x >= rx && x <= rx + PANEL.rightW && y >= gy && y <= gy + PANEL.gridH) {
      state.devConfig.gridKey = GRID_KEYS[i];
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
    state.devConfig.density = CONFIG.asteroids.density;
    state.devConfig.materials = { rock: 1.0, ice: 0, lava: 0, metal: 0, crystal: 0, obsidian: 0 };
    state.devConfig.patternKey = 'random';
    state.devConfig.gridKey = 'small';
    saveDevConfig();
    return null;
  }

  // --- Sliders matériaux ---
  for (let i = 0; i < MAT_KEYS.length; i++) {
    const sy = PANEL.matStartY + i * PANEL.matSpacing;
    if (hitTrack(x, y, sy)) {
      state.draggingSlider = { key: MAT_KEYS[i], type: 'mat' };
      updateDragValue(x);
      return null;
    }
  }

  // --- Slider densité ---
  if (hitTrack(x, y, PANEL.densityY)) {
    state.draggingSlider = { key: 'density', type: 'density' };
    updateDragValue(x);
    return null;
  }

  return null;
}

export function handleDevDrag(x, _y) {
  updateDragValue(x);
}

export function handleDevRelease() {
  state.draggingSlider = null;
}

export function handleDevHover(x, y) {
  state.hoveredPreset = -1;
  state.hoveredPattern = -1;
  state.hoveredGrid = -1;

  const rx = PANEL.rightX;

  // Patterns
  for (let i = 0; i < PATTERN_KEYS.length; i++) {
    const py = PANEL.patternStartY + i * PANEL.patternSpacing;
    if (x >= rx && x <= rx + PANEL.rightW && y >= py && y <= py + PANEL.patternH) {
      state.hoveredPattern = i;
      return;
    }
  }

  // Grille
  for (let i = 0; i < GRID_KEYS.length; i++) {
    const gy = PANEL.gridStartY + i * PANEL.gridSpacing;
    if (x >= rx && x <= rx + PANEL.rightW && y >= gy && y <= gy + PANEL.gridH) {
      state.hoveredGrid = i;
      return;
    }
  }

  // Presets matériaux
  const presetY = PANEL.densityY + 35;
  for (let i = 0; i < PRESETS.length; i++) {
    const bx = 20 + (i % 3) * 155;
    const by = presetY + 10 + Math.floor(i / 3) * 28;
    if (x >= bx && x <= bx + 148 && y >= by && y <= by + 24) {
      state.hoveredPreset = i;
      return;
    }
  }
}

function applyPreset(index) {
  const p = PRESETS[index];
  state.devConfig.density = p.density;
  for (const k of MAT_KEYS) state.devConfig.materials[k] = 0;
  for (const [k, v] of Object.entries(p.mats)) state.devConfig.materials[k] = v;
  saveDevConfig();
}
