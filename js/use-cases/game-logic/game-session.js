// --- Game Logic (Use Case) ---
// État pur de la session : score, vies, state, combo.
// La logique de collision est dans CollisionResolver.

import { CollisionResolver } from '../collision/collision-resolver.js';

export class GameSession {
  constructor(config) {
    this.canvasHeight = config.canvas.height;
    this.maxLives = config.lives;
    this.basePoints = config.scoring?.basePoints || { large: 40, medium: 20, small: 10 };
    this.state = 'menu'; // menu | worldMap | playing | paused | gameOver | won | stats
    this.lives = 0;
    this.score = 0;
    this.currentLevelId = null;
    this.levelStartTime = 0;
    this._resolver = new CollisionResolver({ basePoints: this.basePoints });
  }

  start(levelId) {
    if (levelId) this.currentLevelId = levelId;
    this.levelStartTime = Date.now();
    if (this.lives <= 0) this.lives = this.maxLives; // reset uniquement si zone fresh
    this.score = 0;
    this.scoreMultiplier = 1;
    this._combo = 0;
    this.state = 'playing';
  }

  goToWorldMap() {
    this.state = 'worldMap';
  }

  goToStats() {
    this.state = 'stats';
  }

  /** Temps écoulé depuis le début du niveau, en secondes. */
  get elapsedTime() {
    return this.levelStartTime ? Math.floor((Date.now() - this.levelStartTime) / 1000) : 0;
  }

  /** Met à jour le combo courant (piloté par CollisionHandler) */
  set combo(val) { this._combo = val; }
  get combo() { return this._combo; }

  pause() {
    if (this.state === 'playing') this.state = 'paused';
  }

  resume() {
    if (this.state === 'paused') this.state = 'playing';
  }

  backToMenu() {
    this.state = 'menu';
  }

  /** Perd une vie. Retourne le nombre restant. */
  loseLife() {
    this.lives = Math.max(0, this.lives - 1);
    return this.lives;
  }

  // --- Délégation vers CollisionResolver (API stable pour les consommateurs) ---

  checkShipCollision(drone, ship) {
    return this._resolver.checkShipCollision(drone, ship);
  }

  checkAsteroidCollision(drone, field) {
    return this._resolver.checkAsteroidCollision(drone, field, this);
  }

  isDroneLost(drone) {
    return this._resolver.isDroneLost(drone, this.canvasHeight);
  }

  checkCapsuleCollision(capsules, ship) {
    return this._resolver.checkCapsuleCollision(capsules, ship);
  }

  checkWin(field) {
    return this._resolver.checkWin(field, this);
  }
}
