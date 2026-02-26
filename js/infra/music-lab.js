// --- Music Lab : panel de test musical accessible via ?mus ---
// 3 onglets : Sons · Gameplay · Mix
// Pensé pour supporter plusieurs pistes à terme.

import { CONFIG } from '../config.js';
import {
  startMusic, stopMusic, isPlaying, setVolume,
  muffle, unmuffle,
  playWinStinger, playGameOverStinger, playPowerUpAccent,
  playSectionByName, playInstrumentDemo, peekAudioContext, resetAudio,
  setLayerVolume, getLayerVolumes, LAYER_NAMES, getCurrentSection,
  enableAdaptiveMode, requestNextSection,
} from './music.js';

let active = false;
let muffled = false;
let hovered = null;
let scrollY = 0;
const SCROLL_SPEED = 40;

// --- Onglets ---
const TABS = ['Sons', 'Gameplay', 'Mix'];
let currentTab = 0; // index

// --- Activity tracker ---
const BPM = 110;
const BEAT = 60 / BPM;
const SECTION_DUR = 16 * BEAT;

let activity = { label: null, startTime: 0, duration: 0 };

// --- Loop section tracking ---
const LOOP_ORDER = [
  'intro', 'verse', 'chorus', 'verse',
  'breakdown', 'chorus', 'bridge', 'climax',
  'verse', 'bridge', 'chorus', 'outro',
];
let loopStartTime = 0;

function getActiveLoopSection() {
  if (!isPlaying()) return null;
  const elapsed = (Date.now() - loopStartTime) / 1000;
  const totalDur = SECTION_DUR * LOOP_ORDER.length;
  const pos = elapsed % totalDur;
  const idx = Math.floor(pos / SECTION_DUR);
  return idx < LOOP_ORDER.length ? LOOP_ORDER[idx] : null;
}

function setActivity(label, duration) {
  activity = { label, startTime: Date.now(), duration: duration * 1000 };
}

function getActivityProgress() {
  if (!activity.label) return null;
  const elapsed = Date.now() - activity.startTime;
  if (elapsed >= activity.duration) { activity.label = null; return null; }
  return { label: activity.label, elapsed: elapsed / 1000, total: activity.duration / 1000, ratio: elapsed / activity.duration };
}

// --- Gameplay simulation state ---
const sim = {
  remaining: 20,
  total: 20,
  combo: 0,
  lives: 3,
  powerUp: false,
  intensity: 0,
  adaptiveEnabled: false,
};

function simRecalcIntensity() {
  const ratio = sim.total > 0 ? sim.remaining / sim.total : 0;
  let level = 0;
  if (ratio <= 0.10) level = 4;
  else if (ratio <= 0.30) level = 3;
  else if (ratio <= 0.50) level = 2;
  else if (ratio <= 0.80) level = 1;

  if (sim.combo >= 6) level = Math.min(4, level + 2);
  else if (sim.combo >= 3) level = Math.min(4, level + 1);

  if (sim.powerUp) level = Math.min(4, Math.max(level, 2));
  if (sim.lives <= 1) level = Math.min(4, Math.max(level, 3));

  sim.intensity = Math.min(4, Math.max(0, level));
}

const INTENSITY_LAYERS = [
  { drums: 0, bass: 0, pad: 1, lead: 0, high: 0 },
  { drums: 0, bass: 1, pad: 1, lead: 0, high: 0 },
  { drums: 1, bass: 1, pad: 1, lead: 0, high: 0 },
  { drums: 1, bass: 1, pad: 1, lead: 1, high: 0 },
  { drums: 1, bass: 1, pad: 1, lead: 1, high: 1 },
];
const INTENSITY_SECTIONS = [
  ['intro', 'verse'], ['verse'], ['chorus'], ['bridge', 'breakdown'], ['climax'],
];

function simApply() {
  const prev = sim.intensity;
  simRecalcIntensity();
  const config = INTENSITY_LAYERS[sim.intensity];
  for (const [layer, vol] of Object.entries(config)) {
    setLayerVolume(layer, vol, 0.5);
  }
  if (sim.intensity !== prev) {
    const candidates = INTENSITY_SECTIONS[sim.intensity];
    const cur = getCurrentSection();
    const filtered = candidates.filter(s => s !== cur);
    const pick = filtered.length > 0 ? filtered : candidates;
    requestNextSection(pick[Math.floor(Math.random() * pick.length)]);
  }
}

export function isMusicLab() {
  const p = new URLSearchParams(window.location.search);
  return p.has('music') || p.has('mus');
}
export function isMusicLabActive() { return active; }
export function showMusicLab() { active = true; }

// --- Data (prêt multi-pistes : une seule piste pour l'instant) ---
const TRACKS = [
  { id: 'main', label: 'SPACE MAIN' },
];
let currentTrack = 0;

const SECTIONS = [
  { id: 'intro',     label: 'INTRO',     color: '#4488aa' },
  { id: 'verse',     label: 'VERSE',     color: '#44aa66' },
  { id: 'chorus',    label: 'CHORUS',    color: '#cc8833' },
  { id: 'bridge',    label: 'BRIDGE',    color: '#8855cc' },
  { id: 'breakdown', label: 'BRKDWN',    color: '#668899' },
  { id: 'climax',    label: 'CLIMAX',    color: '#ff4466' },
  { id: 'outro',     label: 'OUTRO',     color: '#cc4455' },
];

const INSTRUMENTS = [
  { id: 'kick',  label: 'KICK',  color: '#ff6644' },
  { id: 'snare', label: 'SNARE', color: '#ffaa33' },
  { id: 'hihat', label: 'HIHAT', color: '#ffdd44' },
  { id: 'bass',  label: 'BASS',  color: '#44aaff' },
  { id: 'lead',  label: 'LEAD',  color: '#ff44aa' },
  { id: 'pad',   label: 'PAD',   color: '#aa88ff' },
  { id: 'arp',   label: 'ARP',   color: '#44ffaa' },
];

const STINGERS = [
  { id: 'win',      label: 'WIN',      color: '#44ff88', fn: playWinStinger },
  { id: 'gameover', label: 'GAMEOVER', color: '#ff4444', fn: playGameOverStinger },
  { id: 'powerup',  label: 'POWER-UP', color: '#ffcc00', fn: playPowerUpAccent },
];

const LAYER_COLORS = { drums: '#ff6644', bass: '#44aaff', pad: '#aa88ff', lead: '#ff44aa', high: '#ffee44' };
const INTENSITY_LABELS = ['CALM', 'CRUISE', 'ACTION', 'INTENSE', 'CLIMAX'];
const INTENSITY_COLORS = ['#44aa66', '#88cc44', '#ccaa33', '#ff6644', '#ff2244'];

// --- Draw helpers ---

function drawBtn(ctx, x, y, w, h, label, color, isHovered, isActive) {
  const alpha = isActive ? 0.35 : isHovered ? 0.15 : 0.06;
  ctx.fillStyle = color;
  ctx.globalAlpha = alpha;
  ctx.fillRect(x, y, w, h);
  ctx.globalAlpha = 1;
  ctx.strokeStyle = isActive ? color : isHovered ? color : 'rgba(255,255,255,0.1)';
  ctx.lineWidth = isActive ? 2 : 1;
  ctx.strokeRect(x, y, w, h);
  ctx.fillStyle = isHovered || isActive ? '#ffffff' : color;
  ctx.font = 'bold 12px monospace';
  ctx.textAlign = 'center';
  ctx.fillText(label, x + w / 2, y + h / 2 + 4);
  ctx.textAlign = 'left';
}

function drawLabel(ctx, text, x, y) {
  ctx.fillStyle = '#aabbcc';
  ctx.font = 'bold 13px monospace';
  ctx.fillText(text, x, y);
}

function drawSmallText(ctx, text, x, y, color) {
  ctx.fillStyle = color || '#556666';
  ctx.font = '11px monospace';
  ctx.fillText(text, x, y);
}

// --- Header persistant (titre + onglets) ---

const HEADER_H = 80; // hauteur réservée au header (hors scroll)

function drawHeader(ctx, W) {
  // Fond header
  ctx.fillStyle = '#0a1018';
  ctx.fillRect(0, 0, W, HEADER_H);

  // Titre
  ctx.textAlign = 'center';
  ctx.fillStyle = '#ffcc00';
  ctx.font = 'bold 20px monospace';
  ctx.fillText('MUSIC LAB', W / 2, 24);
  ctx.textAlign = 'left';

  // Onglets
  const tabW = 100;
  const tabH = 28;
  const tabGap = 6;
  const totalW = TABS.length * tabW + (TABS.length - 1) * tabGap;
  const tabX0 = (W - totalW) / 2;
  const tabY = 38;

  for (let i = 0; i < TABS.length; i++) {
    const tx = tabX0 + i * (tabW + tabGap);
    const isCurrent = i === currentTab;
    const isHov = hovered === `tab-${i}`;
    ctx.fillStyle = isCurrent ? 'rgba(0,212,255,0.15)' : isHov ? 'rgba(255,255,255,0.05)' : 'transparent';
    ctx.fillRect(tx, tabY, tabW, tabH);
    ctx.strokeStyle = isCurrent ? '#00d4ff' : 'rgba(255,255,255,0.08)';
    ctx.lineWidth = isCurrent ? 2 : 1;
    ctx.strokeRect(tx, tabY, tabW, tabH);
    ctx.fillStyle = isCurrent ? '#ffffff' : isHov ? '#aaccdd' : '#667788';
    ctx.font = 'bold 12px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(TABS[i], tx + tabW / 2, tabY + tabH / 2 + 4);
  }
  ctx.textAlign = 'left';

  // Ligne séparatrice
  ctx.strokeStyle = 'rgba(255,255,255,0.06)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(0, HEADER_H - 1);
  ctx.lineTo(W, HEADER_H - 1);
  ctx.stroke();
}

// --- Footer persistant (transport + activity) ---

const FOOTER_H = 64;

function drawFooter(ctx, W, H) {
  const fy = H - FOOTER_H;
  ctx.fillStyle = '#0a1018';
  ctx.fillRect(0, fy, W, FOOTER_H);
  ctx.strokeStyle = 'rgba(255,255,255,0.06)';
  ctx.beginPath();
  ctx.moveTo(0, fy);
  ctx.lineTo(W, fy);
  ctx.stroke();

  const col1 = 16;
  const playing = isPlaying();
  const btnW = 90;
  const btnH = 28;

  // Transport button
  drawBtn(ctx, col1, fy + 6, btnW, btnH, playing ? '■ STOP' : '▸ PLAY', '#00d4ff', hovered === 'transport', playing);

  // Activity bar
  const barX = col1 + btnW + 12;
  const barW = W - barX - 16;
  const barH = 20;
  const barY = fy + 10;
  ctx.fillStyle = '#1a2233';
  ctx.fillRect(barX, barY, barW, barH);

  const prog = getActivityProgress();
  if (prog) {
    ctx.fillStyle = '#00d4ff';
    ctx.globalAlpha = 0.3;
    ctx.fillRect(barX, barY, barW * prog.ratio, barH);
    ctx.globalAlpha = 1;
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 10px monospace';
    ctx.fillText(`▸ ${prog.label}`, barX + 6, barY + 14);
    ctx.fillStyle = '#88bbdd';
    ctx.font = '10px monospace';
    ctx.textAlign = 'right';
    ctx.fillText(`${prog.elapsed.toFixed(1)}s / ${prog.total.toFixed(1)}s`, barX + barW - 6, barY + 14);
    ctx.textAlign = 'left';
  } else {
    drawSmallText(ctx, 'Idle', barX + 6, barY + 14, '#445566');
  }

  // Section en cours (sous la barre)
  const curSec = getCurrentSection();
  if (curSec) {
    drawSmallText(ctx, `Section: ${curSec.toUpperCase()}`, barX, fy + FOOTER_H - 10, '#667788');
  }
}

// --- Onglet Sons ---

function drawTabSons(ctx, col1, startY, W) {
  const btnW = 120;
  const btnH = 32;
  const gap = 8;
  let y = startY;

  // Piste
  drawLabel(ctx, `PISTE: ${TRACKS[currentTrack].label}`, col1, y);
  if (TRACKS.length > 1) {
    drawSmallText(ctx, '(← → pour changer)', col1 + 220, y, '#445566');
  }

  // Sections
  y += 24;
  drawLabel(ctx, 'SECTIONS', col1, y);
  y += 14;
  const secPerRow = 4;
  const activeSec = getActiveLoopSection();
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

  // Instruments
  drawLabel(ctx, 'INSTRUMENTS', col1, y);
  y += 14;
  const instPerRow = 4;
  for (let i = 0; i < INSTRUMENTS.length; i++) {
    const inst = INSTRUMENTS[i];
    const row = Math.floor(i / instPerRow);
    const col = i % instPerRow;
    const bx = col1 + col * (btnW + gap);
    const by = y + row * (btnH + gap);
    drawBtn(ctx, bx, by, btnW, btnH, inst.label, inst.color, hovered === `inst-${inst.id}`, false);
  }
  const instRows = Math.ceil(INSTRUMENTS.length / instPerRow);
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

// --- Onglet Gameplay ---

function drawTabGameplay(ctx, col1, startY, W) {
  const btnW = 120;
  const btnH = 32;
  const gap = 8;
  const smallBtnW = 55;
  let y = startY;

  // === Intensité courante ===
  drawLabel(ctx, 'INTENSITÉ', col1, y);
  y += 14;
  // Grand affichage
  const intColor = INTENSITY_COLORS[sim.intensity];
  const intLabel = INTENSITY_LABELS[sim.intensity];
  ctx.fillStyle = intColor;
  ctx.font = 'bold 28px monospace';
  ctx.fillText(`${sim.intensity}`, col1, y + 24);
  ctx.font = 'bold 16px monospace';
  ctx.fillText(intLabel, col1 + 30, y + 24);

  // Override direct : boutons 0-4
  const ovX = col1 + 180;
  for (let i = 0; i <= 4; i++) {
    const bx = ovX + i * (smallBtnW + 4);
    drawBtn(ctx, bx, y, smallBtnW, btnH, `${i}`, INTENSITY_COLORS[i], hovered === `intensity-${i}`, sim.intensity === i);
  }
  y += btnH + 20;

  // === État simulé ===
  drawLabel(ctx, 'ÉTAT SIMULÉ', col1, y);
  y += 14;

  // Remaining bar
  const ratio = sim.total > 0 ? sim.remaining / sim.total : 0;
  const barW = W - col1 * 2;
  ctx.fillStyle = '#1a2233';
  ctx.fillRect(col1, y, barW, 24);
  ctx.fillStyle = '#44aa66';
  ctx.globalAlpha = 0.4;
  ctx.fillRect(col1, y, barW * ratio, 24);
  ctx.globalAlpha = 1;
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 11px monospace';
  ctx.fillText(`Remaining: ${sim.remaining}/${sim.total}  (${(ratio * 100).toFixed(0)}%)`, col1 + 8, y + 16);
  y += 32;

  // Combo + Lives + PowerUp display
  ctx.font = 'bold 13px monospace';
  ctx.fillStyle = sim.combo >= 3 ? '#ffcc00' : '#556677';
  ctx.fillText(`Combo: ${sim.combo}`, col1, y + 12);
  ctx.fillStyle = sim.lives <= 1 ? '#ff4444' : '#556677';
  ctx.fillText(`Lives: ${sim.lives}`, col1 + 120, y + 12);
  ctx.fillStyle = sim.powerUp ? '#ffcc00' : '#556677';
  ctx.fillText(`PU: ${sim.powerUp ? 'ON' : 'OFF'}`, col1 + 240, y + 12);
  y += 28;

  // === Actions ===
  drawLabel(ctx, 'ACTIONS', col1, y);
  y += 14;

  // Row 1 : Destroy, Combo+1, Reset combo
  drawBtn(ctx, col1, y, btnW, btnH, 'DESTROY', '#ff6644', hovered === 'gp-destroy', false);
  drawBtn(ctx, col1 + btnW + gap, y, btnW, btnH, 'COMBO +1', '#ffcc00', hovered === 'gp-combo-up', false);
  drawBtn(ctx, col1 + (btnW + gap) * 2, y, btnW, btnH, 'COMBO RST', '#888888', hovered === 'gp-combo-reset', false);
  y += btnH + gap;

  // Row 2 : Life -1, PU ON/OFF, Reset all
  drawBtn(ctx, col1, y, btnW, btnH, 'LIFE -1', '#ff4444', hovered === 'gp-life', false);
  drawBtn(ctx, col1 + btnW + gap, y, btnW, btnH, sim.powerUp ? 'PU OFF' : 'PU ON', '#ffcc00', hovered === 'gp-powerup', sim.powerUp);
  drawBtn(ctx, col1 + (btnW + gap) * 2, y, btnW, btnH, 'RESET ALL', '#ff4444', hovered === 'gp-reset', false);
  y += btnH + 20;

  // === Layers temps réel ===
  drawLabel(ctx, 'LAYERS (temps réel)', col1, y);
  y += 14;
  const vols = getLayerVolumes();
  const layerBtnW = 80;
  for (let i = 0; i < LAYER_NAMES.length; i++) {
    const name = LAYER_NAMES[i];
    const bx = col1 + i * (layerBtnW + gap);
    const vol = vols[name] || 0;
    const color = LAYER_COLORS[name] || '#888';
    ctx.fillStyle = '#1a2233';
    ctx.fillRect(bx, y, layerBtnW, btnH);
    ctx.fillStyle = color;
    ctx.globalAlpha = 0.4;
    ctx.fillRect(bx, y, layerBtnW * vol, btnH);
    ctx.globalAlpha = 1;
    ctx.strokeStyle = vol > 0.5 ? color : '#334455';
    ctx.lineWidth = 1;
    ctx.strokeRect(bx, y, layerBtnW, btnH);
    ctx.fillStyle = vol > 0.5 ? '#ffffff' : '#556677';
    ctx.font = 'bold 11px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(name.toUpperCase(), bx + layerBtnW / 2, y + btnH / 2 + 4);
    ctx.textAlign = 'left';
  }
  y += btnH + 16;

  return y;
}

// --- Onglet Mix ---

function drawTabMix(ctx, col1, startY, W) {
  const btnW = 120;
  const btnH = 32;
  const gap = 8;
  let y = startY;

  // Layers avec toggle on/off
  drawLabel(ctx, 'LAYERS (cliquer pour toggle)', col1, y);
  y += 14;
  const vols = getLayerVolumes();
  const layerBtnW = 110;
  for (let i = 0; i < LAYER_NAMES.length; i++) {
    const name = LAYER_NAMES[i];
    const bx = col1;
    const by = y + i * (btnH + gap);
    const vol = vols[name] || 0;
    const color = LAYER_COLORS[name] || '#888';
    const isOn = vol > 0.01;
    // Fond
    ctx.fillStyle = '#1a2233';
    ctx.fillRect(bx, by, layerBtnW, btnH);
    // Barre
    ctx.fillStyle = color;
    ctx.globalAlpha = isOn ? 0.4 : 0.05;
    ctx.fillRect(bx, by, layerBtnW * vol, btnH);
    ctx.globalAlpha = 1;
    ctx.strokeStyle = hovered === `layer-${name}` ? color : (isOn ? color : '#334455');
    ctx.lineWidth = hovered === `layer-${name}` ? 2 : 1;
    ctx.strokeRect(bx, by, layerBtnW, btnH);
    // Label
    ctx.fillStyle = isOn ? '#ffffff' : '#445566';
    ctx.font = 'bold 12px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(`${name.toUpperCase()} ${isOn ? 'ON' : 'OFF'}`, bx + layerBtnW / 2, by + btnH / 2 + 4);
    ctx.textAlign = 'left';
    // Volume text
    drawSmallText(ctx, `vol: ${(vol * 100).toFixed(0)}%`, bx + layerBtnW + 12, by + btnH / 2 + 4, '#667788');
  }
  y += LAYER_NAMES.length * (btnH + gap) + 8;

  // Effets
  drawLabel(ctx, 'EFFETS', col1, y);
  y += 14;
  drawBtn(ctx, col1, y, btnW, btnH, muffled ? 'UNMUFFLE' : 'MUFFLE', '#6688aa', hovered === 'fx-muffle', muffled);
  y += btnH + 16;

  return y;
}

// --- Main draw ---

export function drawMusicLab(ctx) {
  const W = CONFIG.canvas.width;
  const H = CONFIG.canvas.height;

  // Fond complet
  ctx.fillStyle = 'rgba(0, 0, 0, 0.92)';
  ctx.fillRect(0, 0, W, H);

  // Header (fixe)
  drawHeader(ctx, W);

  // Zone de contenu scrollable
  const contentTop = HEADER_H;
  const contentBottom = H - FOOTER_H;
  const contentH = contentBottom - contentTop;

  ctx.save();
  ctx.beginPath();
  ctx.rect(0, contentTop, W, contentH);
  ctx.clip();
  ctx.translate(0, contentTop - scrollY);

  const col1 = 20;
  const startY = 16;
  let endY = startY;

  if (currentTab === 0) endY = drawTabSons(ctx, col1, startY, W);
  else if (currentTab === 1) endY = drawTabGameplay(ctx, col1, startY, W);
  else if (currentTab === 2) endY = drawTabMix(ctx, col1, startY, W);

  const totalContentH = endY + 8;
  ctx.restore();

  // Footer (fixe)
  drawFooter(ctx, W, H);

  // Clamp scroll
  const maxScroll = Math.max(0, totalContentH - contentH);
  scrollY = Math.min(maxScroll, Math.max(0, scrollY));

  // Scrollbar
  if (maxScroll > 0) {
    const sbH = Math.max(20, contentH * (contentH / totalContentH));
    const sbY = contentTop + (scrollY / maxScroll) * (contentH - sbH);
    ctx.fillStyle = 'rgba(255,255,255,0.12)';
    ctx.fillRect(W - 6, sbY, 4, sbH);
  }
}

// --- Hit-test ---

function getButtonLayout() {
  const col1 = 20;
  const btnW = 120;
  const btnH = 32;
  const gap = 8;
  const smallBtnW = 55;
  const buttons = [];

  // Onglets (position absolue, pas scrollé)
  const tabW = 100;
  const tabH = 28;
  const tabGap = 6;
  const W = CONFIG.canvas.width;
  const totalTabW = TABS.length * tabW + (TABS.length - 1) * tabGap;
  const tabX0 = (W - totalTabW) / 2;
  for (let i = 0; i < TABS.length; i++) {
    buttons.push({ id: `tab-${i}`, x: tabX0 + i * (tabW + tabGap), y: 38, w: tabW, h: tabH, fixed: true });
  }

  // Transport (dans le footer, position absolue)
  const H = CONFIG.canvas.height;
  const fy = H - FOOTER_H;
  buttons.push({ id: 'transport', x: 16, y: fy + 6, w: 90, h: 28, fixed: true });

  // Contenu par onglet (positions relatives au content area)
  let y = 16;

  if (currentTab === 0) {
    // Sections
    y += 24; // piste label
    y += 14; // sections label + gap
    const secPerRow = 4;
    for (let i = 0; i < SECTIONS.length; i++) {
      const row = Math.floor(i / secPerRow);
      const col = i % secPerRow;
      buttons.push({ id: `section-${SECTIONS[i].id}`, x: col1 + col * (btnW + gap), y: y + row * (btnH + gap), w: btnW, h: btnH });
    }
    const secRows = Math.ceil(SECTIONS.length / secPerRow);
    y += secRows * (btnH + gap) + 8;

    // Instruments
    y += 14;
    const instPerRow = 4;
    for (let i = 0; i < INSTRUMENTS.length; i++) {
      const row = Math.floor(i / instPerRow);
      const col = i % instPerRow;
      buttons.push({ id: `inst-${INSTRUMENTS[i].id}`, x: col1 + col * (btnW + gap), y: y + row * (btnH + gap), w: btnW, h: btnH });
    }
    const instRows = Math.ceil(INSTRUMENTS.length / instPerRow);
    y += instRows * (btnH + gap) + 8;

    // Stingers
    y += 14;
    for (let i = 0; i < STINGERS.length; i++) {
      buttons.push({ id: `stinger-${STINGERS[i].id}`, x: col1 + i * (btnW + gap), y, w: btnW, h: btnH });
    }

  } else if (currentTab === 1) {
    // Intensity override
    y += 14; // label
    const ovX = col1 + 180;
    for (let i = 0; i <= 4; i++) {
      buttons.push({ id: `intensity-${i}`, x: ovX + i * (smallBtnW + 4), y, w: smallBtnW, h: btnH });
    }
    y += btnH + 20;

    // État simulé (pas de boutons, juste display)
    y += 14 + 32 + 28; // label + bar+padding + combo+padding

    // Actions row 1
    y += 14;
    buttons.push({ id: 'gp-destroy', x: col1, y, w: btnW, h: btnH });
    buttons.push({ id: 'gp-combo-up', x: col1 + btnW + gap, y, w: btnW, h: btnH });
    buttons.push({ id: 'gp-combo-reset', x: col1 + (btnW + gap) * 2, y, w: btnW, h: btnH });
    y += btnH + gap;

    // Actions row 2
    buttons.push({ id: 'gp-life', x: col1, y, w: btnW, h: btnH });
    buttons.push({ id: 'gp-powerup', x: col1 + btnW + gap, y, w: btnW, h: btnH });
    buttons.push({ id: 'gp-reset', x: col1 + (btnW + gap) * 2, y, w: btnW, h: btnH });

  } else if (currentTab === 2) {
    // Layers toggle
    y += 14;
    const layerBtnW = 110;
    for (let i = 0; i < LAYER_NAMES.length; i++) {
      buttons.push({ id: `layer-${LAYER_NAMES[i]}`, x: col1, y: y + i * (btnH + gap), w: layerBtnW, h: btnH });
    }
    y += LAYER_NAMES.length * (btnH + gap) + 8;

    // FX
    y += 14;
    buttons.push({ id: 'fx-muffle', x: col1, y, w: btnW, h: btnH });
  }

  return buttons;
}

function hitTest(mx, my) {
  const contentTop = HEADER_H;
  const contentBottom = CONFIG.canvas.height - FOOTER_H;

  for (const b of getButtonLayout()) {
    if (b.fixed) {
      // Boutons fixes (tabs, transport) — coordonnées directes
      if (mx >= b.x && mx <= b.x + b.w && my >= b.y && my <= b.y + b.h) return b.id;
    } else {
      // Boutons dans la zone scrollable — compenser scroll et offset
      const by = b.y + contentTop - scrollY;
      if (by + b.h < contentTop || by > contentBottom) continue; // hors zone visible
      if (mx >= b.x && mx <= b.x + b.w && my >= by && my <= by + b.h) return b.id;
    }
  }
  return null;
}

// --- Handlers ---

export function handleMusicLabTap(x, y) {
  const id = hitTest(x, y);
  if (!id) return;

  // Onglets
  if (id.startsWith('tab-')) {
    const idx = parseInt(id.replace('tab-', ''));
    if (idx !== currentTab) { currentTab = idx; scrollY = 0; }
    return;
  }

  // Transport
  if (id === 'transport') {
    if (isPlaying()) { stopMusic(); activity.label = null; }
    else {
      if (!sim.adaptiveEnabled) { enableAdaptiveMode(); sim.adaptiveEnabled = true; }
      startMusic(); loopStartTime = Date.now();
      setActivity('Boucle complète', SECTION_DUR * LOOP_ORDER.length);
      simApply(); // appliquer l'état courant
    }
    return;
  }

  // --- Onglet Sons ---
  if (id.startsWith('section-')) {
    resetAudio(); muffled = false;
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
    const s = STINGERS.find(s => `stinger-${s.id}` === id);
    if (s) { resetAudio(); muffled = false; s.fn(); const durs = { win: 1.0, gameover: 2.0, powerup: 0.4 }; setActivity(`Stinger: ${s.label}`, durs[s.id] || 1); }
    return;
  }

  // --- Onglet Gameplay ---
  if (id.startsWith('intensity-')) {
    const level = parseInt(id.replace('intensity-', ''));
    // Force l'état simulé pour atteindre ce niveau (override simplifié)
    sim.combo = 0; sim.powerUp = false;
    if (level === 0) sim.remaining = sim.total;
    else if (level === 1) sim.remaining = Math.round(sim.total * 0.6);
    else if (level === 2) sim.remaining = Math.round(sim.total * 0.4);
    else if (level === 3) sim.remaining = Math.round(sim.total * 0.2);
    else sim.remaining = Math.round(sim.total * 0.05);
    if (!sim.adaptiveEnabled) { enableAdaptiveMode(); sim.adaptiveEnabled = true; }
    simApply();
    return;
  }
  if (id === 'gp-destroy') {
    sim.remaining = Math.max(0, sim.remaining - 1);
    sim.combo++;
    if (!sim.adaptiveEnabled) { enableAdaptiveMode(); sim.adaptiveEnabled = true; }
    simApply();
    return;
  }
  if (id === 'gp-combo-up') {
    sim.combo++;
    if (!sim.adaptiveEnabled) { enableAdaptiveMode(); sim.adaptiveEnabled = true; }
    simApply();
    return;
  }
  if (id === 'gp-combo-reset') {
    sim.combo = 0;
    simApply();
    return;
  }
  if (id === 'gp-life') {
    sim.lives = Math.max(0, sim.lives - 1);
    sim.combo = 0; // la perte de vie reset le combo (comme en jeu)
    simApply();
    return;
  }
  if (id === 'gp-powerup') {
    sim.powerUp = !sim.powerUp;
    simApply();
    return;
  }
  if (id === 'gp-reset') {
    sim.remaining = sim.total;
    sim.combo = 0;
    sim.lives = 3;
    sim.powerUp = false;
    simApply();
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
    muffled = !muffled;
    if (muffled) muffle(); else unmuffle();
  }
}

export function handleMusicLabHover(x, y) {
  hovered = hitTest(x, y);
}

export function handleMusicLabScroll(deltaY) {
  scrollY += deltaY > 0 ? SCROLL_SPEED : -SCROLL_SPEED;
  scrollY = Math.max(0, scrollY);
}
