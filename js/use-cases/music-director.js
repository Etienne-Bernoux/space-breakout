// --- MusicDirector : pilote la musique en fonction du gameplay ---
// Reçoit des événements, calcule un niveau d'intensité, contrôle sections + layers.

import {
  enableAdaptiveMode, requestNextSection, setLayerVolume,
  getCurrentSection, getTimeToNextSection,
} from '../infra/music/index.js';

// === Niveaux d'intensité ===
// 0 = calm    (début, >80% restants)  → pad seul, section intro/verse
// 1 = cruise  (50-80% restants)       → +bass, section verse
// 2 = action  (combo≥3 ou 30-50%)     → +drums, section chorus
// 3 = intense (combo≥5 ou <30% ou PU) → +lead, section bridge/breakdown
// 4 = climax  (<10% restants)         → tout, section climax

const INTENSITY_LAYERS = [
  { drums: 0,   bass: 0,   pad: 1,   lead: 0,   high: 0 },  // 0 calm
  { drums: 0,   bass: 1,   pad: 1,   lead: 0,   high: 0 },  // 1 cruise
  { drums: 1,   bass: 1,   pad: 1,   lead: 0,   high: 0 },  // 2 action
  { drums: 1,   bass: 1,   pad: 1,   lead: 1,   high: 0 },  // 3 intense
  { drums: 1,   bass: 1,   pad: 1,   lead: 1,   high: 1 },  // 4 climax
];

const INTENSITY_SECTIONS = [
  ['intro', 'verse'],               // 0 calm
  ['verse'],                        // 1 cruise
  ['chorus'],                       // 2 action
  ['bridge', 'breakdown'],          // 3 intense
  ['climax'],                       // 4 climax
];

export class MusicDirector {
  constructor() {
    this.intensity = 0;
    this.combo = 0;
    this.remainingRatio = 1.0; // % astéroïdes restants
    this.powerUpActive = false;
    this.lastLife = false;
    this.enabled = false;
  }

  /** Activer le mode adaptatif. Appelé au startGame. */
  enable() {
    this.enabled = true;
    this.intensity = 0;
    this.combo = 0;
    this.remainingRatio = 1.0;
    this.powerUpActive = false;
    this.lastLife = false;
    enableAdaptiveMode();
    this._applyLayers();
  }

  /** Désactiver (retour au menu). */
  disable() {
    this.enabled = false;
  }

  // === Événements gameplay ===

  /** Astéroïde détruit — met à jour combo et ratio. */
  onAsteroidDestroyed(remaining, total) {
    if (!this.enabled) return;
    this.combo++;
    this.remainingRatio = total > 0 ? remaining / total : 0;
    this._recalculate();
  }

  /** Combo cassé (rebond vaisseau ou perte de vie). */
  onComboReset() {
    if (!this.enabled) return;
    this.combo = 0;
    this._recalculate();
  }

  /** Power-up activé. */
  onPowerUpActivated() {
    if (!this.enabled) return;
    this.powerUpActive = true;
    this._recalculate();
  }

  /** Plus aucun power-up actif. */
  onPowerUpExpired() {
    if (!this.enabled) return;
    this.powerUpActive = false;
    this._recalculate();
  }

  /** Perte de vie — si dernière vie, boost intensité. */
  onLifeChanged(lives) {
    if (!this.enabled) return;
    this.lastLife = lives <= 1;
    this._recalculate();
  }

  /** Mise à jour du ratio restant (appelé chaque frame ou à chaque destruction). */
  updateRemaining(remaining, total) {
    if (!this.enabled) return;
    this.remainingRatio = total > 0 ? remaining / total : 0;
    this._recalculate();
  }

  // === Calcul interne ===

  _recalculate() {
    const prev = this.intensity;
    let level = 0;

    // Ratio-based
    if (this.remainingRatio <= 0.10) level = 4;
    else if (this.remainingRatio <= 0.30) level = 3;
    else if (this.remainingRatio <= 0.50) level = 2;
    else if (this.remainingRatio <= 0.80) level = 1;

    // Combo boost (+1 si combo ≥3, +2 si combo ≥6)
    if (this.combo >= 6) level = Math.max(level, Math.min(4, level + 2));
    else if (this.combo >= 3) level = Math.max(level, Math.min(4, level + 1));

    // Power-up boost
    if (this.powerUpActive) level = Math.min(4, Math.max(level, 2));

    // Last life boost — tension max
    if (this.lastLife) level = Math.min(4, Math.max(level, 3));

    // Clamp
    this.intensity = Math.min(4, Math.max(0, level));

    // Appliquer les changements
    this._applyLayers();

    // Demander un changement de section si l'intensité a changé significativement
    if (this.intensity !== prev) {
      this._requestSection();
    }
  }

  _applyLayers() {
    const config = INTENSITY_LAYERS[this.intensity];
    for (const [layer, vol] of Object.entries(config)) {
      setLayerVolume(layer, vol, 0.8);
    }
  }

  _requestSection() {
    const candidates = INTENSITY_SECTIONS[this.intensity];
    // Éviter de re-demander la section en cours
    const current = getCurrentSection();
    const filtered = candidates.filter(s => s !== current);
    const pick = filtered.length > 0 ? filtered : candidates;
    const section = pick[Math.floor(Math.random() * pick.length)];
    requestNextSection(section);
  }
}
