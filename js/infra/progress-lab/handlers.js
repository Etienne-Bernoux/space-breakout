// --- Event handlers du progress lab (DOM) ---

import { MINERAL_IDS } from '../../domain/mineral/index.js';
import { UPGRADE_IDS } from '../../use-cases/upgrade/upgrade-catalog.js';
import state from './state.js';

const STEP = 10;  // +/- par clic pour wallet
const SIM_STEP = 1;  // +/- par clic pour simulator minerals

/**
 * Attache les event listeners au conteneur root (event delegation).
 * @param {HTMLElement} root - #progress-lab
 * @param {object} deps - { wallet, upgrades, progress, levels, saveProgress, onClose, onSimulate, refs }
 */
export function attachHandlers(root, deps) {
  root.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-action], [data-tab]');
    if (!btn) return;
    const action = btn.dataset.action;

    // --- Back to hub ---
    if (action === 'back') {
      if (deps.onBack) deps.onBack();
      return;
    }

    // --- Close ---
    if (action === 'close') {
      deps.onClose();
      return;
    }

    // --- Tab switching ---
    if (btn.dataset.tab) {
      state.tab = btn.dataset.tab;
      deps.refresh();
      return;
    }

    // --- Wallet ± ---
    if (action === 'mineral-plus') {
      deps.wallet.add(btn.dataset.mineral, STEP);
      deps.wallet.save();
      deps.refresh();
      return;
    }
    if (action === 'mineral-minus') {
      const id = btn.dataset.mineral;
      const qty = deps.wallet.get(id);
      if (qty > 0) {
        deps.wallet.add(id, -Math.min(STEP, qty));
        deps.wallet.save();
      }
      deps.refresh();
      return;
    }

    // --- Upgrade ± (force, bypass cost) ---
    if (action === 'upgrade-plus') {
      const id = btn.dataset.upgrade;
      if (!deps.upgrades.isMaxed(id)) {
        deps.upgrades._levels.set(id, deps.upgrades.getLevel(id) + 1);
        deps.upgrades.save();
      }
      deps.refresh();
      return;
    }
    if (action === 'upgrade-minus') {
      const id = btn.dataset.upgrade;
      if (deps.upgrades.getLevel(id) > 0) {
        deps.upgrades._levels.set(id, deps.upgrades.getLevel(id) - 1);
        deps.upgrades.save();
      }
      deps.refresh();
      return;
    }

    // --- Simulator ---
    if (action === 'sim-result') {
      state.sim.result = btn.dataset.value;
      if (state.sim.result === 'defeat') state.sim.stars = 0;
      else if (state.sim.stars === 0) state.sim.stars = 3;
      deps.refresh();
      return;
    }
    if (action === 'sim-stars') {
      state.sim.stars = Number(btn.dataset.value);
      deps.refresh();
      return;
    }
    if (action === 'sim-mineral-plus') {
      state.sim.minerals[btn.dataset.mineral] += SIM_STEP;
      deps.refresh();
      return;
    }
    if (action === 'sim-mineral-minus') {
      const id = btn.dataset.mineral;
      if (state.sim.minerals[id] > 0) state.sim.minerals[id]--;
      deps.refresh();
      return;
    }
    if (action === 'sim-lives-plus') {
      state.sim.livesLost = Math.min(state.sim.livesLost + 1, 5);
      deps.refresh();
      return;
    }
    if (action === 'sim-lives-minus') {
      if (state.sim.livesLost > 0) state.sim.livesLost--;
      deps.refresh();
      return;
    }
    if (action === 'sim-run') {
      deps.onSimulate(state.sim);
      return;
    }

    // --- Reset ---
    if (action === 'reset-all') {
      deps.wallet.reset();
      deps.wallet.save();
      deps.upgrades.reset();
      deps.upgrades.save();
      deps.progress.reset();
      deps.saveProgress(deps.progress);
      deps.refs.reset.feedback.textContent = 'Reset effectué !';
      setTimeout(() => { deps.refs.reset.feedback.textContent = ''; }, 2000);
      deps.refresh();
      return;
    }
  });

  // Level select change
  root.addEventListener('change', (e) => {
    if (e.target.dataset.action === 'sim-level') {
      state.sim.levelIndex = Number(e.target.value);
    }
  });

  // Escape key (global, only when lab active)
  document.addEventListener('keydown', (e) => {
    if (!state.active) return;
    if (e.key === 'Escape') {
      e.preventDefault();
      deps.onClose();
    }
  });
}
