// --- Construction DOM du progress lab (panel droit + simulator modal) ---

import { MINERAL_IDS, getMineral } from '../../../contexts/mineral/domain/index.js';
import { UPGRADE_IDS, getUpgrade } from '../../../use-cases/upgrade/upgrade-catalog.js';

/**
 * Construit le panel unique (wallet + upgrades + reset + zone details).
 * Les sections worldMap (minerais/upgrades) et systemMap (zones) sont swappées par CSS.
 * @param {HTMLElement} root - #pl-panel
 * @param {object[]} zones - getAllZones()
 * @returns {object} refs
 */
export function buildPanel(root, zones) {
  root.innerHTML = '';

  // Back button (toujours visible)
  const backBtn = el('button', 'lab-back-btn');
  backBtn.textContent = '\u2190 LAB';
  backBtn.dataset.action = 'back';
  root.appendChild(backBtn);

  // --- Contenu systemMap (zone details) ---
  const systemContent = el('div', 'pl-system-content');
  const zoneRefs = buildZoneSection(systemContent, zones);
  root.appendChild(systemContent);

  // --- Contenu worldMap (minerais + upgrades + reset) ---
  const worldContent = el('div', 'pl-world-content');
  const { walletRows, upgradeRows, feedback } = buildWorldSection(worldContent);
  root.appendChild(worldContent);

  return {
    wallet: { rows: walletRows },
    upgrades: { rows: upgradeRows },
    reset: { feedback },
    zone: zoneRefs,
  };
}

// --- Section zones (systemMap) ---

function buildZoneSection(container, zones) {
  container.appendChild(sectionTitle('ZONES'));
  const body = el('div', 'pl-body');

  const zoneRows = {};
  for (const z of zones) {
    const row = el('div', 'pl-zone-row');
    row.dataset.zone = z.id;

    // Indicateur couleur
    const swatch = el('span', 'pl-swatch');
    swatch.style.background = z.accent;
    row.appendChild(swatch);

    // Nom
    row.appendChild(txt('span', z.name, 'pl-label'));

    // Progression (ex: "3/6 • 8★")
    const progress = txt('span', '', 'pl-zone-progress');
    progress.dataset.zone = z.id;
    row.appendChild(progress);

    // Bouton lock/unlock
    const lockBtn = el('button', 'pl-btn-sm');
    lockBtn.dataset.action = 'zone-toggle';
    lockBtn.dataset.zone = z.id;
    lockBtn.textContent = '🔓';
    row.appendChild(lockBtn);

    body.appendChild(row);
    zoneRows[z.id] = { progress, lockBtn };
  }
  container.appendChild(body);

  // Feedback
  const feedback = txt('div', '', 'pl-feedback');
  feedback.dataset.id = 'zone-feedback';
  container.appendChild(feedback);

  return { rows: zoneRows };
}

// --- Section worldMap (minerais + upgrades + reset) ---

function buildWorldSection(container) {
  // Minerais
  container.appendChild(sectionTitle('MINERAIS'));
  const walletBody = el('div', 'pl-body');
  const walletRows = {};
  for (const id of MINERAL_IDS) {
    const m = getMineral(id);
    const row = el('div', 'pl-row');
    const swatch = el('span', 'pl-swatch');
    swatch.style.background = m.color;
    row.appendChild(swatch);
    row.appendChild(txt('span', m.name, 'pl-label'));
    row.appendChild(smBtn('\u2212', 'mineral-minus', { mineral: id }));
    const qty = txt('span', '0', 'pl-qty');
    qty.dataset.mineral = id;
    row.appendChild(qty);
    row.appendChild(smBtn('+', 'mineral-plus', { mineral: id }));
    walletBody.appendChild(row);
    walletRows[id] = qty;
  }
  container.appendChild(walletBody);

  // Upgrades
  container.appendChild(sectionTitle('UPGRADES'));
  const upgradeBody = el('div', 'pl-body');
  const upgradeRows = {};
  for (const id of UPGRADE_IDS) {
    const u = getUpgrade(id);
    const row = el('div', 'pl-row');
    row.appendChild(txt('span', u.name, 'pl-label'));
    row.appendChild(smBtn('\u2212', 'upgrade-minus', { upgrade: id }));
    const lvl = txt('span', '0/' + u.maxLevel, 'pl-qty');
    lvl.dataset.upgrade = id;
    row.appendChild(lvl);
    row.appendChild(smBtn('+', 'upgrade-plus', { upgrade: id }));
    upgradeBody.appendChild(row);
    upgradeRows[id] = lvl;
  }
  container.appendChild(upgradeBody);

  // Reset
  const resetBody = el('div', 'pl-body');
  resetBody.appendChild(el('div', 'pl-separator'));
  const resetBtn = el('button', 'pl-btn pl-btn-danger');
  resetBtn.textContent = 'Reset tout';
  resetBtn.dataset.action = 'reset-all';
  resetBody.appendChild(resetBtn);
  const feedback = txt('div', '', 'pl-feedback');
  resetBody.appendChild(feedback);
  container.appendChild(resetBody);

  return { walletRows, upgradeRows, feedback };
}

/**
 * Construit le modal simulateur (popup éphémère).
 * @param {HTMLElement} root - #pl-simulator
 * @param {object[]} levels - getAllLevels()
 */
export function buildSimulatorModal(root, levels) {
  root.innerHTML = '';

  const header = el('div', 'pl-sim-title');
  header.textContent = 'SIMULATEUR DE RUN';
  root.appendChild(header);

  const body = el('div', 'pl-body');

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
  body.appendChild(levelRow);

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
  body.appendChild(resultRow);

  // Stars
  const starsRow = el('div', 'pl-sim-row');
  starsRow.dataset.id = 'sim-stars-row';
  starsRow.appendChild(txt('span', 'Étoiles :', 'pl-label'));
  const starBtns = [];
  for (let s = 1; s <= 3; s++) {
    const btn = el('button', 'pl-btn-star');
    btn.textContent = '\u2605'.repeat(s);
    btn.dataset.action = 'sim-stars';
    btn.dataset.value = s;
    if (s === 3) btn.classList.add('pl-btn-active');
    starsRow.appendChild(btn);
    starBtns.push(btn);
  }
  body.appendChild(starsRow);

  // Minerals collected
  const mineralInputs = {};
  for (const id of MINERAL_IDS) {
    const m = getMineral(id);
    const row = el('div', 'pl-sim-row');
    const swatch = el('span', 'pl-swatch');
    swatch.style.background = m.color;
    row.appendChild(swatch);
    row.appendChild(txt('span', m.name, 'pl-label'));
    row.appendChild(smBtn('\u2212', 'sim-mineral-minus', { mineral: id }));
    const qty = txt('span', '0', 'pl-qty');
    qty.dataset.simMineral = id;
    row.appendChild(qty);
    row.appendChild(smBtn('+', 'sim-mineral-plus', { mineral: id }));
    body.appendChild(row);
    mineralInputs[id] = qty;
  }

  // Lives lost
  const livesRow = el('div', 'pl-sim-row');
  livesRow.appendChild(txt('span', 'Vies perdues :', 'pl-label'));
  livesRow.appendChild(smBtn('\u2212', 'sim-lives-minus', {}));
  const livesSpan = txt('span', '0', 'pl-qty');
  livesSpan.dataset.id = 'sim-lives';
  livesRow.appendChild(livesSpan);
  livesRow.appendChild(smBtn('+', 'sim-lives-plus', {}));
  body.appendChild(livesRow);

  // Simulate button
  const simBtn = el('button', 'pl-btn pl-btn-primary');
  simBtn.textContent = 'Simuler';
  simBtn.dataset.action = 'sim-run';
  body.appendChild(simBtn);

  // Close button
  const closeBtn = el('button', 'pl-btn');
  closeBtn.textContent = 'Annuler';
  closeBtn.dataset.action = 'sim-close';
  closeBtn.style.marginTop = '6px';
  closeBtn.style.width = '100%';
  body.appendChild(closeBtn);

  // Feedback
  const feedback = txt('div', '', 'pl-feedback');
  body.appendChild(feedback);
  root.appendChild(body);

  return {
    select, victoryBtn, defeatBtn, starBtns, starsRow,
    mineralInputs, livesSpan, feedback,
  };
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
function sectionTitle(text) {
  return txt('div', text, 'pl-panel-title');
}
function smBtn(label, action, data) {
  const b = el('button', 'pl-btn-sm');
  b.textContent = label;
  b.dataset.action = action;
  for (const [k, v] of Object.entries(data)) b.dataset[k] = v;
  return b;
}
