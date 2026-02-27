// --- Drone Manager ---
// Centralise le lifecycle des drones : spawn, remove, reset, power-up cleanup.

import { Drone } from '../../domain/drone/drone.js';

export class DroneManager {
  /**
   * @param {object} deps
   * @param {function} deps.clearDroneEffects - PowerUpManager.clearDroneEffects()
   */
  constructor({ clearDroneEffects } = {}) {
    this.clearDroneEffects = clearDroneEffects || (() => {});
  }

  /** Ajouter un drone en copiant la config du premier. */
  spawn(drones, ship) {
    const ref = drones[0];
    if (!ref) return;
    const d = new Drone(
      { radius: ref._baseRadius || ref.radius, speed: ref._baseSpeed || ref.speed, color: ref.color },
      ship,
    );
    d.piercing = ref.piercing;
    d.sticky = ref.sticky;
    d.launchAtAngle(ship, (Math.random() - 0.5) * 0.6);
    drones.push(d);
  }

  /** Retirer un drone extra (multi-drone). */
  removeExtra(drones, index) {
    if (drones.length > 1) {
      drones.splice(index, 1);
      return true;
    }
    return false;
  }

  /** Reset le dernier drone + nettoyage power-ups drone. */
  resetLast(drones, ship) {
    drones[0].reset(ship);
    this.clearDroneEffects();
  }
}
