// --- Dev Panel DOM Update ---
// Sync DOM ← devConfig state.

import state, { SLIDER_MAT_KEYS } from './state.js';

export function updateDevPanel(refs) {
  const cfg = state.devConfig;
  const isPatternMode = cfg.patternKey !== 'random';

  // Material sliders
  for (const key of SLIDER_MAT_KEYS) {
    const r = refs.sliders[key];
    if (!r) continue;
    const pct = Math.round((cfg.materials[key] || 0) * 100);
    r.slider.value = pct;
    r.val.textContent = `${pct}%`;
  }

  // Hints for pattern mode
  refs.matHint.textContent = isPatternMode ? '(pour les cases "?" du pattern)' : '';
  refs.densityHint.textContent = isPatternMode ? '(ignoré en mode pattern)' : '';
  refs.gridHint.textContent = isPatternMode ? '(définie par le pattern)' : '';

  // Density slider
  refs.densitySlider.value = Math.round(cfg.density * 100);
  refs.densityVal.textContent = `${Math.round(cfg.density * 100)}%`;

  // Pattern buttons
  for (const p of refs.patterns) {
    p.btn.classList.toggle('dp-btn-active', cfg.patternKey === p.key);
  }

  // Grid buttons
  for (const g of refs.grids) {
    g.btn.classList.toggle('dp-btn-active', !isPatternMode && cfg.gridKey === g.key);
  }

  // AI checkbox
  if (refs.aiCheckbox) refs.aiCheckbox.checked = cfg.aiPlay;
}
