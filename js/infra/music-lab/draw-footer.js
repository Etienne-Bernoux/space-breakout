// Footer drawing

import { isPlaying, getCurrentSection } from '../music/index.js';
import { drawBtn, drawSmallText } from './draw-helpers.js';
import { getHovered, getActivityProgress } from './state.js';

export const FOOTER_H = 64;

export function drawFooter(ctx, W, H) {
  const hovered = getHovered();
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
