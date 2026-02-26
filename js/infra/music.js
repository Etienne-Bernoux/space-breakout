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

// === INSTRUMENTS ===

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

// --- Layer "high" : arp rapide + doublage octave lead ---

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
  osc.frequency.value = freq(note + 12); // octave au-dessus
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

// === PATTERNS (Mi mineur) ===
// E2=40 G2=43 A2=45 B2=47 D3=50
// E4=64 G4=67 A4=69 B4=71 D5=74 E5=76

// --- Section A : Intro (16 beats) — pad + arpèges, pas de drums ---
function sectionIntro(t0) {
  // Pad Em → Cmaj → G → D
  pad(t0, [52, 55, 59], 4 * BEAT);
  pad(t0 + 4 * BEAT, [48, 52, 55], 4 * BEAT);
  pad(t0 + 8 * BEAT, [55, 59, 62], 4 * BEAT);
  pad(t0 + 12 * BEAT, [50, 54, 57], 4 * BEAT);

  // Arpèges doux
  const arpNotes = [64, 71, 76, 71, 69, 71, 67, 64,
                    60, 67, 72, 67, 64, 67, 60, 64,
                    67, 74, 79, 74, 71, 74, 67, 71,
                    62, 69, 74, 69, 66, 69, 62, 66];
  for (let i = 0; i < 32; i++) {
    arp(t0 + i * BEAT * 0.5, arpNotes[i], BEAT * 0.6);
  }
}

// --- Section B : Couplet (16 beats) — drums légers + basse + mélodie ---
function sectionVerse(t0) {
  // Drums légers
  for (let i = 0; i < 16; i++) {
    if (i % 4 === 0) kick(t0 + i * BEAT);
    if (i % 4 === 2) hihat(t0 + i * BEAT, 0.06);
    if (i % 8 === 4) snare(t0 + i * BEAT);
  }

  // Basse
  const bassLine = [
    [40, 0, 3], [40, 3, 1], [43, 4, 3], [43, 7, 1],
    [45, 8, 3], [45, 11, 1], [47, 12, 2], [45, 14, 2]
  ];
  for (const [n, t, d] of bassLine) bass(t0 + t * BEAT, n, d * BEAT);

  // Pad
  pad(t0, [52, 55, 59], 4 * BEAT);
  pad(t0 + 4 * BEAT, [55, 59, 62], 4 * BEAT);
  pad(t0 + 8 * BEAT, [57, 60, 64], 4 * BEAT);
  pad(t0 + 12 * BEAT, [47, 55, 59], 4 * BEAT);

  // Mélodie couplet — retenue
  const mel = [
    [64, 0, 1.5], [67, 2, 1], [69, 3, 1],
    [67, 4, 1.5], [71, 6, 2],
    [69, 8, 1], [71, 9, 0.5], [74, 9.5, 1.5], [71, 11, 1],
    [69, 12, 1.5], [67, 14, 2],
  ];
  for (const [n, t, d] of mel) lead(t0 + t * BEAT, n, d * BEAT, 0.1);
}

// --- Section C : Refrain (16 beats) — drums complets + mélodie épique ---
function sectionChorus(t0) {
  // Drums complets
  for (let i = 0; i < 16; i++) {
    kick(t0 + i * BEAT);
    hihat(t0 + i * BEAT + BEAT * 0.5, 0.07);
    if (i % 4 === 2) snare(t0 + i * BEAT);
  }

  // Basse driving
  const bassLine = [
    [40, 0, 1], [40, 1, 1], [40, 2, 0.5], [43, 2.5, 1.5],
    [43, 4, 1], [43, 5, 1], [45, 6, 1], [47, 7, 1],
    [45, 8, 1], [45, 9, 1], [45, 10, 0.5], [43, 10.5, 1.5],
    [47, 12, 1], [47, 13, 1], [45, 14, 1], [43, 15, 1],
  ];
  for (const [n, t, d] of bassLine) bass(t0 + t * BEAT, n, d * BEAT);

  // Pad plus fort
  pad(t0, [52, 55, 59], 4 * BEAT);
  pad(t0 + 4 * BEAT, [55, 59, 62], 4 * BEAT);
  pad(t0 + 8 * BEAT, [57, 60, 64], 4 * BEAT);
  pad(t0 + 12 * BEAT, [47, 54, 59], 4 * BEAT);

  // Mélodie refrain — épique, mémorable
  const mel = [
    [71, 0, 1], [74, 1, 1], [76, 2, 2],
    [74, 4, 0.5], [76, 4.5, 0.5], [79, 5, 1.5], [76, 6.5, 1.5],
    [74, 8, 1], [71, 9, 1], [74, 10, 1], [76, 11, 1],
    [74, 12, 0.5], [71, 12.5, 0.5], [69, 13, 1], [67, 14, 1], [64, 15, 1],
  ];
  for (const [n, t, d] of mel) lead(t0 + t * BEAT, n, d * BEAT, 0.15);
}

// --- Section D : Pont (16 beats) — breakdown, arpèges + montée ---
function sectionBridge(t0) {
  // Drums allégés
  for (let i = 0; i < 16; i++) {
    if (i % 2 === 0) kick(t0 + i * BEAT);
    if (i >= 12) hihat(t0 + i * BEAT + BEAT * 0.5, 0.05);
  }

  // Basse tenue
  bass(t0, 40, 4 * BEAT);
  bass(t0 + 4 * BEAT, 45, 4 * BEAT);
  bass(t0 + 8 * BEAT, 43, 4 * BEAT);
  bass(t0 + 12 * BEAT, 47, 4 * BEAT);

  // Pad
  pad(t0, [52, 55, 59], 8 * BEAT);
  pad(t0 + 8 * BEAT, [55, 59, 62], 8 * BEAT);

  // Arpèges montants (buildup)
  const arpNotes = [64, 67, 71, 67, 69, 71, 74, 71,
                    67, 71, 74, 71, 69, 74, 76, 74,
                    71, 74, 76, 74, 76, 79, 76, 79,
                    74, 76, 79, 76, 79, 81, 79, 83];
  for (let i = 0; i < 32; i++) {
    const vol = 0.04 + (i / 32) * 0.08;
    arp(t0 + i * BEAT * 0.5, arpNotes[i], BEAT * 0.55);
  }
}

// --- Section E : Refrain final (16 beats) — refrain avec variation ---
function sectionOutro(t0) {
  // Drums complets
  for (let i = 0; i < 16; i++) {
    kick(t0 + i * BEAT);
    hihat(t0 + i * BEAT + BEAT * 0.5, 0.07);
    if (i % 4 === 2) snare(t0 + i * BEAT);
    if (i % 4 === 0 && i > 0) hihat(t0 + i * BEAT, 0.04);
  }

  // Basse
  const bassLine = [
    [40, 0, 1], [40, 1, 0.5], [43, 1.5, 0.5], [40, 2, 1], [43, 3, 1],
    [45, 4, 1], [45, 5, 1], [43, 6, 1], [47, 7, 1],
    [40, 8, 1], [40, 9, 0.5], [43, 9.5, 0.5], [45, 10, 1], [47, 11, 1],
    [45, 12, 2], [43, 14, 1], [40, 15, 1],
  ];
  for (const [n, t, d] of bassLine) bass(t0 + t * BEAT, n, d * BEAT);

  // Pad
  pad(t0, [52, 55, 59], 4 * BEAT);
  pad(t0 + 4 * BEAT, [57, 60, 64], 4 * BEAT);
  pad(t0 + 8 * BEAT, [55, 59, 62], 4 * BEAT);
  pad(t0 + 12 * BEAT, [52, 55, 59], 4 * BEAT);

  // Mélodie finale — variante du refrain, plus haute
  const mel = [
    [76, 0, 1], [79, 1, 1], [81, 2, 2],
    [79, 4, 0.5], [76, 4.5, 0.5], [74, 5, 1.5], [76, 6.5, 1.5],
    [74, 8, 0.5], [76, 8.5, 0.5], [79, 9, 1], [76, 10, 1], [74, 11, 1],
    [71, 12, 1.5], [69, 13.5, 1], [67, 14.5, 0.5], [64, 15, 1],
  ];
  for (const [n, t, d] of mel) lead(t0 + t * BEAT, n, d * BEAT, 0.15);
}

// --- Section F : Breakdown (16 beats) — minimal, tendu, basse + hihats ---
function sectionBreakdown(t0) {
  // Drums minimalistes — kick espacés, hihats serrés
  for (let i = 0; i < 16; i++) {
    if (i % 8 === 0) kick(t0 + i * BEAT);
    if (i % 2 === 0) hihat(t0 + i * BEAT, 0.04);
    hihat(t0 + i * BEAT + BEAT * 0.5, 0.03);
  }
  // Snare rolls sur les 4 derniers beats
  for (let i = 12; i < 16; i++) {
    snare(t0 + i * BEAT);
    if (i >= 14) snare(t0 + i * BEAT + BEAT * 0.5);
  }

  // Basse menaçante — notes longues, filtre bas
  bass(t0, 40, 8 * BEAT);
  bass(t0 + 8 * BEAT, 43, 4 * BEAT);
  bass(t0 + 12 * BEAT, 45, 4 * BEAT);

  // Pad très filtré, tension
  pad(t0, [52, 55, 58], 8 * BEAT);  // Em(b6) → tension
  pad(t0 + 8 * BEAT, [52, 55, 59], 8 * BEAT);
}

// --- Section G : Climax (16 beats) — intensité max, double-time hihats ---
function sectionClimax(t0) {
  // Drums double-time — kick chaque beat, hihats en croches
  for (let i = 0; i < 16; i++) {
    kick(t0 + i * BEAT);
    hihat(t0 + i * BEAT, 0.08);
    hihat(t0 + i * BEAT + BEAT * 0.25, 0.05);
    hihat(t0 + i * BEAT + BEAT * 0.5, 0.07);
    hihat(t0 + i * BEAT + BEAT * 0.75, 0.04);
    if (i % 2 === 1) snare(t0 + i * BEAT);
  }

  // Basse agressive — motif rapide
  const bassLine = [
    [40, 0, 0.5], [40, 0.5, 0.5], [43, 1, 0.5], [45, 1.5, 0.5],
    [47, 2, 1], [45, 3, 0.5], [43, 3.5, 0.5],
    [40, 4, 0.5], [40, 4.5, 0.5], [43, 5, 0.5], [47, 5.5, 0.5],
    [45, 6, 1], [43, 7, 0.5], [40, 7.5, 0.5],
    [40, 8, 0.5], [43, 8.5, 0.5], [45, 9, 0.5], [47, 9.5, 0.5],
    [48, 10, 1], [47, 11, 0.5], [45, 11.5, 0.5],
    [43, 12, 1], [45, 13, 1], [47, 14, 1], [40, 15, 1],
  ];
  for (const [n, t, d] of bassLine) bass(t0 + t * BEAT, n, d * BEAT);

  // Pad épais
  pad(t0, [52, 55, 59, 64], 4 * BEAT);
  pad(t0 + 4 * BEAT, [55, 59, 62, 67], 4 * BEAT);
  pad(t0 + 8 * BEAT, [57, 60, 64, 69], 4 * BEAT);
  pad(t0 + 12 * BEAT, [52, 55, 59, 64], 4 * BEAT);

  // Mélodie climax — octave haute, urgente
  const mel = [
    [76, 0, 0.5], [79, 0.5, 0.5], [81, 1, 1], [83, 2, 1], [81, 3, 1],
    [79, 4, 0.5], [81, 4.5, 0.5], [83, 5, 1], [86, 6, 2],
    [83, 8, 0.5], [81, 8.5, 0.5], [79, 9, 1], [81, 10, 1], [83, 11, 1],
    [81, 12, 1], [79, 13, 1], [76, 14, 1], [74, 15, 1],
  ];
  for (const [n, t, d] of mel) {
    lead(t0 + t * BEAT, n, d * BEAT, 0.18);
    leadOctave(t0 + t * BEAT, n, d * BEAT, 0.06);
  }

  // Arp rapide (16th notes) — layer high
  const arpNotes = [76, 79, 83, 79, 81, 76, 79, 83,
                    79, 83, 86, 83, 81, 79, 83, 81,
                    83, 86, 88, 86, 83, 81, 79, 83,
                    81, 79, 76, 79, 81, 83, 79, 76];
  for (let i = 0; i < 32; i++) {
    arpFast(t0 + i * BEAT * 0.5, arpNotes[i % arpNotes.length], BEAT * 0.35);
  }
}

// === SCHEDULING ===
const SECTION_MAP = {
  intro: sectionIntro, verse: sectionVerse, chorus: sectionChorus,
  bridge: sectionBridge, breakdown: sectionBreakdown,
  climax: sectionClimax, outro: sectionOutro,
};

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
let currentSectionStartTime = 0; // AudioContext time
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

  const fn = SECTION_MAP[sectionName];
  if (fn) fn(now);
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
  const tempo = 0.14; // durée d'une croche

  // --- Fanfare mélodique (square, brillant) ---
  // Motif montant rapide puis accord final tenu
  const melody = [
    [64, 0, 1],    // E4
    [67, 1, 1],    // G4
    [71, 2, 1],    // B4
    [76, 3, 1],    // E5
    [79, 4, 1],    // G5
    [83, 5, 1.5],  // B5 (légèrement tenu)
    [88, 7, 5],    // E6 — note finale longue
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
  const chord = [64, 68, 71, 76, 80]; // E major large
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
  const melody = [[64, 0.2, 0.6], [62, 0.9, 0.6], [59, 1.6, 1.0]];
  for (const [n, start, dur] of melody) {
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
  const map = { intro: sectionIntro, verse: sectionVerse, chorus: sectionChorus, bridge: sectionBridge, breakdown: sectionBreakdown, climax: sectionClimax, outro: sectionOutro };
  if (map[name]) map[name](t);
}

export function playInstrumentDemo(name) {
  const c = getCtx();
  if (c.state === 'suspended') c.resume();
  const t = c.currentTime + 0.05;
  const demos = {
    kick:  () => kick(t),
    snare: () => snare(t),
    hihat: () => hihat(t, 0.12),
    bass:  () => bass(t, 40, BEAT * 2),
    lead:  () => lead(t, 71, BEAT * 2, 0.15),
    pad:   () => pad(t, [52, 55, 59], BEAT * 8),
    arp:   () => { [64, 67, 71, 74].forEach((n, i) => arp(t + i * BEAT * 0.5, n, BEAT * 0.5)); },
  };
  if (demos[name]) demos[name]();
}

export function playPowerUpAccent() {
  const c = getCtx();
  const t = c.currentTime;
  // Petit arpège rapide montant : B5 → D6 → E6
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
