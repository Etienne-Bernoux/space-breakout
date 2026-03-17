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
    noFragment: false, // se fragmente comme la roche
    frostExplosion: true, // gèle les voisins adjacents à la destruction
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
  tentacle: {
    name: 'Tentacule',
    hp: 4,
    destructible: true,
    pointsMult: 2.5,
    noFragment: true,
    piercingImmune: true,
    creaturePart: true,     // fait partie d'une créature alien (rendu unifié, skip projectile shield)
    optional: true,         // ne compte pas pour la victoire
    colors: ['#33cc55', '#22aa44', '#44dd66', '#119933'],
    style: 'tentacle', // tentacule organique, pulsation, tir
    fireRate: 360,          // frames entre tirs (≈6s à 60fps)
    projectileSpeed: 1.5,   // vitesse du projectile
  },
  alienCore: {
    name: 'Noyau alien',
    hp: 5,
    destructible: true,
    pointsMult: 5,
    noFragment: true,
    piercingImmune: true,
    creaturePart: true,     // fait partie d'une créature alien
    isBoss: true,           // détruire = victoire + tue les tentacules
    colors: ['#888899', '#33cc55', '#999aab', '#22aa44'],
    style: 'alienCore',     // métal parasité (base métal + excroissances organiques)
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
