// Sons tab content and data

import { getTrack, playWinStinger, playGameOverStinger, playPowerUpAccent } from '../music/index.js';
import { playShipExplosion } from '../audio.js';
import { drawBtn, drawLabel } from './draw-helpers.js';
import { getHovered } from './state.js';

// --- Data multi-pistes ---
export const TRACKS = [
  { id: 'main', label: 'SPACE MAIN' },
  { id: 'dark', label: 'DARK ORCH' },
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

export function getInstruments() {
  return getTrack() === 'dark' ? INSTRUMENTS_DARK : INSTRUMENTS_MAIN;
}

const STINGERS = [
  { id: 'win',       label: 'WIN',       color: '#44ff88', fn: playWinStinger },
  { id: 'gameover',  label: 'GAMEOVER',  color: '#ff4444', fn: playGameOverStinger },
  { id: 'powerup',   label: 'POWER-UP',  color: '#ffcc00', fn: playPowerUpAccent },
  { id: 'explosion', label: 'EXPLOSION', color: '#ff8800', fn: playShipExplosion },
];

export function getStingers() {
  return STINGERS;
}

export function getSections() {
  return SECTIONS;
}

export function drawTabSons(ctx, col1, startY, W, activeSec) {
  const hovered = getHovered();
  const btnW = 120;
  const btnH = 32;
  const gap = 8;
  let y = startY;

  // Piste — boutons de sélection
  drawLabel(ctx, 'PISTE', col1, y);
  y += 14;
  const trackBtnW = 130;
  for (let i = 0; i < TRACKS.length; i++) {
    const bx = col1 + i * (trackBtnW + gap);
    const isCurrent = TRACKS[i].id === getTrack();
    drawBtn(ctx, bx, y, trackBtnW, btnH, TRACKS[i].label, '#00d4ff', hovered === `track-${TRACKS[i].id}`, isCurrent);
  }
  y += btnH + gap;

  // Sections
  y += 24;
  drawLabel(ctx, 'SECTIONS', col1, y);
  y += 14;
  const secPerRow = 4;
  for (let i = 0; i < SECTIONS.length; i++) {
    const s = SECTIONS[i];
    const row = Math.floor(i / secPerRow);
    const col = i % secPerRow;
    const bx = col1 + col * (btnW + gap);
    const by = y + row * (btnH + gap);
    drawBtn(ctx, bx, by, btnW, btnH, s.label, s.color, hovered === `section-${s.id}`, activeSec === s.id);
  }
  const secRows = Math.ceil(SECTIONS.length / secPerRow);
  y += secRows * (btnH + gap) + 8;

  // Instruments (dynamique par piste)
  const instruments = getInstruments();
  drawLabel(ctx, 'INSTRUMENTS', col1, y);
  y += 14;
  const instPerRow = 4;
  for (let i = 0; i < instruments.length; i++) {
    const inst = instruments[i];
    const row = Math.floor(i / instPerRow);
    const col = i % instPerRow;
    const bx = col1 + col * (btnW + gap);
    const by = y + row * (btnH + gap);
    drawBtn(ctx, bx, by, btnW, btnH, inst.label, inst.color, hovered === `inst-${inst.id}`, false);
  }
  const instRows = Math.ceil(instruments.length / instPerRow);
  y += instRows * (btnH + gap) + 8;

  // Stingers
  drawLabel(ctx, 'STINGERS', col1, y);
  y += 14;
  for (let i = 0; i < STINGERS.length; i++) {
    const s = STINGERS[i];
    const bx = col1 + i * (btnW + gap);
    drawBtn(ctx, bx, y, btnW, btnH, s.label, s.color, hovered === `stinger-${s.id}`, false);
  }
  y += btnH + 16;

  return y;
}
