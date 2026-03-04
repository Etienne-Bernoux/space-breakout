// --- Rendu des capsules minerai et HUD minerais ---

import { getMineral, MINERAL_IDS } from '../../domain/mineral/index.js';
import { gameScale } from '../../shared/responsive.js';

/** Dessiner une capsule minerai qui tombe (pépite ou cristal). */
export function drawMineralCapsule(ctx, mc) {
  if (!mc.alive) return;
  const mineral = getMineral(mc.mineralKey);
  if (!mineral) return;

  const { x, rotation, radius } = mc;
  const t = Date.now() * 0.001;

  // Bob vertical
  const bob = Math.sin(t * 3.5 + x * 0.12) * 2;
  const y = mc.y + bob;

  ctx.save();
  ctx.translate(x, y);

  // Lueur douce
  const glowPulse = 1 + Math.sin(t * 5) * 0.2;
  const glow = ctx.createRadialGradient(0, 0, radius * 0.2, 0, 0, radius * 1.8 * glowPulse);
  glow.addColorStop(0, mineral.glowColor + '40');
  glow.addColorStop(1, 'transparent');
  ctx.fillStyle = glow;
  ctx.fillRect(-radius * 2, -radius * 2, radius * 4, radius * 4);

  ctx.rotate(rotation);

  if (mineral.shape === 'crystal') {
    // Forme cristal (losange allongé)
    ctx.beginPath();
    ctx.moveTo(0, -radius * 1.2);
    ctx.lineTo(radius * 0.7, 0);
    ctx.lineTo(0, radius * 1.2);
    ctx.lineTo(-radius * 0.7, 0);
    ctx.closePath();
  } else {
    // Forme pépite (polygone irrégulier arrondi)
    ctx.beginPath();
    const pts = 5;
    for (let i = 0; i < pts; i++) {
      const a = (i / pts) * Math.PI * 2 - Math.PI / 2;
      const r = radius * (0.7 + Math.sin(i * 2.3) * 0.3);
      const method = i === 0 ? 'moveTo' : 'lineTo';
      ctx[method](Math.cos(a) * r, Math.sin(a) * r);
    }
    ctx.closePath();
  }

  // Remplissage avec dégradé
  const grad = ctx.createLinearGradient(-radius, -radius, radius, radius);
  grad.addColorStop(0, mineral.color);
  grad.addColorStop(0.5, lighten(mineral.color, 40));
  grad.addColorStop(1, mineral.color);
  ctx.fillStyle = grad;
  ctx.fill();

  // Contour
  ctx.strokeStyle = mineral.glowColor;
  ctx.lineWidth = 1 + Math.sin(t * 4) * 0.3;
  ctx.stroke();

  // Reflet
  ctx.beginPath();
  ctx.arc(-radius * 0.2, -radius * 0.3, radius * 0.2, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
  ctx.fill();

  ctx.restore();
}

/** Dessiner le HUD des minerais (en haut à droite). */
export function drawMineralHUD(ctx, canvasWidth = 800) {
  // wallet est injecté via closure (set par initMineralHUD)
  if (!_wallet) return;

  const s = gameScale(canvasWidth);
  const fontSize = Math.round(12 * s);
  const iconSize = Math.round(6 * s);
  const pad = Math.round(10 * s);
  const startY = Math.round(12 * s);
  const lineH = Math.round(16 * s);
  const rightX = canvasWidth - pad;

  ctx.font = `${fontSize}px monospace`;
  ctx.textAlign = 'right';
  ctx.textBaseline = 'middle';

  for (let i = 0; i < MINERAL_IDS.length; i++) {
    const id = MINERAL_IDS[i];
    const mineral = getMineral(id);
    const qty = _wallet.get(id);
    const y = startY + i * lineH;

    // Icône (petit carré coloré)
    ctx.fillStyle = mineral.color;
    ctx.fillRect(rightX - fontSize * 4 - iconSize * 2, y - iconSize / 2, iconSize, iconSize);
    ctx.strokeStyle = mineral.glowColor;
    ctx.lineWidth = 0.5;
    ctx.strokeRect(rightX - fontSize * 4 - iconSize * 2, y - iconSize / 2, iconSize, iconSize);

    // Quantité
    ctx.fillStyle = qty > 0 ? '#ffffff' : '#666666';
    ctx.fillText(`${qty}`, rightX, y);

    // Nom court
    ctx.fillStyle = mineral.color;
    ctx.textAlign = 'left';
    ctx.fillText(mineral.name, rightX - fontSize * 4 - iconSize * 2 + iconSize + 4, y);
    ctx.textAlign = 'right';
  }
}

// --- Injection du wallet pour le HUD ---
let _wallet = null;
export function initMineralHUD(wallet) {
  _wallet = wallet;
}

// --- Utilitaire couleur ---
function lighten(hex, amount) {
  const num = parseInt(hex.slice(1), 16);
  const r = Math.min(255, (num >> 16) + amount);
  const g = Math.min(255, ((num >> 8) & 0xff) + amount);
  const b = Math.min(255, (num & 0xff) + amount);
  return `rgb(${r},${g},${b})`;
}
