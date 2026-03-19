// --- Catalogue des consommables ---
// Data pure, 0 logique. Stock achetable à l'atelier, consommé en jeu.

export const CONSUMABLES = {
  safetyNet: {
    id: 'safetyNet',
    name: 'Filet de sécurité',
    short: 'Filet',
    type: 'passive',
    color: '#00e5ff',
    maxStock: 10,
    cost: { copper: 20, silver: 5 },
    description: '1 rebond gratuit en bas de l\'écran.',
  },
  shockwave: {
    id: 'shockwave',
    name: 'Onde de choc',
    short: 'Onde',
    type: 'active',
    key: '1',
    color: '#ff8800',
    maxStock: 10,
    cost: { silver: 15, gold: 5 },
    description: 'Détruit les astéroïdes autour du drone.',
  },
  missiles: {
    id: 'missiles',
    name: 'Missiles',
    short: 'Missiles',
    type: 'active',
    key: '2',
    color: '#ff3355',
    maxStock: 10,
    cost: { copper: 15, silver: 3 },
    description: '2 missiles verticaux.',
  },
  fireball: {
    id: 'fireball',
    name: 'Boule de feu',
    short: 'Feu',
    type: 'active',
    key: '3',
    color: '#ff4400',
    maxStock: 10,
    cost: { copper: 15, silver: 5 },
    description: 'Active la boule de feu pour 15s.',
    requiresUpgrade: 'puUnlockFireball',
  },
};

export const CONSUMABLE_IDS = Object.keys(CONSUMABLES);

export function getConsumable(id) {
  return CONSUMABLES[id] || null;
}
