// --- AI Lab Model UI ---
// Coordination UI pour le browsing, import, export de modèles IA.
// L'I/O est déléguée à model-storage.js.

import state from './state.js';
import { drawAllGraphs } from './update.js';
import {
  loadCommittedModel, fetchModelIndex, fetchModel,
  loadFromStorage, saveToStorage, clearStorage,
  loadHistoryIntoTrainer, getModelData, parseModelJson, downloadJson,
} from './model-storage.js';

export { loadCommittedModel, loadHistoryIntoTrainer, clearStorage };

/** Modèle actuellement sélectionné dans le select. */
let selectedModelFile = '';

/** Charge l'index des modèles et peuple le select. */
export async function loadModelIndex(selectEl) {
  const models = await fetchModelIndex();
  for (const m of models) {
    const opt = document.createElement('option');
    opt.value = m.file;
    opt.textContent = `${m.name} — gen ${m.generation}, fit ${m.fitness}`;
    selectEl.appendChild(opt);
  }
}

/** Met à jour l'info et les graphes du modèle sélectionné (preview). */
export async function onModelSelectChange(file, refs, trainer) {
  selectedModelFile = file;
  if (!file) {
    refs.modelInfo.textContent = '';
    if (trainer) {
      drawAllGraphs(refs.graphCanvases, trainer);
    } else {
      const data = loadFromStorage();
      drawAllGraphs(refs.graphCanvases, data);
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
  refs.statsDiv.innerHTML = '<div class="ai-stat">Modèle téléchargé — placer dans <b>js/contexts/ai/models/</b> et mettre à jour <b>index.json</b></div>';
}

/** Importe un modèle depuis une chaîne JSON. */
export function importModel(jsonStr, refs, trainer) {
  try {
    const data = parseModelJson(jsonStr);
    saveToStorage(jsonStr);
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
