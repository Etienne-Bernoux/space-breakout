// --- Instruments piste Dark (Orchestral) ---

import { getCtx, freq, layers } from './audio-core.js';

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
  gain.connect(layers.pad || getCtx().destination);
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
  gain.connect(layers.lead || getCtx().destination);
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
  gain.connect(layers.drums || getCtx().destination);
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
  ng.connect(layers.drums || getCtx().destination);
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
  gain.connect(layers.bass || getCtx().destination);
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
  gain.connect(layers.high || getCtx().destination);
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
  gain.connect(layers.high || getCtx().destination);
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
  g.connect(layers.drums || getCtx().destination);
  src.start(time);
}

/** Chœur 4 voix (SATB) : formants par registre + vibrato */
function choir(time, notes, dur, vol = 0.06) {
  const c = getCtx();
  const dest = layers.pad || getCtx().destination;
  // Formants par registre vocal (voyelle "aah")
  const VOICE = {
    bass:    [{ f: 600, q: 4, g: 1.3 }, { f: 1000, q: 5, g: 0.7 }, { f: 2400, q: 5, g: 0.2 }],
    tenor:   [{ f: 700, q: 5, g: 1.1 }, { f: 1100, q: 5, g: 0.8 }, { f: 2600, q: 5, g: 0.3 }],
    alto:    [{ f: 800, q: 5, g: 1.0 }, { f: 1200, q: 6, g: 0.7 }, { f: 2800, q: 5, g: 0.3 }],
    soprano: [{ f: 900, q: 5, g: 0.9 }, { f: 1300, q: 6, g: 0.8 }, { f: 3200, q: 4, g: 0.4 }],
  };
  function register(midi) {
    if (midi < 48) return 'bass';
    if (midi < 60) return 'tenor';
    if (midi < 72) return 'alto';
    return 'soprano';
  }
  const master = c.createGain();
  master.gain.setValueAtTime(0, time);
  master.gain.linearRampToValueAtTime(vol, time + 0.7);
  if (dur > 1.4) master.gain.setValueAtTime(vol, time + dur - 0.7);
  master.gain.linearRampToValueAtTime(0, time + dur);
  master.connect(dest);
  // Vibrato commun ~5Hz ±8 cents
  const lfo = c.createOscillator();
  const lfoG = c.createGain();
  lfo.type = 'sine';
  lfo.frequency.value = 5;
  lfoG.gain.value = 8;
  lfo.connect(lfoG);
  lfo.start(time);
  lfo.stop(time + dur);
  for (const n of notes) {
    const fmts = VOICE[register(n)];
    // 3 chanteurs par voix (detune)
    for (const det of [0, 8, -8]) {
      // Sine = corps chaud, saw (filtré) = harmoniques pour formants
      const sine = c.createOscillator();
      sine.type = 'sine';
      sine.frequency.value = freq(n);
      sine.detune.value = det;
      lfoG.connect(sine.detune);
      const sineG = c.createGain();
      sineG.gain.value = 0.6; // fondamentale chaude
      sine.connect(sineG);
      sineG.connect(master);
      sine.start(time);
      sine.stop(time + dur);
      const saw = c.createOscillator();
      saw.type = 'sawtooth';
      saw.frequency.value = freq(n);
      saw.detune.value = det;
      lfoG.connect(saw.detune);
      // Lowpass pour dompter les aigus métalliques
      const lp = c.createBiquadFilter();
      lp.type = 'lowpass';
      lp.frequency.value = 3000;
      lp.Q.value = 0.5;
      saw.connect(lp);
      for (const fm of fmts) {
        const bp = c.createBiquadFilter();
        bp.type = 'bandpass';
        bp.frequency.value = fm.f;
        bp.Q.value = fm.q;
        const fg = c.createGain();
        fg.gain.value = fm.g * 0.5; // atténué vs sine
        lp.connect(bp);
        bp.connect(fg);
        fg.connect(master);
      }
      saw.start(time);
      saw.stop(time + dur);
    }
  }
}

export { strings, brass, timpani, cello, harp, brassHigh, cymbal, choir };
