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

  // Track fond arrondi
  const trackH = 6;
  const trackR = trackH / 2;
  ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
  _roundRect(ctx, sx, y - trackR, sliderW, trackH, trackR);
  ctx.fill();

  // Track rempli avec gradient
  if (val > 0.01) {
    const fillW = sliderW * val;
    const tGrad = ctx.createLinearGradient(sx, 0, sx + fillW, 0);
    tGrad.addColorStop(0, '#0088cc');
    tGrad.addColorStop(1, '#00d4ff');
    ctx.fillStyle = tGrad;
    _roundRect(ctx, sx, y - trackR, fillW, trackH, trackR);
    ctx.fill();
    // Glow sur le fill
    ctx.shadowColor = '#00d4ff';
    ctx.shadowBlur = 6;
    ctx.fill();
    ctx.shadowBlur = 0;
  }

  // Thumb avec glow
  const tx = sx + sliderW * val;
  ctx.shadowColor = '#00d4ff';
  ctx.shadowBlur = 8;
  ctx.beginPath();
  ctx.arc(tx, y, thumbR, 0, Math.PI * 2);
  ctx.fillStyle = '#ffffff';
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.strokeStyle = '#00d4ff';
  ctx.lineWidth = 2;
  ctx.stroke();

  // Percentage
  ctx.fillStyle = '#667788';
  ctx.font = `${Math.round(12 * scale)}px monospace`;
  ctx.fillText(`${Math.round(val * 100)}%`, cx, y + 30 * scale);
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

  const t = Date.now() * 0.001;

  // Titre avec glow pulsant
  ctx.shadowColor = '#00d4ff';
  ctx.shadowBlur = 12 + Math.sin(t * 2) * 4;
  ctx.fillStyle = '#00d4ff';
  ctx.font = `bold ${Math.round(24 * scale)}px monospace`;
  ctx.fillText('RÉGLAGES', cx, h * 0.22);
  ctx.shadowBlur = 0;

  for (const s of sliders) drawSlider(ctx, s);

  // Bouton RETOUR avec glow subtil
  ctx.fillStyle = 'rgba(0, 212, 255, 0.08)';
  ctx.fillRect(btnX, btnY, btnW, btnH);
  ctx.shadowColor = '#00d4ff';
  ctx.shadowBlur = 4;
  ctx.strokeStyle = '#445566';
  ctx.lineWidth = 1;
  ctx.strokeRect(btnX, btnY, btnW, btnH);
  ctx.shadowBlur = 0;
  ctx.font = `${Math.round(14 * scale)}px monospace`;
  ctx.fillStyle = '#8899aa';
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
