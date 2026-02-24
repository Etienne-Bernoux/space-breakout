import { CONFIG } from './config.js';

export class Ship {
  constructor(canvasWidth, canvasHeight) {
    this.width = CONFIG.ship.width;
    this.height = CONFIG.ship.height;
    this.speed = CONFIG.ship.speed;
    this.x = (canvasWidth - this.width) / 2;
    this.y = canvasHeight - this.height - 10;
    this.movingLeft = false;
    this.movingRight = false;
    this.canvasWidth = canvasWidth;
  }

  update() {
    if (this.movingLeft) this.x -= this.speed;
    if (this.movingRight) this.x += this.speed;
    this.x = Math.max(0, Math.min(this.canvasWidth - this.width, this.x));
  }

  draw(ctx) {
    const cx = this.x + this.width / 2;
    const { y, width, height } = this;

    // Aile gauche
    ctx.fillStyle = '#006a99';
    ctx.beginPath();
    ctx.moveTo(cx - 12, y + 6);
    ctx.lineTo(this.x, y + height + 2);
    ctx.lineTo(cx - 8, y + height);
    ctx.closePath();
    ctx.fill();

    // Aile droite
    ctx.beginPath();
    ctx.moveTo(cx + 12, y + 6);
    ctx.lineTo(this.x + width, y + height + 2);
    ctx.lineTo(cx + 8, y + height);
    ctx.closePath();
    ctx.fill();

    // Corps central
    ctx.fillStyle = CONFIG.ship.color;
    ctx.beginPath();
    ctx.moveTo(cx, y - 4);
    ctx.lineTo(cx + 14, y + height);
    ctx.lineTo(cx - 14, y + height);
    ctx.closePath();
    ctx.fill();

    // Cockpit
    ctx.fillStyle = '#80eaff';
    ctx.beginPath();
    ctx.ellipse(cx, y + 8, 4, 6, 0, 0, Math.PI * 2);
    ctx.fill();

    // Réacteurs (x2)
    const flicker = 4 + Math.random() * 4;
    ctx.fillStyle = '#ff6600';
    ctx.beginPath();
    ctx.moveTo(cx - 10, y + height);
    ctx.lineTo(cx - 4, y + height);
    ctx.lineTo(cx - 7, y + height + flicker);
    ctx.closePath();
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(cx + 4, y + height);
    ctx.lineTo(cx + 10, y + height);
    ctx.lineTo(cx + 7, y + height + flicker);
    ctx.closePath();
    ctx.fill();

    // Lumières bout d'ailes
    ctx.fillStyle = '#ff0040';
    ctx.beginPath();
    ctx.arc(this.x + 2, y + height + 2, 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#00ff80';
    ctx.beginPath();
    ctx.arc(this.x + width - 2, y + height + 2, 2, 0, Math.PI * 2);
    ctx.fill();
  }
}
