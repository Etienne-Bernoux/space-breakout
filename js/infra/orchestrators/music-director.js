// --- MusicDirector : gère TOUS les sons et la musique du jeu ---
// Reçoit un niveau d'intensité + des événements ponctuels du GameIntensityDirector.

import {
  enableAdaptiveMode, requestNextSection, setLayerVolume,
  getCurrentSection, setBPM,
  startMusic, isPlaying, fadeOutMusic,
  muffle, unmuffle,
  playWinStinger, playGameOverStinger, playPowerUpAccent, playComboAccent, playComboMilestone,
} from '../music/index.js';

import {
  playBounce, playAsteroidHit, playLoseLife,
  playWin, playGameOver, playLaunch, unlockAudio,
} from '../audio.js';

// BPM par niveau d'intensité : calm→climax
const INTENSITY_BPM = [110, 114, 118, 122, 128];

const INTENSITY_LAYERS = [
  { drums: 0, bass: 0, pad: 1, lead: 0, high: 0 },  // 0 calm
  { drums: 0, bass: 1, pad: 1, lead: 0, high: 0 },  // 1 cruise
  { drums: 1, bass: 1, pad: 1, lead: 0, high: 0 },  // 2 action
  { drums: 1, bass: 1, pad: 1, lead: 1, high: 0 },  // 3 intense
  { drums: 1, bass: 1, pad: 1, lead: 1, high: 1 },  // 4 climax
];

const INTENSITY_SECTIONS = [
  ['intro', 'verse'],          // 0 calm
  ['verse'],                   // 1 cruise
  ['chorus'],                  // 2 action
  ['bridge', 'breakdown'],     // 3 intense
  ['climax'],                  // 4 climax
];

export class MusicDirector {
  constructor() {
    this.intensity = 0;
    this.enabled = false;
  }

  // === Lifecycle ===

  enable() {
    this.enabled = true;
    this.intensity = 0;
    unlockAudio();
    enableAdaptiveMode();
    this._applyLayers();
    this._ensureMusic();
  }

  disable() {
    this.enabled = false;
  }

  /** Appelé par le GameIntensityDirector. */
  setIntensity(level) {
    if (!this.enabled) return;
    this.intensity = level;
    this._applyLayers();
    setBPM(INTENSITY_BPM[level]);
  }

  /** Demande un changement de section musicale. */
  requestSectionChange() {
    if (!this.enabled) return;
    const candidates = INTENSITY_SECTIONS[this.intensity];
    const current = getCurrentSection();
    const filtered = candidates.filter(s => s !== current);
    const pick = filtered.length > 0 ? filtered : candidates;
    requestNextSection(pick[Math.floor(Math.random() * pick.length)]);
  }

  // === Événements ponctuels ===

  onBounce() { playBounce(); }

  onAsteroidHit() { playAsteroidHit(); }

  onCombo(combo) {
    if (combo > 0 && combo % 5 === 0) playComboMilestone(combo);
    else playComboAccent(combo);
  }

  onPowerUp() { playPowerUpAccent(); }

  onLoseLife() { playLoseLife(); }

  onLaunch() { playLaunch(); }

  onPause() { muffle(); }

  onResume() { unmuffle(); }

  onWin() {
    this.disable();
    playWin();
    fadeOutMusic(0.8, () => playWinStinger());
  }

  onGameOver() {
    this.disable();
    playGameOver();
    fadeOutMusic(0.8, () => playGameOverStinger());
  }

  // === Interne ===

  _applyLayers() {
    const config = INTENSITY_LAYERS[this.intensity];
    for (const [layer, vol] of Object.entries(config)) {
      setLayerVolume(layer, vol, 0.8);
    }
  }

  _ensureMusic() {
    if (!isPlaying()) startMusic();
  }
}
