// --- Collision Resolver ---
// Logique pure de détection/résolution de collisions.
// Reçoit des entités, retourne des events. Aucun side-effect sur le state global.

export class CollisionResolver {
  constructor({ basePoints }) {
    this.basePoints = basePoints || { large: 40, medium: 20, small: 10 };
  }

  /** Drone rebondit sur le vaisseau (+ sticky) */
  checkShipCollision(drone, ship) {
    if (
      drone.dy > 0 &&
      drone.y + drone.radius >= ship.y &&
      drone.x >= ship.x &&
      drone.x <= ship.x + ship.width
    ) {
      if (drone.sticky) {
        drone.launched = false;
        drone._stickyOffset = drone.x - ship.x;
        drone.y = ship.y - drone.radius;
        return { type: 'sticky' };
      }
      drone.dy = -drone.dy;
      const hit = (drone.x - ship.x) / ship.width;
      drone.dx = drone.speed * (hit - 0.5) * 2;
      return { type: 'bounce' };
    }
    return null;
  }

  /** Drone touche un astéroïde — gère HP, fragmentation, indestructibles, piercing */
  checkAsteroidCollision(drone, field, session) {
    const piercing = !!drone.piercing;
    let firstEvent = null;

    const snapshot = [...field.grid];
    for (const a of snapshot) {
      if (!a.alive) continue;
      if (
        drone.x + drone.radius > a.x &&
        drone.x - drone.radius < a.x + a.width &&
        drone.y + drone.radius > a.y &&
        drone.y - drone.radius < a.y + a.height
      ) {
        const hitX = drone.x;
        const hitY = drone.y;

        // Indestructible → rebond (même en piercing)
        if (!a.destructible) {
          if (!piercing) drone.dy = -drone.dy;
          if (!firstEvent) firstEvent = { type: 'bounce', x: hitX, y: hitY, color: a.color };
          if (!piercing) return firstEvent;
          continue;
        }

        // Rebond normal (sauf piercing)
        if (!piercing && !firstEvent) drone.dy = -drone.dy;

        // Décrémenter HP
        a.hp--;
        if (a.hp > 0) {
          const ev = { type: 'asteroidDamage', x: hitX, y: hitY, color: a.color, hpLeft: a.hp, maxHp: a.maxHp };
          if (!piercing) return ev;
          if (!firstEvent) firstEvent = ev;
          continue;
        }

        // Détruit — scoring (combo mult: ×2 @5, ×3 @10, ×4 @15…)
        const basePoints = this.basePoints[a.sizeName] || this.basePoints.small;
        const comboMult = 1 + Math.floor((session.combo || 0) / 5);
        const mult = (a.material?.pointsMult || 1) * (session.scoreMultiplier || 1) * comboMult;
        const points = Math.round(basePoints * mult);
        session.score += points;

        const fragments = field.fragment(a, hitX, hitY);
        const ev = {
          type: fragments.length > 0 ? 'asteroidFragment' : 'asteroidHit',
          points, x: hitX, y: hitY, color: a.color, fragments,
          materialKey: a.materialKey, sizeName: a.sizeName,
        };
        if (!piercing) return ev;
        if (!firstEvent) firstEvent = ev;
      }
    }
    return firstEvent;
  }

  /** Drone perdu en bas de l'écran */
  isDroneLost(drone, canvasHeight) {
    return drone.launched && drone.y - drone.radius > canvasHeight;
  }

  /** Capsule ramassée par le vaisseau */
  checkCapsuleCollision(capsules, ship) {
    const events = [];
    for (const cap of capsules) {
      if (!cap.alive) continue;
      const cx = Math.max(ship.x, Math.min(cap.x, ship.x + ship.width));
      const cy = Math.max(ship.y, Math.min(cap.y, ship.y + ship.height));
      if (Math.hypot(cap.x - cx, cap.y - cy) < cap.radius + 4) {
        cap.alive = false;
        events.push({ type: 'capsuleCollected', powerUpId: cap.powerUpId, x: cap.x, y: cap.y });
      }
    }
    return events;
  }

  /** Tous les astéroïdes détruits */
  checkWin(field, session) {
    if (field.remaining === 0) {
      session.state = 'won';
      return { type: 'win' };
    }
    return null;
  }
}
