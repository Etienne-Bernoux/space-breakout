// --- MusicDirector : gère TOUS les sons et la musique du jeu ---
// Reçoit un niveau d'intensité + des événements ponctuels du GameIntensityDirector.

import {
  enableAdaptiveMode, requestNextSection, setLayerVolume,
  getCurrentSection, setBPM,
  startMusic, stopMusic, isPlaying, fadeOutMusic,
  muffle, unmuffle,
  setTrack, getTrack,
  playWinStinger, playGameOverStinger, playPowerUpAccent, playComboAccent, playComboMilestone,
} from '../music/index.js';

import {
  playBounce, playAsteroidHit, playAlienHit, playLoseLife,
  playWin, playGameOver, playShipExplosion, playBossExplosion, playLaunch, unlockAudio,
  playForgePurchase,
} from '../sfx/index.js';

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

  enable({ boss = false } = {}) {
    this.enabled = true;
    this.intensity = 0;
    unlockAudio();
    const target = boss ? 'dark' : 'main';
    if (isPlaying() && getTrack() === target) {
      // Déjà sur le bon track (ex: worldMap → level main) → transition fluide
      enableAdaptiveMode();
      setBPM(INTENSITY_BPM[0]);
      this._applyLayers();
      this.requestSectionChange();
    } else if (isPlaying()) {
      // Mauvais track → crossfade
      fadeOutMusic(0.8, () => {
        setTrack(target);
        enableAdaptiveMode();
        setBPM(INTENSITY_BPM[0]);
        this._applyLayers();
        startMusic();
      });
    } else {
      setTrack(target);
      enableAdaptiveMode();
      setBPM(INTENSITY_BPM[0]);
      this._applyLayers();
      startMusic();
    }
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

  /** Appelé chaque frame par le GID. Relance la musique si elle s'est arrêtée. */
  update() {
    if (!this.enabled) return;
    if (!isPlaying()) {
      startMusic();
      this._applyLayers();
      this.requestSectionChange();
    }
  }

  // === Événements ponctuels ===

  onBounce() { playBounce(); }

  onAsteroidHit(materialKey) {
    if (materialKey === 'tentacle' || materialKey === 'alienCore') playAlienHit();
    else playAsteroidHit();
  }

  onBossDestroyed() { playBossExplosion(); }

  onCombo(combo) {
    if (combo > 0 && combo % 5 === 0) playComboMilestone(combo);
    else playComboAccent(combo);
  }

  onPowerUp() { playPowerUpAccent(); }

  onLoseLife() { playLoseLife(); }

  onLaunch() { playLaunch(); }

  onUpgradePurchased() { unlockAudio(); playForgePurchase(); }

  onEnterWorldMap() {
    unlockAudio();
    this._crossfadeTo('main');
  }

  onEnterUpgrade() {
    unlockAudio();
    this._crossfadeTo('cantina');
  }

  onLeaveUpgrade() {
    // Délégué à onEnterWorldMap (appelé par init.js)
  }

  onPause() { muffle(); }

  onResume() { unmuffle(); }

  onWin() {
    this.disable();
    playWin();
    fadeOutMusic(0.8, () => playWinStinger());
  }

  onGameOver() {
    this.disable();
    playShipExplosion();
    playGameOver();
    fadeOutMusic(0.8, () => playGameOverStinger());
  }

  // === Interne ===

  /** Crossfade vers un track hors-gameplay (toutes couches à 1). */
  _crossfadeTo(track) {
    if (isPlaying() && getTrack() === track) return; // déjà dessus
    const start = () => {
      setTrack(track);
      enableAdaptiveMode();
      this._startAllLayers();
      startMusic();
    };
    if (isPlaying()) {
      fadeOutMusic(0.8, start);
    } else {
      start();
    }
  }

  /** Hors gameplay : toutes les couches à 1. */
  _startAllLayers() {
    for (const layer of ['drums', 'bass', 'pad', 'lead', 'high']) {
      setLayerVolume(layer, 1, 0.3);
    }
  }

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
