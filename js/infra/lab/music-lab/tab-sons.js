// Sons tab - Data definitions (shared by build.js and handlers.js)
// Draw functions removed (DOM version).

import { getTrack, playWinStinger, playGameOverStinger, playPowerUpAccent } from '../../../audio/infra/music/index.js';
import { playBounce, playAsteroidHit, playLoseLife, playLaunch, playShipExplosion, playAlienHit, playBossExplosion, playForgePurchase } from '../../../audio/infra/sfx/audio.js';

// --- Data multi-pistes ---
export const TRACKS = [
  { id: 'main', label: 'SPACE MAIN' },
  { id: 'dark', label: 'DARK ORCH' },
  { id: 'cantina', label: 'CANTINA' },
];

const SECTIONS = [
  { id: 'intro',     label: 'INTRO',     color: '#4488aa' },
  { id: 'verse',     label: 'VERSE',     color: '#44aa66' },
  { id: 'chorus',    label: 'CHORUS',    color: '#cc8833' },
  { id: 'bridge',    label: 'BRIDGE',    color: '#8855cc' },
  { id: 'breakdown', label: 'BRKDWN',    color: '#668899' },
  { id: 'climax',    label: 'CLIMAX',    color: '#ff4466' },
  { id: 'outro',     label: 'OUTRO',     color: '#cc4455' },
];

export const INSTRUMENTS_MAIN = [
  { id: 'kick',  label: 'KICK',  color: '#ff6644' },
  { id: 'snare', label: 'SNARE', color: '#ffaa33' },
  { id: 'hihat', label: 'HIHAT', color: '#ffdd44' },
  { id: 'bass',  label: 'BASS',  color: '#44aaff' },
  { id: 'lead',  label: 'LEAD',  color: '#ff44aa' },
  { id: 'pad',   label: 'PAD',   color: '#aa88ff' },
  { id: 'arp',   label: 'ARP',   color: '#44ffaa' },
];

export const INSTRUMENTS_DARK = [
  { id: 'timpani', label: 'TIMPANI', color: '#ff6644' },
  { id: 'cymbal',  label: 'CYMBAL',  color: '#ffaa33' },
  { id: 'cello',   label: 'CELLO',   color: '#44aaff' },
  { id: 'brass',   label: 'BRASS',   color: '#ff44aa' },
  { id: 'strings', label: 'STRINGS', color: '#aa88ff' },
  { id: 'choir',   label: 'CHOIR',   color: '#cc66aa' },
  { id: 'harp',    label: 'HARP',    color: '#44ffaa' },
  { id: 'brassHi', label: 'BRASS HI', color: '#ffee44' },
];

export const INSTRUMENTS_CANTINA = [
  { id: 'jazzKick',   label: 'KICK',    color: '#ff6644' },
  { id: 'brushSnare', label: 'BRUSH',   color: '#ffaa33' },
  { id: 'rimclick',   label: 'RIM',     color: '#ffdd44' },
  { id: 'walkBass',   label: 'BASS',    color: '#44aaff' },
  { id: 'piano',      label: 'PIANO',   color: '#ff44aa' },
  { id: 'pianoChord', label: 'CHORDS',  color: '#aa88ff' },
  { id: 'sax',        label: 'SAX',     color: '#ffcc44' },
  { id: 'trumpet',    label: 'TRUMPET', color: '#44ffaa' },
];

export function getInstruments() {
  const t = getTrack();
  if (t === 'dark') return INSTRUMENTS_DARK;
  if (t === 'cantina') return INSTRUMENTS_CANTINA;
  return INSTRUMENTS_MAIN;
}

const STINGER_GROUPS = [
  { label: 'STINGERS MUSICAUX', items: [
    { id: 'win',       label: 'WIN',       color: '#44ff88', fn: playWinStinger },
    { id: 'gameover',  label: 'GAMEOVER',  color: '#ff4444', fn: playGameOverStinger },
    { id: 'powerup',   label: 'POWER-UP',  color: '#ffcc00', fn: playPowerUpAccent },
  ]},
  { label: 'SFX GAMEPLAY', items: [
    { id: 'bounce',    label: 'BOUNCE',    color: '#4488ff', fn: playBounce },
    { id: 'asthit',    label: 'AST. HIT',  color: '#aa6633', fn: playAsteroidHit },
    { id: 'launch',    label: 'LAUNCH',    color: '#88ccff', fn: playLaunch },
    { id: 'loselife',  label: 'LOSE LIFE', color: '#ff6666', fn: playLoseLife },
    { id: 'explosion', label: 'SHIP EXPL', color: '#ff8800', fn: playShipExplosion },
    { id: 'forge',     label: 'FORGE',     color: '#ffd700', fn: playForgePurchase },
  ]},
  { label: 'SFX ALIEN', items: [
    { id: 'alienhit',  label: 'ALIEN HIT', color: '#33cc55', fn: playAlienHit },
    { id: 'alienexpl', label: 'ALIEN EXPL', color: '#44dd66', fn: playBossExplosion },
  ]},
];

/** Flat list (pour handlers). */
export function getStingers() {
  return STINGER_GROUPS.flatMap(g => g.items);
}

export function getStingerGroups() {
  return STINGER_GROUPS;
}

export function getSections() {
  return SECTIONS;
}
