// --- Collision Resolver ---
// Logique pure de détection/résolution de collisions.
// Reçoit des entités, retourne des events. Aucun side-effect sur le state global.

import { polyBounds, circleIntersectsPolygon } from '../../domain/shape/polygon-collision.js';

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

    // Anti-doublon : si le drone vient de rebondir sur un astéroïde,
    // on l'ignore tant qu'il est encore dedans (polygon plus petit que AABB)
    if (drone._lastHitAsteroid && !this._droneHitsAsteroid(drone, drone._lastHitAsteroid)) {
      drone._lastHitAsteroid = null; // sorti → reset
    }

    const snapshot = [...field.grid];
    for (const a of snapshot) {
      if (!a.alive) continue;
      if (a === drone._lastHitAsteroid) continue;
      if (!this._droneHitsAsteroid(drone, a)) continue;
      {
        const hitX = drone.x;
        const hitY = drone.y;

        // Indestructible → rebond (même en piercing)
        if (!a.destructible) {
          if (!piercing) { drone.dy = -drone.dy; drone._lastHitAsteroid = a; }
          if (!firstEvent) firstEvent = { type: 'bounce', x: hitX, y: hitY, color: a.color };
          if (!piercing) return firstEvent;
          continue;
        }

        // Alien piercingImmune → rebond forcé (le piercing ne traverse pas)
        const isPiercingImmune = !!a.material?.piercingImmune;
        const effectivePiercing = piercing && !isPiercingImmune;

        // Rebond normal (sauf piercing effectif)
        if (!effectivePiercing && !firstEvent) {
          drone.dy = -drone.dy;
          drone._lastHitAsteroid = a;
        }

        // Bouclier alien absorbe le coup
        if (a.shield) {
          a.shield = false;
          const ev = { type: 'asteroidDamage', x: hitX, y: hitY, color: '#33ff66', hpLeft: a.hp, maxHp: a.maxHp, materialKey: a.materialKey };
          if (!effectivePiercing) return ev;
          if (!firstEvent) firstEvent = ev;
          continue;
        }

        // Décrémenter HP (damage upgrade : drone.damage, default 1)
        const dmg = drone.damage || 1;
        a.hp -= dmg;
        if (a.hp > 0) {
          const ev = { type: 'asteroidDamage', x: hitX, y: hitY, color: a.color, hpLeft: a.hp, maxHp: a.maxHp, materialKey: a.materialKey };
          if (!effectivePiercing) return ev;
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
          materialKey: a.materialKey, material: a.material, sizeName: a.sizeName,
        };
        if (!effectivePiercing) return ev;
        if (!firstEvent) firstEvent = ev;
      }
    }
    return firstEvent;
  }

  /**
   * Test de collision drone ↔ astéroïde.
   * Si l'astéroïde a un collisionPoly : broadphase AABB + narrowphase polygon.
   * Sinon fallback AABB classique.
   */
  _droneHitsAsteroid(drone, a) {
    if (a.collisionPoly && a.collisionPoly.length >= 3) {
      const b = polyBounds(a.collisionPoly);
      if (drone.x + drone.radius < b.x || drone.x - drone.radius > b.x + b.w ||
          drone.y + drone.radius < b.y || drone.y - drone.radius > b.y + b.h) {
        return false;
      }
      return circleIntersectsPolygon(drone.x, drone.y, drone.radius, a.collisionPoly);
    }
    // Fallback AABB
    return drone.x + drone.radius > a.x &&
           drone.x - drone.radius < a.x + a.width &&
           drone.y + drone.radius > a.y &&
           drone.y - drone.radius < a.y + a.height;
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

  /** Victoire : tous détruits OU boss tué */
  checkWin(field, session) {
    const won = field.remaining === 0 || (field.hasBoss && !field.bossAlive);
    if (won) {
      session.state = 'won';
      return { type: 'win' };
    }
    return null;
  }
}
