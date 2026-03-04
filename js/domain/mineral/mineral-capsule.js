// --- MineralCapsule : entité minerai qui tombe ---
// Même physique que Capsule (chute, bob, rotation).
// Ramassée par le vaisseau → ajoutée au wallet.

export class MineralCapsule {
  constructor(mineralKey, quantity, x, y, config = {}) {
    this.mineralKey = mineralKey;
    this.quantity = quantity;
    this.x = x;
    this.y = y;
    this.speedY = config.speedY || 1.8;   // un peu plus rapide que power-up
    this.radius = config.radius || 7;      // plus petit que power-up (10)
    this.bobSpeed = config.bobSpeed || 0.05;
    this.bobAmplitude = config.bobAmplitude || 0.3;
    this.rotationSpeed = config.rotationSpeed || 0.04;
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
