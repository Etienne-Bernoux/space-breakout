import { CONFIG } from '../../config.js';
import state from './state.js';

// Layout responsive
// Scale basé sur la largeur, clampé à [0.6, 1.0].
// Sur petit écran (400px) : 400/500 = 0.8 → textes lisibles.
// Sur grand écran (800px+) : clampé à 1.0 → pas de surdimensionnement.
export function layout() {
  const w = CONFIG.canvas.width;
  const h = CONFIG.canvas.height;
  const scale = Math.min(1.0, Math.max(0.6, w / 500));
  return { w, h, cx: w / 2, scale };
}

export function drawFloatingRocks(ctx) {
  const floatingRocks = state.floatingRocks;
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
    ctx.fillStyle = r.color;
    ctx.globalAlpha = 0.3;
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

  ctx.save();
  ctx.textAlign = 'center';

  // Ombre
  ctx.fillStyle = 'rgba(0, 100, 200, 0.3)';
  ctx.font = `bold ${titleSize}px monospace`;
  ctx.fillText('SPACE BREAKOUT', cx + 3, titleY + 3);

  // Texte
  const titleGrad = ctx.createLinearGradient(cx - 200 * scale, titleY - 30, cx + 200 * scale, titleY + 10);
  titleGrad.addColorStop(0, '#00d4ff');
  titleGrad.addColorStop(0.5, '#ffffff');
  titleGrad.addColorStop(1, '#00d4ff');
  ctx.fillStyle = titleGrad;
  ctx.fillText('SPACE BREAKOUT', cx, titleY);

  // Sous-titre
  ctx.font = `${subSize}px monospace`;
  ctx.fillStyle = '#667788';
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
  const showSettings = state.showSettings();
  const showCredits = state.showCredits();
  const menuItems = state.menuItems;

  // These will be imported and called separately, don't draw them here
  // if (showSettings) { drawSettingsScreen(ctx); return; }
  // if (showCredits) { drawCreditsScreen(ctx); return; }

  drawTitle(ctx);

  ctx.save();
  ctx.textAlign = 'center';

  const fontSize = Math.round(26 * scale);
  const fontSmall = Math.round(22 * scale);

  for (let i = 0; i < menuItems.length; i++) {
    const { y: itemY, itemH, halfW } = menuItemLayout(i);
    const isSelected = i === selected;

    if (isSelected) {
      ctx.fillStyle = 'rgba(0, 212, 255, 0.1)';
      ctx.fillRect(cx - halfW, itemY - itemH * 0.55, halfW * 2, itemH);
      ctx.strokeStyle = '#00d4ff';
      ctx.lineWidth = 1;
      ctx.strokeRect(cx - halfW, itemY - itemH * 0.55, halfW * 2, itemH);

      ctx.fillStyle = '#ffcc00';
      ctx.font = `${fontSmall}px monospace`;
      ctx.fillText('▸', cx - halfW * 0.83, itemY);
    }

    ctx.fillStyle = isSelected ? '#ffffff' : '#556677';
    ctx.font = isSelected ? `bold ${fontSize}px monospace` : `${fontSmall}px monospace`;
    ctx.fillText(menuItems[i].label, cx, itemY);
  }

  // Instructions
  ctx.font = `${Math.round(12 * scale)}px monospace`;
  ctx.fillStyle = '#445566';
  const isMobile = 'ontouchstart' in window;
  ctx.fillText(
    isMobile ? 'APPUIE POUR SÉLECTIONNER' : '↑↓ NAVIGUER  ·  ESPACE SÉLECTIONNER',
    cx, h * 0.78
  );

  ctx.restore();
}
