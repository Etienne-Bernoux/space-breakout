// --- Construction DOM du progress lab ---

import { MINERAL_IDS, getMineral } from '../../domain/mineral/index.js';
import { UPGRADE_IDS } from '../../use-cases/upgrade/upgrade-catalog.js';
import { getUpgrade } from '../../use-cases/upgrade/upgrade-catalog.js';

/**
 * Construit le DOM complet du progress lab.
 * Appelé une seule fois au boot. Retourne les refs pour update.js.
 * @param {HTMLElement} root - #progress-lab div
 * @param {object[]} levels - getAllLevels()
 * @returns {object} refs - { tabs, panels, wallet, upgrades, simulator, reset }
 */
export function buildProgressLab(root, levels) {
  root.innerHTML = '';

  // --- Header ---
  const header = el('div', 'pl-header');
  const backBtn = el('button', 'lab-back-btn');
  backBtn.textContent = '\u2190 LAB';
  backBtn.dataset.action = 'back';
  header.appendChild(backBtn);
  header.appendChild(txt('span', 'PROGRESS LAB', 'pl-title'));
  root.appendChild(header);

  // --- Tabs ---
  const tabBar = el('div', 'pl-tabs');
  const tabDefs = [
    { id: 'wallet', label: 'Minerais' },
    { id: 'upgrades', label: 'Upgrades' },
    { id: 'simulator', label: 'Simulateur' },
    { id: 'reset', label: 'Reset' },
  ];
  const tabBtns = {};
  for (const t of tabDefs) {
    const btn = el('button', 'pl-tab');
    btn.textContent = t.label;
    btn.dataset.tab = t.id;
    tabBar.appendChild(btn);
    tabBtns[t.id] = btn;
  }
  root.appendChild(tabBar);

  // --- Panel container ---
  const body = el('div', 'pl-body');

  // Wallet panel
  const walletPanel = buildWalletPanel();
  body.appendChild(walletPanel.el);

  // Upgrades panel
  const upgradesPanel = buildUpgradesPanel();
  body.appendChild(upgradesPanel.el);

  // Simulator panel
  const simulatorPanel = buildSimulatorPanel(levels);
  body.appendChild(simulatorPanel.el);

  // Reset panel
  const resetPanel = buildResetPanel();
  body.appendChild(resetPanel.el);

  root.appendChild(body);

  return {
    tabBtns,
    wallet: walletPanel,
    upgrades: upgradesPanel,
    simulator: simulatorPanel,
    reset: resetPanel,
  };
}

// --- Wallet ---
function buildWalletPanel() {
  const panel = el('div', 'pl-panel');
  panel.dataset.panel = 'wallet';
  const rows = {};

  for (const id of MINERAL_IDS) {
    const m = getMineral(id);
    const row = el('div', 'pl-row');

    const swatch = el('span', 'pl-swatch');
    swatch.style.background = m.color;
    row.appendChild(swatch);

    row.appendChild(txt('span', m.name, 'pl-label'));

    const minus = el('button', 'pl-btn-sm');
    minus.textContent = '−';
    minus.dataset.action = 'mineral-minus';
    minus.dataset.mineral = id;
    row.appendChild(minus);

    const qty = txt('span', '0', 'pl-qty');
    qty.dataset.mineral = id;
    row.appendChild(qty);

    const plus = el('button', 'pl-btn-sm');
    plus.textContent = '+';
    plus.dataset.action = 'mineral-plus';
    plus.dataset.mineral = id;
    row.appendChild(plus);

    panel.appendChild(row);
    rows[id] = qty;
  }
  return { el: panel, rows };
}

// --- Upgrades ---
function buildUpgradesPanel() {
  const panel = el('div', 'pl-panel');
  panel.dataset.panel = 'upgrades';
  const rows = {};

  for (const id of UPGRADE_IDS) {
    const u = getUpgrade(id);
    const row = el('div', 'pl-row');

    row.appendChild(txt('span', u.name, 'pl-label'));

    const minus = el('button', 'pl-btn-sm');
    minus.textContent = '−';
    minus.dataset.action = 'upgrade-minus';
    minus.dataset.upgrade = id;
    row.appendChild(minus);

    const levelSpan = txt('span', '0/' + u.maxLevel, 'pl-qty');
    levelSpan.dataset.upgrade = id;
    row.appendChild(levelSpan);

    const plus = el('button', 'pl-btn-sm');
    plus.textContent = '+';
    plus.dataset.action = 'upgrade-plus';
    plus.dataset.upgrade = id;
    row.appendChild(plus);

    panel.appendChild(row);
    rows[id] = levelSpan;
  }
  return { el: panel, rows };
}

// --- Simulator ---
function buildSimulatorPanel(levels) {
  const panel = el('div', 'pl-panel');
  panel.dataset.panel = 'simulator';

  // Level select
  const levelRow = el('div', 'pl-sim-row');
  levelRow.appendChild(txt('label', 'Niveau :', 'pl-label'));
  const select = document.createElement('select');
  select.className = 'pl-select';
  select.dataset.action = 'sim-level';
  for (let i = 0; i < levels.length; i++) {
    const opt = document.createElement('option');
    opt.value = i;
    opt.textContent = levels[i].name;
    select.appendChild(opt);
  }
  levelRow.appendChild(select);
  panel.appendChild(levelRow);

  // Result type
  const resultRow = el('div', 'pl-sim-row');
  resultRow.appendChild(txt('span', 'Résultat :', 'pl-label'));
  const victoryBtn = el('button', 'pl-btn pl-btn-active');
  victoryBtn.textContent = 'Victoire';
  victoryBtn.dataset.action = 'sim-result';
  victoryBtn.dataset.value = 'victory';
  const defeatBtn = el('button', 'pl-btn');
  defeatBtn.textContent = 'Défaite';
  defeatBtn.dataset.action = 'sim-result';
  defeatBtn.dataset.value = 'defeat';
  resultRow.appendChild(victoryBtn);
  resultRow.appendChild(defeatBtn);
  panel.appendChild(resultRow);

  // Stars
  const starsRow = el('div', 'pl-sim-row');
  starsRow.dataset.id = 'sim-stars-row';
  starsRow.appendChild(txt('span', 'Étoiles :', 'pl-label'));
  const starBtns = [];
  for (let s = 1; s <= 3; s++) {
    const btn = el('button', 'pl-btn-star');
    btn.textContent = '★'.repeat(s);
    btn.dataset.action = 'sim-stars';
    btn.dataset.value = s;
    if (s === 3) btn.classList.add('pl-btn-active');
    starsRow.appendChild(btn);
    starBtns.push(btn);
  }
  panel.appendChild(starsRow);

  // Minerals collected
  const mineralInputs = {};
  for (const id of MINERAL_IDS) {
    const m = getMineral(id);
    const row = el('div', 'pl-sim-row');
    const swatch = el('span', 'pl-swatch');
    swatch.style.background = m.color;
    row.appendChild(swatch);
    row.appendChild(txt('span', m.name, 'pl-label'));

    const minus = el('button', 'pl-btn-sm');
    minus.textContent = '−';
    minus.dataset.action = 'sim-mineral-minus';
    minus.dataset.mineral = id;
    row.appendChild(minus);

    const qty = txt('span', '0', 'pl-qty');
    qty.dataset.simMineral = id;
    row.appendChild(qty);

    const plus = el('button', 'pl-btn-sm');
    plus.textContent = '+';
    plus.dataset.action = 'sim-mineral-plus';
    plus.dataset.mineral = id;
    row.appendChild(plus);

    panel.appendChild(row);
    mineralInputs[id] = qty;
  }

  // Lives lost
  const livesRow = el('div', 'pl-sim-row');
  livesRow.appendChild(txt('span', 'Vies perdues :', 'pl-label'));
  const lMinus = el('button', 'pl-btn-sm');
  lMinus.textContent = '−';
  lMinus.dataset.action = 'sim-lives-minus';
  livesRow.appendChild(lMinus);
  const livesSpan = txt('span', '0', 'pl-qty');
  livesSpan.dataset.id = 'sim-lives';
  livesRow.appendChild(livesSpan);
  const lPlus = el('button', 'pl-btn-sm');
  lPlus.textContent = '+';
  lPlus.dataset.action = 'sim-lives-plus';
  livesRow.appendChild(lPlus);
  panel.appendChild(livesRow);

  // Simulate button
  const simBtn = el('button', 'pl-btn pl-btn-primary');
  simBtn.textContent = 'Simuler';
  simBtn.dataset.action = 'sim-run';
  panel.appendChild(simBtn);

  // Feedback
  const feedback = txt('div', '', 'pl-feedback');
  panel.appendChild(feedback);

  return {
    el: panel,
    select,
    victoryBtn, defeatBtn, starBtns, starsRow,
    mineralInputs, livesSpan, feedback,
  };
}

// --- Reset ---
function buildResetPanel() {
  const panel = el('div', 'pl-panel');
  panel.dataset.panel = 'reset';

  panel.appendChild(txt('p', 'Remet à zéro : minerais, upgrades et progression.', 'pl-desc'));

  const btn = el('button', 'pl-btn pl-btn-danger');
  btn.textContent = 'Confirmer Reset';
  btn.dataset.action = 'reset-all';
  panel.appendChild(btn);

  const feedback = txt('div', '', 'pl-feedback');
  panel.appendChild(feedback);
  return { el: panel, feedback };
}

// --- Helpers ---
function el(tag, cls) {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  return e;
}

function txt(tag, text, cls) {
  const e = el(tag, cls);
  e.textContent = text;
  return e;
}
