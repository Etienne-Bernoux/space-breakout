// --- Table de drop des minerais ---
// Matrice matériau × minerai. Chaque valeur = poids relatif de drop.
// 0 = ne droppe jamais ce minerai. obsidian = indestructible, pas de drop.

/**
 * DROP_TABLE[materialKey][mineralKey] = poids (0 = jamais)
 * Les poids sont relatifs entre eux pour un même matériau.
 */
export const DROP_TABLE = {
  rock:      { copper: 5, silver: 1, gold: 0, platinum: 0 },
  ice:       { copper: 3, silver: 2, gold: 0, platinum: 0 },
  lava:      { copper: 2, silver: 3, gold: 1, platinum: 0 },
  metal:     { copper: 1, silver: 4, gold: 2, platinum: 0 },
  crystal:   { copper: 0, silver: 2, gold: 4, platinum: 1 },
  obsidian:  { copper: 0, silver: 0, gold: 0, platinum: 0 }, // indestructible
  tentacle:  { copper: 0, silver: 1, gold: 3, platinum: 2 },
  alienCore: { copper: 0, silver: 0, gold: 2, platinum: 5 },
};

/**
 * Retourne les poids de drop pour un matériau donné.
 * @param {string} materialKey
 * @returns {Record<string, number>}
 */
export function getDropWeights(materialKey) {
  return DROP_TABLE[materialKey] || DROP_TABLE.rock;
}
