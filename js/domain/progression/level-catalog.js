// Catalogue des niveaux — données pures, zéro side-effect.
// Chaque niveau définit sa config astéroïdes (mergée avec CONFIG.asteroids dans init).

export const ZONE_1 = {
  id: 'zone1',
  name: 'Nuage d\'astéroïdes',
  theme: { bg: '#0a0a1a', accent: '#8b6914' },
  levels: [
    { id: 'z1-1', name: 'Avant-poste',    asteroids: { rows: 4, cols: 6,  density: 0.4,  materials: { rock: 1.0 } },                    timeTarget: 90 },
    { id: 'z1-2', name: 'Champ de roches', asteroids: { rows: 5, cols: 8,  density: 0.5,  materials: { rock: 0.9, metal: 0.1 } },        timeTarget: 100 },
    { id: 'z1-3', name: 'Ceinture dense',  asteroids: { rows: 6, cols: 8,  density: 0.55, materials: { rock: 0.85, metal: 0.15 } },      timeTarget: 110 },
    { id: 'z1-4', name: 'Corridor étroit',  asteroids: { rows: 5, cols: 10, density: 0.5,  materials: { rock: 0.8, metal: 0.2 } },       timeTarget: 110 },
    { id: 'z1-5', name: 'Noyau rocheux',   asteroids: { rows: 6, cols: 10, density: 0.55, materials: { rock: 0.75, metal: 0.25 } },      timeTarget: 120 },
    { id: 'z1-6', name: 'Dernier mur',     asteroids: { rows: 6, cols: 10, density: 0.6,  materials: { rock: 0.7, metal: 0.3 } },        timeTarget: 130 },
  ],
};

const ALL_LEVELS = ZONE_1.levels;

/** Retourne la définition d'un niveau par son id. */
export function getLevel(id) {
  return ALL_LEVELS.find(l => l.id === id) || null;
}

/** Retourne l'index (0-based) d'un niveau. -1 si introuvable. */
export function getLevelIndex(id) {
  return ALL_LEVELS.findIndex(l => l.id === id);
}

/** Retourne le niveau suivant, ou null si dernier. */
export function getNextLevel(id) {
  const idx = getLevelIndex(id);
  return idx >= 0 && idx < ALL_LEVELS.length - 1 ? ALL_LEVELS[idx + 1] : null;
}

/** Retourne tous les niveaux de la zone courante. */
export function getAllLevels() {
  return ALL_LEVELS;
}
