let ctx = null;
let masterGain = null;
let playing = false;
let loopTimer = null;

const BPM = 110;
const BEAT = 60 / BPM;

function getCtx() {
  if (!ctx) {
    ctx = new (window.AudioContext || window.webkitAudioContext)();
    masterGain = ctx.createGain();
    masterGain.gain.value = 0.3;
    masterGain.connect(ctx.destination);
  }
  return ctx;
}

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
  gain.connect(masterGain);
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
  gain.connect(masterGain);
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
  gain.connect(masterGain);
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
  gain.connect(masterGain);
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
  gain.connect(masterGain);
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
  gain.connect(masterGain);
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
  gain.connect(masterGain);
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

// === SCHEDULING ===
// Structure : Intro → Couplet → Refrain → Couplet → Pont → Refrain final
// = 6 × 16 beats = 96 beats ≈ 52s à 110 BPM

function scheduleFullLoop() {
  if (!playing) return;
  const c = getCtx();
  const now = c.currentTime + 0.1;
  const sectionLen = 16 * BEAT;

  sectionIntro(now);
  sectionVerse(now + sectionLen);
  sectionChorus(now + sectionLen * 2);
  sectionVerse(now + sectionLen * 3);
  sectionBridge(now + sectionLen * 4);
  sectionOutro(now + sectionLen * 5);

  const totalLen = sectionLen * 6;
  loopTimer = setTimeout(scheduleFullLoop, totalLen * 1000 - 200);
}

export function startMusic() {
  if (playing) return;
  const c = getCtx();
  if (c.state === 'suspended') c.resume();
  playing = true;
  scheduleFullLoop();
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

export function isPlaying() {
  return playing;
}

export function setVolume(v) {
  if (masterGain) masterGain.gain.value = v;
}
