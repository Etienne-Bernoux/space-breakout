import { CONFIG } from './config.js';

export class Drone {
  constructor(ship) {
    this.radius = CONFIG.drone.radius;
    this.speed = CONFIG.drone.speed;
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

    // Rebond murs latéraux
    if (this.x - this.radius <= 0 || this.x + this.radius >= canvasWidth) {
      this.dx = -this.dx;
    }
    // Rebond plafond
    if (this.y - this.radius <= 0) {
      this.dy = -this.dy;
    }
  }

  draw(ctx) {
    ctx.fillStyle = CONFIG.drone.color;
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
