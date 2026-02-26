// --- Music : façade publique ---
// Tous les consommateurs importent depuis ce fichier.

export {
  BEAT, LAYER_NAMES,
  setLayerVolume, getLayerVolumes,
  setVolume, muffle, unmuffle,
  peekAudioContext,
} from './audio-core.js';

// resetAudio du scheduler englobe celui du core (reset state + contexte)
export {
  TRACK_NAMES, setTrack, getTrack,
  enableAdaptiveMode, disableAdaptiveMode,
  requestNextSection, getCurrentSection, getTimeToNextSection,
  startMusic, stopMusic, fadeOutMusic, isPlaying,
  resetAudio, playSectionByName,
} from './scheduler.js';

export { playWinStinger, playGameOverStinger, playPowerUpAccent } from './stingers.js';

export { playInstrumentDemo } from './demos.js';
