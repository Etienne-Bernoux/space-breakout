import { PropModifier } from '../../shared/prop-modifier.js';

export class Drone {
  /**
   * @param {object} config - { radius, speed, color }
   * @param {object} ship
   */
  constructor(config, ship, isMobile = false, canvasWidth = 800, canvasHeight = 600) {
    this._baseRadius = (isMobile && config.mobileRadiusRatio)
      ? Math.max(config.radius, Math.round(canvasWidth * config.mobileRadiusRatio))
      : config.radius;
    this._baseSpeed = (isMobile && config.mobileSpeedRatio)
      ? Math.max(config.speed, canvasHeight * config.mobileSpeedRatio)
      : config.speed;
    this.radiusMod = new PropModifier(this._baseRadius);
    this.speedMod = new PropModifier(this._baseSpeed);
    this.color = config.color;
    this.speedBoost = 1;   // upgrade factor (>1 = smart boost: fast up, normal down)
    this.piercing = false;
    this.sticky = false;
    this.warp = false;
    this.fireball = false;
    this.reset(ship);
  }

  get radius() { return this.radiusMod ? this.radiusMod.current : this._baseRadius; }
  set radius(v) { if (this.radiusMod) this.radiusMod.base = v; else this._baseRadius = v; }

  get speed() { return this.speedMod ? this.speedMod.currentRaw : this._baseSpeed; }
  set speed(v) { if (this.speedMod) this.speedMod.base = v; else this._baseSpeed = v; }

  reset(ship) {
    if (this.radiusMod) this.radiusMod.clear();
    if (this.speedMod) this.speedMod.clear();
    this.piercing = false;
    this.sticky = false;
    this.warp = false;
    this.fireball = false;
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
    // Sticky : utiliser l'offset stocké (évite le décalage si ship a bougé ce frame)
    const offset = (this.sticky && this._stickyOffset !== undefined)
      ? this._stickyOffset
      : this.x - ship.x;
    const hit = offset / ship.width;   // 0..1
    const angle = (hit - 0.5) * 2;
    this.launchAtAngle(ship, angle);
  }

  /** Lance avec un angle explicite (-1..1). 0 = tout droit. */
  launchAtAngle(ship, angle) {
    this.launched = true;
    this.dx = this.speed * angle;
    this.dy = -this.speed;
  }

  update(ship, canvasWidth, dt = 1) {
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

    this.x += this.dx * dt;
    this.y += this.dy * dt;

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
      // Si dx === 0 (lancement tout droit), direction aléatoire
      const sign = this.dx === 0 ? (Math.random() < 0.5 ? -1 : 1) : Math.sign(this.dx);
      this.dx = sign * minDx;
    }

    // Smart speed boost: rapide partout, ralentit progressivement en zone de retour
    if (this.speedBoost > 1) {
      const inReturnZone = this.dy > 0 && this.y > ship.y * 0.7;
      const targetSpeed = inReturnZone
        ? this._baseSpeed / this.speedBoost         // zone retour → vitesse originale
        : this._baseSpeed;                           // ailleurs → vitesse boostée
      const currentSpeed = Math.hypot(this.dx, this.dy);
      if (currentSpeed > 0) {
        const lerpRate = 0.08 * dt;    // transition progressive (~12 frames pour converger)
        const lerpedSpeed = currentSpeed + (targetSpeed - currentSpeed) * lerpRate;
        const scale = lerpedSpeed / currentSpeed;
        this.dx *= scale;
        this.dy *= scale;
      }
    }
  }

}
