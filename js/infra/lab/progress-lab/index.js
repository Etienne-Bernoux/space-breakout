// --- Façade progress lab ---

import state from './state.js';
import { buildProgressLab } from './build.js';
import { updateProgressLab } from './update.js';
import { attachHandlers } from './handlers.js';
import { applySimulation } from '../../../use-cases/simulator/run-simulator.js';

let refs = null;
let deps = null;

export function isProgressLabActive() {
  return state.active;
}

/**
 * Initialise le progress lab. Construit le DOM, attache les handlers.
 * @param {object} d - { wallet, upgrades, progress, levels, saveProgress }
 */
export function initProgressLab(d) {
  deps = d;
  const root = document.getElementById('progress-lab');
  if (!root) return;

  refs = buildProgressLab(root, d.levels);

  const refresh = () => updateProgressLab(refs, d.wallet, d.upgrades);

  attachHandlers(root, {
    wallet: d.wallet,
    upgrades: d.upgrades,
    progress: d.progress,
    levels: d.levels,
    saveProgress: d.saveProgress,
    refs,
    refresh,
    onBack: d.onBack,
    onSimulate: (sim) => {
      const level = d.levels[sim.levelIndex];
      if (!level) return;
      applySimulation(level.id, sim, {
        progress: d.progress,
        wallet: d.wallet,
        saveProgress: d.saveProgress,
      });
      // Reset sim minerals pour prochain run
      for (const k of Object.keys(sim.minerals)) sim.minerals[k] = 0;
      refs.simulator.feedback.textContent = sim.result === 'victory'
        ? `✓ ${level.name} — ${sim.stars}★`
        : `✗ ${level.name} — Défaite`;
      setTimeout(() => { refs.simulator.feedback.textContent = ''; }, 3000);
      refresh();
    },
  });

  // Initial render
  refresh();
}

export function showProgressLab() {
  state.active = true;
  const root = document.getElementById('progress-lab');
  if (root) root.classList.add('active');
  if (refs && deps) updateProgressLab(refs, deps.wallet, deps.upgrades);
}

export function hideProgressLab() {
  state.active = false;
  const root = document.getElementById('progress-lab');
  if (root) root.classList.remove('active');
}
