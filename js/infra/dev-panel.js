// --- Dev Panel : config astéroïdes pour le développement ---
// Activé via ?dev=1 dans l'URL. Sauvegarde en localStorage.
// S'affiche AVANT le menu, permet de configurer puis lancer.

import { CONFIG } from '../config.js';
import { MATERIALS } from '../domain/materials.js';

const STORAGE_KEY = 'space-breakout-dev';
const MAT_KEYS = Object.keys(MATERIALS); // rock, ice, lava, metal, crystal, obsidian

// --- Presets ---
const PRESETS = [
  { name: 'Niveau 1 — Roche',     density: 0.5, mats: { rock: 1.0 } },
  { name: 'Niveau 2 — Givre',     density: 0.5, mats: { rock: 0.6, ice: 0.3, crystal: 0.1 } },
  { name: 'Niveau 3 — Volcan',    density: 0.55, mats: { rock: 0.4, lava: 0.35, metal: 0.15, obsidian: 0.1 } },
  { name: 'Niveau 4 — Forteresse', density: 0.6, mats: { rock: 0.2, metal: 0.35, obsidian: 0.2, lava: 0.15, crystal: 0.1 } },
  { name: 'Endgame — Chaos',      density: 0.65, mats: { rock: 0.15, ice: 0.1, lava: 0.2, metal: 0.25, crystal: 0.1, obsidian: 0.2 } },
  { name: 'Cristaux purs',        density: 0.4, mats: { crystal: 0.7, ice: 0.3 } },
];

// --- State ---
let devConfig = {
  density: CONFIG.asteroids.density,
  materials: { rock: 1.0, ice: 0, lava: 0, metal: 0, crystal: 0, obsidian: 0 },
};
let active = false;
let draggingSlider = null; // { key, type } type = 'mat' | 'density'
let hoveredPreset = -1;

// --- Persistence ---
export function loadDevConfig() {
  try {
    const data = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (data) {
      devConfig.density = data.density ?? devConfig.density;
      if (data.materials) devConfig.materials = { ...devConfig.materials, ...data.materials };
    }
  } catch (_) {}
}

function saveDevConfig() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(devConfig));
}

export function isDevMode() {
  return new URLSearchParams(window.location.search).has('dev');
}

export function isDevPanelActive() { return active; }
export function showDevPanel() { active = true; }
export function hideDevPanel() { active = false; }

/** Retourne la config astéroïdes enrichie du dev panel */
export function getDevAsteroidConfig() {
  // Normaliser les poids pour qu'ils fassent 1.0
  const mats = { ...devConfig.materials };
  const total = Object.values(mats).reduce((s, v) => s + v, 0);
  if (total > 0) {
    for (const k of MAT_KEYS) mats[k] = (mats[k] || 0) / total;
  }
  // Filtrer les matériaux à 0
  const filtered = {};
  for (const [k, v] of Object.entries(mats)) {
    if (v > 0.001) filtered[k] = v;
  }
  return {
    ...CONFIG.asteroids,
    density: devConfig.density,
    materials: Object.keys(filtered).length > 0 ? filtered : undefined,
  };
}

// --- Layout ---
const PANEL = {
  sliderX: 180, sliderW: 350, trackH: 6, thumbR: 10,
  matStartY: 170, matSpacing: 42,
  densityY: 440,
  presetStartY: 160, presetX: 600, presetW: 160, presetH: 28, presetSpacing: 34,
  launchY: 510,
};

// --- Draw ---
export function drawDevPanel(ctx) {
  const w = CONFIG.canvas.width;
  const cx = w / 2;

  // Fond semi-opaque
  ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
  ctx.fillRect(0, 0, w, CONFIG.canvas.height);

  ctx.save();
  ctx.textAlign = 'center';

  // Titre
  ctx.fillStyle = '#ffcc00';
  ctx.font = 'bold 22px monospace';
  ctx.fillText('DEV CONFIG — ASTÉROÏDES', cx - 50, 50);

  ctx.font = '11px monospace';
  ctx.fillStyle = '#556666';
  ctx.fillText('Sauvegardé dans localStorage · ?dev dans l\'URL', cx - 50, 75);

  ctx.textAlign = 'left';

  // --- Sliders matériaux ---
  ctx.fillStyle = '#aabbcc';
  ctx.font = 'bold 14px monospace';
  ctx.fillText('MATÉRIAUX', 30, 145);

  for (let i = 0; i < MAT_KEYS.length; i++) {
    const key = MAT_KEYS[i];
    const mat = MATERIALS[key];
    const y = PANEL.matStartY + i * PANEL.matSpacing;
    const val = devConfig.materials[key] || 0;

    // Label avec couleur du matériau
    ctx.fillStyle = mat.colors[0];
    ctx.fillRect(30, y - 6, 12, 12);
    ctx.fillStyle = '#ccddee';
    ctx.font = '13px monospace';
    ctx.fillText(mat.name, 50, y + 4);

    // Info HP
    ctx.fillStyle = '#556677';
    ctx.font = '10px monospace';
    const hpText = mat.hp === Infinity ? '∞ HP' : `${mat.hp} HP`;
    ctx.fillText(hpText, 130, y + 4);

    // Track
    drawTrack(ctx, PANEL.sliderX, y, PANEL.sliderW, val);

    // Valeur
    ctx.fillStyle = '#889999';
    ctx.font = '11px monospace';
    ctx.textAlign = 'right';
    ctx.fillText(`${Math.round(val * 100)}%`, PANEL.sliderX + PANEL.sliderW + 40, y + 4);
    ctx.textAlign = 'left';
  }

  // --- Slider densité ---
  ctx.fillStyle = '#aabbcc';
  ctx.font = 'bold 14px monospace';
  ctx.fillText('DENSITÉ', 30, PANEL.densityY - 15);

  drawTrack(ctx, PANEL.sliderX, PANEL.densityY, PANEL.sliderW, devConfig.density);
  ctx.fillStyle = '#889999';
  ctx.font = '11px monospace';
  ctx.textAlign = 'right';
  ctx.fillText(`${Math.round(devConfig.density * 100)}%`, PANEL.sliderX + PANEL.sliderW + 40, PANEL.densityY + 4);
  ctx.textAlign = 'left';

  // --- Presets ---
  ctx.fillStyle = '#aabbcc';
  ctx.font = 'bold 14px monospace';
  ctx.fillText('PRESETS', PANEL.presetX, 145);

  for (let i = 0; i < PRESETS.length; i++) {
    const y = PANEL.presetStartY + i * PANEL.presetSpacing;
    const hovered = i === hoveredPreset;
    ctx.fillStyle = hovered ? 'rgba(255, 204, 0, 0.15)' : 'rgba(255, 255, 255, 0.05)';
    ctx.fillRect(PANEL.presetX, y, PANEL.presetW, PANEL.presetH);
    ctx.strokeStyle = hovered ? '#ffcc00' : '#334455';
    ctx.lineWidth = 1;
    ctx.strokeRect(PANEL.presetX, y, PANEL.presetW, PANEL.presetH);
    ctx.fillStyle = hovered ? '#ffcc00' : '#889999';
    ctx.font = '11px monospace';
    ctx.fillText(PRESETS[i].name, PANEL.presetX + 8, y + 18);
  }

  // --- Bouton LANCER ---
  ctx.textAlign = 'center';
  const btnX = cx - 50;
  const btnW = 200;
  ctx.fillStyle = 'rgba(0, 212, 255, 0.2)';
  ctx.fillRect(btnX - 50, PANEL.launchY, btnW, 40);
  ctx.strokeStyle = '#00d4ff';
  ctx.lineWidth = 2;
  ctx.strokeRect(btnX - 50, PANEL.launchY, btnW, 40);
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 18px monospace';
  ctx.fillText('▸ LANCER', cx - 50, PANEL.launchY + 27);

  // --- Bouton RESET ---
  ctx.fillStyle = 'rgba(255, 100, 100, 0.1)';
  ctx.fillRect(btnX + 170, PANEL.launchY, 100, 40);
  ctx.strokeStyle = '#664444';
  ctx.lineWidth = 1;
  ctx.strokeRect(btnX + 170, PANEL.launchY, 100, 40);
  ctx.fillStyle = '#aa6666';
  ctx.font = '13px monospace';
  ctx.fillText('RESET', btnX + 220, PANEL.launchY + 26);

  ctx.restore();
}

function drawTrack(ctx, x, y, w, val) {
  // Track bg
  ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
  ctx.fillRect(x, y - PANEL.trackH / 2, w, PANEL.trackH);
  // Track fill
  ctx.fillStyle = '#ffcc00';
  ctx.fillRect(x, y - PANEL.trackH / 2, w * val, PANEL.trackH);
  // Thumb
  const tx = x + w * val;
  ctx.beginPath();
  ctx.arc(tx, y, PANEL.thumbR, 0, Math.PI * 2);
  ctx.fillStyle = '#ffffff';
  ctx.fill();
  ctx.strokeStyle = '#ffcc00';
  ctx.lineWidth = 2;
  ctx.stroke();
}

// --- Input handlers ---

export function handleDevTap(x, y) {
  const cx = CONFIG.canvas.width / 2;

  // Presets
  for (let i = 0; i < PRESETS.length; i++) {
    const py = PANEL.presetStartY + i * PANEL.presetSpacing;
    if (x >= PANEL.presetX && x <= PANEL.presetX + PANEL.presetW &&
        y >= py && y <= py + PANEL.presetH) {
      applyPreset(i);
      return null;
    }
  }

  // Bouton LANCER
  const btnX = cx - 100;
  if (x >= btnX && x <= btnX + 200 && y >= PANEL.launchY && y <= PANEL.launchY + 40) {
    saveDevConfig();
    return 'launch';
  }

  // Bouton RESET
  if (x >= btnX + 220 && x <= btnX + 320 && y >= PANEL.launchY && y <= PANEL.launchY + 40) {
    devConfig.density = CONFIG.asteroids.density;
    devConfig.materials = { rock: 1.0, ice: 0, lava: 0, metal: 0, crystal: 0, obsidian: 0 };
    saveDevConfig();
    return null;
  }

  // Sliders matériaux
  for (let i = 0; i < MAT_KEYS.length; i++) {
    const sy = PANEL.matStartY + i * PANEL.matSpacing;
    if (hitTrack(x, y, sy)) {
      draggingSlider = { key: MAT_KEYS[i], type: 'mat' };
      updateDragValue(x);
      return null;
    }
  }

  // Slider densité
  if (hitTrack(x, y, PANEL.densityY)) {
    draggingSlider = { key: 'density', type: 'density' };
    updateDragValue(x);
    return null;
  }

  return null;
}

function hitTrack(x, y, trackY) {
  return x >= PANEL.sliderX - 10 && x <= PANEL.sliderX + PANEL.sliderW + 10 &&
         y >= trackY - 16 && y <= trackY + 16;
}

function updateDragValue(x) {
  if (!draggingSlider) return;
  const val = Math.max(0, Math.min(1, (x - PANEL.sliderX) / PANEL.sliderW));
  if (draggingSlider.type === 'density') {
    devConfig.density = Math.round(val * 20) / 20; // pas de 5%
  } else {
    devConfig.materials[draggingSlider.key] = Math.round(val * 20) / 20;
  }
  saveDevConfig();
}

export function handleDevDrag(x, _y) {
  updateDragValue(x);
}

export function handleDevRelease() {
  draggingSlider = null;
}

export function handleDevHover(x, y) {
  hoveredPreset = -1;
  for (let i = 0; i < PRESETS.length; i++) {
    const py = PANEL.presetStartY + i * PANEL.presetSpacing;
    if (x >= PANEL.presetX && x <= PANEL.presetX + PANEL.presetW &&
        y >= py && y <= py + PANEL.presetH) {
      hoveredPreset = i;
      return;
    }
  }
}

function applyPreset(index) {
  const p = PRESETS[index];
  devConfig.density = p.density;
  // Reset tous à 0 puis applique le preset
  for (const k of MAT_KEYS) devConfig.materials[k] = 0;
  for (const [k, v] of Object.entries(p.mats)) devConfig.materials[k] = v;
  saveDevConfig();
}
