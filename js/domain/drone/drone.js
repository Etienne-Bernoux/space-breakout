export class Drone {
  /**
   * @param {object} config - { radius, speed, color }
   * @param {object} ship
   */
  constructor(config, ship, isMobile = false, canvasWidth = 800) {
    this.radius = (isMobile && config.mobileRadiusRatio)
      ? Math.max(config.radius, Math.round(canvasWidth * config.mobileRadiusRatio))
      : config.radius;
    this.speed = config.speed;
    this.color = config.color;
    this.piercing = false;
    this.sticky = false;
    this.reset(ship);
  }

  reset(ship) {
    this.x = ship.x + ship.width / 2;
    this.y = ship.y - this.radius;
    this.dx = 0;
    this.dy = -this.speed;
    this.launched = false;
  }

  /** Lance la balle depuis le vaisseau. Angle basé sur la position relative.
   *  Centre → tout droit, bords → angle max (~60°) */
  launch(ship) {
    const hit = (this.x - ship.x) / ship.width;   // 0..1
    this.launchAtAngle(ship, (hit - 0.5) * 2);
  }

  /** Lance avec un angle explicite (-1..1). 0 = tout droit. */
  launchAtAngle(ship, angle) {
    this.launched = true;
    this.dx = this.speed * angle;
    this.dy = -this.speed;
  }

  update(ship, canvasWidth) {
    if (!this.launched) {
      if (this.sticky && this._stickyOffset !== undefined) {
        // Sticky : garder l'offset relatif au vaisseau
        this.x = ship.x + this._stickyOffset;
      } else {
        this.x = ship.x + ship.width / 2;
      }
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

}
