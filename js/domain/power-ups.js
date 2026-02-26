// --- Définitions des power-ups (P1) ---
// Pattern identique à materials.js : data pure, 0 logique.

export const POWER_UPS = {
  shipWide: {
    id: 'shipWide',
    name: 'Vaisseau élargi',
    short: 'Élargi',
    type: 'bonus',
    duration: 20000,
    color: '#00cc88',
    effect: { target: 'ship', prop: 'width', factor: 1.5 },
    dropWeight: { rock: 3, ice: 4, lava: 2, metal: 2, crystal: 2, obsidian: 0 },
  },
  shipNarrow: {
    id: 'shipNarrow',
    name: 'Vaisseau rétréci',
    short: 'Rétréci',
    type: 'malus',
    duration: 10000,
    color: '#ff4466',
    effect: { target: 'ship', prop: 'width', factor: 0.6 },
    dropWeight: { rock: 2, ice: 1, lava: 3, metal: 4, crystal: 1, obsidian: 0 },
  },
  droneSticky: {
    id: 'droneSticky',
    name: 'Drone collant',
    short: 'Collant',
    type: 'bonus',
    duration: 30000,
    color: '#ffaa00',
    effect: { target: 'drone', prop: 'sticky' },
    dropWeight: { rock: 2, ice: 3, lava: 1, metal: 2, crystal: 2, obsidian: 0 },
  },
  dronePiercing: {
    id: 'dronePiercing',
    name: 'Drone perçant',
    short: 'Perçant',
    type: 'bonus',
    duration: 15000,
    color: '#ff6600',
    effect: { target: 'drone', prop: 'piercing' },
    dropWeight: { rock: 1, ice: 2, lava: 2, metal: 3, crystal: 3, obsidian: 0 },
  },
  extraLife: {
    id: 'extraLife',
    name: 'Vie supplémentaire',
    short: '+1 Vie',
    type: 'bonus',
    duration: 0,
    color: '#ff3399',
    effect: { target: 'session', prop: 'lives', delta: 1 },
    dropWeight: { rock: 1, ice: 1, lava: 1, metal: 1, crystal: 2, obsidian: 0 },
  },
  scoreDouble: {
    id: 'scoreDouble',
    name: 'Score ×2',
    short: '×2',
    type: 'bonus',
    duration: 20000,
    color: '#ffdd00',
    effect: { target: 'session', prop: 'scoreMultiplier', factor: 2 },
    dropWeight: { rock: 2, ice: 2, lava: 2, metal: 2, crystal: 4, obsidian: 0 },
  },
  weaken: {
    id: 'weaken',
    name: 'Fragilisation',
    short: 'Fragile',
    type: 'bonus',
    duration: 0,
    color: '#aa66ff',
    effect: { target: 'field', action: 'weakenAll', delta: -1 },
    dropWeight: { rock: 1, ice: 1, lava: 2, metal: 3, crystal: 2, obsidian: 0 },
  },
};

export const POWER_UP_IDS = Object.keys(POWER_UPS);

export function getPowerUp(id) {
  return POWER_UPS[id] || null;
}
