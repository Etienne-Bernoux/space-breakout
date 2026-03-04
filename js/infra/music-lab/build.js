// --- Music Lab DOM Build ---
// Construit le DOM complet du music lab, retourne les refs pour update.

import { TRACKS, getSections, getStingerGroups, INSTRUMENTS_MAIN, INSTRUMENTS_DARK } from './tab-sons.js';
import { LAYER_NAMES } from '../music/index.js';

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
function actionBtn(cls, label, action, extra = {}) {
  const btn = txt('button', cls, label);
  btn.setAttribute('data-action', action);
  for (const [k, v] of Object.entries(extra)) btn.setAttribute(k, v);
  return btn;
}

const LAYER_COLORS = { drums: '#ff6644', bass: '#44aaff', pad: '#aa88ff', lead: '#ff44aa', high: '#ffee44' };
const INTENSITY_COLORS = ['#44aa66', '#88cc44', '#ccaa33', '#ff6644', '#ff2244'];

export function buildMusicLab(root) {
  root.innerHTML = '';
  const refs = { tabs: [], panels: [], trackBtns: [], sectionBtns: [], instContainer: null, instBtns: [],
    stingerBtns: [], intensityBtns: [], layerReadonly: [], layerToggles: [],
    sim: {}, footer: {} };

  // --- Header ---
  const header = el('div', 'ml-header');
  header.appendChild(txt('span', 'ml-title', 'MUSIC LAB'));
  const close = txt('button', 'ml-close', '×');
  close.setAttribute('data-action', 'close');
  header.appendChild(close);
  root.appendChild(header);

  // --- Tabs ---
  const tabNames = ['Stingers', 'Sons', 'Gameplay', 'Mix'];
  const tabBar = el('div', 'ml-tabs');
  for (let i = 0; i < tabNames.length; i++) {
    const tab = txt('button', 'ml-tab', tabNames[i]);
    tab.setAttribute('data-action', 'tab');
    tab.setAttribute('data-index', i);
    tabBar.appendChild(tab);
    refs.tabs.push(tab);
  }
  root.appendChild(tabBar);

  // --- Body (scrollable) ---
  const body = el('div', 'ml-body');

  // Panel 0: Stingers
  const p0 = el('div', 'ml-panel');
  const groups = getStingerGroups();
  for (const group of groups) {
    p0.appendChild(txt('div', 'ml-section-label', group.label));
    const grid = el('div', 'ml-btn-grid');
    for (const s of group.items) {
      const btn = actionBtn('ml-btn', s.label, 'stinger', { 'data-id': s.id });
      btn.style.borderColor = s.color;
      btn.style.color = s.color;
      grid.appendChild(btn);
      refs.stingerBtns.push(btn);
    }
    p0.appendChild(grid);
  }
  refs.panels.push(p0);
  body.appendChild(p0);

  // Panel 1: Sons
  const p1 = el('div', 'ml-panel');

  // Tracks
  p1.appendChild(txt('div', 'ml-section-label', 'PISTE'));
  const trackRow = el('div', 'ml-btn-row');
  for (const t of TRACKS) {
    const btn = actionBtn('ml-btn', t.label, 'track', { 'data-id': t.id });
    trackRow.appendChild(btn);
    refs.trackBtns.push({ id: t.id, btn });
  }
  p1.appendChild(trackRow);

  // Sections
  p1.appendChild(txt('div', 'ml-section-label', 'SECTIONS'));
  const secGrid = el('div', 'ml-btn-grid');
  const sections = getSections();
  for (const s of sections) {
    const btn = actionBtn('ml-btn', s.label, 'section', { 'data-id': s.id });
    btn.style.borderColor = s.color;
    btn.style.color = s.color;
    secGrid.appendChild(btn);
    refs.sectionBtns.push({ id: s.id, btn });
  }
  p1.appendChild(secGrid);

  // Instruments (rebuilt when track changes)
  p1.appendChild(txt('div', 'ml-section-label', 'INSTRUMENTS'));
  const instContainer = el('div', 'ml-btn-grid');
  refs.instContainer = instContainer;
  p1.appendChild(instContainer);

  refs.panels.push(p1);
  body.appendChild(p1);

  // Panel 2: Gameplay
  const p2 = el('div', 'ml-panel');

  // Intensity display
  p2.appendChild(txt('div', 'ml-section-label', 'INTENSITÉ'));
  const intRow = el('div', 'ml-intensity-row');
  const intValue = txt('span', 'ml-intensity-value', '0');
  const intLabel = txt('span', 'ml-intensity-label', 'CALM');
  intRow.appendChild(intValue);
  intRow.appendChild(intLabel);
  refs.sim.intValue = intValue;
  refs.sim.intLabel = intLabel;

  // Override buttons 0-4
  const intBtns = el('div', 'ml-btn-row ml-intensity-btns');
  for (let i = 0; i <= 4; i++) {
    const btn = actionBtn('ml-btn-sm', `${i}`, 'intensity', { 'data-level': i });
    btn.style.borderColor = INTENSITY_COLORS[i];
    btn.style.color = INTENSITY_COLORS[i];
    intBtns.appendChild(btn);
    refs.intensityBtns.push(btn);
  }
  intRow.appendChild(intBtns);
  p2.appendChild(intRow);

  // Sim state
  p2.appendChild(txt('div', 'ml-section-label', 'ÉTAT SIMULÉ'));
  const progressBar = el('div', 'ml-progress-bar');
  const progressFill = el('div', 'ml-progress-fill');
  const progressText = txt('span', 'ml-progress-text', 'Remaining: 20/20 (100%)');
  progressBar.appendChild(progressFill);
  progressBar.appendChild(progressText);
  p2.appendChild(progressBar);
  refs.sim.progressFill = progressFill;
  refs.sim.progressText = progressText;

  const simStats = el('div', 'ml-sim-stats');
  const comboStat = txt('span', 'ml-stat', 'Combo: 0');
  const livesStat = txt('span', 'ml-stat', 'Lives: 3');
  const puStat = txt('span', 'ml-stat', 'PU: OFF');
  simStats.appendChild(comboStat);
  simStats.appendChild(livesStat);
  simStats.appendChild(puStat);
  p2.appendChild(simStats);
  refs.sim.combo = comboStat;
  refs.sim.lives = livesStat;
  refs.sim.pu = puStat;

  // Actions
  p2.appendChild(txt('div', 'ml-section-label', 'ACTIONS'));
  const actGrid = el('div', 'ml-btn-grid');
  const actions = [
    { id: 'gp-destroy', label: 'DESTROY', color: '#ff6644' },
    { id: 'gp-combo-up', label: 'COMBO +1', color: '#ffcc00' },
    { id: 'gp-combo-reset', label: 'COMBO RST', color: '#888888' },
    { id: 'gp-life', label: 'LIFE -1', color: '#ff4444' },
    { id: 'gp-powerup', label: 'PU ON', color: '#ffcc00' },
    { id: 'gp-reset', label: 'RESET ALL', color: '#ff4444' },
  ];
  for (const a of actions) {
    const btn = actionBtn('ml-btn', a.label, 'gameplay', { 'data-id': a.id });
    btn.style.borderColor = a.color;
    btn.style.color = a.color;
    actGrid.appendChild(btn);
    if (a.id === 'gp-powerup') refs.sim.puBtn = btn;
  }
  p2.appendChild(actGrid);

  // Layers readonly
  p2.appendChild(txt('div', 'ml-section-label', 'LAYERS (temps réel)'));
  const layerRow = el('div', 'ml-layer-row');
  for (const name of LAYER_NAMES) {
    const cell = el('div', 'ml-layer-cell');
    const fill = el('div', 'ml-layer-fill');
    fill.style.background = LAYER_COLORS[name] || '#888';
    const label = txt('span', 'ml-layer-label', name.toUpperCase());
    cell.appendChild(fill);
    cell.appendChild(label);
    layerRow.appendChild(cell);
    refs.layerReadonly.push({ name, cell, fill, label });
  }
  p2.appendChild(layerRow);

  refs.panels.push(p2);
  body.appendChild(p2);

  // Panel 3: Mix
  const p3 = el('div', 'ml-panel');
  p3.appendChild(txt('div', 'ml-section-label', 'LAYERS (cliquer pour toggle)'));
  for (const name of LAYER_NAMES) {
    const row = el('div', 'ml-mix-row');
    const btn = actionBtn('ml-btn ml-mix-btn', `${name.toUpperCase()} ON`, 'layer', { 'data-name': name });
    btn.style.borderColor = LAYER_COLORS[name] || '#888';
    const volText = txt('span', 'ml-mix-vol', 'vol: 100%');
    row.appendChild(btn);
    row.appendChild(volText);
    p3.appendChild(row);
    refs.layerToggles.push({ name, btn, volText });
  }

  p3.appendChild(txt('div', 'ml-section-label', 'EFFETS'));
  const muffleBtn = actionBtn('ml-btn', 'MUFFLE', 'muffle');
  refs.muffleBtn = muffleBtn;
  p3.appendChild(muffleBtn);

  refs.panels.push(p3);
  body.appendChild(p3);

  root.appendChild(body);

  // --- Footer ---
  const footer = el('div', 'ml-footer');
  const transport = actionBtn('ml-btn ml-transport', '▸ PLAY', 'transport');
  footer.appendChild(transport);
  refs.footer.transport = transport;

  const actBar = el('div', 'ml-activity');
  const actFill = el('div', 'ml-activity-fill');
  const actLabel = txt('span', 'ml-activity-label', 'Idle');
  const actTime = txt('span', 'ml-activity-time', '');
  actBar.appendChild(actFill);
  actBar.appendChild(actLabel);
  actBar.appendChild(actTime);
  footer.appendChild(actBar);

  const secLabel = txt('div', 'ml-current-section', '');
  footer.appendChild(secLabel);
  refs.footer.actFill = actFill;
  refs.footer.actLabel = actLabel;
  refs.footer.actTime = actTime;
  refs.footer.secLabel = secLabel;

  root.appendChild(footer);

  return refs;
}
