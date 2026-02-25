// --- Game Logic (Use Case) ---
// Pur : aucune dépendance DOM, audio, canvas.
// Reçoit les entités, retourne des events que l'infra dispatch.

export class GameSession {
  constructor(config) {
    this.canvasHeight = config.canvas.height;
    this.maxLives = config.lives;
    this.state = 'menu'; // menu | playing | paused | gameOver | won
    this.lives = 0;
    this.score = 0;
  }

  start() {
    this.lives = this.maxLives;
    this.score = 0;
    this.scoreMultiplier = 1;
    this.state = 'playing';
  }

  pause() {
    if (this.state === 'playing') this.state = 'paused';
  }

  resume() {
    if (this.state === 'paused') this.state = 'playing';
  }

  backToMenu() {
    this.state = 'menu';
  }

  // --- Collisions (retournent des events) ---

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
        drone.dx = drone.speed;
        drone.dy = -drone.speed;
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
  checkAsteroidCollision(drone, field) {
    const piercing = !!drone.piercing;
    let firstEvent = null;

    for (const a of field.grid) {
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

        // Détruit — scoring
        const basePoints = a.sizeName === 'large' ? 40 : a.sizeName === 'medium' ? 20 : 10;
        const mult = (a.material?.pointsMult || 1) * (this.scoreMultiplier || 1);
        const points = Math.round(basePoints * mult);
        this.score += points;

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
  checkDroneLost(drone, ship) {
    if (drone.y - drone.radius > this.canvasHeight) {
      this.lives--;
      if (this.lives <= 0) {
        this.state = 'gameOver';
        return { type: 'gameOver' };
      }
      drone.reset(ship);
      return { type: 'loseLife', livesLeft: this.lives };
    }
    return null;
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
  checkWin(field) {
    if (field.remaining === 0) {
      this.state = 'won';
      return { type: 'win' };
    }
    return null;
  }
}
