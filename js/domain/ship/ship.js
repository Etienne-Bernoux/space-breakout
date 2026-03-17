export class Ship {
  /**
   * @param {object} config - { width, height, speed, color }
   * @param {number} canvasWidth
   * @param {number} canvasHeight
   */
  constructor(config, canvasWidth, canvasHeight, isMobile = false) {
    this.width = isMobile && config.mobileWidthRatio
      ? Math.round(canvasWidth * config.mobileWidthRatio)
      : config.width;
    this.height = isMobile && config.mobileWidthRatio
      ? Math.round(this.width * (config.height / config.width))
      : config.height;
    this.speed = config.speed;
    this.color = config.color;
    this.isMobile = isMobile;
    this._mobileRatio = config.bottomMarginMobileRatio || 0.08;
    this._desktopMargin = config.bottomMargin || 10;
    this.bottomMargin = isMobile
      ? Math.max(60, Math.round(canvasHeight * this._mobileRatio))
      : this._desktopMargin;
    this.x = (canvasWidth - this.width) / 2;
    this.y = canvasHeight - this.height - this.bottomMargin;
    this.baseY = this.y;
    this.advanceTimer = 0;
    this.advanceDelay = 0; // calculé au premier appel de advanceY
    this.advanceConfig = config.advance || null;
    this.movingLeft = false;
    this.movingRight = false;
    this.canvasWidth = canvasWidth;
    this.vx = 0; // vélocité horizontale (pour le rendu des flammes)
    this.visible = true;
    this.stunTimer = 0; // immobilisation (frames, décrémenté par dt)
  }

  /** Applique un stun (immobilisation). durée en frames (~150 ≈ 2.5s à 60fps). */
  stun(duration = 150) {
    this.stunTimer = duration;
  }

  update(pointerX, dt = 1) {
    if (this.stunTimer > 0) {
      this.stunTimer -= dt;
      this.vx = 0;
      return;
    }
    const prevX = this.x;
    if (pointerX !== null && pointerX !== undefined) {
      // Le vaisseau suit le pointeur — touch ou souris (lerp modulé par speed)
      const target = pointerX - this.width / 2;
      const diff = target - this.x;
      const lerpBase = Math.min(0.6, this.speed / 7 * 0.3);
      let move = diff * (1 - Math.pow(1 - lerpBase, dt));
      // Clamp à la vitesse max (même contrainte qu'au clavier)
      const maxMove = this.speed * dt;
      if (Math.abs(move) > maxMove) move = Math.sign(move) * maxMove;
      this.x += move;
    } else {
      if (this.movingLeft) this.x -= this.speed * dt;
      if (this.movingRight) this.x += this.speed * dt;
    }
    this.x = Math.max(0, Math.min(this.canvasWidth - this.width, this.x));
    this.vx = this.x - prevX;
  }

  /**
   * Avance le vaisseau vers le haut.
   * @param {number} dt - delta time (1 = 1 frame à 60fps)
   * @param {number} remainingRatio - remaining / totalAsteroids (1→0)
   * @param {number} totalAsteroids - nombre total d'astéroïdes (pour calcul délai)
   */
  advanceY(dt, remainingRatio, totalAsteroids) {
    const cfg = this.advanceConfig;
    if (!cfg) return;

    // Calcul du délai initial au premier appel
    if (!this.advanceDelay && totalAsteroids > 0) {
      const t = Math.min(totalAsteroids / cfg.maxAsteroidsRef, 1);
      this.advanceDelay = cfg.minDelay + (cfg.maxDelay - cfg.minDelay) * t;
    }

    this.advanceTimer += dt;
    const elapsed = this.advanceTimer / 60; // secondes
    if (elapsed < this.advanceDelay) return;

    const sinceDel = elapsed - this.advanceDelay;
    const speed = cfg.baseSpeed
      * (1 + cfg.timeFactor * sinceDel)
      * (1 + cfg.remainingFactor * (1 - remainingRatio));
    this.y -= speed * dt;
    if (this.y < cfg.minY) this.y = cfg.minY;
  }

  /** Reset le vaisseau en bas (après perte de vie). */
  resetToBase() {
    this.y = this.baseY;
    this.advanceTimer = 0;
    this.advanceDelay = 0;
  }
}
