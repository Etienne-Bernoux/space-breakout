// Catalogue des niveaux — données pures, zéro side-effect.
// Chaque niveau définit sa config astéroïdes (mergée avec CONFIG.asteroids dans init).
// Multi-zone : chaque zone a ses propres levels. Seule zone1 est définie pour l'instant.

import { PATTERNS } from '../patterns.js';

export const ZONE_1 = {
  id: 'zone1',
  name: 'Nuage d\'astéroïdes',
  theme: { bg: '#0a0a1a', accent: '#8b6914' },
  levels: [
    { id: 'z1-1', name: 'Avant-poste',    asteroids: { rows: 4, cols: 6,  density: 0.4,  materials: { rock: 1.0 } },                    timeTarget: 90 },
    { id: 'z1-2', name: 'Champ de roches', asteroids: { rows: 5, cols: 8,  density: 0.5,  materials: { rock: 0.9, metal: 0.1 } },        timeTarget: 100 },
    { id: 'z1-3', name: 'Ceinture dense',  asteroids: { rows: 6, cols: 8,  density: 0.45, materials: { rock: 0.85, metal: 0.15 } },      timeTarget: 110 },
    { id: 'z1-4', name: 'Corridor étroit',  asteroids: { rows: 5, cols: 10, density: 0.45, materials: { rock: 0.8, metal: 0.2 } },       timeTarget: 115 },
    { id: 'z1-5', name: 'Noyau rocheux',   asteroids: { rows: 6, cols: 10, density: 0.50, materials: { rock: 0.75, metal: 0.25 } },      timeTarget: 130 },
    { id: 'z1-6', name: 'Parasite',         asteroids: { rows: 10, cols: 14, materials: { rock: 0.7, metal: 0.3 }, pattern: PATTERNS.invasion1 }, timeTarget: 150 },
  ],
};

export const ZONE_2 = {
  id: 'zone2',
  name: 'Lune de Kryos',
  theme: { bg: '#0a0a2a', accent: '#5bc0eb' },
  levels: [
    { id: 'z2-1', name: 'Glacis',          asteroids: { rows: 5, cols: 8,  density: 0.40, materials: { ice: 0.7, rock: 0.3 } },                                        timeTarget: 105 },
    { id: 'z2-2', name: 'Crevasses',        asteroids: { rows: 6, cols: 10, density: 0.45, materials: { ice: 0.5, rock: 0.4, metal: 0.1 } },                              timeTarget: 115 },
    { id: 'z2-3', name: 'Permafrost',       asteroids: { rows: 6, cols: 10, materials: { ice: 0.6, rock: 0.3, metal: 0.1 }, pattern: PATTERNS.frostWall },                 timeTarget: 110 },
    { id: 'z2-4', name: 'Geysers',          asteroids: { rows: 6, cols: 10, density: 0.55, materials: { ice: 0.4, rock: 0.2, lava: 0.2, metal: 0.2 } },                   timeTarget: 115 },
    { id: 'z2-5', name: 'Calotte polaire',  asteroids: { rows: 8, cols: 12, materials: { ice: 0.5, rock: 0.2, metal: 0.2, crystal: 0.1 }, pattern: PATTERNS.iceCrown },    timeTarget: 125 },
    { id: 'z2-6', name: 'Cryovore',         asteroids: { rows: 10, cols: 14, materials: { ice: 0.7, rock: 0.3 }, pattern: PATTERNS.cryovore },                             timeTarget: 150 },
  ],
};

/** Map zone id → levels array. Les zones futures seront ajoutées ici. */
const LEVELS_BY_ZONE = {
  zone1: ZONE_1.levels,
  zone2: ZONE_2.levels,
};

/** Tous les levels à plat (toutes zones confondues). */
const ALL_LEVELS_FLAT = Object.values(LEVELS_BY_ZONE).flat();

/** Retourne les niveaux d'une zone. Défaut : zone1. */
export function getLevelsForZone(zoneId = 'zone1') {
  return LEVELS_BY_ZONE[zoneId] || [];
}

/** Retourne la définition d'un niveau par son id (cherche dans toutes les zones). */
export function getLevel(id) {
  return ALL_LEVELS_FLAT.find(l => l.id === id) || null;
}

/** Retourne l'index (0-based) d'un niveau dans sa zone. -1 si introuvable. */
export function getLevelIndex(id) {
  for (const levels of Object.values(LEVELS_BY_ZONE)) {
    const idx = levels.findIndex(l => l.id === id);
    if (idx >= 0) return idx;
  }
  return -1;
}

/** Retourne le niveau suivant dans la même zone, ou null si dernier. */
export function getNextLevel(id) {
  for (const levels of Object.values(LEVELS_BY_ZONE)) {
    const idx = levels.findIndex(l => l.id === id);
    if (idx >= 0) return idx < levels.length - 1 ? levels[idx + 1] : null;
  }
  return null;
}

/** Retourne la zone (id) qui contient le niveau donné, ou null. */
export function getZoneForLevel(levelId) {
  for (const [zoneId, levels] of Object.entries(LEVELS_BY_ZONE)) {
    if (levels.some(l => l.id === levelId)) return zoneId;
  }
  return null;
}

/** Retourne tous les niveaux de la zone courante (rétro-compatible). */
export function getAllLevels(zoneId = 'zone1') {
  return getLevelsForZone(zoneId);
}
