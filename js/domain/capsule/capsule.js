// --- Capsule : entité power-up qui tombe ---
// Pure data + mouvement. Rendu dans infra/power-up-render.js.

export class Capsule {
  constructor(powerUpId, x, y, config = {}) {
    this.powerUpId = powerUpId;
    this.x = x;
    this.y = y;
    this.speedY = config.speedY || 1.5;
    this.radius = config.radius || 10;
    this.bobSpeed = config.bobSpeed || 0.06;
    this.bobAmplitude = config.bobAmplitude || 0.4;
    this.rotationSpeed = config.rotationSpeed || 0.03;
    this.alive = true;
    this.rotation = 0;
    this.bobPhase = Math.random() * Math.PI * 2;
  }

  update(canvasHeight, dt = 1) {
    if (!this.alive) return;
    this.y += this.speedY * dt;
    this.bobPhase += this.bobSpeed * dt;
    this.x += Math.sin(this.bobPhase) * this.bobAmplitude;
    this.rotation += this.rotationSpeed * dt;

    if (this.y - this.radius > canvasHeight) {
      this.alive = false;
    }
  }
}
