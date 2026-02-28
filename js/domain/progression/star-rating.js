// Calcul des étoiles — fonction pure, zéro dépendance.
// ★   = terminé (au moins une vie perdue)
// ★★  = terminé sans perdre de vie
// ★★★ = terminé sans perdre de vie ET sous le temps cible

/**
 * @param {number} livesLost - nombre de vies perdues pendant le niveau
 * @param {number} timeSpent - temps en secondes
 * @param {number} timeTarget - seuil pour 3 étoiles (secondes)
 * @returns {1|2|3}
 */
export function computeStars(livesLost, timeSpent, timeTarget) {
  if (livesLost > 0) return 1;
  return timeSpent <= timeTarget ? 3 : 2;
}
