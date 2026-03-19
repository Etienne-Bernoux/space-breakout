// --- Dev Panel DOM Build ---
// Construit le DOM complet du dev panel, retourne les refs pour update.

import { MATERIALS } from '../../../domain/materials.js';
import { PATTERNS, PATTERN_KEYS, GRID_PRESETS } from '../../../domain/patterns.js';
import { SLIDER_MAT_KEYS, GRID_KEYS, PRESETS } from './state.js';
import { ZONE_1, ZONE_2 } from '../../../domain/progression/level-catalog.js';

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
  const backBtn = txt('button', 'lab-back-btn', '\u2190 LAB');
  backBtn.setAttribute('data-action', 'back');
  header.appendChild(backBtn);
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

  // --- Presets (colonne gauche) ---
  colLeft.appendChild(txt('div', 'dp-section-label', 'PRESETS'));
  const presetGrid = el('div', 'dp-btn-grid');
  for (let i = 0; i < PRESETS.length; i++) {
    const btn = txt('button', 'dp-btn', PRESETS[i].name);
    btn.setAttribute('data-action', 'preset');
    btn.setAttribute('data-index', i);
    presetGrid.appendChild(btn);
    refs.presets.push(btn);
  }
  colLeft.appendChild(presetGrid);

  // --- Niveaux par zone (accordéons repliables) ---
  refs.levels = [];
  refs.accordions = [];
  const zones = [ZONE_1, ZONE_2];
  for (const zone of zones) {
    const name = zone.name.toUpperCase();
    const header = txt('div', 'dp-section-label dp-accordion', `▸ ${name}`);
    const levelList = el('div', 'dp-btn-list dp-collapsed');
    const levelIds = zone.levels.map(l => l.id);
    header.addEventListener('click', () => {
      const collapsed = levelList.classList.toggle('dp-collapsed');
      header.textContent = `${collapsed ? '▸' : '▾'} ${name}`;
    });
    colRight.appendChild(header);
    for (const lvl of zone.levels) {
      const btn = txt('button', 'dp-btn', `${lvl.id} ${lvl.name}`);
      btn.setAttribute('data-action', 'level');
      btn.setAttribute('data-key', lvl.id);
      levelList.appendChild(btn);
      refs.levels.push({ key: lvl.id, btn });
    }
    colRight.appendChild(levelList);
    refs.accordions.push({ header, list: levelList, name, levelIds });
  }

  // --- Patterns libres (accordéon repliable) ---
  const usedPatterns = new Set();
  for (const zone of zones) {
    for (const lvl of zone.levels) {
      if (lvl.asteroids?.pattern) {
        const patKey = PATTERN_KEYS.find(k => PATTERNS[k] === lvl.asteroids.pattern);
        if (patKey) usedPatterns.add(patKey);
      }
    }
  }
  const freePatternKeys = PATTERN_KEYS.filter(k => !usedPatterns.has(k));

  const patHeader = txt('div', 'dp-section-label dp-accordion', '▸ PATTERNS LIBRES');
  const patternList = el('div', 'dp-btn-list dp-collapsed');
  patHeader.addEventListener('click', () => {
    const collapsed = patternList.classList.toggle('dp-collapsed');
    patHeader.textContent = `${collapsed ? '▸' : '▾'} PATTERNS LIBRES`;
  });
  colRight.appendChild(patHeader);
  for (const key of freePatternKeys) {
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

  // --- Footer: AI toggle + Launch + Reset ---
  const footer = el('div', 'dp-footer');

  const aiRow = el('label', 'dp-ai-toggle');
  const aiCheckbox = el('input', '', { type: 'checkbox', 'data-action': 'ai-toggle' });
  aiRow.appendChild(aiCheckbox);
  aiRow.appendChild(document.createTextNode(' IA JOUE'));
  refs.aiCheckbox = aiCheckbox;
  footer.appendChild(aiRow);

  const launch = txt('button', 'dp-btn-primary', '▸ LANCER');
  launch.setAttribute('data-action', 'launch');
  footer.appendChild(launch);
  const reset = txt('button', 'dp-btn-danger', 'RESET');
  reset.setAttribute('data-action', 'reset');
  footer.appendChild(reset);
  root.appendChild(footer);

  return refs;
}
