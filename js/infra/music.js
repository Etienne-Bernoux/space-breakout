let ctx = null;
let masterGain = null;
let masterFilter = null;
let playing = false;
let loopTimer = null;

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
export function setLayerVolume(layerName, vol, dur = 0.5) {
  if (!layers[layerName] || !ctx) return;
  const g = layers[layerName].gain;
  g.cancelScheduledValues(ctx.currentTime);
  g.setValueAtTime(g.value, ctx.currentTime);
  g.linearRampToValueAtTime(vol, ctx.currentTime + dur);
}

/** Retourne les volumes actuels des layers. */
export function getLayerVolumes() {
  const vols = {};
  for (const name of LAYER_NAMES) {
    vols[name] = layers[name] ? layers[name].gain.value : 1;
  }
  return vols;
}

export { LAYER_NAMES };

function freq(note) {
  return 440 * Math.pow(2, (note - 69) / 12);
}

// =============================================
// === INSTRUMENTS (piste Main — Space Synth) ===
// =============================================

function kick(time) {
  const c = getCtx();
  const osc = c.createOscillator();
  const gain = c.createGain();
  osc.frequency.setValueAtTime(120, time);
  osc.frequency.exponentialRampToValueAtTime(25, time + 0.15);
  gain.gain.setValueAtTime(0.6, time);
  gain.gain.exponentialRampToValueAtTime(0.001, time + 0.3);
  osc.connect(gain);
  gain.connect(layers.drums || masterGain);
  osc.start(time);
  osc.stop(time + 0.3);
}

function snare(time) {
  const c = getCtx();
  const bufLen = c.sampleRate * 0.1;
  const buf = c.createBuffer(1, bufLen, c.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < bufLen; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / bufLen);
  const src = c.createBufferSource();
  src.buffer = buf;
  const bp = c.createBiquadFilter();
  bp.type = 'bandpass';
  bp.frequency.value = 3000;
  const gain = c.createGain();
  gain.gain.setValueAtTime(0.2, time);
  gain.gain.exponentialRampToValueAtTime(0.001, time + 0.1);
  src.connect(bp);
  bp.connect(gain);
  gain.connect(layers.drums || masterGain);
  src.start(time);
}

function hihat(time, vol = 0.08) {
  const c = getCtx();
  const bufLen = c.sampleRate * 0.04;
  const buf = c.createBuffer(1, bufLen, c.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < bufLen; i++) data[i] = Math.random() * 2 - 1;
  const src = c.createBufferSource();
  src.buffer = buf;
  const hp = c.createBiquadFilter();
  hp.type = 'highpass';
  hp.frequency.value = 9000;
  const gain = c.createGain();
  gain.gain.setValueAtTime(vol, time);
  gain.gain.exponentialRampToValueAtTime(0.001, time + 0.04);
  src.connect(hp);
  hp.connect(gain);
  gain.connect(layers.drums || masterGain);
  src.start(time);
}

function bass(time, note, dur) {
  const c = getCtx();
  const osc = c.createOscillator();
  const gain = c.createGain();
  const filter = c.createBiquadFilter();
  osc.type = 'sawtooth';
  osc.frequency.value = freq(note);
  filter.type = 'lowpass';
  filter.frequency.setValueAtTime(500, time);
  filter.frequency.exponentialRampToValueAtTime(120, time + dur);
  gain.gain.setValueAtTime(0.22, time);
  gain.gain.setValueAtTime(0.22, time + dur - 0.03);
  gain.gain.linearRampToValueAtTime(0, time + dur);
  osc.connect(filter);
  filter.connect(gain);
  gain.connect(layers.bass || masterGain);
  osc.start(time);
  osc.stop(time + dur);
}

function lead(time, note, dur, vol = 0.12) {
  const c = getCtx();
  const osc1 = c.createOscillator();
  const osc2 = c.createOscillator();
  const gain = c.createGain();
  const filter = c.createBiquadFilter();
  osc1.type = 'square';
  osc2.type = 'square';
  osc1.frequency.value = freq(note);
  osc2.frequency.value = freq(note) * 1.004;
  filter.type = 'lowpass';
  filter.frequency.setValueAtTime(1800, time);
  filter.frequency.exponentialRampToValueAtTime(600, time + dur);
  gain.gain.setValueAtTime(0, time);
  gain.gain.linearRampToValueAtTime(vol, time + 0.02);
  gain.gain.setValueAtTime(vol, time + dur - 0.05);
  gain.gain.linearRampToValueAtTime(0, time + dur);
  osc1.connect(filter);
  osc2.connect(filter);
  filter.connect(gain);
  gain.connect(layers.lead || masterGain);
  osc1.start(time);
  osc2.start(time);
  osc1.stop(time + dur);
  osc2.stop(time + dur);
}

function pad(time, notes, dur) {
  const c = getCtx();
  const gain = c.createGain();
  const filter = c.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.value = 450;
  gain.gain.setValueAtTime(0, time);
  gain.gain.linearRampToValueAtTime(0.06, time + 1);
  gain.gain.setValueAtTime(0.06, time + dur - 1.5);
  gain.gain.linearRampToValueAtTime(0, time + dur);
  for (const n of notes) {
    const osc = c.createOscillator();
    osc.type = 'triangle';
    osc.frequency.value = freq(n);
    osc.connect(filter);
    osc.start(time);
    osc.stop(time + dur);
  }
  filter.connect(gain);
  gain.connect(layers.pad || masterGain);
}

function arp(time, note, dur) {
  const c = getCtx();
  const osc = c.createOscillator();
  const gain = c.createGain();
  osc.type = 'sine';
  osc.frequency.value = freq(note);
  gain.gain.setValueAtTime(0, time);
  gain.gain.linearRampToValueAtTime(0.07, time + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.001, time + dur);
  osc.connect(gain);
  gain.connect(layers.lead || masterGain);
  osc.start(time);
  osc.stop(time + dur);
}

function arpFast(time, note, dur) {
  const c = getCtx();
  const osc = c.createOscillator();
  const gain = c.createGain();
  osc.type = 'sawtooth';
  osc.frequency.value = freq(note);
  gain.gain.setValueAtTime(0, time);
  gain.gain.linearRampToValueAtTime(0.05, time + 0.005);
  gain.gain.exponentialRampToValueAtTime(0.001, time + dur);
  osc.connect(gain);
  gain.connect(layers.high || masterGain);
  osc.start(time);
  osc.stop(time + dur);
}

function leadOctave(time, note, dur, vol = 0.06) {
  const c = getCtx();
  const osc = c.createOscillator();
  const gain = c.createGain();
  const filter = c.createBiquadFilter();
  osc.type = 'square';
  osc.frequency.value = freq(note + 12);
  filter.type = 'lowpass';
  filter.frequency.value = 2200;
  gain.gain.setValueAtTime(0, time);
  gain.gain.linearRampToValueAtTime(vol, time + 0.02);
  gain.gain.setValueAtTime(vol, time + dur - 0.04);
  gain.gain.linearRampToValueAtTime(0, time + dur);
  osc.connect(filter);
  filter.connect(gain);
  gain.connect(layers.high || masterGain);
  osc.start(time);
  osc.stop(time + dur);
}

// =============================================
// === INSTRUMENTS (piste Dark — Orchestral) ===
// =============================================

/** Cordes (ensemble) : 3 sawtooth empilées + filtre doux */
function strings(time, notes, dur, vol = 0.05) {
  const c = getCtx();
  const gain = c.createGain();
  const filter = c.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.value = 800;
  gain.gain.setValueAtTime(0, time);
  gain.gain.linearRampToValueAtTime(vol, time + 0.4);
  gain.gain.setValueAtTime(vol, time + dur - 0.5);
  gain.gain.linearRampToValueAtTime(0, time + dur);
  for (const n of notes) {
    for (const detune of [0, 3, -3]) {
      const osc = c.createOscillator();
      osc.type = 'sawtooth';
      osc.frequency.value = freq(n);
      osc.detune.value = detune;
      osc.connect(filter);
      osc.start(time);
      osc.stop(time + dur);
    }
  }
  filter.connect(gain);
  gain.connect(layers.pad || masterGain);
}

/** Cuivres (brass) : square + attaque, routé vers lead */
function brass(time, note, dur, vol = 0.1) {
  const c = getCtx();
  const osc1 = c.createOscillator();
  const osc2 = c.createOscillator();
  const gain = c.createGain();
  const filter = c.createBiquadFilter();
  osc1.type = 'square';
  osc2.type = 'sawtooth';
  osc1.frequency.value = freq(note);
  osc2.frequency.value = freq(note) * 1.002;
  filter.type = 'lowpass';
  filter.frequency.setValueAtTime(1200, time);
  filter.frequency.exponentialRampToValueAtTime(500, time + dur);
  gain.gain.setValueAtTime(0, time);
  gain.gain.linearRampToValueAtTime(vol, time + 0.08);
  gain.gain.setValueAtTime(vol, time + dur - 0.1);
  gain.gain.linearRampToValueAtTime(0, time + dur);
  osc1.connect(filter);
  osc2.connect(filter);
  filter.connect(gain);
  gain.connect(layers.lead || masterGain);
  osc1.start(time);
  osc2.start(time);
  osc1.stop(time + dur);
  osc2.stop(time + dur);
}

/** Timbale : sine avec pitch drop + noise */
function timpani(time, note = 45, vol = 0.4) {
  const c = getCtx();
  const osc = c.createOscillator();
  const gain = c.createGain();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(freq(note), time);
  osc.frequency.exponentialRampToValueAtTime(freq(note) * 0.5, time + 0.4);
  gain.gain.setValueAtTime(vol, time);
  gain.gain.exponentialRampToValueAtTime(0.001, time + 0.8);
  osc.connect(gain);
  gain.connect(layers.drums || masterGain);
  osc.start(time);
  osc.stop(time + 0.9);
  // Noise texture
  const noiseLen = c.sampleRate * 0.08;
  const buf = c.createBuffer(1, noiseLen, c.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < noiseLen; i++) data[i] = (Math.random() * 2 - 1) * 0.3;
  const src = c.createBufferSource();
  const ng = c.createGain();
  const nf = c.createBiquadFilter();
  src.buffer = buf;
  nf.type = 'lowpass';
  nf.frequency.value = 600;
  ng.gain.setValueAtTime(0.15, time);
  ng.gain.exponentialRampToValueAtTime(0.001, time + 0.12);
  src.connect(nf);
  nf.connect(ng);
  ng.connect(layers.drums || masterGain);
  src.start(time);
}

/** Basse orchestrale (violoncelles) */
function cello(time, note, dur) {
  const c = getCtx();
  const gain = c.createGain();
  const filter = c.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.value = 350;
  gain.gain.setValueAtTime(0, time);
  gain.gain.linearRampToValueAtTime(0.18, time + 0.15);
  gain.gain.setValueAtTime(0.18, time + dur - 0.1);
  gain.gain.linearRampToValueAtTime(0, time + dur);
  for (const detune of [0, 4]) {
    const osc = c.createOscillator();
    osc.type = 'sawtooth';
    osc.frequency.value = freq(note);
    osc.detune.value = detune;
    osc.connect(filter);
    osc.start(time);
    osc.stop(time + dur);
  }
  filter.connect(gain);
  gain.connect(layers.bass || masterGain);
}

/** Harpe sombre : sine, note courte, layer high */
function harp(time, note, dur) {
  const c = getCtx();
  const osc = c.createOscillator();
  const gain = c.createGain();
  osc.type = 'sine';
  osc.frequency.value = freq(note);
  gain.gain.setValueAtTime(0, time);
  gain.gain.linearRampToValueAtTime(0.06, time + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.001, time + dur);
  osc.connect(gain);
  gain.connect(layers.high || masterGain);
  osc.start(time);
  osc.stop(time + dur);
}

/** Cuivres haute octave pour layer high */
function brassHigh(time, note, dur, vol = 0.06) {
  const c = getCtx();
  const osc = c.createOscillator();
  const gain = c.createGain();
  const filter = c.createBiquadFilter();
  osc.type = 'square';
  osc.frequency.value = freq(note + 12);
  filter.type = 'lowpass';
  filter.frequency.value = 1800;
  gain.gain.setValueAtTime(0, time);
  gain.gain.linearRampToValueAtTime(vol, time + 0.04);
  gain.gain.setValueAtTime(vol, time + dur - 0.06);
  gain.gain.linearRampToValueAtTime(0, time + dur);
  osc.connect(filter);
  filter.connect(gain);
  gain.connect(layers.high || masterGain);
  osc.start(time);
  osc.stop(time + dur);
}

/** Cymbale orchestrale (crash) */
function cymbal(time, vol = 0.08) {
  const c = getCtx();
  const noiseLen = c.sampleRate * 0.6;
  const buf = c.createBuffer(1, noiseLen, c.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < noiseLen; i++) data[i] = Math.random() * 2 - 1;
  const src = c.createBufferSource();
  const g = c.createGain();
  const f = c.createBiquadFilter();
  src.buffer = buf;
  f.type = 'highpass';
  f.frequency.value = 6000;
  g.gain.setValueAtTime(vol, time);
  g.gain.exponentialRampToValueAtTime(0.001, time + 0.6);
  src.connect(f);
  f.connect(g);
  g.connect(layers.drums || masterGain);
  src.start(time);
}

// =============================================
// === DATA-DRIVEN SECTION ENGINE ===
// =============================================
// Chaque instrument est référencé par nom dans les configs.
// Le scheduler générique lit les events et dispatch vers les fonctions.

const INSTRUMENTS = {
  // Main synth
  kick, snare, hihat, bass, lead, pad, arp, arpFast, leadOctave,
  // Dark orchestral
  timpani, cymbal, cello, brass, strings, harp, brassHigh,
};

/**
 * Joue une section à partir de sa config data-driven.
 * Config format : { drums: [...], bass: [...], pad: [...], lead: [...], high: [...] }
 * Chaque event : { fn, t (en beats), note?, notes?, dur? (en beats), vol? }
 */
function playSectionConfig(config, t0) {
  for (const events of Object.values(config)) {
    for (const ev of events) {
      const fn = INSTRUMENTS[ev.fn];
      if (!fn) continue;
      const t = t0 + ev.t * BEAT;
      // Dispatch selon la signature de l'instrument
      if (ev.notes) {
        // Accord : pad(t, notes, dur), strings(t, notes, dur, vol)
        fn(t, ev.notes, ev.dur * BEAT, ev.vol);
      } else if (ev.note !== undefined && ev.dur !== undefined) {
        // Note + durée : bass, lead, arp, cello, brass, harp...
        fn(t, ev.note, ev.dur * BEAT, ev.vol);
      } else if (ev.note !== undefined) {
        // Note + vol (pas de dur) : timpani(t, note, vol)
        fn(t, ev.note, ev.vol);
      } else {
        // Temps seul ou temps + vol : kick(t), hihat(t, vol), cymbal(t, vol)
        fn(t, ev.vol);
      }
    }
  }
}

// =============================================
// === SECTION CONFIGS — MAIN (Mi mineur) ===
// =============================================
// E2=40 G2=43 A2=45 B2=47 D3=50
// E4=64 G4=67 A4=69 B4=71 D5=74 E5=76

const MAIN_INTRO = {
  drums: [],
  bass: [],
  pad: [
    { fn: 'pad', t: 0, notes: [52, 55, 59], dur: 4 },
    { fn: 'pad', t: 4, notes: [48, 52, 55], dur: 4 },
    { fn: 'pad', t: 8, notes: [55, 59, 62], dur: 4 },
    { fn: 'pad', t: 12, notes: [50, 54, 57], dur: 4 },
  ],
  lead: [64, 71, 76, 71, 69, 71, 67, 64, 60, 67, 72, 67, 64, 67, 60, 64,
         67, 74, 79, 74, 71, 74, 67, 71, 62, 69, 74, 69, 66, 69, 62, 66]
    .map((n, i) => ({ fn: 'arp', t: i * 0.5, note: n, dur: 0.6 })),
  high: [],
};

const MAIN_VERSE = {
  drums: [
    ...[0, 4, 8, 12].map(t => ({ fn: 'kick', t })),
    ...[2, 6, 10, 14].map(t => ({ fn: 'hihat', t, vol: 0.06 })),
    { fn: 'snare', t: 4 },
  ],
  bass: [
    [40, 0, 3], [40, 3, 1], [43, 4, 3], [43, 7, 1],
    [45, 8, 3], [45, 11, 1], [47, 12, 2], [45, 14, 2],
  ].map(([note, t, dur]) => ({ fn: 'bass', t, note, dur })),
  pad: [
    { fn: 'pad', t: 0, notes: [52, 55, 59], dur: 4 },
    { fn: 'pad', t: 4, notes: [55, 59, 62], dur: 4 },
    { fn: 'pad', t: 8, notes: [57, 60, 64], dur: 4 },
    { fn: 'pad', t: 12, notes: [47, 55, 59], dur: 4 },
  ],
  lead: [
    [64, 0, 1.5], [67, 2, 1], [69, 3, 1],
    [67, 4, 1.5], [71, 6, 2],
    [69, 8, 1], [71, 9, 0.5], [74, 9.5, 1.5], [71, 11, 1],
    [69, 12, 1.5], [67, 14, 2],
  ].map(([note, t, dur]) => ({ fn: 'lead', t, note, dur, vol: 0.1 })),
  high: [],
};

const MAIN_CHORUS = {
  drums: [
    ...Array.from({ length: 16 }, (_, i) => ({ fn: 'kick', t: i })),
    ...Array.from({ length: 16 }, (_, i) => ({ fn: 'hihat', t: i + 0.5, vol: 0.07 })),
    ...[2, 6, 10, 14].map(t => ({ fn: 'snare', t })),
  ],
  bass: [
    [40, 0, 1], [40, 1, 1], [40, 2, 0.5], [43, 2.5, 1.5],
    [43, 4, 1], [43, 5, 1], [45, 6, 1], [47, 7, 1],
    [45, 8, 1], [45, 9, 1], [45, 10, 0.5], [43, 10.5, 1.5],
    [47, 12, 1], [47, 13, 1], [45, 14, 1], [43, 15, 1],
  ].map(([note, t, dur]) => ({ fn: 'bass', t, note, dur })),
  pad: [
    { fn: 'pad', t: 0, notes: [52, 55, 59], dur: 4 },
    { fn: 'pad', t: 4, notes: [55, 59, 62], dur: 4 },
    { fn: 'pad', t: 8, notes: [57, 60, 64], dur: 4 },
    { fn: 'pad', t: 12, notes: [47, 54, 59], dur: 4 },
  ],
  lead: [
    [71, 0, 1], [74, 1, 1], [76, 2, 2],
    [74, 4, 0.5], [76, 4.5, 0.5], [79, 5, 1.5], [76, 6.5, 1.5],
    [74, 8, 1], [71, 9, 1], [74, 10, 1], [76, 11, 1],
    [74, 12, 0.5], [71, 12.5, 0.5], [69, 13, 1], [67, 14, 1], [64, 15, 1],
  ].map(([note, t, dur]) => ({ fn: 'lead', t, note, dur, vol: 0.15 })),
  high: [],
};

const MAIN_BRIDGE = {
  drums: [
    ...Array.from({ length: 8 }, (_, i) => ({ fn: 'kick', t: i * 2 })),
    ...[12, 13, 14, 15].map(t => ({ fn: 'hihat', t: t + 0.5, vol: 0.05 })),
  ],
  bass: [
    { fn: 'bass', t: 0, note: 40, dur: 4 },
    { fn: 'bass', t: 4, note: 45, dur: 4 },
    { fn: 'bass', t: 8, note: 43, dur: 4 },
    { fn: 'bass', t: 12, note: 47, dur: 4 },
  ],
  pad: [
    { fn: 'pad', t: 0, notes: [52, 55, 59], dur: 8 },
    { fn: 'pad', t: 8, notes: [55, 59, 62], dur: 8 },
  ],
  lead: [64, 67, 71, 67, 69, 71, 74, 71, 67, 71, 74, 71, 69, 74, 76, 74,
         71, 74, 76, 74, 76, 79, 76, 79, 74, 76, 79, 76, 79, 81, 79, 83]
    .map((n, i) => ({ fn: 'arp', t: i * 0.5, note: n, dur: 0.55 })),
  high: [],
};

const MAIN_BREAKDOWN = {
  drums: [
    { fn: 'kick', t: 0 }, { fn: 'kick', t: 8 },
    ...Array.from({ length: 8 }, (_, i) => ({ fn: 'hihat', t: i * 2, vol: 0.04 })),
    ...Array.from({ length: 16 }, (_, i) => ({ fn: 'hihat', t: i + 0.5, vol: 0.03 })),
    ...[12, 13, 14, 15].map(t => ({ fn: 'snare', t })),
    { fn: 'snare', t: 14.5 }, { fn: 'snare', t: 15.5 },
  ],
  bass: [
    { fn: 'bass', t: 0, note: 40, dur: 8 },
    { fn: 'bass', t: 8, note: 43, dur: 4 },
    { fn: 'bass', t: 12, note: 45, dur: 4 },
  ],
  pad: [
    { fn: 'pad', t: 0, notes: [52, 55, 58], dur: 8 },
    { fn: 'pad', t: 8, notes: [52, 55, 59], dur: 8 },
  ],
  lead: [],
  high: [],
};

const MAIN_CLIMAX = {
  drums: [
    ...Array.from({ length: 16 }, (_, i) => ({ fn: 'kick', t: i })),
    ...Array.from({ length: 16 }, (_, i) => [
      { fn: 'hihat', t: i, vol: 0.08 },
      { fn: 'hihat', t: i + 0.25, vol: 0.05 },
      { fn: 'hihat', t: i + 0.5, vol: 0.07 },
      { fn: 'hihat', t: i + 0.75, vol: 0.04 },
    ]).flat(),
    ...[1, 3, 5, 7, 9, 11, 13, 15].map(t => ({ fn: 'snare', t })),
  ],
  bass: [
    [40, 0, 0.5], [40, 0.5, 0.5], [43, 1, 0.5], [45, 1.5, 0.5],
    [47, 2, 1], [45, 3, 0.5], [43, 3.5, 0.5],
    [40, 4, 0.5], [40, 4.5, 0.5], [43, 5, 0.5], [47, 5.5, 0.5],
    [45, 6, 1], [43, 7, 0.5], [40, 7.5, 0.5],
    [40, 8, 0.5], [43, 8.5, 0.5], [45, 9, 0.5], [47, 9.5, 0.5],
    [48, 10, 1], [47, 11, 0.5], [45, 11.5, 0.5],
    [43, 12, 1], [45, 13, 1], [47, 14, 1], [40, 15, 1],
  ].map(([note, t, dur]) => ({ fn: 'bass', t, note, dur })),
  pad: [
    { fn: 'pad', t: 0, notes: [52, 55, 59, 64], dur: 4 },
    { fn: 'pad', t: 4, notes: [55, 59, 62, 67], dur: 4 },
    { fn: 'pad', t: 8, notes: [57, 60, 64, 69], dur: 4 },
    { fn: 'pad', t: 12, notes: [52, 55, 59, 64], dur: 4 },
  ],
  lead: [
    [76, 0, 0.5], [79, 0.5, 0.5], [81, 1, 1], [83, 2, 1], [81, 3, 1],
    [79, 4, 0.5], [81, 4.5, 0.5], [83, 5, 1], [86, 6, 2],
    [83, 8, 0.5], [81, 8.5, 0.5], [79, 9, 1], [81, 10, 1], [83, 11, 1],
    [81, 12, 1], [79, 13, 1], [76, 14, 1], [74, 15, 1],
  ].map(([note, t, dur]) => ({ fn: 'lead', t, note, dur, vol: 0.18 })),
  high: [
    // leadOctave doublant la mélodie
    ...[
      [76, 0, 0.5], [79, 0.5, 0.5], [81, 1, 1], [83, 2, 1], [81, 3, 1],
      [79, 4, 0.5], [81, 4.5, 0.5], [83, 5, 1], [86, 6, 2],
      [83, 8, 0.5], [81, 8.5, 0.5], [79, 9, 1], [81, 10, 1], [83, 11, 1],
      [81, 12, 1], [79, 13, 1], [76, 14, 1], [74, 15, 1],
    ].map(([note, t, dur]) => ({ fn: 'leadOctave', t, note, dur, vol: 0.06 })),
    // arpFast 16th notes
    ...[76, 79, 83, 79, 81, 76, 79, 83, 79, 83, 86, 83, 81, 79, 83, 81,
        83, 86, 88, 86, 83, 81, 79, 83, 81, 79, 76, 79, 81, 83, 79, 76]
      .map((n, i) => ({ fn: 'arpFast', t: i * 0.5, note: n, dur: 0.35 })),
  ],
};

const MAIN_OUTRO = {
  drums: [
    ...Array.from({ length: 16 }, (_, i) => ({ fn: 'kick', t: i })),
    ...Array.from({ length: 16 }, (_, i) => ({ fn: 'hihat', t: i + 0.5, vol: 0.07 })),
    ...[2, 6, 10, 14].map(t => ({ fn: 'snare', t })),
    ...[4, 8, 12].map(t => ({ fn: 'hihat', t, vol: 0.04 })),
  ],
  bass: [
    [40, 0, 1], [40, 1, 0.5], [43, 1.5, 0.5], [40, 2, 1], [43, 3, 1],
    [45, 4, 1], [45, 5, 1], [43, 6, 1], [47, 7, 1],
    [40, 8, 1], [40, 9, 0.5], [43, 9.5, 0.5], [45, 10, 1], [47, 11, 1],
    [45, 12, 2], [43, 14, 1], [40, 15, 1],
  ].map(([note, t, dur]) => ({ fn: 'bass', t, note, dur })),
  pad: [
    { fn: 'pad', t: 0, notes: [52, 55, 59], dur: 4 },
    { fn: 'pad', t: 4, notes: [57, 60, 64], dur: 4 },
    { fn: 'pad', t: 8, notes: [55, 59, 62], dur: 4 },
    { fn: 'pad', t: 12, notes: [52, 55, 59], dur: 4 },
  ],
  lead: [
    [76, 0, 1], [79, 1, 1], [81, 2, 2],
    [79, 4, 0.5], [76, 4.5, 0.5], [74, 5, 1.5], [76, 6.5, 1.5],
    [74, 8, 0.5], [76, 8.5, 0.5], [79, 9, 1], [76, 10, 1], [74, 11, 1],
    [71, 12, 1.5], [69, 13.5, 1], [67, 14.5, 0.5], [64, 15, 1],
  ].map(([note, t, dur]) => ({ fn: 'lead', t, note, dur, vol: 0.15 })),
  high: [],
};

// =============================================
// === SECTION CONFIGS — DARK (Ré mineur) ===
// =============================================
// D2=38 F2=41 G2=43 A2=45 Bb2=46 C3=48 D3=50
// D4=62 F4=65 G4=67 A4=69 Bb4=70 C5=72 D5=74 F5=77

const DARK_INTRO = {
  drums: [
    { fn: 'timpani', t: 0, note: 38, vol: 0.2 },
    { fn: 'timpani', t: 8, note: 38, vol: 0.25 },
  ],
  bass: [],
  pad: [
    { fn: 'strings', t: 0, notes: [38, 41, 45], dur: 8, vol: 0.04 },
    { fn: 'strings', t: 8, notes: [38, 41, 44], dur: 8, vol: 0.05 },
  ],
  lead: [],
  high: [74, 70, 67, 65, 62, 58, 55, 50, 72, 69, 65, 62, 58, 55, 50, 46]
    .map((n, i) => ({ fn: 'harp', t: i, note: n, dur: 1.5 })),
};

const DARK_VERSE = {
  drums: [
    ...[0, 4, 8, 12].map(t => ({ fn: 'timpani', t, note: 38, vol: 0.3 })),
    ...[2, 6, 10, 14].map(t => ({ fn: 'timpani', t, note: 43, vol: 0.15 })),
  ],
  bass: [
    { fn: 'cello', t: 0, note: 38, dur: 4 },
    { fn: 'cello', t: 4, note: 41, dur: 4 },
    { fn: 'cello', t: 8, note: 43, dur: 4 },
    { fn: 'cello', t: 12, note: 45, dur: 4 },
  ],
  pad: [
    { fn: 'strings', t: 0, notes: [50, 53, 57], dur: 4, vol: 0.04 },
    { fn: 'strings', t: 4, notes: [53, 57, 60], dur: 4, vol: 0.04 },
    { fn: 'strings', t: 8, notes: [55, 59, 62], dur: 4, vol: 0.04 },
    { fn: 'strings', t: 12, notes: [53, 57, 60], dur: 4, vol: 0.04 },
  ],
  lead: [
    [62, 0, 2], [65, 2, 1], [67, 3, 1], [65, 4, 2], [62, 6, 2],
    [67, 8, 1], [69, 9, 1], [70, 10, 2], [67, 12, 2], [65, 14, 2],
  ].map(([note, t, dur]) => ({ fn: 'brass', t, note, dur, vol: 0.07 })),
  high: [],
};

const DARK_CHORUS = {
  drums: [
    ...Array.from({ length: 8 }, (_, i) => ({ fn: 'timpani', t: i * 2, note: 38, vol: 0.35 })),
    ...[0, 4, 8, 12].map(t => ({ fn: 'cymbal', t, vol: 0.06 })),
  ],
  bass: [
    [38, 0, 1], [38, 1, 1], [41, 2, 1], [43, 3, 1],
    [41, 4, 1], [41, 5, 1], [45, 6, 1], [43, 7, 1],
    [46, 8, 1], [46, 9, 1], [45, 10, 1], [43, 11, 1],
    [41, 12, 1], [43, 13, 1], [45, 14, 1], [38, 15, 1],
  ].map(([note, t, dur]) => ({ fn: 'cello', t, note, dur })),
  pad: [
    { fn: 'strings', t: 0, notes: [50, 53, 57, 62], dur: 4, vol: 0.06 },
    { fn: 'strings', t: 4, notes: [53, 57, 60, 65], dur: 4, vol: 0.06 },
    { fn: 'strings', t: 8, notes: [58, 62, 65, 70], dur: 4, vol: 0.06 },
    { fn: 'strings', t: 12, notes: [53, 57, 60, 65], dur: 4, vol: 0.06 },
  ],
  lead: [
    [62, 0, 1], [65, 1, 1], [69, 2, 2], [67, 4, 1], [69, 5, 1], [72, 6, 2],
    [70, 8, 1], [69, 9, 1], [67, 10, 2], [65, 12, 1], [67, 13, 1], [62, 14, 2],
  ].map(([note, t, dur]) => ({ fn: 'brass', t, note, dur, vol: 0.12 })),
  high: [],
};

const DARK_BRIDGE = {
  drums: [
    { fn: 'timpani', t: 0, note: 38, vol: 0.25 },
    { fn: 'timpani', t: 4, note: 38, vol: 0.25 },
    // Montée chromatique beats 8-15
    ...Array.from({ length: 8 }, (_, i) => ({ fn: 'timpani', t: 8 + i, note: 38 + i, vol: 0.2 })),
  ],
  bass: [
    { fn: 'cello', t: 0, note: 38, dur: 4 },
    { fn: 'cello', t: 4, note: 41, dur: 4 },
    { fn: 'cello', t: 8, note: 43, dur: 4 },
    { fn: 'cello', t: 12, note: 41, dur: 4 },
  ],
  pad: [
    { fn: 'strings', t: 0, notes: [50, 53, 57], dur: 8, vol: 0.03 },
    { fn: 'strings', t: 8, notes: [53, 57, 62], dur: 8, vol: 0.05 },
  ],
  lead: [],
  high: [50, 53, 57, 62, 53, 57, 62, 65, 57, 62, 65, 69, 62, 65, 69, 74]
    .map((n, i) => ({ fn: 'harp', t: i, note: n, dur: 0.8 })),
};

const DARK_BREAKDOWN = {
  drums: [
    { fn: 'timpani', t: 0, note: 36, vol: 0.3 },
    { fn: 'timpani', t: 4, note: 36, vol: 0.25 },
    { fn: 'timpani', t: 8, note: 36, vol: 0.2 },
    ...[12, 13, 14, 15].map((t, i) => ({ fn: 'timpani', t, note: 36, vol: 0.15 + i * 0.08 })),
  ],
  bass: [
    { fn: 'cello', t: 0, note: 36, dur: 12 },
    { fn: 'cello', t: 12, note: 38, dur: 4 },
  ],
  pad: [
    { fn: 'strings', t: 0, notes: [50, 51, 55], dur: 8, vol: 0.03 },
    { fn: 'strings', t: 8, notes: [50, 53, 56], dur: 8, vol: 0.04 },
  ],
  lead: [],
  high: [],
};

const DARK_CLIMAX = {
  drums: [
    ...Array.from({ length: 16 }, (_, i) => ({ fn: 'timpani', t: i, note: i % 2 === 0 ? 38 : 43, vol: 0.4 })),
    ...[0, 4, 8, 12].map(t => ({ fn: 'cymbal', t, vol: 0.08 })),
    ...[1, 3, 5, 7, 9, 11, 13, 15].map(t => ({ fn: 'cymbal', t, vol: 0.04 })),
  ],
  bass: [
    [38, 0, 0.5], [38, 0.5, 0.5], [41, 1, 0.5], [43, 1.5, 0.5],
    [45, 2, 1], [43, 3, 0.5], [41, 3.5, 0.5],
    [38, 4, 0.5], [41, 4.5, 0.5], [43, 5, 0.5], [45, 5.5, 0.5],
    [46, 6, 1], [45, 7, 0.5], [43, 7.5, 0.5],
    [38, 8, 0.5], [41, 8.5, 0.5], [43, 9, 0.5], [45, 9.5, 0.5],
    [46, 10, 1], [45, 11, 0.5], [43, 11.5, 0.5],
    [41, 12, 1], [43, 13, 1], [45, 14, 1], [38, 15, 1],
  ].map(([note, t, dur]) => ({ fn: 'cello', t, note, dur })),
  pad: [
    { fn: 'strings', t: 0, notes: [50, 53, 57, 62, 65], dur: 4, vol: 0.07 },
    { fn: 'strings', t: 4, notes: [53, 57, 60, 65, 69], dur: 4, vol: 0.07 },
    { fn: 'strings', t: 8, notes: [58, 62, 65, 70, 74], dur: 4, vol: 0.07 },
    { fn: 'strings', t: 12, notes: [50, 53, 57, 62, 65], dur: 4, vol: 0.07 },
  ],
  lead: [
    [62, 0, 0.5], [65, 0.5, 0.5], [69, 1, 1], [72, 2, 1], [70, 3, 1],
    [69, 4, 0.5], [67, 4.5, 0.5], [65, 5, 1], [69, 6, 2],
    [72, 8, 0.5], [74, 8.5, 0.5], [77, 9, 1], [74, 10, 1], [72, 11, 1],
    [70, 12, 1], [69, 13, 1], [67, 14, 1], [62, 15, 1],
  ].map(([note, t, dur]) => ({ fn: 'brass', t, note, dur, vol: 0.14 })),
  high: [
    // brassHigh doublant la mélodie
    ...[
      [62, 0, 0.5], [65, 0.5, 0.5], [69, 1, 1], [72, 2, 1], [70, 3, 1],
      [69, 4, 0.5], [67, 4.5, 0.5], [65, 5, 1], [69, 6, 2],
      [72, 8, 0.5], [74, 8.5, 0.5], [77, 9, 1], [74, 10, 1], [72, 11, 1],
      [70, 12, 1], [69, 13, 1], [67, 14, 1], [62, 15, 1],
    ].map(([note, t, dur]) => ({ fn: 'brassHigh', t, note, dur, vol: 0.05 })),
    // Harpe rapide (16th notes)
    ...[74, 70, 67, 65, 62, 65, 67, 70, 72, 69, 65, 62, 58, 62, 65, 69,
        74, 72, 69, 67, 65, 67, 69, 72, 70, 67, 65, 62, 58, 62, 65, 67]
      .map((n, i) => ({ fn: 'harp', t: i * 0.5, note: n, dur: 0.4 })),
  ],
};

const DARK_OUTRO = {
  drums: [
    ...Array.from({ length: 8 }, (_, i) => ({ fn: 'timpani', t: i * 2, note: 38, vol: 0.3 })),
    ...[0, 4, 8, 12].map(t => ({ fn: 'cymbal', t, vol: 0.05 })),
  ],
  bass: [
    [38, 0, 2], [41, 2, 2], [43, 4, 2], [45, 6, 2],
    [43, 8, 2], [41, 10, 2], [38, 12, 4],
  ].map(([note, t, dur]) => ({ fn: 'cello', t, note, dur })),
  pad: [
    { fn: 'strings', t: 0, notes: [50, 53, 57, 62], dur: 4, vol: 0.06 },
    { fn: 'strings', t: 4, notes: [53, 57, 60, 65], dur: 4, vol: 0.06 },
    { fn: 'strings', t: 8, notes: [55, 57, 60, 65], dur: 4, vol: 0.05 },
    { fn: 'strings', t: 12, notes: [50, 53, 57, 62], dur: 4, vol: 0.04 },
  ],
  lead: [
    [69, 0, 2], [72, 2, 2], [70, 4, 2], [67, 6, 2],
    [65, 8, 2], [67, 10, 2], [62, 12, 4],
  ].map(([note, t, dur]) => ({ fn: 'brass', t, note, dur, vol: 0.1 })),
  high: [],
};

// =============================================
// === SCHEDULING (data-driven) ===
// =============================================

const SECTIONS = {
  main: {
    intro: MAIN_INTRO, verse: MAIN_VERSE, chorus: MAIN_CHORUS,
    bridge: MAIN_BRIDGE, breakdown: MAIN_BREAKDOWN,
    climax: MAIN_CLIMAX, outro: MAIN_OUTRO,
  },
  dark: {
    intro: DARK_INTRO, verse: DARK_VERSE, chorus: DARK_CHORUS,
    bridge: DARK_BRIDGE, breakdown: DARK_BREAKDOWN,
    climax: DARK_CLIMAX, outro: DARK_OUTRO,
  },
};

const TRACK_NAMES = ['main', 'dark'];
let currentTrack = 'main';

export function setTrack(name) {
  if (TRACK_NAMES.includes(name)) currentTrack = name;
}
export function getTrack() { return currentTrack; }
export { TRACK_NAMES };

const FULL_LOOP_NAMES = [
  'intro', 'verse', 'chorus', 'verse',
  'breakdown', 'chorus', 'bridge', 'climax',
  'verse', 'bridge', 'chorus', 'outro',
];

const SECTION_LEN = 16 * BEAT;

// --- Mode adaptatif : le MusicDirector peut demander la prochaine section ---
let adaptiveMode = false;
let nextRequestedSection = null;
let currentSectionName = null;
let currentSectionStartTime = 0;
let loopIndex = 0;

export function enableAdaptiveMode() { adaptiveMode = true; }
export function disableAdaptiveMode() { adaptiveMode = false; }

/** Demande une section pour la prochaine transition. */
export function requestNextSection(name) { nextRequestedSection = name; }

/** Retourne le nom de la section en cours. */
export function getCurrentSection() { return currentSectionName; }

/** Retourne le temps restant avant la prochaine transition (en secondes). */
export function getTimeToNextSection() {
  if (!ctx || !playing) return 0;
  const elapsed = ctx.currentTime - currentSectionStartTime;
  return Math.max(0, SECTION_LEN - elapsed);
}

function scheduleNextSection() {
  if (!playing) return;
  const c = getCtx();
  const now = c.currentTime + 0.05;

  let sectionName;
  if (adaptiveMode && nextRequestedSection) {
    sectionName = nextRequestedSection;
    nextRequestedSection = null;
  } else {
    sectionName = FULL_LOOP_NAMES[loopIndex % FULL_LOOP_NAMES.length];
    loopIndex++;
  }

  const map = SECTIONS[currentTrack] || SECTIONS.main;
  const config = map[sectionName];
  if (config) playSectionConfig(config, now);
  currentSectionName = sectionName;
  currentSectionStartTime = now;

  loopTimer = setTimeout(scheduleNextSection, SECTION_LEN * 1000 - 100);
}

export function startMusic() {
  if (playing) return;
  const c = getCtx();
  if (c.state === 'suspended') c.resume();
  playing = true;
  loopIndex = 0;
  scheduleNextSection();
}

export function stopMusic() {
  const savedVol = masterGain ? masterGain.gain.value : 0.3;
  playing = false;
  if (loopTimer) clearTimeout(loopTimer);
  if (masterGain) {
    masterGain.gain.linearRampToValueAtTime(0, ctx.currentTime + 1);
    setTimeout(() => {
      if (masterGain) masterGain.gain.value = savedVol;
    }, 1200);
  }
}

/** Fade out la musique puis exécute un callback. Ne remet pas le volume. */
export function fadeOutMusic(duration = 1.0, onDone) {
  playing = false;
  if (loopTimer) clearTimeout(loopTimer);
  loopTimer = null;
  if (masterGain && ctx) {
    masterGain.gain.cancelScheduledValues(ctx.currentTime);
    masterGain.gain.setValueAtTime(masterGain.gain.value, ctx.currentTime);
    masterGain.gain.linearRampToValueAtTime(0, ctx.currentTime + duration);
  }
  if (onDone) setTimeout(onDone, duration * 1000);
}

export function isPlaying() {
  return playing;
}

export function setVolume(v) {
  if (masterGain) masterGain.gain.value = v;
}

// --- Low-pass pour la pause ---
export function muffle() {
  if (!masterFilter) return;
  const c = getCtx();
  masterFilter.frequency.cancelScheduledValues(c.currentTime);
  masterFilter.frequency.setValueAtTime(masterFilter.frequency.value, c.currentTime);
  masterFilter.frequency.exponentialRampToValueAtTime(FILTER_MUFFLED, c.currentTime + 0.4);
}

export function unmuffle() {
  if (!masterFilter) return;
  const c = getCtx();
  masterFilter.frequency.cancelScheduledValues(c.currentTime);
  masterFilter.frequency.setValueAtTime(masterFilter.frequency.value, c.currentTime);
  masterFilter.frequency.exponentialRampToValueAtTime(FILTER_OPEN, c.currentTime + 0.3);
}

// --- Stingers (motifs courts, connectés directement à destination) ---
function stingerGain(vol, dur) {
  const c = getCtx();
  const g = c.createGain();
  g.gain.setValueAtTime(vol, c.currentTime);
  g.gain.linearRampToValueAtTime(0, c.currentTime + dur);
  g.connect(c.destination);
  return g;
}

export function playWinStinger() {
  const c = getCtx();
  const t = c.currentTime;
  const tempo = 0.14;

  // --- Fanfare mélodique (square, brillant) ---
  const melody = [
    [64, 0, 1], [67, 1, 1], [71, 2, 1], [76, 3, 1],
    [79, 4, 1], [83, 5, 1.5], [88, 7, 5],
  ];
  for (const [n, beat, dur] of melody) {
    const osc = c.createOscillator();
    const g = c.createGain();
    const f = c.createBiquadFilter();
    osc.type = 'square';
    osc.frequency.value = freq(n);
    f.type = 'lowpass';
    f.frequency.value = 2500;
    const vol = beat < 7 ? 0.1 : 0.13;
    const start = t + beat * tempo;
    const length = dur * tempo;
    g.gain.setValueAtTime(0, start);
    g.gain.linearRampToValueAtTime(vol, start + 0.015);
    g.gain.setValueAtTime(vol, start + length * 0.7);
    g.gain.linearRampToValueAtTime(0, start + length);
    osc.connect(f);
    f.connect(g);
    g.connect(c.destination);
    osc.start(start);
    osc.stop(start + length + 0.05);
  }

  // --- Doublage octave basse (triangle, corps) ---
  const bassNotes = [
    [52, 0, 1], [55, 1, 1], [59, 2, 1], [64, 3, 1],
    [67, 4, 1], [71, 5, 1.5], [76, 7, 5],
  ];
  for (const [n, beat, dur] of bassNotes) {
    const osc = c.createOscillator();
    const g = c.createGain();
    osc.type = 'triangle';
    osc.frequency.value = freq(n);
    const start = t + beat * tempo;
    const length = dur * tempo;
    g.gain.setValueAtTime(0, start);
    g.gain.linearRampToValueAtTime(0.08, start + 0.02);
    g.gain.setValueAtTime(0.08, start + length * 0.6);
    g.gain.linearRampToValueAtTime(0, start + length);
    osc.connect(g);
    g.connect(c.destination);
    osc.start(start);
    osc.stop(start + length + 0.05);
  }

  // --- Accord final majeur tenu (nappe brillante) ---
  const chordStart = t + 7 * tempo;
  const chordDur = 5 * tempo;
  const chord = [64, 68, 71, 76, 80];
  for (const n of chord) {
    const osc = c.createOscillator();
    const g = c.createGain();
    const f = c.createBiquadFilter();
    osc.type = 'sawtooth';
    osc.frequency.value = freq(n);
    f.type = 'lowpass';
    f.frequency.setValueAtTime(1800, chordStart);
    f.frequency.exponentialRampToValueAtTime(400, chordStart + chordDur);
    g.gain.setValueAtTime(0, chordStart);
    g.gain.linearRampToValueAtTime(0.04, chordStart + 0.1);
    g.gain.setValueAtTime(0.04, chordStart + chordDur * 0.5);
    g.gain.linearRampToValueAtTime(0, chordStart + chordDur);
    osc.connect(f);
    f.connect(g);
    g.connect(c.destination);
    osc.start(chordStart);
    osc.stop(chordStart + chordDur + 0.05);
  }

  // --- Petit roulement percussif (celebration) ---
  for (let i = 0; i < 6; i++) {
    const noiseLen = c.sampleRate * 0.04;
    const buf = c.createBuffer(1, noiseLen, c.sampleRate);
    const data = buf.getChannelData(0);
    for (let j = 0; j < noiseLen; j++) data[j] = (Math.random() * 2 - 1);
    const src = c.createBufferSource();
    const g = c.createGain();
    const f = c.createBiquadFilter();
    src.buffer = buf;
    f.type = 'highpass';
    f.frequency.value = 4000;
    g.gain.setValueAtTime(0.06, t + i * tempo * 0.8);
    g.gain.exponentialRampToValueAtTime(0.001, t + i * tempo * 0.8 + 0.06);
    src.connect(f);
    f.connect(g);
    g.connect(c.destination);
    src.start(t + i * tempo * 0.8);
  }
}

export function playGameOverStinger() {
  const c = getCtx();
  const t = c.currentTime;

  // --- Impact sourd (boom percussif) ---
  const impactOsc = c.createOscillator();
  const impactGain = c.createGain();
  impactOsc.type = 'sine';
  impactOsc.frequency.setValueAtTime(80, t);
  impactOsc.frequency.exponentialRampToValueAtTime(20, t + 0.8);
  impactGain.gain.setValueAtTime(0.35, t);
  impactGain.gain.exponentialRampToValueAtTime(0.001, t + 1.2);
  impactOsc.connect(impactGain);
  impactGain.connect(c.destination);
  impactOsc.start(t);
  impactOsc.stop(t + 1.3);

  // --- Noise burst (texture d'impact) ---
  const noiseLen = c.sampleRate * 0.3;
  const noiseBuf = c.createBuffer(1, noiseLen, c.sampleRate);
  const noiseData = noiseBuf.getChannelData(0);
  for (let i = 0; i < noiseLen; i++) noiseData[i] = (Math.random() * 2 - 1) * 0.5;
  const noiseSrc = c.createBufferSource();
  const noiseGain = c.createGain();
  const noiseFilter = c.createBiquadFilter();
  noiseSrc.buffer = noiseBuf;
  noiseFilter.type = 'lowpass';
  noiseFilter.frequency.value = 400;
  noiseGain.gain.setValueAtTime(0.15, t);
  noiseGain.gain.exponentialRampToValueAtTime(0.001, t + 0.3);
  noiseSrc.connect(noiseFilter);
  noiseFilter.connect(noiseGain);
  noiseGain.connect(c.destination);
  noiseSrc.start(t);

  // --- Nappe sombre (Em grave, s'éteint lentement) ---
  const chordNotes = [40, 43, 47, 52, 55];
  for (const n of chordNotes) {
    const osc = c.createOscillator();
    const g = c.createGain();
    const f = c.createBiquadFilter();
    osc.type = 'sawtooth';
    osc.frequency.value = freq(n);
    f.type = 'lowpass';
    f.frequency.setValueAtTime(600, t + 0.1);
    f.frequency.exponentialRampToValueAtTime(150, t + 2.5);
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(0.06, t + 0.15);
    g.gain.setValueAtTime(0.06, t + 1.0);
    g.gain.linearRampToValueAtTime(0, t + 2.8);
    osc.connect(f);
    f.connect(g);
    g.connect(c.destination);
    osc.start(t);
    osc.stop(t + 3.0);
  }

  // --- Mélodie de mort (3 notes lentes, descendantes) ---
  const deathMelody = [[64, 0.2, 0.6], [62, 0.9, 0.6], [59, 1.6, 1.0]];
  for (const [n, start, dur] of deathMelody) {
    const osc = c.createOscillator();
    const g = c.createGain();
    const f = c.createBiquadFilter();
    osc.type = 'triangle';
    osc.frequency.value = freq(n);
    f.type = 'lowpass';
    f.frequency.setValueAtTime(1200, t + start);
    f.frequency.exponentialRampToValueAtTime(300, t + start + dur);
    g.gain.setValueAtTime(0, t + start);
    g.gain.linearRampToValueAtTime(0.12, t + start + 0.04);
    g.gain.setValueAtTime(0.12, t + start + dur * 0.6);
    g.gain.linearRampToValueAtTime(0, t + start + dur);
    osc.connect(f);
    f.connect(g);
    g.connect(c.destination);
    osc.start(t + start);
    osc.stop(t + start + dur + 0.1);
  }
}

// --- Exports pour le Music Lab ---
/** Retourne le contexte audio SANS le créer (peut être null). */
export function peekAudioContext() { return ctx; }

/** Reset complet : ferme le contexte audio et le recrée. Coupe tout son en cours. */
export function resetAudio() {
  playing = false;
  if (loopTimer) clearTimeout(loopTimer);
  loopTimer = null;
  if (ctx) { ctx.close().catch(() => {}); }
  ctx = null;
  masterGain = null;
  masterFilter = null;
  for (const name of LAYER_NAMES) delete layers[name];
}

export function playSectionByName(name) {
  const c = getCtx();
  if (c.state === 'suspended') c.resume();
  const t = c.currentTime + 0.05;
  const map = SECTIONS[currentTrack] || SECTIONS.main;
  if (map[name]) playSectionConfig(map[name], t);
}

export function playInstrumentDemo(name) {
  const c = getCtx();
  if (c.state === 'suspended') c.resume();
  const t = c.currentTime + 0.05;
  const demosMain = {
    kick:  () => kick(t),
    snare: () => snare(t),
    hihat: () => hihat(t, 0.12),
    bass:  () => bass(t, 40, BEAT * 2),
    lead:  () => lead(t, 71, BEAT * 2, 0.15),
    pad:   () => pad(t, [52, 55, 59], BEAT * 8),
    arp:   () => { [64, 67, 71, 74].forEach((n, i) => arp(t + i * BEAT * 0.5, n, BEAT * 0.5)); },
  };
  const demosDark = {
    timpani: () => timpani(t, 38, 0.4),
    cymbal:  () => cymbal(t, 0.1),
    cello:   () => cello(t, 38, BEAT * 2),
    brass:   () => brass(t, 62, BEAT * 2, 0.12),
    strings: () => strings(t, [50, 53, 57], BEAT * 6, 0.06),
    harp:    () => { [62, 65, 69, 74].forEach((n, i) => harp(t + i * BEAT * 0.4, n, BEAT * 0.8)); },
    brassHi: () => brassHigh(t, 62, BEAT * 2, 0.08),
  };
  const demos = currentTrack === 'dark' ? demosDark : demosMain;
  if (demos[name]) demos[name]();
}

export function playPowerUpAccent() {
  const c = getCtx();
  const t = c.currentTime;
  const notes = [83, 86, 88];
  for (let i = 0; i < notes.length; i++) {
    const osc = c.createOscillator();
    const g = c.createGain();
    osc.type = 'sine';
    osc.frequency.value = freq(notes[i]);
    g.gain.setValueAtTime(0, t + i * 0.06);
    g.gain.linearRampToValueAtTime(0.1, t + i * 0.06 + 0.01);
    g.gain.exponentialRampToValueAtTime(0.001, t + i * 0.06 + 0.2);
    osc.connect(g);
    g.connect(c.destination);
    osc.start(t + i * 0.06);
    osc.stop(t + i * 0.06 + 0.25);
  }
}
