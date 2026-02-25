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

  /** Drone touche un astéroïde — fragmente les gros, détruit les small */
  checkAsteroidCollision(drone, field) {
    for (const a of field.grid) {
      if (!a.alive) continue;
      if (
        drone.x + drone.radius > a.x &&
        drone.x - drone.radius < a.x + a.width &&
        drone.y + drone.radius > a.y &&
        drone.y - drone.radius < a.y + a.height
      ) {
        drone.dy = -drone.dy;
        const hitX = drone.x;
        const hitY = drone.y;
        const points = a.sizeName === 'large' ? 40 : a.sizeName === 'medium' ? 20 : 10;
        this.score += points;

        // Fragmenter si > 1×1, sinon juste détruire
        const fragments = field.fragment(a, hitX, hitY);

        return {
          type: fragments.length > 0 ? 'asteroidFragment' : 'asteroidHit',
          points,
          x: hitX,
          y: hitY,
          color: a.color,
          fragments,
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
