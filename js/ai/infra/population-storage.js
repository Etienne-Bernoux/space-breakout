// --- Persistence des modèles IA ---
// Adapter localStorage pour Population (injectable, testable).

const STORAGE_KEY = 'ai-best-genome';

/** Adapter localStorage par défaut. */
export const localStorageAdapter = {
  save(data) { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); },
  load() {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  },
};

/** Adapter noop (pour Node / tests). */
export const nullStorageAdapter = {
  save() {},
  load() { return null; },
};
