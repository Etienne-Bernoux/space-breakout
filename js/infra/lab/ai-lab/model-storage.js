// --- AI Model Storage ---
// Fetch, cache, download, import/export de modèles IA.
// Pur I/O — aucune mise à jour DOM ici.

const STORAGE_KEY = 'ai-best-genome';

/** Cache des modèles déjà fetchés (file → data). */
const modelCache = {};

/** Charge le modèle commité (best.json) comme point de départ si pas de localStorage. */
export async function loadCommittedModel() {
  if (localStorage.getItem(STORAGE_KEY)) return;
  try {
    const resp = await fetch('./js/contexts/ai/models/best.json');
    if (!resp.ok) return;
    const data = await resp.json();
    if (!data.weights || data.weights.length === 0) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch { /* silently ignore */ }
}

/** Charge l'index des modèles depuis models/index.json. */
export async function fetchModelIndex() {
  try {
    const resp = await fetch('./js/contexts/ai/models/index.json');
    if (!resp.ok) return [];
    return await resp.json();
  } catch { return []; }
}

/** Fetch et cache un modèle depuis models/. */
export async function fetchModel(file) {
  if (modelCache[file]) return modelCache[file];
  const resp = await fetch(`./js/contexts/ai/models/${file}`);
  if (!resp.ok) throw new Error(`Modèle introuvable : ${file}`);
  const data = await resp.json();
  modelCache[file] = data;
  return data;
}

/** Lit le modèle depuis localStorage (ou null). */
export function loadFromStorage() {
  const raw = localStorage.getItem(STORAGE_KEY);
  return raw ? JSON.parse(raw) : null;
}

/** Écrit un modèle dans localStorage. */
export function saveToStorage(data) {
  localStorage.setItem(STORAGE_KEY, typeof data === 'string' ? data : JSON.stringify(data));
}

/** Supprime le modèle du localStorage. */
export function clearStorage() {
  localStorage.removeItem(STORAGE_KEY);
}

/** Restaure l'historique depuis le modèle sauvegardé dans le trainer. */
export function loadHistoryIntoTrainer(trainer) {
  const data = loadFromStorage();
  if (data?.stats?.genHistory) trainer.genHistory = [...data.stats.genHistory];
}

/** Récupère les données du modèle (depuis trainer ou localStorage). */
export function getModelData(trainer) {
  const stats = trainer ? { genHistory: trainer.genHistory } : undefined;
  let data = trainer?.population.exportModel(stats);
  if (!data) data = loadFromStorage();
  return data;
}

/** Parse et valide un JSON de modèle. */
export function parseModelJson(jsonStr) {
  const data = JSON.parse(jsonStr);
  if (!data.topology || !data.weights) throw new Error('Format invalide');
  return data;
}

/** Télécharge un objet JSON en fichier. */
export function downloadJson(data, filename) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
