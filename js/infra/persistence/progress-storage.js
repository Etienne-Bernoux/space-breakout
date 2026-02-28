// Persistence localStorage pour la progression joueur.

const KEY = 'space-breakout-progress';

/** Charge les données brutes depuis localStorage (ou null). */
export function loadProgress() {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

/** Sauvegarde un PlayerProgress (via toJSON). */
export function saveProgress(progress) {
  try {
    localStorage.setItem(KEY, JSON.stringify(progress.toJSON()));
  } catch { /* quota exceeded — silent fail */ }
}
