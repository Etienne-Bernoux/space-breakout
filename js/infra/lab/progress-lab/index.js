// --- Façade progress lab (panel droit + simulator modal) ---

import state from './state.js';
import { buildPanel, buildSimulatorModal } from './build.js';
import { updateLeftPanel, updateRightPanel, updateSimulator } from './update.js';
import { attachHandlers } from './handlers.js';
import { applySimulation } from '../../../use-cases/simulator/run-simulator.js';

let refs = null;
let deps = null;

export function isProgressLabActive() {
  return state.active;
}

export function isSimulatorOpen() {
  return state.simulatorOpen;
}

/**
 * Initialise le progress lab. Construit le DOM, attache les handlers.
 * @param {object} d - { wallet, upgrades, progress, levels, saveProgress, onBack, onSetWorldMap }
 */
export function initProgressLab(d) {
  deps = d;
  const panel = document.getElementById('pl-panel');
  const sim = document.getElementById('pl-simulator');
  if (!panel || !sim) return;

  const panelRefs = buildPanel(panel);
  const simRefs = buildSimulatorModal(sim, d.levels);

  refs = { ...panelRefs, simulator: simRefs };

  const refresh = () => {
    updateLeftPanel(refs, d.wallet);
    updateRightPanel(refs, d.upgrades);
  };
  const refreshSim = () => updateSimulator(refs);

  attachHandlers({ panel, simulator: sim }, {
    wallet: d.wallet,
    upgrades: d.upgrades,
    progress: d.progress,
    levels: d.levels,
    saveProgress: d.saveProgress,
    refs,
    refresh,
    refreshSim,
    onBack: d.onBack,
    onSimulate: (simState) => {
      const level = d.levels[simState.levelIndex];
      if (!level) return;
      applySimulation(level.id, simState, {
        progress: d.progress,
        wallet: d.wallet,
        saveProgress: d.saveProgress,
      });
      for (const k of Object.keys(simState.minerals)) simState.minerals[k] = 0;
      simRefs.feedback.textContent = simState.result === 'victory'
        ? `✓ ${level.name} — ${simState.stars}★`
        : `✗ ${level.name} — Défaite`;
      setTimeout(() => { simRefs.feedback.textContent = ''; }, 3000);
      hideSimulatorModal();
      refresh();
    },
    onCloseSimulator: () => hideSimulatorModal(),
  });
}

export function showProgressLab() {
  state.active = true;
  document.getElementById('pl-panel')?.classList.add('active');
  if (refs && deps) {
    updateLeftPanel(refs, deps.wallet);
    updateRightPanel(refs, deps.upgrades);
  }
  if (deps?.onSetWorldMap) deps.onSetWorldMap();
}

export function hideProgressLab() {
  state.active = false;
  state.simulatorOpen = false;
  document.getElementById('pl-panel')?.classList.remove('active');
  document.getElementById('pl-simulator')?.classList.remove('open');
  // Revenir au menu pour que le canvas n'affiche plus la carte
  if (deps?.onBackToMenu) deps.onBackToMenu();
}

export function showSimulatorModal(levelIndex) {
  state.sim.levelIndex = levelIndex ?? 0;
  state.simulatorOpen = true;
  document.getElementById('pl-simulator')?.classList.add('open');
  if (refs) updateSimulator(refs);
}

export function hideSimulatorModal() {
  state.simulatorOpen = false;
  document.getElementById('pl-simulator')?.classList.remove('open');
}
