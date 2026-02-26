// Header drawing

import { getHovered, getCurrentTab } from './state.js';

export const HEADER_H = 80; // hauteur réservée au header (hors scroll)

const TABS = ['Sons', 'Gameplay', 'Mix'];

export function drawHeader(ctx, W) {
  const currentTab = getCurrentTab();
  const hovered = getHovered();

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
