// --- AI Lab Facade ---

import state, { isAILabActive, isAILabOpen, setAILabActive } from './state.js';
import { buildAILab } from './build.js';
import { attachAILabHandlers } from './handlers.js';
import { updateStats, drawGraph } from './update.js';

export { isAILabActive, isAILabOpen };

let trainer = null;
let refs = null;
let fitnessHistory = [];
let avgHistory = [];
let rafId = null;
let _createTrainer = null;

/** Charge le modèle commité (best.json) comme point de départ si pas de localStorage. */
async function loadCommittedModel() {
  if (localStorage.getItem('ai-best-genome')) return; // déjà un modèle local
  try {
    const resp = await fetch('./js/ai/models/best.json');
    if (!resp.ok) return;
    const data = await resp.json();
    if (!data.weights || data.weights.length === 0) return; // placeholder vide
    localStorage.setItem('ai-best-genome', JSON.stringify(data));
  } catch { /* silently ignore */ }
}

/**
 * Initialise le AI Lab. Construit le DOM, attache les handlers.
 * @param {object} deps - { onBack, levels, createTrainer }
 *   createTrainer(levelId) → AITrainer instance
 */
export function initAILab({ onBack, levels, createTrainer }) {
  const root = document.getElementById('ai-lab');
  if (!root) return;

  _createTrainer = createTrainer;
  refs = buildAILab(root, levels);
  loadCommittedModel();

  attachAILabHandlers(root, {
    onBack: () => { stopTraining(); onBack(); },
    onStart: () => toggleTraining(createTrainer),
    onWatch: () => {
      if (trainer) {
        trainer.watchBest = !trainer.watchBest;
        refs.watchBtn.classList.toggle('ai-btn-active', trainer.watchBest);
        trainer.restartAgent();
      }
    },
    onReset: () => {
      if (trainer) {
        localStorage.removeItem('ai-best-genome');
        stopTraining();
        fitnessHistory = [];
        avgHistory = [];
        drawGraph(refs.graphCanvas, fitnessHistory, avgHistory);
        refs.statsDiv.innerHTML = '<div class="ai-stat-muted">Reset — prêt.</div>';
      }
    },
    onExport: () => exportModel(),
    onImport: () => refs.fileInput.click(),
    onLevelChange: (levelId) => { state.selectedLevel = levelId; },
  });

  // Listener pour import fichier
  refs.fileInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      importModel(reader.result);
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
  trainer.onGenerationEnd = (bestFit, avgFit) => {
    fitnessHistory.push(bestFit);
    avgHistory.push(avgFit);
    drawGraph(refs.graphCanvas, fitnessHistory, avgHistory);
  };
  trainer.start();
  state.training = true;
  refs.startBtn.textContent = 'Arrêter';
  refs.startBtn.classList.add('ai-btn-active');
  refs.select.disabled = true;
  // Passer en mode sidebar (libère le canvas)
  const root = document.getElementById('ai-lab');
  if (root) root.classList.add('ai-sidebar');
  startStatsLoop();
}

function stopTraining() {
  if (trainer) trainer.stop();
  state.training = false;
  if (refs) {
    refs.startBtn.textContent = 'Lancer l\'entraînement';
    refs.startBtn.classList.remove('ai-btn-active');
    refs.select.disabled = false;
  }
  // Revenir en mode centré
  const root = document.getElementById('ai-lab');
  if (root) root.classList.remove('ai-sidebar');
  if (rafId) { cancelAnimationFrame(rafId); rafId = null; }
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
  setAILabActive(false);
  const root = document.getElementById('ai-lab');
  if (root) root.classList.remove('active');
}

// ─── Import / Export ────────────────────────────────

function exportModel() {
  // Prendre le modèle du trainer actif (avec stats), sinon depuis localStorage
  const stats = (fitnessHistory.length > 0)
    ? { bestHistory: fitnessHistory, avgHistory }
    : undefined;
  let data = trainer?.population.exportModel(stats);
  if (!data) {
    const raw = localStorage.getItem('ai-best-genome');
    if (!raw) {
      refs.statsDiv.innerHTML = '<div class="ai-stat-muted">Aucun modèle à exporter.</div>';
      return;
    }
    data = JSON.parse(raw);
    // Ajouter les stats si dispo
    if (stats) data.stats = stats;
  }
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `ai-model-gen${data.generation}-fit${Math.round(data.fitness)}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

function importModel(jsonStr) {
  try {
    const data = JSON.parse(jsonStr);
    if (!data.topology || !data.weights) throw new Error('Format invalide');
    localStorage.setItem('ai-best-genome', jsonStr);
    // Si un trainer est actif, recharger le modèle
    if (trainer) {
      trainer.population.loadModel(data);
    }
    // Restaurer les historiques de stats si présents
    if (data.stats) {
      fitnessHistory = data.stats.bestHistory || [];
      avgHistory = data.stats.avgHistory || [];
    } else {
      fitnessHistory = [];
      avgHistory = [];
    }
    drawGraph(refs.graphCanvas, fitnessHistory, avgHistory);
    const statsInfo = data.stats
      ? `, ${fitnessHistory.length} gen d'historique`
      : '';
    refs.statsDiv.innerHTML = `<div class="ai-stat">Modèle importé — gén. <b>${data.generation}</b>, fitness <b>${Math.round(data.fitness)}</b>${statsInfo}</div>`;
  } catch (e) {
    refs.statsDiv.innerHTML = `<div class="ai-stat-muted">Erreur import : ${e.message}</div>`;
  }
}
