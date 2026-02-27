export class Drone {
  /**
   * @param {object} config - { radius, speed, color }
   * @param {object} ship
   */
  constructor(config, ship, isMobile = false, canvasWidth = 800) {
    this._baseRadius = (isMobile && config.mobileRadiusRatio)
      ? Math.max(config.radius, Math.round(canvasWidth * config.mobileRadiusRatio))
      : config.radius;
    this._baseSpeed = config.speed;
    this.radius = this._baseRadius;
    this.speed = this._baseSpeed;
    this.color = config.color;
    this.piercing = false;
    this.sticky = false;
    this.warp = false;
    this.reset(ship);
  }

  reset(ship) {
    this.radius = this._baseRadius;
    this.speed = this._baseSpeed;
    this.piercing = false;
    this.sticky = false;
    this.warp = false;
    this._stickyOffset = undefined;
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

    // Murs latéraux : warp (traverse) ou rebond
    if (this.warp) {
      if (this.x + this.radius < 0) this.x = canvasWidth + this.radius;
      else if (this.x - this.radius > canvasWidth) this.x = -this.radius;
    } else {
      if (this.x - this.radius <= 0) {
        this.x = this.radius;
        this.dx = Math.abs(this.dx);
      } else if (this.x + this.radius >= canvasWidth) {
        this.x = canvasWidth - this.radius;
        this.dx = -Math.abs(this.dx);
      }
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
