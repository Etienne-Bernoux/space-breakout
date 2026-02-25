// --- Capsule : entité power-up qui tombe ---
// Pure data + mouvement. Rendu dans infra/power-up-render.js.

export class Capsule {
  constructor(powerUpId, x, y, config = {}) {
    this.powerUpId = powerUpId;
    this.x = x;
    this.y = y;
    this.speedY = config.speedY || 1.5;
    this.radius = config.radius || 10;
    this.alive = true;
    this.rotation = 0;
    this.bobPhase = Math.random() * Math.PI * 2;
  }

  update(canvasHeight) {
    if (!this.alive) return;
    this.y += this.speedY;
    this.bobPhase += 0.06;
    this.x += Math.sin(this.bobPhase) * 0.4;
    this.rotation += 0.03;

    if (this.y - this.radius > canvasHeight) {
      this.alive = false;
    }
  }
}
