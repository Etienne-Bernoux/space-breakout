// --- Section Engine : registre d'instruments + dispatch data-driven ---

import { BEAT } from './audio-core.js';
import { kick, snare, hihat, bass, lead, pad, arp, arpFast, leadOctave } from './instruments-main.js';
import { timpani, cymbal, cello, brass, strings, harp, brassHigh, choir } from './instruments-dark.js';
import { MAIN_INTRO, MAIN_VERSE, MAIN_CHORUS, MAIN_BRIDGE, MAIN_BREAKDOWN, MAIN_CLIMAX, MAIN_OUTRO } from './sections-main.js';
import { DARK_INTRO, DARK_VERSE, DARK_CHORUS, DARK_BRIDGE, DARK_BREAKDOWN, DARK_CLIMAX, DARK_OUTRO } from './sections-dark.js';

// Chaque instrument est référencé par nom dans les configs.
const INSTRUMENTS = {
  // Main synth
  kick, snare, hihat, bass, lead, pad, arp, arpFast, leadOctave,
  // Dark orchestral
  timpani, cymbal, cello, brass, strings, harp, brassHigh, choir,
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

export { INSTRUMENTS, playSectionConfig, SECTIONS };
