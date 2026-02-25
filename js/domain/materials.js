// --- Définitions des matériaux d'astéroïdes ---
// Chaque matériau : hp, destructible, palette, pointsMult, noFragment, style visuel

export const MATERIALS = {
  rock: {
    name: 'Roche',
    hp: 1,
    destructible: true,
    pointsMult: 1,
    noFragment: false,
    colors: ['#8b4513', '#a0522d', '#6b3a2a', '#7a4530'],
    style: 'rock', // rendu standard (cratères, veines, rim)
  },
  ice: {
    name: 'Glace',
    hp: 1,
    destructible: true,
    pointsMult: 1,
    noFragment: true, // explose entièrement, pas de fragmentation
    colors: ['#88ccee', '#66aadd', '#aaddff', '#77bbee'],
    style: 'ice', // translucide, reflets, cristaux
  },
  lava: {
    name: 'Lave',
    hp: 2,
    destructible: true,
    pointsMult: 1.5,
    noFragment: false,
    colors: ['#cc3300', '#dd4411', '#aa2200', '#bb3300'],
    style: 'lava', // veines incandescentes, pulsation
  },
  metal: {
    name: 'Métal',
    hp: 3,
    destructible: true,
    pointsMult: 2,
    noFragment: false,
    colors: ['#888899', '#999aab', '#777788', '#aaaabb'],
    style: 'metal', // reflets métalliques, surface lisse, bosses au hit
  },
  crystal: {
    name: 'Cristal',
    hp: 1,
    destructible: true,
    pointsMult: 3,
    noFragment: true, // éclate en morceaux
    colors: ['#cc66ff', '#dd88ff', '#bb44ee', '#aa55dd'],
    style: 'crystal', // facettes angulaires, brillance
  },
  obsidian: {
    name: 'Obsidienne',
    hp: Infinity,
    destructible: false,
    pointsMult: 0,
    noFragment: false,
    colors: ['#1a1a2e', '#222244', '#2a2a3e', '#181830'],
    style: 'obsidian', // noir profond, lueur violette
  },
};

/** Retourne le matériau par clé, avec fallback rock */
export function getMaterial(key) {
  return MATERIALS[key] || MATERIALS.rock;
}
