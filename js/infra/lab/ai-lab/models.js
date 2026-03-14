// --- AI Lab Model Management ---
// Browsing, import, export et sauvegarde de modèles IA.

import state from './state.js';
import { drawAllGraphs } from './update.js';

/** Cache des modèles déjà fetchés (file → data). */
const modelCache = {};
/** Modèle actuellement sélectionné dans le select. */
let selectedModelFile = '';

/** Charge le modèle commité (best.json) comme point de départ si pas de localStorage. */
export async function loadCommittedModel() {
  if (localStorage.getItem('ai-best-genome')) return;
  try {
    const resp = await fetch('./js/ai/models/best.json');
    if (!resp.ok) return;
    const data = await resp.json();
    if (!data.weights || data.weights.length === 0) return;
    localStorage.setItem('ai-best-genome', JSON.stringify(data));
  } catch { /* silently ignore */ }
}

/** Charge l'index des modèles et peuple le select. */
export async function loadModelIndex(selectEl) {
  try {
    const resp = await fetch('./js/ai/models/index.json');
    if (!resp.ok) return;
    const models = await resp.json();
    for (const m of models) {
      const opt = document.createElement('option');
      opt.value = m.file;
      opt.textContent = `${m.name} — gen ${m.generation}, fit ${m.fitness}`;
      selectEl.appendChild(opt);
    }
  } catch { /* silently ignore */ }
}

/** Fetch et cache un modèle depuis models/. */
async function fetchModel(file) {
  if (modelCache[file]) return modelCache[file];
  const resp = await fetch(`./js/ai/models/${file}`);
  if (!resp.ok) throw new Error(`Modèle introuvable : ${file}`);
  const data = await resp.json();
  modelCache[file] = data;
  return data;
}

/** Met à jour l'info et les graphes du modèle sélectionné (preview). */
export async function onModelSelectChange(file, refs, trainer) {
  selectedModelFile = file;
  if (!file) {
    refs.modelInfo.textContent = '';
    if (trainer) {
      drawAllGraphs(refs.graphCanvases, trainer);
    } else {
      try {
        const raw = localStorage.getItem('ai-best-genome');
        if (raw) drawAllGraphs(refs.graphCanvases, JSON.parse(raw));
        else drawAllGraphs(refs.graphCanvases, null);
      } catch { drawAllGraphs(refs.graphCanvases, null); }
    }
    return;
  }
  try {
    const data = await fetchModel(file);
    const gens = data.stats?.genHistory?.length || 0;
    refs.modelInfo.textContent = `Gen ${data.generation} | Fitness ${Math.round(data.fitness)} | ${gens} gen d'historique`;
    if (!state.training) drawAllGraphs(refs.graphCanvases, data);
  } catch (e) {
    refs.modelInfo.textContent = e.message;
  }
}

/** Charge le modèle sélectionné dans localStorage. */
export async function loadSelectedModel(refs, trainer) {
  if (!selectedModelFile) {
    refs.statsDiv.innerHTML = '<div class="ai-stat-muted">Modèle localStorage déjà actif.</div>';
    return;
  }
  try {
    const data = await fetchModel(selectedModelFile);
    importModel(JSON.stringify(data), refs, trainer);
  } catch (e) {
    refs.statsDiv.innerHTML = `<div class="ai-stat-muted">Erreur : ${e.message}</div>`;
  }
}

/** Restaure l'historique depuis le modèle sauvegardé dans le trainer. */
export function loadHistoryIntoTrainer(trainer) {
  try {
    const raw = localStorage.getItem('ai-best-genome');
    if (raw) {
      const data = JSON.parse(raw);
      if (data.stats?.genHistory) trainer.genHistory = [...data.stats.genHistory];
    }
  } catch { /* ignore */ }
}

/** Récupère les stats courantes du trainer pour l'export. */
function getTrainerStats(trainer) {
  if (!trainer) return undefined;
  return { genHistory: trainer.genHistory };
}

/** Obtient les données du modèle (depuis trainer ou localStorage). */
function getModelData(trainer) {
  let data = trainer?.population.exportModel(getTrainerStats(trainer));
  if (!data) {
    const raw = localStorage.getItem('ai-best-genome');
    if (!raw) return null;
    data = JSON.parse(raw);
  }
  return data;
}

/** Exporte le modèle courant (téléchargement). */
export function exportModel(refs, trainer) {
  const data = getModelData(trainer);
  if (!data) {
    refs.statsDiv.innerHTML = '<div class="ai-stat-muted">Aucun modèle à exporter.</div>';
    return;
  }
  downloadJson(data, `ai-model-gen${data.generation}-fit${Math.round(data.fitness)}.json`);
}

/** Sauvegarde le modèle pour le dossier models/ (téléchargement best.json). */
export function saveModelToDownload(refs, trainer) {
  const data = getModelData(trainer);
  if (!data) {
    refs.statsDiv.innerHTML = '<div class="ai-stat-muted">Aucun modèle à sauvegarder.</div>';
    return;
  }
  downloadJson(data, 'best.json');
  refs.statsDiv.innerHTML = '<div class="ai-stat">Modèle téléchargé — placer dans <b>js/ai/models/</b> et mettre à jour <b>index.json</b></div>';
}

/** Importe un modèle depuis une chaîne JSON. */
export function importModel(jsonStr, refs, trainer) {
  try {
    const data = JSON.parse(jsonStr);
    if (!data.topology || !data.weights) throw new Error('Format invalide');
    localStorage.setItem('ai-best-genome', jsonStr);
    if (trainer) {
      trainer.population.loadModel(data);
      trainer.genHistory = data.stats?.genHistory || [];
      drawAllGraphs(refs.graphCanvases, trainer);
    } else {
      drawAllGraphs(refs.graphCanvases, data);
    }
    const histLen = data.stats?.genHistory?.length || 0;
    const statsInfo = histLen > 0 ? `, ${histLen} gen d'historique` : '';
    refs.statsDiv.innerHTML = `<div class="ai-stat">Modèle chargé — gén. <b>${data.generation}</b>, fitness <b>${Math.round(data.fitness)}</b>${statsInfo}</div>`;
  } catch (e) {
    refs.statsDiv.innerHTML = `<div class="ai-stat-muted">Erreur import : ${e.message}</div>`;
  }
}

function downloadJson(data, filename) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
