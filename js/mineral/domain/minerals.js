// --- Définitions des minerais récoltables ---
// 4 types par rareté croissante. Début de jeu = cuivre/argent.
// Or et platine réservés aux zones avancées.

export const MINERALS = {
  copper: {
    name: 'Cuivre',
    color: '#cc7733',
    glowColor: '#ff9944',
    rarity: 1,       // 1 = commun, 4 = très rare
    shape: 'nugget',  // pépite
  },
  silver: {
    name: 'Argent',
    color: '#c0c0c0',
    glowColor: '#e8e8ff',
    rarity: 2,
    shape: 'nugget',
  },
  gold: {
    name: 'Or',
    color: '#ffd700',
    glowColor: '#ffee88',
    rarity: 3,
    shape: 'nugget',
  },
  platinum: {
    name: 'Platine',
    color: '#aabbdd',
    glowColor: '#ccddff',
    rarity: 4,
    shape: 'crystal',  // cristal
  },
};

export const MINERAL_IDS = Object.keys(MINERALS);

/** Retourne un minerai par clé, ou null. */
export function getMineral(key) {
  return MINERALS[key] || null;
}
