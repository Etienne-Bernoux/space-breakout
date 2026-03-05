// --- Event handlers du progress lab (panel + simulator modal) ---

import state from './state.js';
import { getZoneIndex, ZONES } from '../../../domain/progression/zone-catalog.js';

const STEP = 10;      // +/- par clic pour wallet
const SIM_STEP = 1;   // +/- par clic pour simulator minerals

/**
 * Attache les event listeners aux 2 conteneurs (event delegation).
 * @param {object} roots - { panel, simulator }
 * @param {object} deps - { wallet, upgrades, progress, levels, saveProgress, onBack, onSimulate, onCloseSimulator, refs, refresh }
 */
export function attachHandlers(roots, deps) {
  // --- Panel (wallet + upgrades + reset) ---
  roots.panel.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-action]');
    if (!btn) return;
    const action = btn.dataset.action;

    if (action === 'back') {
      if (deps.onBack) deps.onBack();
      return;
    }
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
    if (action === 'upgrade-plus') {
      const id = btn.dataset.upgrade;
      if (!deps.upgrades.isMaxed(id)) {
        deps.upgrades.setLevel(id, deps.upgrades.getLevel(id) + 1);
        deps.upgrades.save();
      }
      deps.refresh();
      return;
    }
    if (action === 'upgrade-minus') {
      const id = btn.dataset.upgrade;
      if (deps.upgrades.getLevel(id) > 0) {
        deps.upgrades.setLevel(id, deps.upgrades.getLevel(id) - 1);
        deps.upgrades.save();
      }
      deps.refresh();
      return;
    }
    if (action === 'zone-toggle') {
      const zoneId = btn.dataset.zone;
      const unlocked = deps.progress.isZoneUnlocked(zoneId);
      if (unlocked) {
        // Verrouiller : remettre unlockedZoneUpTo à la zone précédente
        const idx = getZoneIndex(zoneId);
        deps.progress.unlockedZoneUpTo = idx > 0 ? ZONES[idx - 1].id : ZONES[0].id;
      } else {
        // Débloquer : mettre unlockedZoneUpTo à cette zone
        deps.progress.unlockedZoneUpTo = zoneId;
      }
      deps.saveProgress(deps.progress);
      deps.refresh();
      return;
    }
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

  // --- Simulator modal ---
  roots.simulator.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-action]');
    if (!btn) return;
    const action = btn.dataset.action;

    if (action === 'sim-result') {
      state.sim.result = btn.dataset.value;
      if (state.sim.result === 'defeat') state.sim.stars = 0;
      else if (state.sim.stars === 0) state.sim.stars = 3;
      deps.refreshSim();
      return;
    }
    if (action === 'sim-stars') {
      state.sim.stars = Number(btn.dataset.value);
      deps.refreshSim();
      return;
    }
    if (action === 'sim-mineral-plus') {
      state.sim.minerals[btn.dataset.mineral] += SIM_STEP;
      deps.refreshSim();
      return;
    }
    if (action === 'sim-mineral-minus') {
      const id = btn.dataset.mineral;
      if (state.sim.minerals[id] > 0) state.sim.minerals[id]--;
      deps.refreshSim();
      return;
    }
    if (action === 'sim-lives-plus') {
      state.sim.livesLost = Math.min(state.sim.livesLost + 1, 5);
      deps.refreshSim();
      return;
    }
    if (action === 'sim-lives-minus') {
      if (state.sim.livesLost > 0) state.sim.livesLost--;
      deps.refreshSim();
      return;
    }
    if (action === 'sim-run') {
      deps.onSimulate(state.sim);
      return;
    }
    if (action === 'sim-close') {
      deps.onCloseSimulator();
      return;
    }
  });

  // Level select change
  roots.simulator.addEventListener('change', (e) => {
    if (e.target.dataset.action === 'sim-level') {
      state.sim.levelIndex = Number(e.target.value);
    }
  });

  // Escape → ferme simulator si ouvert
  document.addEventListener('keydown', (e) => {
    if (!state.active) return;
    if (e.key === 'Escape' && state.simulatorOpen) {
      e.preventDefault();
      deps.onCloseSimulator();
    }
  });
}
