// Catalogue des zones du système planétaire — données pures, zéro side-effect.
// Progression linéaire : ceinture → lune → station → planète → nébuleuse → noyau.

export const ZONES = [
  { id: 'zone1', name: 'Ceinture d\'astéroïdes', description: 'Nuage rocheux en bordure du système', orbitIndex: 0, type: 'belt',    accent: '#8b6914' },
  { id: 'zone2', name: 'Lune de Kryos',          description: 'Satellite glacé et inhospitalier',    orbitIndex: 1, type: 'moon',    accent: '#5bc0eb' },
  { id: 'zone3', name: 'Station Erebus',          description: 'Station spatiale abandonnée',         orbitIndex: 2, type: 'station', accent: '#9b9b9b' },
  { id: 'zone4', name: 'Orbite de Pyralis',       description: 'Géante de lave et cristaux',          orbitIndex: 3, type: 'planet',  accent: '#ff6b35' },
  { id: 'zone5', name: 'Nébuleuse Vortex',        description: 'Brume toxique et obsidienne',         orbitIndex: 4, type: 'nebula',  accent: '#7b2d8b' },
  { id: 'zone6', name: 'Noyau Alien',             description: 'Cœur parasité du système',            orbitIndex: 5, type: 'core',    accent: '#00ff66' },
];

/** Retourne une zone par son id. */
export function getZone(id) {
  return ZONES.find(z => z.id === id) || null;
}

/** Retourne l'index (0-based) d'une zone. -1 si introuvable. */
export function getZoneIndex(id) {
  return ZONES.findIndex(z => z.id === id);
}

/** Retourne toutes les zones. */
export function getAllZones() {
  return ZONES;
}
