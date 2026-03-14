// --- Instruments piste Cantina (Jazz spatial — style bar Star Wars) ---

import { getCtx, freq, layers } from './audio-core.js';

/** Kick jazz léger : sine rapide pitch-drop, court et discret */
function jazzKick(time, vol = 0.3) {
  const c = getCtx();
  const osc = c.createOscillator();
  osc.frequency.setValueAtTime(100, time);
  osc.frequency.exponentialRampToValueAtTime(40, time + 0.08);
  const gain = c.createGain();
  gain.gain.setValueAtTime(vol, time);
  gain.gain.exponentialRampToValueAtTime(0.001, time + 0.15);
  osc.connect(gain);
  gain.connect(layers.drums);
  osc.start(time);
  osc.stop(time + 0.15);
}

/** Balai sur caisse claire : bruit bandpass, shuffle feel */
function brushSnare(time, vol = 0.09) {
  const c = getCtx();
  const len = c.sampleRate * 0.06;
  const buf = c.createBuffer(1, len, c.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
  const src = c.createBufferSource();
  src.buffer = buf;
  const bp = c.createBiquadFilter();
  bp.type = 'bandpass';
  bp.frequency.value = 2500;
  bp.Q.value = 0.6;
  const gain = c.createGain();
  gain.gain.setValueAtTime(vol, time);
  gain.gain.exponentialRampToValueAtTime(0.001, time + 0.06);
  src.connect(bp);
  bp.connect(gain);
  gain.connect(layers.drums);
  src.start(time);
}

/** Rim click : clic sec métallique */
function rimclick(time, vol = 0.12) {
  const c = getCtx();
  const osc = c.createOscillator();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(1200, time);
  osc.frequency.exponentialRampToValueAtTime(600, time + 0.025);
  const gain = c.createGain();
  gain.gain.setValueAtTime(vol, time);
  gain.gain.exponentialRampToValueAtTime(0.001, time + 0.025);
  osc.connect(gain);
  gain.connect(layers.drums);
  osc.start(time);
  osc.stop(time + 0.03);
}

/** Walking bass : sawtooth grave filtré, attaque nette */
function walkBass(time, note, dur) {
  const c = getCtx();
  const osc = c.createOscillator();
  osc.type = 'sawtooth';
  osc.frequency.value = freq(note);
  const filter = c.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.setValueAtTime(700, time);
  filter.frequency.exponentialRampToValueAtTime(150, time + dur);
  const gain = c.createGain();
  gain.gain.setValueAtTime(0.22, time);
  gain.gain.setValueAtTime(0.18, time + dur * 0.8);
  gain.gain.linearRampToValueAtTime(0, time + dur);
  osc.connect(filter);
  filter.connect(gain);
  gain.connect(layers.bass);
  osc.start(time);
  osc.stop(time + dur);
}

/** Piano comp : pluck percussif (sine + harmoniques paires) */
function piano(time, note, dur, vol = 0.07) {
  const c = getCtx();
  const f = freq(note);
  const harmonics = [1, 2, 4];
  const vols = [vol, vol * 0.25, vol * 0.08];
  for (let h = 0; h < harmonics.length; h++) {
    const osc = c.createOscillator();
    osc.type = 'sine';
    osc.frequency.value = f * harmonics[h];
    const g = c.createGain();
    g.gain.setValueAtTime(vols[h], time);
    g.gain.exponentialRampToValueAtTime(0.001, time + dur * (1 - h * 0.25));
    osc.connect(g);
    g.connect(layers.lead);
    osc.start(time);
    osc.stop(time + dur);
  }
}

/** Piano accord : stab percussif (sines) */
function pianoChord(time, notes, dur) {
  const c = getCtx();
  for (const n of notes) {
    const osc = c.createOscillator();
    osc.type = 'sine';
    osc.frequency.value = freq(n);
    const g = c.createGain();
    g.gain.setValueAtTime(0.045, time);
    g.gain.exponentialRampToValueAtTime(0.001, time + dur);
    osc.connect(g);
    g.connect(layers.pad);
    osc.start(time);
    osc.stop(time + dur);
  }
}

/**
 * Saxophone : 2 sawtooth désaccordés + vibrato prononcé + filtre résonant.
 * Son riche et nasillard — instrument lead principal de la cantina.
 */
function sax(time, note, dur, vol = 0.09) {
  const c = getCtx();
  const f = freq(note);

  // 2 oscillateurs désaccordés (richesse)
  const osc1 = c.createOscillator();
  osc1.type = 'sawtooth';
  osc1.frequency.value = f;
  const osc2 = c.createOscillator();
  osc2.type = 'sawtooth';
  osc2.frequency.value = f * 1.006;

  // Vibrato LFO (prononcé — jazz expressif)
  const lfo = c.createOscillator();
  const lfoG = c.createGain();
  lfo.frequency.value = 5.5;
  lfoG.gain.value = 5;
  lfo.connect(lfoG);
  lfoG.connect(osc1.frequency);
  lfoG.connect(osc2.frequency);

  // Filtre résonant nasillard
  const filter = c.createBiquadFilter();
  filter.type = 'bandpass';
  filter.frequency.setValueAtTime(f * 3, time);
  filter.frequency.exponentialRampToValueAtTime(f * 1.5, time + dur);
  filter.Q.value = 2;

  // Enveloppe : attaque rapide, sustain, release court
  const gain = c.createGain();
  gain.gain.setValueAtTime(0, time);
  gain.gain.linearRampToValueAtTime(vol, time + 0.03);
  gain.gain.setValueAtTime(vol * 0.85, time + dur * 0.7);
  gain.gain.linearRampToValueAtTime(0, time + dur);

  osc1.connect(filter);
  osc2.connect(filter);
  filter.connect(gain);
  gain.connect(layers.lead);
  lfo.start(time);
  osc1.start(time);
  osc2.start(time);
  lfo.stop(time + dur);
  osc1.stop(time + dur);
  osc2.stop(time + dur);
}

/** Trompette : sawtooth + vibrato, filtre LP — pour réponses call & response */
function trumpet(time, note, dur, vol = 0.06) {
  const c = getCtx();
  const osc = c.createOscillator();
  osc.type = 'sawtooth';
  osc.frequency.value = freq(note);
  const lfo = c.createOscillator();
  const lfoG = c.createGain();
  lfo.frequency.value = 4.5;
  lfoG.gain.value = 3;
  lfo.connect(lfoG);
  lfoG.connect(osc.frequency);
  const filter = c.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.setValueAtTime(1400, time);
  filter.frequency.exponentialRampToValueAtTime(500, time + dur);
  const gain = c.createGain();
  gain.gain.setValueAtTime(0, time);
  gain.gain.linearRampToValueAtTime(vol, time + 0.04);
  gain.gain.setValueAtTime(vol, time + dur - 0.04);
  gain.gain.linearRampToValueAtTime(0, time + dur);
  osc.connect(filter);
  filter.connect(gain);
  gain.connect(layers.high);
  lfo.start(time);
  osc.start(time);
  lfo.stop(time + dur);
  osc.stop(time + dur);
}

export { jazzKick, brushSnare, rimclick, walkBass, piano, pianoChord, sax, trumpet };
