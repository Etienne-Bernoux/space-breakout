// --- Sync DOM ← state pour le progress lab ---

import { MINERAL_IDS } from '../../../domain/mineral/index.js';
import { UPGRADE_IDS } from '../../../use-cases/upgrade/upgrade-catalog.js';
import { getUpgrade } from '../../../use-cases/upgrade/upgrade-catalog.js';
import state from './state.js';

/**
 * Rafraîchit tout le DOM du progress lab depuis l'état courant.
 * @param {object} refs - retour de buildProgressLab()
 * @param {object} wallet - MineralWallet
 * @param {object} upgrades - UpgradeManager
 */
export function updateProgressLab(refs, wallet, upgrades) {
  // --- Tabs ---
  for (const [id, btn] of Object.entries(refs.tabBtns)) {
    btn.classList.toggle('pl-tab-active', id === state.tab);
  }

  // --- Panels visibility ---
  for (const key of ['wallet', 'upgrades', 'simulator', 'reset']) {
    const panel = refs[key].el;
    panel.style.display = key === state.tab ? '' : 'none';
  }

  // --- Wallet quantities ---
  for (const id of MINERAL_IDS) {
    refs.wallet.rows[id].textContent = wallet.get(id);
  }

  // --- Upgrade levels ---
  for (const id of UPGRADE_IDS) {
    const u = getUpgrade(id);
    refs.upgrades.rows[id].textContent = `${upgrades.getLevel(id)}/${u.maxLevel}`;
  }

  // --- Simulator ---
  const sim = state.sim;
  const sr = refs.simulator;

  sr.select.value = sim.levelIndex;

  sr.victoryBtn.classList.toggle('pl-btn-active', sim.result === 'victory');
  sr.defeatBtn.classList.toggle('pl-btn-active', sim.result === 'defeat');

  // Stars visibility
  sr.starsRow.style.opacity = sim.result === 'victory' ? '1' : '0.3';
  for (const btn of sr.starBtns) {
    btn.classList.toggle('pl-btn-active', Number(btn.dataset.value) === sim.stars);
    btn.disabled = sim.result !== 'victory';
  }

  // Minerals
  for (const id of MINERAL_IDS) {
    sr.mineralInputs[id].textContent = sim.minerals[id];
  }

  sr.livesSpan.textContent = sim.livesLost;
}
