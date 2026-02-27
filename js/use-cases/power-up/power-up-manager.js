// --- Power-Up Manager ---
// Gère les effets actifs, timers, apply/revert.
// gameState = { ship, drones, session, field }

import { getPowerUp } from '../../domain/power-ups.js';

// --- Strategies par type d'effet ---
// Chaque strategy : { apply(gs, effect, saved), revert(gs, effect, saved), cumul?(gs, effect) }

function centerShipDrones(gs) {
  for (const d of gs.drones) {
    if (!d.launched) d.x = gs.ship.x + gs.ship.width / 2;
  }
}

function resizeShip(gs, factor) {
  const cx = gs.ship.x + gs.ship.width / 2;
  gs.ship.width = Math.round(gs.ship.width * factor);
  gs.ship.x = cx - gs.ship.width / 2;
  centerShipDrones(gs);
}

const STRATEGIES = {
  shipWidth: {
    apply(gs, effect, saved) {
      saved.width = gs.ship.width;
      resizeShip(gs, effect.factor);
    },
    revert(gs, effect, saved) {
      const cx = gs.ship.x + gs.ship.width / 2;
      gs.ship.width = saved.width;
      gs.ship.x = cx - gs.ship.width / 2;
      centerShipDrones(gs);
    },
    cumul(gs, effect) {
      resizeShip(gs, effect.factor);
    },
  },

  droneNumeric: {
    apply(gs, effect, saved) {
      saved.values = gs.drones.map(d => d[effect.prop]);
      for (const d of gs.drones) d[effect.prop] *= effect.factor;
    },
    revert(gs, effect, saved) {
      for (let i = 0; i < gs.drones.length; i++) {
        gs.drones[i][effect.prop] = saved.values?.[i] ?? gs.drones[i][effect.prop];
      }
    },
    cumul(gs, effect) {
      for (const d of gs.drones) d[effect.prop] *= effect.factor;
    },
  },

  droneBoolean: {
    apply(gs, effect) {
      for (const d of gs.drones) d[effect.prop] = true;
    },
    revert(gs, effect) {
      for (const d of gs.drones) {
        d[effect.prop] = false;
        if (effect.prop === 'sticky') {
          d._stickyOffset = undefined;
          if (!d.launched) d.launch(gs.ship);
        }
      }
    },
  },

  sessionFactor: {
    apply(gs, effect) {
      gs.session[effect.prop] = (gs.session[effect.prop] || 1) * effect.factor;
    },
    revert(gs, effect) {
      gs.session[effect.prop] = Math.max(1, (gs.session[effect.prop] || effect.factor) / effect.factor);
    },
  },
};

/** Résout la strategy à utiliser pour un effect donné. */
function resolveStrategy(effect) {
  if (effect.target === 'ship' && effect.prop === 'width') return STRATEGIES.shipWidth;
  if (effect.target === 'drone' && effect.factor) return STRATEGIES.droneNumeric;
  if (effect.target === 'drone') return STRATEGIES.droneBoolean;
  if (effect.target === 'session' && effect.factor) return STRATEGIES.sessionFactor;
  return null;
}

export class PowerUpManager {
  constructor({ droneManager } = {}) {
    this.active = new Map(); // id → { startTime, def, saved }
    this.droneManager = droneManager || null;
  }

  /** Activer un power-up. Si déjà actif → reset timer + cumul. */
  activate(puId, gameState, now = Date.now()) {
    const def = getPowerUp(puId);
    if (!def) return;

    // Instant : appliquer et ne pas stocker
    if (def.duration === 0) {
      this._applyInstant(puId, gameState);
      return;
    }

    // Déjà actif → reset timer + cumul éventuel
    if (this.active.has(puId)) {
      const entry = this.active.get(puId);
      entry.startTime = now;
      const strategy = resolveStrategy(def.effect);
      if (strategy?.cumul) strategy.cumul(gameState, def.effect);
      return;
    }

    const saved = {};
    const strategy = resolveStrategy(def.effect);
    if (strategy) strategy.apply(gameState, def.effect, saved);
    this.active.set(puId, { startTime: now, def, saved });
  }

  /** Mettre à jour : expirer les effets terminés. */
  update(gameState, now = Date.now()) {
    for (const [puId, entry] of this.active) {
      if (entry.def.duration === Infinity) continue;
      if (now - entry.startTime >= entry.def.duration) {
        const strategy = resolveStrategy(entry.def.effect);
        if (strategy) strategy.revert(gameState, entry.def.effect, entry.saved);
        this.active.delete(puId);
      }
    }
  }

  /** Révoquer tous les effets (fin de partie). */
  clear(gameState) {
    for (const [puId, entry] of this.active) {
      const strategy = resolveStrategy(entry.def.effect);
      if (strategy) strategy.revert(gameState, entry.def.effect, entry.saved);
    }
    this.active.clear();
  }

  /** Supprime les power-ups drone du manager (drone.reset() a déjà nettoyé les props).
   *  Appelé sur perte de vie pour éviter un revert obsolète à l'expiration. */
  clearDroneEffects() {
    for (const [puId, entry] of this.active) {
      if (entry.def.effect.target === 'drone') {
        this.active.delete(puId);
      }
    }
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

  // --- Instant effects ---

  _applyInstant(puId, gs) {
    const def = getPowerUp(puId);
    const { effect } = def;

    if (effect.target === 'session' && effect.delta) {
      gs.session[effect.prop] += effect.delta;
    } else if (effect.action === 'spawn') {
      if (this.droneManager) this.droneManager.spawn(gs.drones, gs.ship);
    } else if (effect.action === 'weakenAll') {
      for (const a of gs.field.grid) {
        if (!a.alive || !a.destructible) continue;
        a.hp = Math.max(1, a.hp + effect.delta);
      }
    }
  }
}
