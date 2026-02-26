import { CONFIG } from '../config.js';

const menuItems = [
  { label: 'JOUER', action: 'play' },
  { label: 'RÉGLAGES', action: 'settings' },
  { label: 'CRÉDITS', action: 'credits' },
];

let selected = 0;
let showCredits = false;
let showSettings = false;

// --- Volume settings (0..1) ---
const STORAGE_KEY = 'space-breakout-settings';
let musicVolume = 0.5;
let sfxVolume = 1.0;
let draggingSlider = null; // 'music' | 'sfx' | null
let onVolumeChange = null; // callback set from main.js

export function setVolumeChangeCallback(cb) { onVolumeChange = cb; }
export function getMusicVolume() { return musicVolume; }
export function getSfxVolume() { return sfxVolume; }

export function loadSettings() {
  try {
    const data = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (data) {
      musicVolume = data.music ?? 0.5;
      sfxVolume = data.sfx ?? 1.0;
    }
  } catch (_) {}
}

function saveSettings() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ music: musicVolume, sfx: sfxVolume }));
}

// Astéroïdes décoratifs flottants
const floatingRocks = Array.from({ length: 6 }, () => ({
  x: Math.random() * CONFIG.canvas.width,
  y: Math.random() * CONFIG.canvas.height,
  size: 10 + Math.random() * 20,
  speed: 0.2 + Math.random() * 0.3,
  angle: 0,
  rotSpeed: (Math.random() - 0.5) * 0.02,
  color: CONFIG.asteroids.colors[Math.floor(Math.random() * 4)],
}));

function drawFloatingRocks(ctx) {
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
function menuItemLayout(i) {
  const { w, h, scale } = layout();
  const startY = h * 0.42;
  const spacing = Math.round(60 * scale);
  const itemH = Math.round(48 * scale);
  const halfW = Math.round(w * 0.4); // 80% de largeur totale
  return { y: startY + i * spacing, itemH, halfW, scale };
}

function drawMenu(ctx) {
  const { cx, h, scale } = layout();

  if (showSettings) { drawSettingsScreen(ctx); return; }
  if (showCredits) { drawCreditsScreen(ctx); return; }

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

// --- Layout responsive ---
// Scale basé sur la largeur, clampé à [0.6, 1.0].
// Sur petit écran (400px) : 400/500 = 0.8 → textes lisibles.
// Sur grand écran (800px+) : clampé à 1.0 → pas de surdimensionnement.
function layout() {
  const w = CONFIG.canvas.width;
  const h = CONFIG.canvas.height;
  const scale = Math.min(1.0, Math.max(0.6, w / 500));
  return { w, h, cx: w / 2, scale };
}

// --- Slider dimensions ---
const SLIDER_RATIO = { widthPct: 0.6, trackH: 6, thumbR: 12 };
const sliders = [
  { label: 'MUSIQUE', yPct: 0.37, get: () => musicVolume, set: v => { musicVolume = v; } },
  { label: 'SONS', yPct: 0.50, get: () => sfxVolume, set: v => { sfxVolume = v; } },
];

/** Retourne les dimensions du slider en px pour l'écran courant. */
function sliderLayout(s) {
  const { w, h, cx, scale } = layout();
  const sliderW = w * SLIDER_RATIO.widthPct;
  const sx = cx - sliderW / 2;
  const y = h * s.yPct;
  const thumbR = Math.round(SLIDER_RATIO.thumbR * scale);
  return { cx, sx, y, sliderW, thumbR, scale };
}

function drawSlider(ctx, s) {
  const { cx, sx, y, sliderW, thumbR, scale } = sliderLayout(s);
  const val = s.get();

  ctx.textAlign = 'center';
  ctx.fillStyle = '#aabbcc';
  ctx.font = `${Math.round(16 * scale)}px monospace`;
  ctx.fillText(s.label, cx, y - 20 * scale);

  // Track
  ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
  ctx.fillRect(sx, y - 3, sliderW, 6);
  ctx.fillStyle = '#00d4ff';
  ctx.fillRect(sx, y - 3, sliderW * val, 6);

  // Thumb
  const tx = sx + sliderW * val;
  ctx.beginPath();
  ctx.arc(tx, y, thumbR, 0, Math.PI * 2);
  ctx.fillStyle = '#ffffff';
  ctx.fill();
  ctx.strokeStyle = '#00d4ff';
  ctx.lineWidth = 2;
  ctx.stroke();

  // Percentage
  ctx.fillStyle = '#667788';
  ctx.font = `${Math.round(12 * scale)}px monospace`;
  ctx.fillText(`${Math.round(val * 100)}%`, cx, y + 30 * scale);
}

function settingsBackBtnLayout() {
  const { w, cx, h, scale } = layout();
  const btnW = Math.round(w * 0.5);
  const btnH = Math.round(42 * scale);
  const btnY = h * 0.68;
  return { cx, btnX: cx - btnW / 2, btnY, btnW, btnH, scale };
}

function drawSettingsScreen(ctx) {
  const { cx, h, scale } = layout();
  const { btnX, btnY, btnW, btnH } = settingsBackBtnLayout();

  ctx.save();
  ctx.textAlign = 'center';

  ctx.fillStyle = '#00d4ff';
  ctx.font = `bold ${Math.round(24 * scale)}px monospace`;
  ctx.fillText('RÉGLAGES', cx, h * 0.22);

  for (const s of sliders) drawSlider(ctx, s);

  // Bouton RETOUR
  ctx.fillStyle = 'rgba(0, 212, 255, 0.1)';
  ctx.fillRect(btnX, btnY, btnW, btnH);
  ctx.strokeStyle = '#334455';
  ctx.lineWidth = 1;
  ctx.strokeRect(btnX, btnY, btnW, btnH);
  ctx.font = `${Math.round(14 * scale)}px monospace`;
  ctx.fillStyle = '#667788';
  ctx.fillText('RETOUR', cx, btnY + btnH * 0.65);

  ctx.restore();
}

function hitSlider(x, y) {
  for (const s of sliders) {
    const { sx, y: sy, sliderW } = sliderLayout(s);
    if (y >= sy - 20 && y <= sy + 20 && x >= sx - 10 && x <= sx + sliderW + 10) {
      return s;
    }
  }
  return null;
}

function updateSliderValue(s, x) {
  const { sx, sliderW } = sliderLayout(s);
  const val = Math.max(0, Math.min(1, (x - sx) / sliderW));
  s.set(val);
  saveSettings();
  if (onVolumeChange) onVolumeChange(musicVolume, sfxVolume);
}

function creditsBackBtnLayout() {
  const { w, cx, h, scale } = layout();
  const btnW = Math.round(w * 0.5);
  const btnH = Math.round(42 * scale);
  const btnY = h * 0.65;
  return { cx, btnX: cx - btnW / 2, btnY, btnW, btnH, scale };
}

function drawCreditsScreen(ctx) {
  const { cx, h, scale } = layout();
  const { btnX, btnY, btnW, btnH } = creditsBackBtnLayout();

  ctx.save();
  ctx.textAlign = 'center';

  ctx.fillStyle = '#00d4ff';
  ctx.font = `bold ${Math.round(24 * scale)}px monospace`;
  ctx.fillText('CRÉDITS', cx, h * 0.22);

  ctx.fillStyle = '#aabbcc';
  ctx.font = `${Math.round(16 * scale)}px monospace`;
  ctx.fillText('Développé par Etienne Bernoux', cx, h * 0.37);

  ctx.fillStyle = '#667788';
  ctx.font = `${Math.round(14 * scale)}px monospace`;
  ctx.fillText('Inspiré du casse-briques d\'Adibou', cx, h * 0.44);
  ctx.fillText('Construit avec Canvas API', cx, h * 0.49);

  // Bouton retour
  ctx.fillStyle = 'rgba(0, 212, 255, 0.1)';
  ctx.fillRect(btnX, btnY, btnW, btnH);
  ctx.strokeStyle = '#334455';
  ctx.lineWidth = 1;
  ctx.strokeRect(btnX, btnY, btnW, btnH);
  ctx.font = `${Math.round(14 * scale)}px monospace`;
  ctx.fillStyle = '#667788';
  ctx.fillText('RETOUR', cx, btnY + btnH * 0.65);

  ctx.restore();
}

export function updateMenu(ctx) {
  drawFloatingRocks(ctx);
  drawMenu(ctx);
}

export function handleMenuInput(key) {
  if (showSettings) {
    if (key === 'Escape') showSettings = false;
    return null;
  }
  if (showCredits) {
    if (key === 'Escape') showCredits = false;
    return null;
  }

  if (key === 'ArrowUp') selected = (selected - 1 + menuItems.length) % menuItems.length;
  if (key === 'ArrowDown') selected = (selected + 1) % menuItems.length;

  if (key === ' ' || key === 'Enter') {
    const action = menuItems[selected].action;
    if (action === 'settings') { showSettings = true; return null; }
    if (action === 'credits') { showCredits = true; return null; }
    return action;
  }
  return null;
}

export function handleMenuTap(x, y) {
  const { cx } = layout();

  if (showSettings) {
    const { btnX, btnY, btnW, btnH } = settingsBackBtnLayout();
    if (x >= btnX && x <= btnX + btnW && y >= btnY && y <= btnY + btnH) {
      showSettings = false;
      return null;
    }
    const s = hitSlider(x, y);
    if (s) { draggingSlider = s; updateSliderValue(s, x); }
    return null;
  }

  if (showCredits) {
    const { btnX, btnY, btnW, btnH } = creditsBackBtnLayout();
    if (x >= btnX && x <= btnX + btnW && y >= btnY && y <= btnY + btnH) {
      showCredits = false;
    }
    return null;
  }

  // Détection tap sur les items
  for (let i = 0; i < menuItems.length; i++) {
    const { y: itemY, itemH, halfW } = menuItemLayout(i);
    if (x >= cx - halfW && x <= cx + halfW && y >= itemY - itemH * 0.55 && y <= itemY + itemH * 0.45) {
      const action = menuItems[i].action;
      if (action === 'settings') { showSettings = true; return null; }
      if (action === 'credits') { showCredits = true; return null; }
      return action;
    }
  }
  return null;
}

export function handleMenuDrag(x, y) {
  if (draggingSlider) {
    updateSliderValue(draggingSlider, x);
  }
}

export function handleMenuRelease() {
  draggingSlider = null;
}

export function updateMenuHover(mx, my) {
  if (showSettings || showCredits || mx === null || my === null) return;
  const { cx } = layout();
  for (let i = 0; i < menuItems.length; i++) {
    const { y: itemY, itemH, halfW } = menuItemLayout(i);
    if (mx >= cx - halfW && mx <= cx + halfW && my >= itemY - itemH * 0.55 && my <= itemY + itemH * 0.45) {
      selected = i;
      return;
    }
  }
}

export function resetMenu() {
  selected = 0;
  showCredits = false;
  showSettings = false;
  draggingSlider = null;
}
