// --- GameIntensityDirector : calcule l'intensité, dispatch vers Music + Effects ---

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

  // === Événements gameplay ===

  onAsteroidDestroyed(remaining, total) {
    if (!this.enabled) return;
    this.combo++;
    this.remainingRatio = total > 0 ? remaining / total : 0;
    this._recalculate();
  }

  onComboReset() {
    if (!this.enabled) return;
    this.combo = 0;
    this._recalculate();
  }

  onPowerUpActivated() {
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
    if (!this.enabled) return;
    this.lastLife = lives <= 1;
    this._recalculate();
  }

  /** Appelé chaque frame pour le lerp des effets visuels. */
  update() {
    this.effects.update();
  }

  /** Raccourci pour récupérer les effets visuels courants. */
  getEffects() {
    return this.effects.getEffects();
  }

  // === Calcul interne (extrait de l'ancien MusicDirector) ===

  _recalculate() {
    const prev = this.intensity;
    let level = 0;

    // Ratio-based
    if (this.remainingRatio <= 0.10) level = 4;
    else if (this.remainingRatio <= 0.30) level = 3;
    else if (this.remainingRatio <= 0.50) level = 2;
    else if (this.remainingRatio <= 0.80) level = 1;

    // Combo boost
    if (this.combo >= 6) level = Math.min(4, level + 2);
    else if (this.combo >= 3) level = Math.min(4, level + 1);

    // Power-up boost
    if (this.powerUpActive) level = Math.min(4, Math.max(level, 2));

    // Last life — tension max
    if (this.lastLife) level = Math.min(4, Math.max(level, 3));

    this.intensity = Math.min(4, Math.max(0, level));

    // Dispatch vers les sous-directors
    this.music.setIntensity(this.intensity);
    this.effects.setIntensity(this.intensity);

    // Changement de section musicale si l'intensité a bougé
    if (this.intensity !== prev) {
      this.music.requestSectionChange();
    }
  }
}
