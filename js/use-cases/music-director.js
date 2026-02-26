// --- MusicDirector : pilote la musique en fonction de l'intensité ---
// Reçoit un niveau d'intensité du GameIntensityDirector, contrôle sections + layers + BPM.

import {
  enableAdaptiveMode, requestNextSection, setLayerVolume,
  getCurrentSection, setBPM,
} from '../infra/music/index.js';

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

  enable() {
    this.enabled = true;
    this.intensity = 0;
    enableAdaptiveMode();
    this._applyLayers();
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

  _applyLayers() {
    const config = INTENSITY_LAYERS[this.intensity];
    for (const [layer, vol] of Object.entries(config)) {
      setLayerVolume(layer, vol, 0.8);
    }
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
}
