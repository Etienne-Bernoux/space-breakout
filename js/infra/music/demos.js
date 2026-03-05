// --- Demos : lecture individuelle d'instruments (pour music-lab) ---

import { getCtx, BEAT, setLayerVolume } from './audio-core.js';
import { kick, snare, hihat, bass, lead, pad, arp } from './instruments-main.js';
import { timpani, cymbal, cello, brass, strings, choir, harp, brassHigh } from './instruments-dark.js';
import { jazzKick, brushSnare, rimclick, walkBass, piano, pianoChord, sax, trumpet } from './instruments-cantina.js';
import { getTrack } from './scheduler.js';

function playInstrumentDemo(name) {
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
    choir:   () => choir(t, [38, 45, 50, 57], BEAT * 8, 0.05),
    harp:    () => { [62, 65, 69, 74].forEach((n, i) => harp(t + i * BEAT * 0.4, n, BEAT * 0.8)); },
    brassHi: () => brassHigh(t, 62, BEAT * 2, 0.08),
  };
  const demosCantina = {
    jazzKick:   () => jazzKick(t),
    brushSnare: () => brushSnare(t),
    rimclick:   () => rimclick(t),
    walkBass:   () => { [46, 50, 53, 50].forEach((n, i) => walkBass(t + i * BEAT, n, BEAT * 0.9)); },
    piano:      () => { [70, 74, 77, 74].forEach((n, i) => piano(t + i * BEAT * 0.5, n, BEAT * 0.8, 0.08)); },
    pianoChord: () => pianoChord(t, [58, 62, 65, 69], BEAT * 4),
    sax:        () => sax(t, 70, BEAT * 3, 0.1),
    trumpet:    () => trumpet(t, 70, BEAT * 2, 0.08),
  };
  const track = getTrack();
  const demos = track === 'dark' ? demosDark : track === 'cantina' ? demosCantina : demosMain;
  // S'assurer que le layer high est audible pour les démos
  setLayerVolume('high', 1, 0.1);
  if (demos[name]) demos[name]();
}

export { playInstrumentDemo };
