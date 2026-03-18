// --- AI Lab Facade ---

import state, { isAILabActive, isAILabOpen, setAILabActive } from './state.js';
import { buildAILab } from './build.js';
import { attachAILabHandlers } from './handlers.js';
import { updateStats, drawAllGraphs, drawZoomedGraph } from './update.js';
import {
  loadCommittedModel, loadModelIndex, loadHistoryIntoTrainer, clearStorage,
  onModelSelectChange, loadSelectedModel,
  exportModel, importModel, saveModelToDownload,
} from './models/index.js';

export { isAILabActive, isAILabOpen };

let trainer = null;
let refs = null;
let rafId = null;
let _session = null;

/**
 * Initialise le AI Lab. Construit le DOM, attache les handlers.
 * @param {object} deps - { onBack, levels, createTrainer }
 *   createTrainer(levelId) → AITrainer instance
 */
export function initAILab({ onBack, levels, createTrainer, session }) {
  _session = session;
  const root = document.getElementById('ai-lab');
  if (!root) return;

  refs = buildAILab(root, levels);
  loadCommittedModel();
  loadModelIndex(refs.modelSelect);

  attachAILabHandlers(root, {
    onBack: () => { stopTraining(); onBack(); },
    onStart: () => toggleTraining(createTrainer),
    onWatch: () => toggleWatch(createTrainer),
    onReset: () => {
      clearStorage();
      if (trainer) stopTraining();
      drawAllGraphs(refs.graphCanvases, null);
      refs.statsDiv.innerHTML = '<div class="ai-stat-muted">Reset — prêt.</div>';
    },
    onExport: () => exportModel(refs, trainer),
    onImport: () => refs.fileInput.click(),
    onLevelChange: (levelId) => { state.selectedLevel = levelId; },
    onLoadModel: () => loadSelectedModel(refs, trainer),
    onSaveModel: () => saveModelToDownload(refs, trainer),
    onModelSelectChange: (file) => onModelSelectChange(file, refs, trainer),
    onGraphClick: (graphId) => {
      const labels = {
        'ai-graph-fitness': 'Fitness', 'ai-graph-elites': 'Elites',
        'ai-graph-catches': 'Catches', 'ai-graph-drops': 'Drops',
        'ai-graph-wins': 'Wins', 'ai-graph-diversity': 'Diversité',
        'ai-graph-destroys': 'Destroys', 'ai-graph-stars': 'Stars',
      };
      refs.modalTitle.textContent = labels[graphId] || '';
      // Afficher la modale AVANT de dessiner (sinon getBoundingClientRect = 0)
      refs.modal.classList.add('active');
      drawZoomedGraph(graphId, refs.modalCanvas);
    },
  });

  // Listener pour import fichier
  refs.fileInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      importModel(reader.result, refs, trainer);
      refs.fileInput.value = '';
    };
    reader.readAsText(file);
  });
}

function toggleTraining(createTrainer) {
  if (state.training) {
    stopTraining();
  } else {
    startTraining(createTrainer);
  }
}

function startTraining(createTrainer) {
  trainer = createTrainer(state.selectedLevel);
  loadHistoryIntoTrainer(trainer);
  drawAllGraphs(refs.graphCanvases, trainer);

  trainer.onGenerationEnd = () => {
    drawAllGraphs(refs.graphCanvases, trainer);
  };
  trainer.start();
  state.training = true;
  refs.startBtn.textContent = 'Arrêter';
  refs.startBtn.classList.add('ai-btn-active');
  refs.select.disabled = true;
  startStatsLoop();
}

function stopTraining() {
  if (trainer) trainer.stop();
  trainer = null;
  state.training = false;
  state.watching = false;
  if (refs) {
    refs.startBtn.textContent = 'Lancer l\'entraînement';
    refs.startBtn.classList.remove('ai-btn-active');
    refs.watchBtn.classList.remove('ai-btn-active');
    refs.select.disabled = false;
  }
  const root = document.getElementById('ai-lab');
  if (root) root.classList.remove('ai-sidebar');
  if (rafId) { cancelAnimationFrame(rafId); rafId = null; }
}

/** Active/désactive le mode watch (sans entraînement). */
function toggleWatch(createTrainer) {
  if (state.watching) {
    stopTraining();
    return;
  }
  if (state.training) {
    trainer.watchBest = !trainer.watchBest;
    refs.watchBtn.classList.toggle('ai-btn-active', trainer.watchBest);
    const root = document.getElementById('ai-lab');
    if (root) root.classList.toggle('ai-sidebar', trainer.watchBest);
    trainer.restartAgent();
    return;
  }
  // Watch standalone
  trainer = createTrainer(state.selectedLevel);
  trainer.active = true;
  trainer.watchBest = true;
  trainer.population.loadBest();
  if (!trainer.population.bestGenome) {
    refs.statsDiv.innerHTML = '<div class="ai-stat-muted">Aucun modèle chargé.</div>';
    trainer.stop();
    trainer = null;
    return;
  }
  trainer.restartAgent();
  state.watching = true;
  refs.watchBtn.classList.add('ai-btn-active');
  refs.select.disabled = true;
  const root = document.getElementById('ai-lab');
  if (root) root.classList.add('ai-sidebar');
  startWatchStatsLoop();
}

function startWatchStatsLoop() {
  function tick() {
    if (!state.watching || state.training) return;
    updateStats(refs.statsDiv, trainer);
    rafId = requestAnimationFrame(tick);
  }
  tick();
}

function startStatsLoop() {
  function tick() {
    if (!state.training) return;
    updateStats(refs.statsDiv, trainer);
    rafId = requestAnimationFrame(tick);
  }
  tick();
}

export function showAILab() {
  setAILabActive(true);
  const root = document.getElementById('ai-lab');
  if (root) root.classList.add('active');
}

export function hideAILab() {
  stopTraining();
  if (_session && (_session.state === 'playing' || _session.state === 'won' || _session.state === 'gameOver')) {
    _session.backToMenu();
  }
  setAILabActive(false);
  const root = document.getElementById('ai-lab');
  if (root) root.classList.remove('active');
}
