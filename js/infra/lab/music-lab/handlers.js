// --- Music Lab DOM Handlers ---
// Event delegation sur #music-lab root. Plus de hitTest pixel.

import {
  startMusic, stopMusic, isPlaying,
  muffle, unmuffle,
  playSectionByName, playInstrumentDemo,
  setLayerVolume, getLayerVolumes, resetAudio,
  setTrack, getTrack, enableAdaptiveMode,
} from '../../../contexts/audio/infra/music/index.js';
import {
  isActive, setCurrentTab, setActivity, setMuffled, isMuffled,
  getSim, setLoopStartTime, getCurrentTab,
} from './state.js';
import { getStingers } from './tabs/index.js';
import { simApply } from './tabs/index.js';
import { updateMusicLab } from './update.js';

// Constants
const BPM = 110;
const BEAT = 60 / BPM;
const SECTION_DUR = 16 * BEAT;
const LOOP_ORDER = [
  'intro', 'verse', 'chorus', 'verse',
  'breakdown', 'chorus', 'bridge', 'climax',
  'verse', 'bridge', 'chorus', 'outro',
];

/**
 * @param {HTMLElement} root
 * @param {object} refs - from build.js
 * @param {object} opts - { onClose, refresh }
 */
export function attachMusicHandlers(root, refs, { onBack, refresh }) {
  root.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-action]');
    if (!btn) return;
    const action = btn.dataset.action;
    const sim = getSim();

    if (action === 'back') { if (onBack) onBack(); return; }

    // Tabs
    if (action === 'tab') {
      const idx = parseInt(btn.dataset.index);
      if (idx !== getCurrentTab()) {
        setCurrentTab(idx);
        refresh();
      }
      return;
    }

    // Transport
    if (action === 'transport') {
      if (isPlaying()) {
        stopMusic();
        setActivity(null, 0);
      } else {
        if (!sim.adaptiveEnabled) { enableAdaptiveMode(); sim.adaptiveEnabled = true; }
        startMusic();
        setLoopStartTime(Date.now());
        setActivity('Boucle complète', SECTION_DUR * LOOP_ORDER.length);
        simApply(sim);
      }
      refresh();
      return;
    }

    // Track selection
    if (action === 'track') {
      const trackId = btn.dataset.id;
      if (trackId !== getTrack()) {
        setTrack(trackId);
        if (isPlaying()) {
          stopMusic();
          setTimeout(() => {
            startMusic();
            setLoopStartTime(Date.now());
            setActivity('Boucle complète', SECTION_DUR * LOOP_ORDER.length);
            simApply(sim);
            refresh();
          }, 200);
        }
        refresh();
      }
      return;
    }

    // Section
    if (action === 'section') {
      resetAudio();
      setMuffled(false);
      const name = btn.dataset.id;
      playSectionByName(name);
      setActivity(`Section: ${name.toUpperCase()}`, SECTION_DUR);
      refresh();
      return;
    }

    // Instrument
    if (action === 'instrument') {
      const name = btn.dataset.id;
      playInstrumentDemo(name);
      const durs = { kick: 0.3, snare: 0.15, hihat: 0.08, bass: BEAT * 2, lead: BEAT * 2, pad: BEAT * 8, arp: BEAT * 2 };
      setActivity(`Instrument: ${name.toUpperCase()}`, durs[name] || 1);
      refresh();
      return;
    }

    // Stinger
    if (action === 'stinger') {
      const s = getStingers().find(s => s.id === btn.dataset.id);
      if (s && s.fn) {
        resetAudio();
        setMuffled(false);
        s.fn();
        const durs = { win: 2.0, gameover: 3.0, powerup: 0.4, bounce: 0.1, asthit: 0.2, launch: 0.15, loselife: 0.4, explosion: 1.2, alienhit: 0.3, alienexpl: 1.5 };
        setActivity(`Stinger: ${s.label}`, durs[s.id] || 1);
      }
      refresh();
      return;
    }

    // Intensity override
    if (action === 'intensity') {
      const level = parseInt(btn.dataset.level);
      sim.combo = 0;
      sim.powerUp = false;
      if (level === 0) sim.remaining = sim.total;
      else if (level === 1) sim.remaining = Math.round(sim.total * 0.6);
      else if (level === 2) sim.remaining = Math.round(sim.total * 0.4);
      else if (level === 3) sim.remaining = Math.round(sim.total * 0.2);
      else sim.remaining = Math.round(sim.total * 0.05);
      if (!sim.adaptiveEnabled) { enableAdaptiveMode(); sim.adaptiveEnabled = true; }
      simApply(sim);
      refresh();
      return;
    }

    // Gameplay actions
    if (action === 'gameplay') {
      const id = btn.dataset.id;
      if (!sim.adaptiveEnabled && id !== 'gp-reset') { enableAdaptiveMode(); sim.adaptiveEnabled = true; }
      if (id === 'gp-destroy') { sim.remaining = Math.max(0, sim.remaining - 1); sim.combo++; }
      else if (id === 'gp-combo-up') { sim.combo++; }
      else if (id === 'gp-combo-reset') { sim.combo = 0; }
      else if (id === 'gp-life') { sim.lives = Math.max(0, sim.lives - 1); sim.combo = 0; }
      else if (id === 'gp-powerup') { sim.powerUp = !sim.powerUp; }
      else if (id === 'gp-reset') { sim.remaining = sim.total; sim.combo = 0; sim.lives = 3; sim.powerUp = false; }
      simApply(sim);
      refresh();
      return;
    }

    // Layer toggle (Mix)
    if (action === 'layer') {
      const name = btn.dataset.name;
      const vols = getLayerVolumes();
      const cur = vols[name] || 0;
      setLayerVolume(name, cur > 0.01 ? 0 : 1, 0.3);
      setTimeout(refresh, 50);
      return;
    }

    // Muffle
    if (action === 'muffle') {
      const muffled = isMuffled();
      setMuffled(!muffled);
      if (!muffled) muffle(); else unmuffle();
      refresh();
      return;
    }
  });

}
