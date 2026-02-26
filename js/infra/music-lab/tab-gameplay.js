// Gameplay tab content

import { setLayerVolume, getLayerVolumes, LAYER_NAMES, getCurrentSection, requestNextSection, enableAdaptiveMode } from '../music/index.js';
import { drawBtn } from './draw-helpers.js';
import { getHovered, getSim } from './state.js';

// Constants for intensity mapping
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

const LAYER_COLORS = { drums: '#ff6644', bass: '#44aaff', pad: '#aa88ff', lead: '#ff44aa', high: '#ffee44' };
const INTENSITY_LABELS = ['CALM', 'CRUISE', 'ACTION', 'INTENSE', 'CLIMAX'];
const INTENSITY_COLORS = ['#44aa66', '#88cc44', '#ccaa33', '#ff6644', '#ff2244'];

export function simRecalcIntensity(sim) {
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

export function simApply(sim) {
  const prev = sim.intensity;
  simRecalcIntensity(sim);
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

export function drawTabGameplay(ctx, col1, startY, W) {
  const sim = getSim();
  const hovered = getHovered();
  const btnW = 120;
  const btnH = 32;
  const gap = 8;
  const smallBtnW = 55;
  let y = startY;

  // === Intensité courante ===
  ctx.fillStyle = '#aabbcc';
  ctx.font = 'bold 13px monospace';
  ctx.fillText('INTENSITÉ', col1, y);
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
  ctx.fillStyle = '#aabbcc';
  ctx.font = 'bold 13px monospace';
  ctx.fillText('ÉTAT SIMULÉ', col1, y);
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
  ctx.fillStyle = '#aabbcc';
  ctx.font = 'bold 13px monospace';
  ctx.fillText('ACTIONS', col1, y);
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
  ctx.fillStyle = '#aabbcc';
  ctx.font = 'bold 13px monospace';
  ctx.fillText('LAYERS (temps réel)', col1, y);
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
