// Mix tab content

import { getLayerVolumes, LAYER_NAMES } from '../music/index.js';
import { drawBtn, drawLabel, drawSmallText } from './draw-helpers.js';
import { getHovered } from './state.js';

const LAYER_COLORS = { drums: '#ff6644', bass: '#44aaff', pad: '#aa88ff', lead: '#ff44aa', high: '#ffee44' };

export function drawTabMix(ctx, col1, startY, W) {
  const hovered = getHovered();
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
  const isMuffled = true; // This will be checked from state in the handler
  drawBtn(ctx, col1, y, btnW, btnH, isMuffled ? 'UNMUFFLE' : 'MUFFLE', '#6688aa', hovered === 'fx-muffle', false);
  y += btnH + 16;

  return y;
}
