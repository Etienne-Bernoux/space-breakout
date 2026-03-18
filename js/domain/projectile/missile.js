// --- Missile : projectile tiré vers le haut depuis le vaisseau ---

export class Missile {
  constructor(x, y, config = {}) {
    this.x = x;
    this.y = y;
    this.dx = 0;
    this.dy = -(config.speed || 5);
    this.radius = config.radius || 4;
    this.color = config.color || '#ff3355';
    this.alive = true;
    this.damage = config.damage || 1;
  }

  update(dt = 1) {
    this.y += this.dy * dt;
    if (this.y + this.radius < 0) this.alive = false;
  }
}
