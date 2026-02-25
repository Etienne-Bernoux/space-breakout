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

  /** Drone rebondit sur le vaisseau */
  checkShipCollision(drone, ship) {
    if (
      drone.dy > 0 &&
      drone.y + drone.radius >= ship.y &&
      drone.x >= ship.x &&
      drone.x <= ship.x + ship.width
    ) {
      drone.dy = -drone.dy;
      const hit = (drone.x - ship.x) / ship.width;
      drone.dx = drone.speed * (hit - 0.5) * 2;
      return { type: 'bounce' };
    }
    return null;
  }

  /** Drone détruit un astéroïde */
  checkAsteroidCollision(drone, field) {
    for (const a of field.grid) {
      if (!a.alive) continue;
      if (
        drone.x + drone.radius > a.x &&
        drone.x - drone.radius < a.x + a.width &&
        drone.y + drone.radius > a.y &&
        drone.y - drone.radius < a.y + a.height
      ) {
        a.alive = false;
        drone.dy = -drone.dy;
        const points = a.sizeName === 'large' ? 40 : a.sizeName === 'medium' ? 20 : 10;
        this.score += points;
        return {
          type: 'asteroidHit',
          points,
          x: a.x + a.width / 2,
          y: a.y + a.height / 2,
          color: a.color,
        };
      }
    }
    return null;
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

  /** Tous les astéroïdes détruits */
  checkWin(field) {
    if (field.remaining === 0) {
      this.state = 'won';
      return { type: 'win' };
    }
    return null;
  }
}
