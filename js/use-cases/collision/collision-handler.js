import { Capsule } from '../../domain/capsule/capsule.js';
import { getPowerUp } from '../../domain/power-ups.js';

const COMBO_FADE_DURATION = 90;
const SLOW_MO_DURATION = 30;

export class CollisionHandler {
  /**
   * @param {object} deps
   * @param {object} deps.entities  - { ship, drones, field, capsules, totalAsteroids }
   * @param {object} deps.session   - GameSession
   * @param {object} deps.systems   - { drop, powerUp, intensity }
   * @param {object} deps.ui        - { combo, comboDisplay, comboFadeTimer, slowMoTimer }
   * @param {object} deps.config    - { screenshake, capsule }
   * @param {object} deps.effects   - { spawnExplosion, triggerShake }
   * @param {function} deps.getGameState - () => { ship, drones, session, field }
   */
  constructor({ entities, session, systems, ui, config, effects, getGameState }) {
    this.entities = entities;
    this.session = session;
    this.systems = systems;
    this.getGameState = getGameState;
    this.ui = ui;
    this.config = config;
    this.effects = effects;
  }

  /** Appelé à chaque frame de jeu */
  update() {
    this.#handleDroneCollisions();
    this.#handleCapsulePickup();
    this.#handlePowerUpExpiry();
    this.#handleLostDrones();
    this.#handleWinCondition();
  }

  #handleDroneCollisions() {
    const { ship, field, totalAsteroids } = this.entities;
    const { intensity, drop } = this.systems;

    for (const drone of this.entities.drones) {
      if (!drone.launched) continue;

      const ev1 = this.session.checkShipCollision(drone, ship);
      if (ev1) {
        this.ui.combo = 0;
        this.session.combo = 0;
        intensity.onBounce();
      }

      const ev2 = this.session.checkAsteroidCollision(drone, field);
      if (ev2) {
        this.effects.spawnExplosion(ev2.x, ev2.y, ev2.color);
        intensity.onAsteroidHit();
        if (ev2.type === 'asteroidHit' || ev2.type === 'asteroidFragment') {
          this.#onAsteroidDestroyed(ev2, field, totalAsteroids, drop);
        }
      }
    }
  }

  #onAsteroidDestroyed(ev, field, totalAsteroids, drop) {
    this.ui.combo++;
    this.session.combo = this.ui.combo;
    if (this.ui.combo >= 2) {
      this.ui.comboDisplay = this.ui.combo;
      this.ui.comboFadeTimer = COMBO_FADE_DURATION;
    }
    const shakeAmount = this.config.screenshake.intensity[ev.sizeName]
      || this.config.screenshake.intensity.small;
    this.effects.triggerShake(shakeAmount);

    const puId = drop.decideDrop({
      materialKey: ev.materialKey || 'rock',
      sizeName: ev.sizeName || 'small',
    });
    if (puId) {
      this.entities.capsules.push(new Capsule(puId, ev.x, ev.y, this.config.capsule));
    }

    this.systems.intensity.onAsteroidDestroyed(field.remaining, totalAsteroids, this.ui.combo);
    if (field.remaining === 0) {
      this.ui.slowMoTimer = SLOW_MO_DURATION;
    }
  }

  #handleCapsulePickup() {
    const gs = this.getGameState();
    const capEvts = this.session.checkCapsuleCollision(this.entities.capsules, this.entities.ship);
    for (const ce of capEvts) {
      this.systems.powerUp.activate(ce.powerUpId, gs);
      this.systems.intensity.onPowerUpActivated();
      this.effects.spawnExplosion(ce.x, ce.y, getPowerUp(ce.powerUpId)?.color || '#fff');
    }
  }

  #handlePowerUpExpiry() {
    const gs = this.getGameState();
    const puCountBefore = this.systems.powerUp.getActive().length;
    this.systems.powerUp.update(gs);
    if (puCountBefore > 0 && this.systems.powerUp.getActive().length === 0) {
      this.systems.intensity.onPowerUpExpired();
    }
  }

  #handleLostDrones() {
    const { ship } = this.entities;
    const drones = this.entities.drones;

    for (let i = drones.length - 1; i >= 0; i--) {
      if (!this.session.isDroneLost(drones[i])) continue;

      if (drones.length > 1) {
        drones.splice(i, 1);
      } else {
        const livesLeft = this.session.loseLife();
        this.ui.combo = 0;
        this.session.combo = 0;
        if (livesLeft <= 0) {
          this.session.state = 'gameOver';
          this.systems.intensity.onGameOver();
        } else {
          drones[0].reset(ship);
          this.systems.powerUp.clearDroneEffects();
          this.systems.intensity.onLifeChanged(livesLeft);
        }
      }
    }
  }

  #handleWinCondition() {
    if (this.ui.slowMoTimer <= 0) {
      const ev = this.session.checkWin(this.entities.field);
      if (ev) this.systems.intensity.onWin();
    }
  }
}
