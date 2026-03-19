// --- AlienCombatManager : logique de tir alien + firePulse decay ---
// Extrait de loop.js. Aucune dépendance DOM/Audio.
// Les dépendances infra (AlienProjectile, playAlienShoot) sont injectées.

export class AlienCombatManager {
  /**
   * @param {object} deps
   * @param {Function} deps.createProjectile  - (px, py, target, opts) => projectile
   * @param {Function} deps.onShoot           - () => void (SFX)
   */
  constructor({ createProjectile, onShoot } = {}) {
    this.createProjectile = createProjectile;
    this.onShoot = onShoot || (() => {});
  }

  /**
   * Appelé chaque frame de jeu.
   * - Decay firePulse
   * - Spawn projectiles pour les aliens prêts à tirer
   * - Update + cleanup des projectiles existants
   *
   * @param {object} field        - AsteroidField
   * @param {object} ship         - Ship (cible)
   * @param {Array}  projectiles  - tableau mutable de projectiles
   * @param {number} dt           - delta-time effectif
   * @param {object} canvasSize   - { width, height }
   * @returns {Array} projectiles filtrés (vivants)
   */
  update(field, ship, projectiles, dt, canvasSize) {
    // Decay firePulse des aliens (animation tir)
    if (field.grid) {
      for (const a of field.grid) {
        if (a.firePulse > 0) a.firePulse = Math.max(0, a.firePulse - 0.06 * dt);
      }
    }

    // Spawn projectiles pour les aliens prêts à tirer
    const readyAliens = field.getReadyToFire(dt);
    for (const a of readyAliens) {
      if (!a.alive) continue;
      const px = a.x + a.width / 2;
      const py = a.y + a.height;
      const target = { x: ship.x + ship.width / 2, y: ship.y };
      const opts = { speed: a.projectileSpeed };
      if (a.material?.frostShot) {
        opts.frostShot = true;
        opts.color = '#5bc0eb';
      }
      projectiles.push(this.createProjectile(px, py, target, opts));
      a.firePulse = 1.0;
      this.onShoot();
    }

    // Update projectiles existants
    for (const p of projectiles) p.update(canvasSize.width, canvasSize.height, ship, dt);

    // Cleanup morts
    return projectiles.filter(p => p.alive);
  }
}
