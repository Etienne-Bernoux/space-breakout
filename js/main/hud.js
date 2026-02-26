import { CONFIG } from '../config.js';
import { drawPowerUpHUD } from '../infra/power-up-render.js';
import { G, gameScale, pauseBtnLayout, COMBO_FADE_DURATION } from './init.js';

export function drawHUD(fx) {
  const s = gameScale();
  const fontSize = Math.round(18 * s);
  const pad = Math.round(15 * s);
  const pb = pauseBtnLayout();
  const color = fx ? fx.scoreColor : '#ffffff';
  const glow = fx ? fx.scoreGlow : 0;
  G.render.ctx.save();
  G.render.ctx.fillStyle = color;
  G.render.ctx.font = `${fontSize}px monospace`;
  if (glow > 0) {
    G.render.ctx.shadowColor = color;
    G.render.ctx.shadowBlur = glow;
  }
  G.render.ctx.fillText(`VIES: ${G.session.lives}`, pad, pad + fontSize * 0.6);
  const scoreText = `SCORE: ${G.session.score}`;
  const scoreW = G.render.ctx.measureText(scoreText).width;
  G.render.ctx.fillText(scoreText, pb.x - scoreW - 8, pad + fontSize * 0.6);
  G.render.ctx.restore();
}

export function drawCombo() {
  if (G.ui.comboFadeTimer <= 0) return;
  G.ui.comboFadeTimer--;
  const alpha = Math.min(1, G.ui.comboFadeTimer / 30); // fade les 30 dernières frames
  const progress = 1 - G.ui.comboFadeTimer / COMBO_FADE_DURATION;
  const s = gameScale();
  const baseSize = Math.round(36 * s);
  // Le texte grossit légèrement puis rétrécit
  const pulse = 1 + Math.sin(progress * Math.PI) * 0.3;
  const fontSize = Math.round(baseSize * pulse);

  const cx = CONFIG.canvas.width / 2;
  const cy = CONFIG.canvas.height * 0.45 - progress * 30; // monte légèrement

  G.render.ctx.save();
  G.render.ctx.globalAlpha = alpha;
  G.render.ctx.font = `bold ${fontSize}px monospace`;
  G.render.ctx.textAlign = 'center';

  // Couleur selon combo (jaune → orange → rouge)
  const hue = Math.max(0, 60 - (G.ui.comboDisplay - 2) * 15);
  G.render.ctx.fillStyle = `hsl(${hue}, 100%, 60%)`;

  // Ombre
  G.render.ctx.shadowColor = `hsl(${hue}, 100%, 40%)`;
  G.render.ctx.shadowBlur = 12;

  G.render.ctx.fillText(`×${G.ui.comboDisplay}`, cx, cy);

  G.render.ctx.shadowBlur = 0;
  G.render.ctx.globalAlpha = 1;
  G.render.ctx.textAlign = 'start';
  G.render.ctx.restore();
}

export function drawDeathLine(ship, fx) {
  const lineY = ship.y + ship.height + ship.bottomMargin * 0.4;
  const w = CONFIG.canvas.width;
  const [r, g, b] = fx ? fx.deathLine : [0, 212, 255];
  const glowAlpha = fx ? fx.deathLineGlow : 0.07;

  // Lueur diffuse
  const glow = G.render.ctx.createLinearGradient(0, lineY - 15, 0, lineY + 15);
  glow.addColorStop(0, `rgba(${r}, ${g}, ${b}, 0)`);
  glow.addColorStop(0.5, `rgba(${r}, ${g}, ${b}, ${glowAlpha})`);
  glow.addColorStop(1, `rgba(${r}, ${g}, ${b}, 0)`);
  G.render.ctx.fillStyle = glow;
  G.render.ctx.fillRect(0, lineY - 15, w, 30);

  // Ligne avec grésillement
  G.render.ctx.save();
  const segW = 6;
  for (let x = 0; x < w; x += segW) {
    const a = 0.25 + Math.random() * 0.35;
    G.render.ctx.strokeStyle = `rgba(${r}, ${g}, ${b}, ${a})`;
    G.render.ctx.lineWidth = 0.8 + Math.random() * 0.8;
    G.render.ctx.beginPath();
    G.render.ctx.moveTo(x, lineY + (Math.random() - 0.5) * 1.2);
    G.render.ctx.lineTo(x + segW, lineY + (Math.random() - 0.5) * 1.2);
    G.render.ctx.stroke();
  }
  G.render.ctx.restore();
}

export function drawPauseButton() {
  const { x, y, size } = pauseBtnLayout();
  G.render.ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
  G.render.ctx.fillRect(x, y, size, size);
  G.render.ctx.fillStyle = '#ffffff';
  const barW = Math.round(size * 0.13);
  const barH = Math.round(size * 0.53);
  const padX = Math.round(size * 0.3);
  const padY = Math.round(size * 0.23);
  G.render.ctx.fillRect(x + padX, y + padY, barW, barH);
  G.render.ctx.fillRect(x + size - padX - barW, y + padY, barW, barH);
}

export function drawPauseScreen() {
  const cx = CONFIG.canvas.width / 2;
  const cy = CONFIG.canvas.height / 2;
  const s = gameScale();
  const halfW = Math.round(CONFIG.canvas.width * 0.4);
  const btnH = Math.round(44 * s);
  const gap = Math.round(16 * s);

  G.render.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
  G.render.ctx.fillRect(0, 0, CONFIG.canvas.width, CONFIG.canvas.height);

  G.render.ctx.save();
  G.render.ctx.textAlign = 'center';

  G.render.ctx.fillStyle = '#00d4ff';
  G.render.ctx.font = `bold ${Math.round(32 * s)}px monospace`;
  G.render.ctx.fillText('PAUSE', cx, cy - 40 * s);

  // Bouton REPRENDRE
  G.render.ctx.fillStyle = 'rgba(0, 212, 255, 0.15)';
  G.render.ctx.fillRect(cx - halfW, cy, halfW * 2, btnH);
  G.render.ctx.strokeStyle = '#00d4ff';
  G.render.ctx.lineWidth = 1;
  G.render.ctx.strokeRect(cx - halfW, cy, halfW * 2, btnH);
  G.render.ctx.fillStyle = '#ffffff';
  G.render.ctx.font = `${Math.round(20 * s)}px monospace`;
  G.render.ctx.fillText('REPRENDRE', cx, cy + btnH * 0.65);

  // Bouton MENU
  const menuY = cy + btnH + gap;
  G.render.ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
  G.render.ctx.fillRect(cx - halfW, menuY, halfW * 2, btnH);
  G.render.ctx.strokeStyle = '#334455';
  G.render.ctx.strokeRect(cx - halfW, menuY, halfW * 2, btnH);
  G.render.ctx.fillStyle = '#667788';
  G.render.ctx.fillText('MENU', cx, menuY + btnH * 0.65);

  // Instructions clavier
  const isMobile = 'ontouchstart' in window;
  if (!isMobile) {
    G.render.ctx.font = `${Math.round(12 * s)}px monospace`;
    G.render.ctx.fillStyle = '#445566';
    G.render.ctx.fillText('ÉCHAP REPRENDRE  ·  R MENU', cx, menuY + btnH + 30 * s);
  }

  G.render.ctx.restore();
}

export function drawEndScreen(text) {
  const s = gameScale();
  G.render.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
  G.render.ctx.fillRect(0, 0, CONFIG.canvas.width, CONFIG.canvas.height);
  G.render.ctx.fillStyle = '#ffffff';
  G.render.ctx.font = `bold ${Math.round(32 * s)}px monospace`;
  G.render.ctx.textAlign = 'center';
  G.render.ctx.fillText(text, CONFIG.canvas.width / 2, CONFIG.canvas.height / 2);
  G.render.ctx.font = `${Math.round(16 * s)}px monospace`;
  G.render.ctx.fillText('Appuie pour retourner au menu', CONFIG.canvas.width / 2, CONFIG.canvas.height / 2 + 40 * s);
  G.render.ctx.textAlign = 'start';
}
