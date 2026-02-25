// --- Définitions des power-ups (P1) ---
// Pattern identique à materials.js : data pure, 0 logique.

export const POWER_UPS = {
  shipWide: {
    id: 'shipWide',
    name: 'Vaisseau élargi',
    short: 'Élargi',
    type: 'bonus',
    duration: 15000,
    color: '#00cc88',
    dropWeight: { rock: 3, ice: 4, lava: 2, metal: 2, crystal: 2, obsidian: 0 },
  },
  shipNarrow: {
    id: 'shipNarrow',
    name: 'Vaisseau rétréci',
    short: 'Rétréci',
    type: 'malus',
    duration: 10000,
    color: '#ff4466',
    dropWeight: { rock: 2, ice: 1, lava: 3, metal: 4, crystal: 1, obsidian: 0 },
  },
  droneSticky: {
    id: 'droneSticky',
    name: 'Drone collant',
    short: 'Collant',
    type: 'bonus',
    duration: Infinity, // jusqu'au prochain lancer
    color: '#ffaa00',
    dropWeight: { rock: 2, ice: 3, lava: 1, metal: 2, crystal: 2, obsidian: 0 },
  },
  dronePiercing: {
    id: 'dronePiercing',
    name: 'Drone perçant',
    short: 'Perçant',
    type: 'bonus',
    duration: 10000,
    color: '#ff6600',
    dropWeight: { rock: 1, ice: 2, lava: 2, metal: 3, crystal: 3, obsidian: 0 },
  },
  extraLife: {
    id: 'extraLife',
    name: 'Vie supplémentaire',
    short: '+1 Vie',
    type: 'bonus',
    duration: 0, // instant
    color: '#ff3399',
    dropWeight: { rock: 1, ice: 1, lava: 1, metal: 1, crystal: 2, obsidian: 0 },
  },
  scoreDouble: {
    id: 'scoreDouble',
    name: 'Score ×2',
    short: '×2',
    type: 'bonus',
    duration: 15000,
    color: '#ffdd00',
    dropWeight: { rock: 2, ice: 2, lava: 2, metal: 2, crystal: 4, obsidian: 0 },
  },
  weaken: {
    id: 'weaken',
    name: 'Fragilisation',
    short: 'Fragile',
    type: 'bonus',
    duration: 0, // instant
    color: '#aa66ff',
    dropWeight: { rock: 1, ice: 1, lava: 2, metal: 3, crystal: 2, obsidian: 0 },
  },
};

export const POWER_UP_IDS = Object.keys(POWER_UPS);

export function getPowerUp(id) {
  return POWER_UPS[id] || null;
}
