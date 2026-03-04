// --- Dev Panel DOM Build ---
// Construit le DOM complet du dev panel, retourne les refs pour update.

import { MATERIALS } from '../../domain/materials.js';
import { PATTERNS, PATTERN_KEYS, GRID_PRESETS } from '../../domain/patterns.js';
import { SLIDER_MAT_KEYS, GRID_KEYS, PRESETS } from './state.js';

function el(tag, cls, attrs = {}) {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  for (const [k, v] of Object.entries(attrs)) e.setAttribute(k, v);
  return e;
}
function txt(tag, cls, text) {
  const e = el(tag, cls);
  e.textContent = text;
  return e;
}

export function buildDevPanel(root) {
  root.innerHTML = '';
  const refs = { sliders: {}, presets: [], patterns: [], grids: [] };

  // Header
  const header = el('div', 'dp-header');
  header.appendChild(txt('span', 'dp-title', 'DEV PANEL'));
  root.appendChild(header);

  // Body (2 colonnes desktop via CSS grid)
  const body = el('div', 'dp-body');
  const colLeft = el('div', 'dp-col');
  const colRight = el('div', 'dp-col');

  // --- Materials (colonne gauche) ---
  colLeft.appendChild(txt('div', 'dp-section-label', 'MATÉRIAUX'));
  const matHint = txt('div', 'dp-hint', '');
  matHint.setAttribute('data-ref', 'mat-hint');
  refs.matHint = matHint;
  colLeft.appendChild(matHint);

  for (const key of SLIDER_MAT_KEYS) {
    const mat = MATERIALS[key];
    const row = el('div', 'dp-slider-row');

    const swatch = el('span', 'dp-swatch');
    swatch.style.background = mat.colors[0];
    row.appendChild(swatch);

    row.appendChild(txt('span', 'dp-slider-label', mat.name));

    const hp = txt('span', 'dp-slider-hp', mat.hp === Infinity ? '∞HP' : `${mat.hp}HP`);
    row.appendChild(hp);

    const slider = el('input', 'dp-slider', {
      type: 'range', min: '0', max: '100', step: '5',
      'data-slider': key,
    });
    row.appendChild(slider);

    const val = txt('span', 'dp-slider-val', '0%');
    val.setAttribute('data-ref', `val-${key}`);
    row.appendChild(val);

    refs.sliders[key] = { slider, val };
    colLeft.appendChild(row);
  }

  // --- Density (colonne gauche) ---
  colLeft.appendChild(txt('div', 'dp-section-label dp-density-label', 'DENSITÉ'));
  const densityHint = txt('div', 'dp-hint', '');
  densityHint.setAttribute('data-ref', 'density-hint');
  refs.densityHint = densityHint;
  colLeft.appendChild(densityHint);

  const densityRow = el('div', 'dp-slider-row');
  const densitySlider = el('input', 'dp-slider', {
    type: 'range', min: '0', max: '100', step: '5',
    'data-slider': 'density',
  });
  densityRow.appendChild(densitySlider);
  const densityVal = txt('span', 'dp-slider-val', '60%');
  densityVal.setAttribute('data-ref', 'val-density');
  densityRow.appendChild(densityVal);
  refs.densitySlider = densitySlider;
  refs.densityVal = densityVal;
  colLeft.appendChild(densityRow);

  // --- Presets (colonne droite) ---
  colRight.appendChild(txt('div', 'dp-section-label', 'PRESETS'));
  const presetGrid = el('div', 'dp-btn-grid');
  for (let i = 0; i < PRESETS.length; i++) {
    const btn = txt('button', 'dp-btn', PRESETS[i].name);
    btn.setAttribute('data-action', 'preset');
    btn.setAttribute('data-index', i);
    presetGrid.appendChild(btn);
    refs.presets.push(btn);
  }
  colRight.appendChild(presetGrid);

  // --- Pattern (colonne droite) ---
  colRight.appendChild(txt('div', 'dp-section-label', 'PATTERN'));
  const patternList = el('div', 'dp-btn-list');
  const rndBtn = txt('button', 'dp-btn', 'Aléatoire');
  rndBtn.setAttribute('data-action', 'pattern');
  rndBtn.setAttribute('data-key', 'random');
  patternList.appendChild(rndBtn);
  refs.patterns.push({ key: 'random', btn: rndBtn });
  for (const key of PATTERN_KEYS) {
    const pat = PATTERNS[key];
    const btn = txt('button', 'dp-btn', pat.name);
    btn.setAttribute('data-action', 'pattern');
    btn.setAttribute('data-key', key);
    if (pat.grid) {
      const size = txt('span', 'dp-btn-size', `${pat.grid.cols}×${pat.grid.rows}`);
      btn.appendChild(size);
    }
    patternList.appendChild(btn);
    refs.patterns.push({ key, btn });
  }
  colRight.appendChild(patternList);

  // --- Grid (colonne droite) ---
  colRight.appendChild(txt('div', 'dp-section-label', 'TAILLE GRILLE'));
  const gridHint = txt('div', 'dp-hint', '');
  gridHint.setAttribute('data-ref', 'grid-hint');
  refs.gridHint = gridHint;
  colRight.appendChild(gridHint);

  const gridList = el('div', 'dp-btn-list');
  for (const key of GRID_KEYS) {
    const g = GRID_PRESETS[key];
    const btn = txt('button', 'dp-btn', g.label);
    btn.setAttribute('data-action', 'grid');
    btn.setAttribute('data-key', key);
    gridList.appendChild(btn);
    refs.grids.push({ key, btn });
  }
  colRight.appendChild(gridList);

  body.appendChild(colLeft);
  body.appendChild(colRight);
  root.appendChild(body);

  // --- Footer: Launch + Reset ---
  const footer = el('div', 'dp-footer');
  const launch = txt('button', 'dp-btn-primary', '▸ LANCER');
  launch.setAttribute('data-action', 'launch');
  footer.appendChild(launch);
  const reset = txt('button', 'dp-btn-danger', 'RESET');
  reset.setAttribute('data-action', 'reset');
  footer.appendChild(reset);
  root.appendChild(footer);

  return refs;
}
