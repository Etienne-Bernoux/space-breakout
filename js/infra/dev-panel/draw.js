// --- Dev Panel Draw : Canvas rendering ---

import { CONFIG } from '../../config.js';
import { MATERIALS } from '../../domain/materials.js';
import { PATTERNS, PATTERN_KEYS, GRID_PRESETS } from '../../domain/patterns.js';
import state, { MAT_KEYS, GRID_KEYS, PRESETS } from './state.js';

// --- Layout Constants (2 colonnes : gauche = sliders, droite = patterns/grille/presets) ---
const TRACK_H = 6;
const THUMB_R = 10;
const COL_GAP = 155;
const MAT_SPACING = 36;
const PATTERN_SPACING = 26;
const GRID_SPACING = 26;

const PANEL = {
  // Colonne gauche : matériaux + densité
  sliderX: 160, sliderW: 280, trackH: TRACK_H, thumbR: THUMB_R,
  matStartY: 140, matSpacing: MAT_SPACING,
  densityY: 370,
  // Colonne droite : patterns + grille + presets
  rightX: 490, rightW: 280,
  patternStartY: 135, patternH: 22, patternSpacing: PATTERN_SPACING,
  get gridStartY() { return this.patternStartY + PATTERN_KEYS.length * this.patternSpacing + 20; },
  gridH: 22, gridSpacing: GRID_SPACING,
  // Bas
  launchY: 530,
};

// --- Draw helpers ---

function drawTrack(ctx, x, y, w, val) {
  ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
  ctx.fillRect(x, y - PANEL.trackH / 2, w, PANEL.trackH);
  ctx.fillStyle = '#ffcc00';
  ctx.fillRect(x, y - PANEL.trackH / 2, w * val, PANEL.trackH);
  const tx = x + w * val;
  ctx.beginPath();
  ctx.arc(tx, y, PANEL.thumbR, 0, Math.PI * 2);
  ctx.fillStyle = '#ffffff';
  ctx.fill();
  ctx.strokeStyle = '#ffcc00';
  ctx.lineWidth = 2;
  ctx.stroke();
}

function drawButton(ctx, x, y, w, h, label, selected, hovered, color = '#889999') {
  ctx.fillStyle = selected ? 'rgba(255, 204, 0, 0.2)' : hovered ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.03)';
  ctx.fillRect(x, y, w, h);
  ctx.strokeStyle = selected ? '#ffcc00' : hovered ? '#667788' : '#334455';
  ctx.lineWidth = 1;
  ctx.strokeRect(x, y, w, h);
  ctx.fillStyle = selected ? '#ffcc00' : hovered ? '#ccddee' : color;
  ctx.font = '11px monospace';
  ctx.fillText(label, x + 6, y + 15);
}

// --- Draw ---
export function drawDevPanel(ctx) {
  const w = CONFIG.canvas.width;
  const h = CONFIG.canvas.height;

  ctx.fillStyle = 'rgba(0, 0, 0, 0.88)';
  ctx.fillRect(0, 0, w, h);

  ctx.save();

  // Titre
  ctx.textAlign = 'center';
  ctx.fillStyle = '#ffcc00';
  ctx.font = 'bold 20px monospace';
  ctx.fillText('DEV CONFIG — ASTÉROÏDES', w / 2, 40);
  ctx.font = '10px monospace';
  ctx.fillStyle = '#556666';
  ctx.fillText('localStorage · ?dev · Entrée pour lancer', w / 2, 58);

  // ============ COLONNE GAUCHE : Matériaux + Densité ============
  ctx.textAlign = 'left';
  ctx.fillStyle = '#aabbcc';
  ctx.font = 'bold 13px monospace';
  ctx.fillText('MATÉRIAUX', 20, PANEL.matStartY - 18);

  // Indication: actif seulement en mode aléatoire ou pour les '?' du pattern
  const isPatternMode = state.devConfig.patternKey !== 'random';
  if (isPatternMode) {
    ctx.fillStyle = '#556666';
    ctx.font = '9px monospace';
    ctx.fillText('(pour les cases "?" du pattern)', 120, PANEL.matStartY - 18);
  }

  for (let i = 0; i < MAT_KEYS.length; i++) {
    const key = MAT_KEYS[i];
    const mat = MATERIALS[key];
    const y = PANEL.matStartY + i * PANEL.matSpacing;
    const val = state.devConfig.materials[key] || 0;

    ctx.fillStyle = mat.colors[0];
    ctx.fillRect(20, y - 5, 10, 10);
    ctx.fillStyle = '#ccddee';
    ctx.font = '12px monospace';
    ctx.fillText(mat.name, 36, y + 4);
    ctx.fillStyle = '#556677';
    ctx.font = '9px monospace';
    ctx.fillText(mat.hp === Infinity ? '∞HP' : `${mat.hp}HP`, 110, y + 4);

    drawTrack(ctx, PANEL.sliderX, y, PANEL.sliderW, val);

    ctx.fillStyle = '#889999';
    ctx.font = '10px monospace';
    ctx.textAlign = 'right';
    ctx.fillText(`${Math.round(val * 100)}%`, PANEL.sliderX + PANEL.sliderW + 35, y + 4);
    ctx.textAlign = 'left';
  }

  // Densité (seulement pertinent en mode aléatoire)
  ctx.fillStyle = '#aabbcc';
  ctx.font = 'bold 13px monospace';
  ctx.fillText('DENSITÉ', 20, PANEL.densityY - 15);
  if (isPatternMode) {
    ctx.fillStyle = '#556666';
    ctx.font = '9px monospace';
    ctx.fillText('(ignoré en mode pattern)', 100, PANEL.densityY - 15);
  }
  drawTrack(ctx, PANEL.sliderX, PANEL.densityY, PANEL.sliderW, state.devConfig.density);
  ctx.fillStyle = '#889999';
  ctx.font = '10px monospace';
  ctx.textAlign = 'right';
  ctx.fillText(`${Math.round(state.devConfig.density * 100)}%`, PANEL.sliderX + PANEL.sliderW + 35, PANEL.densityY + 4);
  ctx.textAlign = 'left';

  // Presets (sous la densité)
  const presetY = PANEL.densityY + 35;
  ctx.fillStyle = '#aabbcc';
  ctx.font = 'bold 13px monospace';
  ctx.fillText('PRESETS MATÉRIAUX', 20, presetY);
  for (let i = 0; i < PRESETS.length; i++) {
    const bx = 20 + (i % 3) * 155;
    const by = presetY + 10 + Math.floor(i / 3) * 28;
    drawButton(ctx, bx, by, 148, 24, PRESETS[i].name, false, i === state.hoveredPreset);
  }

  // ============ COLONNE DROITE : Patterns + Grille ============
  const rx = PANEL.rightX;

  // Patterns
  ctx.fillStyle = '#aabbcc';
  ctx.font = 'bold 13px monospace';
  ctx.fillText('PATTERN', rx, PANEL.patternStartY - 18);

  for (let i = 0; i < PATTERN_KEYS.length; i++) {
    const key = PATTERN_KEYS[i];
    const pat = PATTERNS[key];
    const y = PANEL.patternStartY + i * PANEL.patternSpacing;
    const selected = state.devConfig.patternKey === key;
    const hovered = i === state.hoveredPattern;
    drawButton(ctx, rx, y, PANEL.rightW, PANEL.patternH, pat.name, selected, hovered);
    // Indice de taille
    if (pat.grid) {
      ctx.fillStyle = '#556677';
      ctx.font = '9px monospace';
      ctx.fillText(`${pat.grid.cols}×${pat.grid.rows}`, rx + PANEL.rightW - 40, y + 15);
    }
  }

  // Grille (seulement en mode aléatoire)
  const gridSectionY = PANEL.gridStartY;
  ctx.fillStyle = '#aabbcc';
  ctx.font = 'bold 13px monospace';
  ctx.fillText('TAILLE GRILLE', rx, gridSectionY - 10);
  if (isPatternMode) {
    ctx.fillStyle = '#556666';
    ctx.font = '9px monospace';
    ctx.fillText('(définie par le pattern)', rx + 120, gridSectionY - 10);
  }

  for (let i = 0; i < GRID_KEYS.length; i++) {
    const key = GRID_KEYS[i];
    const g = GRID_PRESETS[key];
    const y = gridSectionY + i * PANEL.gridSpacing;
    const selected = !isPatternMode && state.devConfig.gridKey === key;
    const hovered = i === state.hoveredGrid;
    drawButton(ctx, rx, y, PANEL.rightW, PANEL.gridH, g.label, selected, hovered);
  }

  // ============ BAS : Boutons LANCER + RESET ============
  ctx.textAlign = 'center';
  // LANCER
  const launchX = w / 2 - 100;
  ctx.fillStyle = 'rgba(0, 212, 255, 0.2)';
  ctx.fillRect(launchX, PANEL.launchY, 200, 36);
  ctx.strokeStyle = '#00d4ff';
  ctx.lineWidth = 2;
  ctx.strokeRect(launchX, PANEL.launchY, 200, 36);
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 16px monospace';
  ctx.fillText('▸ LANCER', w / 2, PANEL.launchY + 25);

  // RESET
  const resetX = launchX + 220;
  ctx.fillStyle = 'rgba(255, 100, 100, 0.1)';
  ctx.fillRect(resetX, PANEL.launchY, 80, 36);
  ctx.strokeStyle = '#664444';
  ctx.lineWidth = 1;
  ctx.strokeRect(resetX, PANEL.launchY, 80, 36);
  ctx.fillStyle = '#aa6666';
  ctx.font = '12px monospace';
  ctx.fillText('RESET', resetX + 40, PANEL.launchY + 24);

  ctx.restore();
}

export { PANEL };
