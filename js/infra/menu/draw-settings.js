import state from './state.js';
import { layout } from './draw-menu.js';

// Slider dimensions
const SLIDER_RATIO = { widthPct: 0.6, trackH: 6, thumbR: 12 };

const sliders = [
  { label: 'MUSIQUE', yPct: 0.37, get: () => state.musicVolume(), set: v => { state.setMusicVolume(v); } },
  { label: 'SONS', yPct: 0.50, get: () => state.sfxVolume(), set: v => { state.setSfxVolume(v); } },
];

/** Retourne les dimensions du slider en px pour l'écran courant. */
export function sliderLayout(s) {
  const { w, h, cx, scale } = layout();
  const sliderW = w * SLIDER_RATIO.widthPct;
  const sx = cx - sliderW / 2;
  const y = h * s.yPct;
  const thumbR = Math.round(SLIDER_RATIO.thumbR * scale);
  return { cx, sx, y, sliderW, thumbR, scale };
}

export function drawSlider(ctx, s) {
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

export function settingsBackBtnLayout() {
  const { w, cx, h, scale } = layout();
  const btnW = Math.round(w * 0.5);
  const btnH = Math.round(42 * scale);
  const btnY = h * 0.68;
  return { cx, btnX: cx - btnW / 2, btnY, btnW, btnH, scale };
}

export function drawSettingsScreen(ctx) {
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

export function hitSlider(x, y) {
  for (const s of sliders) {
    const { sx, y: sy, sliderW } = sliderLayout(s);
    if (y >= sy - 20 && y <= sy + 20 && x >= sx - 10 && x <= sx + sliderW + 10) {
      return s;
    }
  }
  return null;
}

export function updateSliderValue(s, x) {
  const { sx, sliderW } = sliderLayout(s);
  const val = Math.max(0, Math.min(1, (x - sx) / sliderW));
  s.set(val);
  state.saveSettings();
  const onVolumeChange = state.getOnVolumeChange();
  if (onVolumeChange) onVolumeChange(state.musicVolume(), state.sfxVolume());
}
