// --- Power-Up Manager ---
// Gère les effets actifs, timers, apply/revert via PropModifier (base + multiplicateurs).
// gameState = { ship, drones, session, field }

import { getPowerUp } from '../../domain/power-ups.js';

// --- Strategies par type d'effet ---
// Chaque strategy : { apply(gs, effect, puId), revert(gs, effect, puId) }

function recenterShip(gs) {
  const cx = gs.ship.x + gs.ship.width / 2;
  gs.ship.x = Math.max(0, cx - gs.ship.width / 2);
  for (const d of gs.drones) {
    if (!d.launched) d.x = gs.ship.x + gs.ship.width / 2;
  }
}

const STRATEGIES = {
  shipWidth: {
    apply(gs, effect, puId) {
      gs.ship.widthMod.set(puId, effect.factor);
      recenterShip(gs);
    },
    revert(gs, effect, puId) {
      gs.ship.widthMod.remove(puId);
      recenterShip(gs);
    },
  },

  droneNumeric: {
    apply(gs, effect, puId) {
      const modKey = effect.prop + 'Mod';
      for (const d of gs.drones) d[modKey]?.set(puId, effect.factor);
    },
    revert(gs, effect, puId) {
      const modKey = effect.prop + 'Mod';
      for (const d of gs.drones) d[modKey]?.remove(puId);
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
    this.active = new Map(); // id → { startTime, def }
    this.droneManager = droneManager || null;
    /** Multiplicateur de durée des power-ups (upgrade). */
    this.durationMult = 1;
  }

  /** Activer un power-up. Si déjà actif → reset timer (modifier se met à jour automatiquement). */
  activate(puId, gameState, now = Date.now()) {
    const def = getPowerUp(puId);
    if (!def) return;

    // Instant : appliquer et ne pas stocker
    if (def.duration === 0) {
      this._applyInstant(puId, gameState);
      return;
    }

    // Déjà actif → juste reset timer (le facteur est déjà dans le modifier)
    if (this.active.has(puId)) {
      this.active.get(puId).startTime = now;
      return;
    }

    const strategy = resolveStrategy(def.effect);
    if (strategy) strategy.apply(gameState, def.effect, puId);
    this.active.set(puId, { startTime: now, def });
  }

  /** Mettre à jour : expirer les effets terminés. */
  update(gameState, now = Date.now()) {
    for (const [puId, entry] of this.active) {
      if (entry.def.duration === Infinity) continue;
      if (now - entry.startTime >= entry.def.duration * this.durationMult) {
        const strategy = resolveStrategy(entry.def.effect);
        if (strategy) strategy.revert(gameState, entry.def.effect, puId);
        this.active.delete(puId);
      }
    }
  }

  /** Révoquer tous les effets (fin de partie). */
  clear(gameState) {
    for (const [puId, entry] of this.active) {
      const strategy = resolveStrategy(entry.def.effect);
      if (strategy) strategy.revert(gameState, entry.def.effect, puId);
    }
    this.active.clear();
  }

  /** Retire les power-ups drone et revert leurs effets proprement.
   *  Appelé sur perte de vie (drone.reset() nettoie les modifiers). */
  clearDroneEffects(gameState) {
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
        : Math.max(0, e.def.duration * this.durationMult - (now - e.startTime)),
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
