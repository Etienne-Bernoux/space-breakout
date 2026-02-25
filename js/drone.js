export class Drone {
  /**
   * @param {object} config - { radius, speed, color }
   * @param {object} ship
   */
  constructor(config, ship) {
    this.radius = config.radius;
    this.speed = config.speed;
    this.color = config.color;
    this.reset(ship);
  }

  reset(ship) {
    this.x = ship.x + ship.width / 2;
    this.y = ship.y - this.radius;
    this.dx = this.speed;
    this.dy = -this.speed;
    this.launched = false;
  }

  update(ship, canvasWidth) {
    if (!this.launched) {
      this.x = ship.x + ship.width / 2;
      this.y = ship.y - this.radius;
      return;
    }

    this.x += this.dx;
    this.y += this.dy;

    // Rebond murs latéraux + clamp pour éviter de rester collé
    if (this.x - this.radius <= 0) {
      this.x = this.radius;
      this.dx = Math.abs(this.dx);
    } else if (this.x + this.radius >= canvasWidth) {
      this.x = canvasWidth - this.radius;
      this.dx = -Math.abs(this.dx);
    }
    // Rebond plafond
    if (this.y - this.radius <= 0) {
      this.y = this.radius;
      this.dy = Math.abs(this.dy);
    }

    // Garantir un angle minimum pour éviter les trajectoires quasi-verticales
    const minDx = this.speed * 0.25;
    if (Math.abs(this.dx) < minDx) {
      this.dx = this.dx >= 0 ? minDx : -minDx;
    }
  }

  draw(ctx) {
    ctx.fillStyle = this.color;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fill();

    // Halo lumineux
    ctx.strokeStyle = 'rgba(255, 204, 0, 0.3)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius + 3, 0, Math.PI * 2);
    ctx.stroke();
  }
}
