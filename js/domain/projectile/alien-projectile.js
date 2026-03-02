// --- Projectile alien ---
// Entité pure : boule d'énergie tirée par un astéroïde habité vers le vaisseau.
// Trajectoire balistique : vise le ship au tir, puis va tout droit.

export class AlienProjectile {
  /**
   * @param {number} x - position de départ
   * @param {number} y - position de départ
   * @param {object} target - { x, y } position du vaisseau au moment du tir
   * @param {object} config - { speed, radius, color }
   */
  constructor(x, y, target, config = {}) {
    this.x = x;
    this.y = y;
    this.radius = config.radius || 5;
    this.speed = config.speed || 1.5;
    this.color = config.color || '#33ff66';
    this.alive = true;
    this.rotation = 0;
    this.rotationSpeed = 0.08;

    // Direction fixe vers la cible au moment du tir
    const dx = target.x - x;
    const dy = target.y - y;
    const dist = Math.sqrt(dx * dx + dy * dy) || 1;
    this.vx = (dx / dist) * this.speed;
    this.vy = (dy / dist) * this.speed;
  }

  update(canvasWidth, canvasHeight, _ship, dt = 1) {
    if (!this.alive) return;

    this.x += this.vx * dt;
    this.y += this.vy * dt;
    this.rotation += this.rotationSpeed * dt;

    // Hors écran → mort
    if (this.y > canvasHeight + this.radius ||
        this.x < -this.radius || this.x > canvasWidth + this.radius) {
      this.alive = false;
    }
  }
}
