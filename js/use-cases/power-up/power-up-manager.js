// --- Power-Up Manager ---
// Gère les effets actifs, timers, apply/revert.
// gameState = { ship, drones, session, field }

import { getPowerUp } from '../../domain/power-ups.js';
import { Drone } from '../../domain/drone.js';

export class PowerUpManager {
  constructor() {
    this.active = new Map(); // id → { startTime, def, saved }
  }

  /** Activer un power-up. Si déjà actif → reset timer. */
  activate(puId, gameState, now = Date.now()) {
    const def = getPowerUp(puId);
    if (!def) return;

    // Instant : appliquer et ne pas stocker
    if (def.duration === 0) {
      this._applyInstant(puId, gameState);
      return;
    }

    // Déjà actif → reset timer
    if (this.active.has(puId)) {
      this.active.get(puId).startTime = now;
      return;
    }

    const saved = this._apply(puId, gameState);
    this.active.set(puId, { startTime: now, def, saved });
  }

  /** Mettre à jour : expirer les effets terminés. */
  update(gameState, now = Date.now()) {
    for (const [puId, entry] of this.active) {
      if (entry.def.duration === Infinity) continue;
      if (now - entry.startTime >= entry.def.duration) {
        this._revert(puId, entry.saved, gameState);
        this.active.delete(puId);
      }
    }
  }

  /** Révoquer tous les effets (fin de partie). */
  clear(gameState) {
    for (const [puId, entry] of this.active) {
      this._revert(puId, entry.saved, gameState);
    }
    this.active.clear();
  }

  /** Liste des effets actifs pour le HUD. */
  getActive(now = Date.now()) {
    return Array.from(this.active.entries()).map(([id, e]) => ({
      id,
      def: e.def,
      remaining: e.def.duration === Infinity
        ? Infinity
        : Math.max(0, e.def.duration - (now - e.startTime)),
    }));
  }

  // --- Apply / Revert (piloté par def.effect) ---

  _apply(puId, gs) {
    const def = getPowerUp(puId);
    const { effect } = def;
    const saved = {};

    if (effect.target === 'ship' && effect.prop === 'width') {
      saved.width = gs.ship.width;
      this._resizeShip(gs, effect.factor);
    } else if (effect.target === 'drone') {
      for (const d of gs.drones) d[effect.prop] = true;
    } else if (effect.target === 'session' && effect.factor) {
      gs.session[effect.prop] = (gs.session[effect.prop] || 1) * effect.factor;
    }
    return saved;
  }

  /** Resize le vaisseau en gardant le centre + repositionne le drone. */
  _resizeShip(gs, factor) {
    const cx = gs.ship.x + gs.ship.width / 2;
    gs.ship.width = Math.round(gs.ship.width * factor);
    gs.ship.x = cx - gs.ship.width / 2;
    for (const d of gs.drones) {
      if (!d.launched) d.x = gs.ship.x + gs.ship.width / 2;
    }
  }

  _revert(puId, saved, gs) {
    const def = getPowerUp(puId);
    const { effect } = def;

    if (effect.target === 'ship' && effect.prop === 'width') {
      const cx = gs.ship.x + gs.ship.width / 2;
      gs.ship.width = saved.width;
      gs.ship.x = cx - gs.ship.width / 2;
      for (const d of gs.drones) {
        if (!d.launched) d.x = gs.ship.x + gs.ship.width / 2;
      }
    } else if (effect.target === 'drone') {
      for (const d of gs.drones) {
        d[effect.prop] = false;
        if (effect.prop === 'sticky') {
          d._stickyOffset = undefined;
          if (!d.launched) d.launch(gs.ship);
        }
      }
    } else if (effect.target === 'session' && effect.factor) {
      gs.session[effect.prop] = Math.max(1, (gs.session[effect.prop] || effect.factor) / effect.factor);
    }
  }

  _applyInstant(puId, gs) {
    const def = getPowerUp(puId);
    const { effect } = def;

    if (effect.target === 'session' && effect.delta) {
      gs.session[effect.prop] += effect.delta;
    } else if (effect.action === 'spawn') {
      // Ajouter un drone supplémentaire (copie config du premier)
      const ref = gs.drones[0];
      if (ref) {
        const d = new Drone(
          { radius: ref.radius, speed: ref.speed, color: ref.color },
          gs.ship,
        );
        d.piercing = ref.piercing;
        d.sticky = ref.sticky;
        // Lancer immédiatement avec un angle aléatoire léger
        d.launchAtAngle(gs.ship, (Math.random() - 0.5) * 0.6);
        gs.drones.push(d);
      }
    } else if (effect.action === 'weakenAll') {
      for (const a of gs.field.grid) {
        if (!a.alive || !a.destructible) continue;
        a.hp = Math.max(1, a.hp + effect.delta);
      }
    }
  }
}
