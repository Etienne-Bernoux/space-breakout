// --- Audio Core : contexte Web Audio, master gain/filter, layers ---

let ctx = null;
let masterGain = null;
let masterFilter = null;

const BPM = 110;
const BEAT = 60 / BPM;
const FILTER_OPEN = 20000;
const FILTER_MUFFLED = 350;

// --- Layers : chaque couche a son propre GainNode ---
const LAYER_NAMES = ['drums', 'bass', 'pad', 'lead', 'high'];
const layers = {};

function getCtx() {
  if (!ctx) {
    ctx = new (window.AudioContext || window.webkitAudioContext)();
    masterGain = ctx.createGain();
    masterGain.gain.value = 0.3;
    masterFilter = ctx.createBiquadFilter();
    masterFilter.type = 'lowpass';
    masterFilter.frequency.value = FILTER_OPEN;
    masterGain.connect(masterFilter);
    masterFilter.connect(ctx.destination);
    // Créer un GainNode par layer
    for (const name of LAYER_NAMES) {
      const g = ctx.createGain();
      g.gain.value = name === 'high' ? 0 : 1.0;
      g.connect(masterGain);
      layers[name] = g;
    }
  }
  return ctx;
}

/** Fade un layer vers un volume cible (0–1) en `dur` secondes. */
function setLayerVolume(layerName, vol, dur = 0.5) {
  if (!layers[layerName] || !ctx) return;
  const g = layers[layerName].gain;
  g.cancelScheduledValues(ctx.currentTime);
  g.setValueAtTime(g.value, ctx.currentTime);
  g.linearRampToValueAtTime(vol, ctx.currentTime + dur);
}

/** Retourne les volumes actuels des layers. */
function getLayerVolumes() {
  const vols = {};
  for (const name of LAYER_NAMES) {
    vols[name] = layers[name] ? layers[name].gain.value : 1;
  }
  return vols;
}

function freq(note) {
  return 440 * Math.pow(2, (note - 69) / 12);
}

function setVolume(v) {
  if (masterGain) masterGain.gain.value = v;
}

function muffle() {
  if (!masterFilter) return;
  const c = getCtx();
  masterFilter.frequency.cancelScheduledValues(c.currentTime);
  masterFilter.frequency.setValueAtTime(masterFilter.frequency.value, c.currentTime);
  masterFilter.frequency.exponentialRampToValueAtTime(FILTER_MUFFLED, c.currentTime + 0.4);
}

function unmuffle() {
  if (!masterFilter) return;
  const c = getCtx();
  masterFilter.frequency.cancelScheduledValues(c.currentTime);
  masterFilter.frequency.setValueAtTime(masterFilter.frequency.value, c.currentTime);
  masterFilter.frequency.exponentialRampToValueAtTime(FILTER_OPEN, c.currentTime + 0.3);
}

/** Retourne le contexte audio SANS le créer (peut être null). */
function peekAudioContext() { return ctx; }

/** Reset complet : ferme le contexte audio et le recrée. Coupe tout son en cours. */
function resetAudio() {
  if (ctx) { ctx.close().catch(() => {}); }
  ctx = null;
  masterGain = null;
  masterFilter = null;
  for (const name of LAYER_NAMES) delete layers[name];
}

/** Accès interne au masterGain (pour scheduler). */
function getMasterGain() { return masterGain; }

export {
  BPM, BEAT, LAYER_NAMES,
  getCtx, freq, layers, getMasterGain,
  setLayerVolume, getLayerVolumes,
  setVolume, muffle, unmuffle,
  peekAudioContext, resetAudio,
};
