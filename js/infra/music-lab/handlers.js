// Event handlers for Music Lab

import {
  startMusic, stopMusic, isPlaying,
  muffle, unmuffle,
  playSectionByName, playInstrumentDemo,
  setLayerVolume, getLayerVolumes, resetAudio,
  setTrack, getTrack, enableAdaptiveMode,
} from '../music/index.js';
import {
  setCurrentTab, setScrollY, setActivity, setMuffled, isMuffled,
  getSim, setHovered, getLoopStartTime, setLoopStartTime, getCurrentTab,
} from './state.js';
import { hitTest } from './hit-test.js';
import { getInstruments, getStingers, TRACKS } from './tab-sons.js';
import { simApply } from './tab-gameplay.js';

// Constants
const BPM = 110;
const BEAT = 60 / BPM;
const SECTION_DUR = 16 * BEAT;
const LOOP_ORDER = [
  'intro', 'verse', 'chorus', 'verse',
  'breakdown', 'chorus', 'bridge', 'climax',
  'verse', 'bridge', 'chorus', 'outro',
];
const SCROLL_SPEED = 40;

export function handleMusicLabTap(x, y) {
  const id = hitTest(x, y);
  if (!id) return;

  const sim = getSim();

  // Onglets
  if (id.startsWith('tab-')) {
    const idx = parseInt(id.replace('tab-', ''));
    if (idx !== getCurrentTab()) {
      setCurrentTab(idx);
      setScrollY(0);
    }
    return;
  }

  // Transport
  if (id === 'transport') {
    if (isPlaying()) {
      stopMusic();
      setActivity(null, 0);
    } else {
      if (!sim.adaptiveEnabled) {
        enableAdaptiveMode();
        sim.adaptiveEnabled = true;
      }
      startMusic();
      setLoopStartTime(Date.now());
      setActivity('Boucle complète', SECTION_DUR * LOOP_ORDER.length);
      simApply(sim);
    }
    return;
  }

  // --- Track selection ---
  if (id.startsWith('track-')) {
    const trackId = id.replace('track-', '');
    if (trackId !== getTrack()) {
      setTrack(trackId);
      // Si la musique joue, on redémarre pour appliquer la piste
      if (isPlaying()) {
        stopMusic();
        setTimeout(() => {
          startMusic();
          setLoopStartTime(Date.now());
          setActivity('Boucle complète', SECTION_DUR * LOOP_ORDER.length);
          simApply(sim);
        }, 200);
      }
    }
    return;
  }

  // --- Onglet Sons ---
  if (id.startsWith('section-')) {
    resetAudio();
    setMuffled(false);
    const name = id.replace('section-', '');
    playSectionByName(name);
    setActivity(`Section: ${name.toUpperCase()}`, SECTION_DUR);
    return;
  }

  if (id.startsWith('inst-')) {
    const name = id.replace('inst-', '');
    playInstrumentDemo(name);
    const durs = { kick: 0.3, snare: 0.15, hihat: 0.08, bass: BEAT * 2, lead: BEAT * 2, pad: BEAT * 8, arp: BEAT * 2 };
    setActivity(`Instrument: ${name.toUpperCase()}`, durs[name] || 1);
    return;
  }

  if (id.startsWith('stinger-')) {
    const s = getStingers().find(s => `stinger-${s.id}` === id);
    if (s && s.fn) {
      resetAudio();
      setMuffled(false);
      s.fn();
      const durs = { win: 2.0, gameover: 3.0, powerup: 0.4 };
      setActivity(`Stinger: ${s.label}`, durs[s.id] || 1);
    }
    return;
  }

  // --- Onglet Gameplay ---
  if (id.startsWith('intensity-')) {
    const level = parseInt(id.replace('intensity-', ''));
    // Force l'état simulé pour atteindre ce niveau (override simplifié)
    sim.combo = 0;
    sim.powerUp = false;
    if (level === 0) sim.remaining = sim.total;
    else if (level === 1) sim.remaining = Math.round(sim.total * 0.6);
    else if (level === 2) sim.remaining = Math.round(sim.total * 0.4);
    else if (level === 3) sim.remaining = Math.round(sim.total * 0.2);
    else sim.remaining = Math.round(sim.total * 0.05);
    if (!sim.adaptiveEnabled) {
      enableAdaptiveMode();
      sim.adaptiveEnabled = true;
    }
    simApply(sim);
    return;
  }

  if (id === 'gp-destroy') {
    sim.remaining = Math.max(0, sim.remaining - 1);
    sim.combo++;
    if (!sim.adaptiveEnabled) {
      enableAdaptiveMode();
      sim.adaptiveEnabled = true;
    }
    simApply(sim);
    return;
  }

  if (id === 'gp-combo-up') {
    sim.combo++;
    if (!sim.adaptiveEnabled) {
      enableAdaptiveMode();
      sim.adaptiveEnabled = true;
    }
    simApply(sim);
    return;
  }

  if (id === 'gp-combo-reset') {
    sim.combo = 0;
    simApply(sim);
    return;
  }

  if (id === 'gp-life') {
    sim.lives = Math.max(0, sim.lives - 1);
    sim.combo = 0; // la perte de vie reset le combo (comme en jeu)
    simApply(sim);
    return;
  }

  if (id === 'gp-powerup') {
    sim.powerUp = !sim.powerUp;
    simApply(sim);
    return;
  }

  if (id === 'gp-reset') {
    sim.remaining = sim.total;
    sim.combo = 0;
    sim.lives = 3;
    sim.powerUp = false;
    simApply(sim);
    return;
  }

  // --- Onglet Mix ---
  if (id.startsWith('layer-')) {
    const name = id.replace('layer-', '');
    const vols = getLayerVolumes();
    const cur = vols[name] || 0;
    setLayerVolume(name, cur > 0.01 ? 0 : 1, 0.3);
    return;
  }

  if (id === 'fx-muffle') {
    const muffled = isMuffled();
    setMuffled(!muffled);
    if (!muffled) {
      muffle();
    } else {
      unmuffle();
    }
  }
}

export function handleMusicLabHover(x, y) {
  setHovered(hitTest(x, y));
}

export function handleMusicLabScroll(deltaY) {
  const scrollY = getScrollY();
  const newScrollY = scrollY + (deltaY > 0 ? SCROLL_SPEED : -SCROLL_SPEED);
  setScrollY(Math.max(0, newScrollY));
}
