import { CONFIG } from '../../config.js';
import { gameScale } from '../../shared/responsive.js';
import { isMobile } from '../../shared/platform.js';
import state from './state.js';

// Layout responsive
export function layout() {
  const w = CONFIG.canvas.width;
  const h = CONFIG.canvas.height;
  const scale = gameScale(w);
  return { w, h, cx: w / 2, scale };
}

export function drawFloatingRocks(ctx) {
  const floatingRocks = state.floatingRocks;
  const t = Date.now() * 0.001;
  for (const r of floatingRocks) {
    r.y += r.speed;
    r.angle += r.rotSpeed;
    if (r.y > CONFIG.canvas.height + 30) {
      r.y = -30;
      r.x = Math.random() * CONFIG.canvas.width;
    }

    ctx.save();
    ctx.translate(r.x, r.y);
    ctx.rotate(r.angle);
    // Halo subtil
    const haloA = 0.08 + Math.sin(t * 2 + r.x) * 0.04;
    const halo = ctx.createRadialGradient(0, 0, r.size * 0.3, 0, 0, r.size * 1.5);
    halo.addColorStop(0, `rgba(100, 160, 200, ${haloA})`);
    halo.addColorStop(1, 'rgba(100, 160, 200, 0)');
    ctx.fillStyle = halo;
    ctx.fillRect(-r.size * 1.5, -r.size * 1.5, r.size * 3, r.size * 3);
    // Rocher avec gradient 3D
    ctx.globalAlpha = 0.35;
    const rGrad = ctx.createRadialGradient(-r.size * 0.2, -r.size * 0.2, 0, 0, 0, r.size);
    rGrad.addColorStop(0, '#aabbcc');
    rGrad.addColorStop(0.6, r.color);
    rGrad.addColorStop(1, '#223344');
    ctx.fillStyle = rGrad;
    ctx.beginPath();
    ctx.ellipse(0, 0, r.size, r.size * 0.7, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

function drawTitle(ctx) {
  const { cx, h, scale } = layout();
  const titleY = h * 0.22;
  const titleSize = Math.round(48 * scale);
  const subSize = Math.round(14 * scale);
  const t = Date.now() * 0.001;

  ctx.save();
  ctx.textAlign = 'center';

  // Glow derrière le titre
  ctx.shadowColor = '#00d4ff';
  ctx.shadowBlur = 20 + Math.sin(t * 2) * 8;

  // Ombre
  ctx.fillStyle = 'rgba(0, 100, 200, 0.3)';
  ctx.font = `bold ${titleSize}px monospace`;
  ctx.fillText('SPACE BREAKOUT', cx + 3, titleY + 3);

  // Texte gradient animé (le point lumineux se déplace)
  const shift = Math.sin(t * 0.8) * 0.2; // oscille entre 0.3 et 0.7
  const titleGrad = ctx.createLinearGradient(cx - 200 * scale, titleY - 30, cx + 200 * scale, titleY + 10);
  titleGrad.addColorStop(0, '#00d4ff');
  titleGrad.addColorStop(Math.max(0, 0.5 + shift - 0.15), '#00d4ff');
  titleGrad.addColorStop(0.5 + shift, '#ffffff');
  titleGrad.addColorStop(Math.min(1, 0.5 + shift + 0.15), '#00d4ff');
  titleGrad.addColorStop(1, '#00d4ff');
  ctx.fillStyle = titleGrad;
  ctx.fillText('SPACE BREAKOUT', cx, titleY);

  ctx.shadowBlur = 0;

  // Sous-titre avec gradient subtil
  const subGrad = ctx.createLinearGradient(cx - 150 * scale, 0, cx + 150 * scale, 0);
  subGrad.addColorStop(0, '#445566');
  subGrad.addColorStop(0.5, '#8899aa');
  subGrad.addColorStop(1, '#445566');
  ctx.font = `${subSize}px monospace`;
  ctx.fillStyle = subGrad;
  ctx.fillText('MISSION : NETTOYAGE DE ZONE', cx, titleY + titleSize * 0.7);

  ctx.restore();
}

/** Calcule la position Y et la hauteur d'un item de menu. */
export function menuItemLayout(i) {
  const { w, h, scale } = layout();
  const startY = h * 0.42;
  const spacing = Math.round(60 * scale);
  const itemH = Math.round(48 * scale);
  const halfW = Math.round(w * 0.4); // 80% de largeur totale
  return { y: startY + i * spacing, itemH, halfW, scale };
}

export function drawMenu(ctx) {
  const { cx, h, scale } = layout();
  const selected = state.selected();
  const menuItems = state.menuItems;
  const t = Date.now() * 0.001;

  drawTitle(ctx);

  ctx.save();
  ctx.textAlign = 'center';

  const fontSize = Math.round(26 * scale);
  const fontSmall = Math.round(22 * scale);

  for (let i = 0; i < menuItems.length; i++) {
    const { y: itemY, itemH, halfW } = menuItemLayout(i);
    const isSelected = i === selected;

    if (isSelected) {
      // Fond sélectionné avec glow pulsant
      const selAlpha = 0.1 + Math.sin(t * 4) * 0.04;
      ctx.fillStyle = `rgba(0, 212, 255, ${selAlpha})`;
      ctx.fillRect(cx - halfW, itemY - itemH * 0.55, halfW * 2, itemH);
      // Bordure avec glow
      ctx.shadowColor = '#00d4ff';
      ctx.shadowBlur = 6 + Math.sin(t * 3) * 3;
      ctx.strokeStyle = '#00d4ff';
      ctx.lineWidth = 1;
      ctx.strokeRect(cx - halfW, itemY - itemH * 0.55, halfW * 2, itemH);
      ctx.shadowBlur = 0;

      // Flèche animée (oscille horizontalement)
      const arrowOff = Math.sin(t * 5) * 3;
      ctx.fillStyle = '#ffcc00';
      ctx.font = `${fontSmall}px monospace`;
      ctx.fillText('▸', cx - halfW * 0.83 + arrowOff, itemY);
    }

    // Texte avec glow pour l'item sélectionné
    if (isSelected) {
      ctx.shadowColor = '#00d4ff';
      ctx.shadowBlur = 8;
    }
    ctx.fillStyle = isSelected ? '#ffffff' : '#556677';
    ctx.font = isSelected ? `bold ${fontSize}px monospace` : `${fontSmall}px monospace`;
    ctx.fillText(menuItems[i].label, cx, itemY);
    ctx.shadowBlur = 0;
  }

  // Instructions avec pulsation douce
  ctx.font = `${Math.round(12 * scale)}px monospace`;
  const instrAlpha = 0.35 + Math.sin(t * 2) * 0.1;
  ctx.fillStyle = `rgba(68, 85, 102, ${instrAlpha})`;
  const mobile = isMobile();
  ctx.fillText(
    mobile ? 'APPUIE POUR SÉLECTIONNER' : '↑↓ NAVIGUER  ·  ESPACE SÉLECTIONNER',
    cx, h * 0.78
  );

  ctx.restore();
}
