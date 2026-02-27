import { CONFIG } from '../config.js';
import { drawPowerUpHUD } from '../infra/power-up-render.js';
import { G, gameScale, pauseBtnLayout, COMBO_FADE_DURATION } from './init.js';

export function drawHUD(fx) {
  const ctx = G.render.ctx;
  const s = gameScale();
  const fontSize = Math.round(18 * s);
  const pad = Math.round(15 * s);
  const pb = pauseBtnLayout();
  const color = fx ? fx.scoreColor : '#ffffff';
  const glow = fx ? fx.scoreGlow : 0;
  ctx.save();
  ctx.fillStyle = color;
  ctx.font = `${fontSize}px monospace`;
  if (glow > 0) {
    ctx.shadowColor = color;
    ctx.shadowBlur = glow;
  }
  ctx.fillText(`VIES: ${G.session.lives}`, pad, pad + fontSize * 0.6);
  const scoreText = `SCORE: ${G.session.score}`;
  const scoreW = ctx.measureText(scoreText).width;
  ctx.fillText(scoreText, pb.x - scoreW - 8, pad + fontSize * 0.6);
  ctx.restore();
}

export function drawCombo() {
  if (G.ui.comboFadeTimer <= 0) return;
  G.ui.comboFadeTimer--;
  const ctx = G.render.ctx;
  const alpha = Math.min(1, G.ui.comboFadeTimer / 30);
  const progress = 1 - G.ui.comboFadeTimer / COMBO_FADE_DURATION;
  const s = gameScale();
  const baseSize = Math.round(36 * s);
  const pulse = 1 + Math.sin(progress * Math.PI) * 0.3;
  const fontSize = Math.round(baseSize * pulse);

  const cx = CONFIG.canvas.width / 2;
  const cy = CONFIG.canvas.height * 0.45 - progress * 30;

  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.font = `bold ${fontSize}px monospace`;
  ctx.textAlign = 'center';

  const hue = Math.max(0, 60 - (G.ui.comboDisplay - 2) * 15);
  ctx.fillStyle = `hsl(${hue}, 100%, 60%)`;
  ctx.shadowColor = `hsl(${hue}, 100%, 40%)`;
  ctx.shadowBlur = 12;
  ctx.fillText(`×${G.ui.comboDisplay}`, cx, cy);
  ctx.shadowBlur = 0;
  ctx.globalAlpha = 1;
  ctx.textAlign = 'start';
  ctx.restore();
}

export function drawDeathLine(ship, fx) {
  const ctx = G.render.ctx;
  const lineY = ship.y + ship.height + ship.bottomMargin * 0.4;
  const w = CONFIG.canvas.width;
  const [r, g, b] = fx ? fx.deathLine : [0, 212, 255];
  const glowAlpha = fx ? fx.deathLineGlow : 0.07;

  const glow = ctx.createLinearGradient(0, lineY - 15, 0, lineY + 15);
  glow.addColorStop(0, `rgba(${r}, ${g}, ${b}, 0)`);
  glow.addColorStop(0.5, `rgba(${r}, ${g}, ${b}, ${glowAlpha})`);
  glow.addColorStop(1, `rgba(${r}, ${g}, ${b}, 0)`);
  ctx.fillStyle = glow;
  ctx.fillRect(0, lineY - 15, w, 30);

  ctx.save();
  const segW = 6;
  for (let x = 0; x < w; x += segW) {
    const a = 0.25 + Math.random() * 0.35;
    ctx.strokeStyle = `rgba(${r}, ${g}, ${b}, ${a})`;
    ctx.lineWidth = 0.8 + Math.random() * 0.8;
    ctx.beginPath();
    ctx.moveTo(x, lineY + (Math.random() - 0.5) * 1.2);
    ctx.lineTo(x + segW, lineY + (Math.random() - 0.5) * 1.2);
    ctx.stroke();
  }
  ctx.restore();
}

export function drawPauseButton() {
  const ctx = G.render.ctx;
  const { x, y, size } = pauseBtnLayout();
  ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
  ctx.fillRect(x, y, size, size);
  ctx.fillStyle = '#ffffff';
  const barW = Math.round(size * 0.13);
  const barH = Math.round(size * 0.53);
  const padX = Math.round(size * 0.3);
  const padY = Math.round(size * 0.23);
  ctx.fillRect(x + padX, y + padY, barW, barH);
  ctx.fillRect(x + size - padX - barW, y + padY, barW, barH);
}

export function drawPauseScreen() {
  const ctx = G.render.ctx;
  const cx = CONFIG.canvas.width / 2;
  const cy = CONFIG.canvas.height / 2;
  const s = gameScale();
  const halfW = Math.round(CONFIG.canvas.width * 0.4);
  const btnH = Math.round(44 * s);
  const gap = Math.round(16 * s);

  ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
  ctx.fillRect(0, 0, CONFIG.canvas.width, CONFIG.canvas.height);

  ctx.save();
  ctx.textAlign = 'center';

  ctx.fillStyle = '#00d4ff';
  ctx.font = `bold ${Math.round(32 * s)}px monospace`;
  ctx.fillText('PAUSE', cx, cy - 40 * s);

  // Bouton REPRENDRE
  ctx.fillStyle = 'rgba(0, 212, 255, 0.15)';
  ctx.fillRect(cx - halfW, cy, halfW * 2, btnH);
  ctx.strokeStyle = '#00d4ff';
  ctx.lineWidth = 1;
  ctx.strokeRect(cx - halfW, cy, halfW * 2, btnH);
  ctx.fillStyle = '#ffffff';
  ctx.font = `${Math.round(20 * s)}px monospace`;
  ctx.fillText('REPRENDRE', cx, cy + btnH * 0.65);

  // Bouton MENU
  const menuY = cy + btnH + gap;
  ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
  ctx.fillRect(cx - halfW, menuY, halfW * 2, btnH);
  ctx.strokeStyle = '#334455';
  ctx.strokeRect(cx - halfW, menuY, halfW * 2, btnH);
  ctx.fillStyle = '#667788';
  ctx.fillText('MENU', cx, menuY + btnH * 0.65);

  // Instructions clavier
  const isMobile = 'ontouchstart' in window;
  if (!isMobile) {
    ctx.font = `${Math.round(12 * s)}px monospace`;
    ctx.fillStyle = '#445566';
    ctx.fillText('ÉCHAP REPRENDRE  ·  R MENU', cx, menuY + btnH + 30 * s);
  }

  ctx.restore();
}

export function drawEndScreen(text) {
  const ctx = G.render.ctx;
  const s = gameScale();
  ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
  ctx.fillRect(0, 0, CONFIG.canvas.width, CONFIG.canvas.height);
  ctx.fillStyle = '#ffffff';
  ctx.font = `bold ${Math.round(32 * s)}px monospace`;
  ctx.textAlign = 'center';
  ctx.fillText(text, CONFIG.canvas.width / 2, CONFIG.canvas.height / 2);
  ctx.font = `${Math.round(16 * s)}px monospace`;
  ctx.fillText('Appuie pour retourner au menu', CONFIG.canvas.width / 2, CONFIG.canvas.height / 2 + 40 * s);
  ctx.textAlign = 'start';
}
