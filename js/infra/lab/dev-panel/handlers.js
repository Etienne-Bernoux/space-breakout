// --- Dev Panel DOM Handlers ---
// Event delegation sur le root #dev-panel-lab.

import { CONFIG } from '../../../config.js';
import state, { SLIDER_MAT_KEYS, PRESETS, saveDevConfig } from './state.js';
import { updateDevPanel } from './update.js';

/**
 * @param {HTMLElement} root
 * @param {object} refs - from build.js
 * @param {object} opts - { onLaunch, onClose }
 */
export function attachDevHandlers(root, refs, { onLaunch, onBack }) {
  // Click delegation
  root.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-action]');
    if (!btn) return;
    const action = btn.dataset.action;

    if (action === 'back') { if (onBack) onBack(); return; }
    if (action === 'launch') { saveDevConfig(); onLaunch(); return; }

    if (action === 'reset') {
      state.devConfig.density = CONFIG.asteroids.density;
      state.devConfig.materials = {};
      for (const k of SLIDER_MAT_KEYS) state.devConfig.materials[k] = k === 'rock' ? 1.0 : 0;
      state.devConfig.patternKey = 'random';
      state.devConfig.gridKey = 'small';
      saveDevConfig();
      updateDevPanel(refs);
      return;
    }

    if (action === 'preset') {
      const idx = parseInt(btn.dataset.index);
      const p = PRESETS[idx];
      if (!p) return;
      state.devConfig.density = p.density;
      for (const k of SLIDER_MAT_KEYS) state.devConfig.materials[k] = 0;
      for (const [k, v] of Object.entries(p.mats)) state.devConfig.materials[k] = v;
      if (p.patternKey) state.devConfig.patternKey = p.patternKey;
      saveDevConfig();
      updateDevPanel(refs);
      return;
    }

    if (action === 'pattern') {
      state.devConfig.patternKey = btn.dataset.key;
      saveDevConfig();
      updateDevPanel(refs);
      return;
    }

    if (action === 'grid') {
      state.devConfig.gridKey = btn.dataset.key;
      saveDevConfig();
      updateDevPanel(refs);
      return;
    }
  });

  // Slider input (material + density)
  root.addEventListener('input', (e) => {
    if (!e.target.matches('[data-slider]')) return;
    const key = e.target.dataset.slider;
    const val = parseInt(e.target.value) / 100;

    if (key === 'density') {
      state.devConfig.density = val;
    } else {
      state.devConfig.materials[key] = val;
    }
    saveDevConfig();
    updateDevPanel(refs);
  });

  // Keyboard: Enter → launch
  document.addEventListener('keydown', (e) => {
    if (!state.active) return;
    if (e.key === 'Enter') { e.stopPropagation(); saveDevConfig(); onLaunch(); }
  });
}
