// --- Consumable Activator ---
// Orchestre l'effet de chaque consommable. DI pour entities/session/effects.

export class ConsumableActivator {
  /**
   * @param {object} deps
   * @param {object} deps.entities    - { ship, drones, field, missiles }
   * @param {object} deps.session     - GameSession
   * @param {object} deps.systems     - { powerUp }
   * @param {object} deps.consumableSession - ConsumableSession
   * @param {object} deps.effects     - { spawnExplosion, triggerShake, ... }
   * @param {object} deps.config      - { canvas }
   */
  constructor({ entities, session, systems, consumableSession, effects, config }) {
    this.entities = entities;
    this.session = session;
    this.systems = systems;
    this.cs = consumableSession;
    this.effects = effects;
    this.config = config;
  }

  /** Tente d'activer un consommable actif par id. Retourne true si activé. */
  activate(id) {
    if (!this.cs || !this.cs.hasCharge(id)) return false;
    if (id === 'shockwave') return this._shockwave();
    if (id === 'missiles') return this._missiles();
    if (id === 'fireball') return this._fireball();
    return false;
  }

  /** Filet de sécurité : rebondit le drone au lieu de mourir. */
  activateSafetyNet(drone) {
    if (!this.cs || !this.cs.hasCharge('safetyNet')) return false;
    drone.dy = -Math.abs(drone.dy);
    drone.y = this.config.canvas.height - drone.radius - 10;
    this.cs.use('safetyNet');
    this.effects.spawnExplosion?.(drone.x, drone.y, '#00e5ff');
    this.effects.triggerShake?.(4);
    this.effects.playSafetyNetBounce?.();
    return true;
  }

  _shockwave() {
    const drone = this.entities.drones.find(d => d.launched);
    if (!drone) return false;
    this.cs.use('shockwave');
    const radius = 120;
    const field = this.entities.field;
    let destroyed = 0;
    for (const a of field.grid) {
      if (!a.alive || !a.destructible) continue;
      const dx = (a.x + a.width / 2) - drone.x;
      const dy = (a.y + a.height / 2) - drone.y;
      if (Math.sqrt(dx * dx + dy * dy) < radius) {
        a.hp = 0;
        a.alive = false;
        destroyed++;
        this.effects.spawnExplosion?.(a.x + a.width / 2, a.y + a.height / 2, a.color);
      }
    }
    this.effects.spawnShockwaveRing?.(drone.x, drone.y, radius, '#00e5ff');
    this.effects.triggerShake?.(8);
    this.effects.playShockwave?.();
    return true;
  }

  _missiles() {
    const ship = this.entities.ship;
    if (!ship) return false;
    this.cs.use('missiles');
    const { Missile } = this._getMissileClass();
    if (!Missile) return false;
    const cx = ship.x + ship.width / 2;
    const y = ship.y - 5;
    const m1 = new Missile(cx - 12, y, { speed: 5, color: '#ff3355' });
    const m2 = new Missile(cx + 12, y, { speed: 5, color: '#ff3355' });
    if (!this.entities.missiles) this.entities.missiles = [];
    this.entities.missiles.push(m1, m2);
    this.effects.triggerShake?.(3);
    this.effects.playMissileLaunch?.();
    return true;
  }

  _fireball() {
    const gs = { ship: this.entities.ship, drones: this.entities.drones, session: this.session, field: this.entities.field };
    this.systems.powerUp.activate('droneFireball', gs);
    this.cs.use('fireball');
    this.effects.playFireballActivate?.();
    return true;
  }

  /** Lazy import pour éviter dépendance circulaire. */
  _getMissileClass() {
    if (!this._MissileRef) {
      this._MissileRef = { Missile: this.config.MissileClass || null };
    }
    return this._MissileRef;
  }
}
