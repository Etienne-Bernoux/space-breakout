// --- Power-Up Manager ---
// Gère les effets actifs, timers, apply/revert.
// gameState = { ship, drone, session, field }

import { getPowerUp } from '../domain/power-ups.js';

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

  // --- Apply / Revert ---

  _apply(puId, gs) {
    const saved = {};
    if (puId === 'shipWide') {
      saved.width = gs.ship.width;
      this._resizeShip(gs, 1.5);
    } else if (puId === 'shipNarrow') {
      saved.width = gs.ship.width;
      this._resizeShip(gs, 0.6);
    } else if (puId === 'droneSticky') {
      gs.drone.sticky = true;
    } else if (puId === 'dronePiercing') {
      gs.drone.piercing = true;
    } else if (puId === 'scoreDouble') {
      gs.session.scoreMultiplier = (gs.session.scoreMultiplier || 1) * 2;
    }
    return saved;
  }

  /** Resize le vaisseau en gardant le centre + repositionne le drone. */
  _resizeShip(gs, factor) {
    const cx = gs.ship.x + gs.ship.width / 2;
    gs.ship.width = Math.round(gs.ship.width * factor);
    gs.ship.x = cx - gs.ship.width / 2;
    // Recentrer le drone s'il est posé
    if (gs.drone && !gs.drone.launched) {
      gs.drone.x = gs.ship.x + gs.ship.width / 2;
    }
  }

  _revert(puId, saved, gs) {
    if (puId === 'shipWide' || puId === 'shipNarrow') {
      const cx = gs.ship.x + gs.ship.width / 2;
      gs.ship.width = saved.width;
      gs.ship.x = cx - gs.ship.width / 2;
      if (gs.drone && !gs.drone.launched) {
        gs.drone.x = gs.ship.x + gs.ship.width / 2;
      }
    } else if (puId === 'droneSticky') {
      gs.drone.sticky = false;
      gs.drone._stickyOffset = undefined;
      // Si le drone est posé, le relancer automatiquement
      if (!gs.drone.launched) {
        gs.drone.launched = true;
      }
    } else if (puId === 'dronePiercing') {
      gs.drone.piercing = false;
    } else if (puId === 'scoreDouble') {
      gs.session.scoreMultiplier = Math.max(1, (gs.session.scoreMultiplier || 2) / 2);
    }
  }

  _applyInstant(puId, gs) {
    if (puId === 'extraLife') {
      gs.session.lives++;
    } else if (puId === 'weaken') {
      for (const a of gs.field.grid) {
        if (!a.alive || !a.destructible) continue;
        a.hp = Math.max(0, a.hp - 1);
        if (a.hp <= 0) a.alive = false;
      }
    }
  }
}
