// --- GameIntensityDirector : calcule l'intensité, dispatch vers Music + Effects ---
// Point d'entrée unique pour TOUS les événements gameplay.
// Les consommateurs (collisions, input) n'appellent jamais directement audio/music.
//
// Ports attendus (DI) :
//   music  : { enable, disable, onBounce, onAsteroidHit, onBossDestroyed, onCombo,
//              onPowerUp, onLoseLife, onLaunch, onPause, onResume, onWin, onGameOver,
//              onUpgradePurchased, onEnterUpgrade, onLeaveUpgrade, onEnterWorldMap,
//              setIntensity, requestSectionChange }
//   effects: { setIntensity, update, getEffects }

const COMBO_DECAY_INTERVAL = 3000; // ms entre chaque -1 combo

const NOOP_MUSIC = {
  enable() { /* accepts { boss } */ }, disable() {}, update() {}, onBounce() {},
  onAsteroidHit() {}, onBossDestroyed() {}, onCombo() {},
  onPowerUp() {}, onLoseLife() {}, onLaunch() {}, onPause() {}, onResume() {},
  onWin() {}, onGameOver() {}, onUpgradePurchased() {},
  onEnterUpgrade() {}, onLeaveUpgrade() {}, onEnterWorldMap() {},
  setIntensity() {}, requestSectionChange() {},
};
const NOOP_EFFECTS = {
  setIntensity() {}, update() {}, getEffects() { return {}; },
};

export class GameIntensityDirector {
  /**
   * @param {object} deps
   * @param {object} deps.music   - implémente le port music (voir commentaire)
   * @param {object} deps.effects - implémente le port effects
   */
  constructor({ music, effects } = {}) {
    this.music = music || NOOP_MUSIC;
    this.effects = effects || NOOP_EFFECTS;
    this.intensity = 0;
    this.combo = 0;
    this.remainingRatio = 1.0;
    this.powerUpActive = false;
    this.lastLife = false;
    this.enabled = false;
    this._lastEventTime = 0; // timestamp du dernier événement
    this._lastDecayTime = 0; // timestamp du dernier decay
  }

  // === Lifecycle ===

  enable({ boss = false } = {}) {
    this.enabled = true;
    this.intensity = 0;
    this.combo = 0;
    this.remainingRatio = 1.0;
    this.powerUpActive = false;
    this.lastLife = false;
    this._lastEventTime = Date.now();
    this._lastDecayTime = 0;
    this.music.enable({ boss });
    this.effects.setIntensity(0);
  }

  /** Marque un événement → reset le timer de decay */
  _touch() { this._lastEventTime = Date.now(); }

  disable() {
    this.enabled = false;
    this.music.disable();
    this.effects.setIntensity(0);
  }

  // === Événements gameplay → dispatch vers tous les directors ===

  onBounce() {
    this.music.onBounce();
    if (!this.enabled) return;
    this._touch();
    this.combo = 0;
    this._recalculate();
  }

  onAsteroidHit(materialKey) {
    this.music.onAsteroidHit(materialKey);
  }

  onBossDestroyed() {
    this.music.onBossDestroyed();
  }

  onAsteroidDestroyed(remaining, total, combo, materialKey) {
    this.music.onAsteroidHit(materialKey);
    if (!this.enabled) return;
    this._touch();
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
    this._touch();
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

  /** Achat upgrade (hors gameplay — pas de recalcul d'intensité) */
  onUpgradePurchased() { this.music.onUpgradePurchased(); }

  /** Entrée/sortie écran atelier (musique cantina) */
  onEnterUpgrade() { this.music.onEnterUpgrade(); }
  onLeaveUpgrade() { this.music.onLeaveUpgrade(); }

  /** Arrivée sur la carte du monde (main theme, toutes couches) */
  onEnterWorldMap() { this.music.onEnterWorldMap(); }

  // === Frame update ===

  update(now = Date.now()) {
    this.music.update();
    this.effects.update();
    if (!this.enabled || this.combo <= 0) return;
    // Combo decay : -1 toutes les COMBO_DECAY_INTERVAL ms sans événement
    if (now - this._lastEventTime >= COMBO_DECAY_INTERVAL
        && now - this._lastDecayTime >= COMBO_DECAY_INTERVAL) {
      this.combo = Math.max(0, this.combo - 1);
      this._lastDecayTime = now;
      this._recalculate();
    }
  }

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
