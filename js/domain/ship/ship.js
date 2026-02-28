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
    this.movingLeft = false;
    this.movingRight = false;
    this.canvasWidth = canvasWidth;
    this.vx = 0; // vélocité horizontale (pour le rendu des flammes)
    this.visible = true;
  }

  update(touchX, dt = 1) {
    const prevX = this.x;
    if (touchX !== null && touchX !== undefined) {
      // Tactile : le vaisseau suit le doigt (lerp indépendant du framerate)
      const target = touchX - this.width / 2;
      const diff = target - this.x;
      this.x += diff * (1 - Math.pow(1 - 0.3, dt));
    } else {
      if (this.movingLeft) this.x -= this.speed * dt;
      if (this.movingRight) this.x += this.speed * dt;
    }
    this.x = Math.max(0, Math.min(this.canvasWidth - this.width, this.x));
    this.vx = this.x - prevX;
  }
}
