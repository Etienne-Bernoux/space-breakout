// --- GameIntensityDirector : calcule l'intensité, dispatch vers Music + Effects ---
// Point d'entrée unique pour TOUS les événements gameplay.
// Les consommateurs (collisions, input) n'appellent jamais directement audio/music.

import { MusicDirector } from './music-director.js';
import { EffectDirector } from './effect-director.js';

export class GameIntensityDirector {
  constructor() {
    this.music = new MusicDirector();
    this.effects = new EffectDirector();
    this.intensity = 0;
    this.combo = 0;
    this.remainingRatio = 1.0;
    this.powerUpActive = false;
    this.lastLife = false;
    this.enabled = false;
  }

  // === Lifecycle ===

  enable() {
    this.enabled = true;
    this.intensity = 0;
    this.combo = 0;
    this.remainingRatio = 1.0;
    this.powerUpActive = false;
    this.lastLife = false;
    this.music.enable();
    this.effects.setIntensity(0);
  }

  disable() {
    this.enabled = false;
    this.music.disable();
    this.effects.setIntensity(0);
  }

  // === Événements gameplay → dispatch vers tous les directors ===

  onBounce() {
    this.music.onBounce();
    if (!this.enabled) return;
    this.combo = 0;
    this._recalculate();
  }

  onAsteroidHit() {
    this.music.onAsteroidHit();
  }

  onAsteroidDestroyed(remaining, total, combo) {
    this.music.onAsteroidHit();
    if (!this.enabled) return;
    this.combo++;
    if (combo >= 2) this.music.onCombo(combo);
    this.remainingRatio = total > 0 ? remaining / total : 0;
    this._recalculate();
  }

  onComboReset() {
    if (!this.enabled) return;
    this.combo = 0;
    this._recalculate();
  }

  onPowerUpActivated() {
    this.music.onPowerUp();
    if (!this.enabled) return;
    this.powerUpActive = true;
    this._recalculate();
  }

  onPowerUpExpired() {
    if (!this.enabled) return;
    this.powerUpActive = false;
    this._recalculate();
  }

  onLifeChanged(lives) {
    this.music.onLoseLife();
    if (!this.enabled) return;
    this.combo = 0;
    this.lastLife = lives <= 1;
    this._recalculate();
  }

  onLaunch() { this.music.onLaunch(); }

  onPause() { this.music.onPause(); }

  onResume() { this.music.onResume(); }

  onWin() { this.music.onWin(); }

  onGameOver() { this.music.onGameOver(); }

  // === Frame update ===

  update() { this.effects.update(); }

  getEffects() { return this.effects.getEffects(); }

  // === Calcul interne ===

  _recalculate() {
    const prev = this.intensity;
    let level = 0;

    if (this.remainingRatio <= 0.10) level = 4;
    else if (this.remainingRatio <= 0.30) level = 3;
    else if (this.remainingRatio <= 0.50) level = 2;
    else if (this.remainingRatio <= 0.80) level = 1;

    if (this.combo >= 6) level = Math.min(4, level + 2);
    else if (this.combo >= 3) level = Math.min(4, level + 1);

    if (this.powerUpActive) level = Math.min(4, Math.max(level, 2));
    if (this.lastLife) level = Math.min(4, Math.max(level, 3));

    this.intensity = Math.min(4, Math.max(0, level));

    this.music.setIntensity(this.intensity);
    this.effects.setIntensity(this.intensity);

    if (this.intensity !== prev) {
      this.music.requestSectionChange();
    }
  }
}
