// --- Catalogue d'upgrades ---
// Déclaratif : id, name, description, category, maxLevel, costs[], effect.
// Les costs sont par palier : costs[0] = lvl 0→1, costs[1] = lvl 1→2, etc.

export const UPGRADE_CATEGORIES = {
  ship: { name: 'Vaisseau', icon: 'ship' },
  drone: { name: 'Drone', icon: 'drone' },
  powerUp: { name: 'Power-ups', icon: 'powerUp' },
  consumable: { name: 'Consommables', icon: 'consumable' },
};

export const UPGRADES = {
  // --- Vaisseau ---
  shipSpeed: {
    id: 'shipSpeed',
    name: 'Propulseurs',
    description: 'Augmente la vitesse du vaisseau',
    category: 'ship',
    maxLevel: 3,
    costs: [
      { copper: 10 },
      { copper: 25, silver: 5 },
      { copper: 50, silver: 15, gold: 3 },
    ],
    effect: { target: 'ship', prop: 'speed', factors: [1.15, 1.3, 1.5] },
  },
  shipWidth: {
    id: 'shipWidth',
    name: 'Coque \u00e9largie',
    description: '\u00c9largit le vaisseau de minage',
    category: 'ship',
    maxLevel: 3,
    costs: [
      { copper: 15 },
      { copper: 30, silver: 10 },
      { silver: 25, gold: 5 },
    ],
    effect: { target: 'ship', prop: 'width', factors: [1.1, 1.2, 1.35] },
  },

  // --- Drone ---
  droneSpeed: {
    id: 'droneSpeed',
    name: 'Acc\u00e9l\u00e9rateur',
    description: 'Le drone acc\u00e9l\u00e8re vers les ast\u00e9ro\u00efdes, revient \u00e0 vitesse normale',
    category: 'drone',
    maxLevel: 3,
    costs: [
      { copper: 12 },
      { copper: 30, silver: 8 },
      { silver: 20, gold: 5 },
    ],
    effect: { target: 'drone', prop: 'speed', factors: [1.15, 1.3, 1.5] },
  },
  droneDamage: {
    id: 'droneDamage',
    name: 'Foret renforc\u00e9',
    description: 'Le drone inflige plus de d\u00e9g\u00e2ts',
    category: 'drone',
    maxLevel: 2,
    costs: [
      { silver: 15, gold: 3 },
      { silver: 30, gold: 10, platinum: 2 },
    ],
    effect: { target: 'drone', prop: 'damage', factors: [2, 3] },
  },

  dronePiercingDamage: {
    id: 'dronePiercingDamage',
    name: 'Foret perçant',
    description: 'Le drone inflige plus de dégâts en mode perçant',
    category: 'drone',
    maxLevel: 2,
    costs: [
      { copper: 25, silver: 10 },
      { silver: 25, gold: 8 },
    ],
    effect: { target: 'drone', prop: 'piercingDamage', factors: [2, 3] },
  },

  // --- Power-ups ---
  puDuration: {
    id: 'puDuration',
    name: 'Stabilisateur',
    description: 'Augmente la dur\u00e9e des power-ups',
    category: 'powerUp',
    maxLevel: 3,
    costs: [
      { copper: 20 },
      { copper: 40, silver: 10 },
      { silver: 25, gold: 8 },
    ],
    effect: { target: 'powerUp', prop: 'durationMult', factors: [1.2, 1.4, 1.7] },
  },
  puDropRate: {
    id: 'puDropRate',
    name: 'Scanner am\u00e9lior\u00e9',
    description: 'Augmente le taux de drop des power-ups',
    category: 'powerUp',
    maxLevel: 2,
    costs: [
      { silver: 20, gold: 5 },
      { gold: 15, platinum: 3 },
    ],
    effect: { target: 'powerUp', prop: 'dropRateMult', factors: [1.3, 1.6] },
  },

  puUnlockFireball: {
    id: 'puUnlockFireball',
    name: 'Module incendiaire',
    description: 'Débloque le power-up Boule de feu',
    category: 'powerUp',
    maxLevel: 1,
    costs: [
      { copper: 30, silver: 15 },
    ],
    effect: { target: 'powerUp', prop: 'unlockFireball', factors: [1] },
  },
  puUnlockMulti: {
    id: 'puUnlockMulti',
    name: 'Duplicateur de drone',
    description: 'Débloque le power-up Drone supplémentaire',
    category: 'powerUp',
    maxLevel: 1,
    costs: [
      { copper: 40, silver: 20, gold: 5 },
    ],
    effect: { target: 'powerUp', prop: 'unlockMulti', factors: [1] },
  },

  // --- Consommables ---
  extraLife: {
    id: 'extraLife',
    name: 'Bouclier d\u2019urgence',
    description: '+1 vie au d\u00e9but de la partie',
    category: 'consumable',
    maxLevel: 2,
    costs: [
      { silver: 30, gold: 10 },
      { gold: 25, platinum: 5 },
    ],
    effect: { target: 'session', prop: 'bonusLives', factors: [1, 2] },
  },
};

export const UPGRADE_IDS = Object.keys(UPGRADES);

/** Retourne un upgrade par id, ou null. */
export function getUpgrade(id) {
  return UPGRADES[id] || null;
}

/** Retourne les upgrades d'une catégorie. */
export function getUpgradesByCategory(category) {
  return UPGRADE_IDS.filter(id => UPGRADES[id].category === category).map(id => UPGRADES[id]);
}
