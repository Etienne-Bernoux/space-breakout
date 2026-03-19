// --- HUD consommables : ligne filet + boutons actifs ---

import { gameScale } from '../../../shared/responsive.js';

/** Dessine la ligne du filet de sécurité en bas de l'écran. */
export function drawSafetyNetLine(ctx, W, H, hasCharge) {
  if (!hasCharge) return;
  const s = gameScale(W);
  const y = H - 18 * s;
  const t = Date.now() * 0.001;
  const pulse = 0.4 + Math.sin(t * 3) * 0.15;

  // Glow
  ctx.strokeStyle = `rgba(0, 229, 255, ${pulse * 0.3})`;
  ctx.lineWidth = 6 * s;
  ctx.beginPath();
  ctx.moveTo(0, y);
  ctx.lineTo(W, y);
  ctx.stroke();

  // Ligne principale
  ctx.strokeStyle = `rgba(0, 229, 255, ${pulse})`;
  ctx.lineWidth = 2 * s;
  ctx.setLineDash([8 * s, 6 * s]);
  ctx.beginPath();
  ctx.moveTo(0, y);
  ctx.lineTo(W, y);
  ctx.stroke();
  ctx.setLineDash([]);
}

/**
 * Dessine les boutons des consommables actifs (shockwave, missiles, fireball).
 * @param {CanvasRenderingContext2D} ctx
 * @param {Array} activeList - [{ id, charges, def }]
 * @param {number} W - largeur canvas
 * @param {number} H - hauteur canvas
 */
export function drawConsumableHUD(ctx, activeList, W, H) {
  if (activeList.length === 0) return;
  const s = gameScale(W);
  const btnSize = Math.round(36 * s);
  const gap = Math.round(8 * s);
  const totalW = activeList.length * btnSize + (activeList.length - 1) * gap;
  const startX = W - Math.round(20 * s) - totalW;
  const y = H - Math.round(50 * s);

  for (let i = 0; i < activeList.length; i++) {
    const { id, charges, def } = activeList[i];
    const x = startX + i * (btnSize + gap);
    const t = Date.now() * 0.001;

    // Fond bouton
    const pulse = 0.15 + Math.sin(t * 2 + i) * 0.05;
    ctx.fillStyle = `rgba(${_hexRgb(def.color)}, ${pulse})`;
    ctx.strokeStyle = def.color;
    ctx.lineWidth = 1.5;
    _roundRect(ctx, x, y, btnSize, btnSize, 4 * s);
    ctx.fill();
    ctx.stroke();

    // Lettre touche (coin haut-gauche)
    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    ctx.font = `bold ${Math.round(9 * s)}px monospace`;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText(def.key, x + 3 * s, y + 2 * s);

    // Icône distincte par consommable
    _drawConsumableIcon(ctx, id, x + btnSize / 2, y + btnSize * 0.42, btnSize * 0.22, def.color);

    // Charges (coin bas-droite)
    ctx.fillStyle = '#ffffff';
    ctx.font = `bold ${Math.round(11 * s)}px monospace`;
    ctx.textAlign = 'right';
    ctx.textBaseline = 'bottom';
    ctx.fillText(`${charges}`, x + btnSize - 3 * s, y + btnSize - 2 * s);
  }
}

/**
 * Retourne les hitboxes des boutons consommables pour le tap.
 * @returns {Array<{id: string, x: number, y: number, w: number, h: number}>}
 */
export function getConsumableButtonRects(activeList, W, H) {
  if (!activeList || activeList.length === 0) return [];
  const s = gameScale(W);
  const btnSize = Math.round(36 * s);
  const gap = Math.round(8 * s);
  const totalW = activeList.length * btnSize + (activeList.length - 1) * gap;
  const startX = W - Math.round(20 * s) - totalW;
  const y = H - Math.round(50 * s);

  return activeList.map(({ id }, i) => ({
    id,
    x: startX + i * (btnSize + gap),
    y,
    w: btnSize,
    h: btnSize,
  }));
}

function _drawConsumableIcon(ctx, id, cx, cy, r, color) {
  ctx.fillStyle = color;
  ctx.strokeStyle = color;
  ctx.lineWidth = 1.5;
  if (id === 'shockwave') {
    // Onde de choc : cercles concentriques
    for (let i = 0; i < 3; i++) {
      ctx.beginPath();
      ctx.arc(cx, cy, r * (0.4 + i * 0.3), 0, Math.PI * 2);
      ctx.globalAlpha = 1 - i * 0.3;
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
  } else if (id === 'missiles') {
    // Missile : triangle pointu + traînée
    ctx.beginPath();
    ctx.moveTo(cx, cy - r);
    ctx.lineTo(cx - r * 0.5, cy + r * 0.4);
    ctx.lineTo(cx + r * 0.5, cy + r * 0.4);
    ctx.closePath();
    ctx.fill();
    // Ailerons
    ctx.beginPath();
    ctx.moveTo(cx - r * 0.5, cy + r * 0.2);
    ctx.lineTo(cx - r * 0.9, cy + r * 0.7);
    ctx.lineTo(cx - r * 0.3, cy + r * 0.4);
    ctx.moveTo(cx + r * 0.5, cy + r * 0.2);
    ctx.lineTo(cx + r * 0.9, cy + r * 0.7);
    ctx.lineTo(cx + r * 0.3, cy + r * 0.4);
    ctx.fill();
    // Flamme
    ctx.fillStyle = '#ffaa00';
    ctx.beginPath();
    ctx.moveTo(cx - r * 0.3, cy + r * 0.4);
    ctx.lineTo(cx, cy + r);
    ctx.lineTo(cx + r * 0.3, cy + r * 0.4);
    ctx.fill();
  } else if (id === 'fireball') {
    // Flamme : goutte inversée
    ctx.beginPath();
    ctx.arc(cx, cy + r * 0.1, r * 0.55, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(cx - r * 0.5, cy);
    ctx.quadraticCurveTo(cx, cy - r * 1.2, cx + r * 0.5, cy);
    ctx.fill();
    // Centre clair
    ctx.fillStyle = '#ffee88';
    ctx.beginPath();
    ctx.arc(cx, cy + r * 0.15, r * 0.25, 0, Math.PI * 2);
    ctx.fill();
  } else {
    // Fallback cercle
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fill();
  }
}

function _roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

function _hexRgb(hex) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `${r},${g},${b}`;
}
