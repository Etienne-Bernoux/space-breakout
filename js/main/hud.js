import { CONFIG } from '../config.js';
import { drawPowerUpHUD } from '../infra/power-up-render.js';
import { G, gameScale, pauseBtnLayout, COMBO_FADE_DURATION } from './init.js';

export function drawHUD() {
  const s = gameScale();
  const fontSize = Math.round(18 * s);
  const pad = Math.round(15 * s);
  const pb = pauseBtnLayout();
  G.ctx.fillStyle = '#ffffff';
  G.ctx.font = `${fontSize}px monospace`;
  G.ctx.fillText(`VIES: ${G.session.lives}`, pad, pad + fontSize * 0.6);
  const scoreText = `SCORE: ${G.session.score}`;
  const scoreW = G.ctx.measureText(scoreText).width;
  // Placer le score à gauche du bouton pause
  G.ctx.fillText(scoreText, pb.x - scoreW - 8, pad + fontSize * 0.6);
}

export function drawCombo() {
  if (G.comboFadeTimer <= 0) return;
  G.comboFadeTimer--;
  const alpha = Math.min(1, G.comboFadeTimer / 30); // fade les 30 dernières frames
  const progress = 1 - G.comboFadeTimer / COMBO_FADE_DURATION;
  const s = gameScale();
  const baseSize = Math.round(36 * s);
  // Le texte grossit légèrement puis rétrécit
  const pulse = 1 + Math.sin(progress * Math.PI) * 0.3;
  const fontSize = Math.round(baseSize * pulse);

  const cx = CONFIG.canvas.width / 2;
  const cy = CONFIG.canvas.height * 0.45 - progress * 30; // monte légèrement

  G.ctx.save();
  G.ctx.globalAlpha = alpha;
  G.ctx.font = `bold ${fontSize}px monospace`;
  G.ctx.textAlign = 'center';

  // Couleur selon combo (jaune → orange → rouge)
  const hue = Math.max(0, 60 - (G.comboDisplay - 2) * 15);
  G.ctx.fillStyle = `hsl(${hue}, 100%, 60%)`;

  // Ombre
  G.ctx.shadowColor = `hsl(${hue}, 100%, 40%)`;
  G.ctx.shadowBlur = 12;

  G.ctx.fillText(`×${G.comboDisplay}`, cx, cy);

  G.ctx.shadowBlur = 0;
  G.ctx.globalAlpha = 1;
  G.ctx.textAlign = 'start';
  G.ctx.restore();
}

export function drawDeathLine(ship) {
  const lineY = ship.y + ship.height + ship.bottomMargin * 0.4;
  const w = CONFIG.canvas.width;

  // Lueur diffuse statique
  const glow = G.ctx.createLinearGradient(0, lineY - 15, 0, lineY + 15);
  glow.addColorStop(0, 'rgba(0, 212, 255, 0)');
  glow.addColorStop(0.5, 'rgba(0, 212, 255, 0.07)');
  glow.addColorStop(1, 'rgba(0, 212, 255, 0)');
  G.ctx.fillStyle = glow;
  G.ctx.fillRect(0, lineY - 15, w, 30);

  // Ligne continue avec grésillement (segments d'opacité variable)
  G.ctx.save();
  const segW = 6;
  for (let x = 0; x < w; x += segW) {
    const a = 0.25 + Math.random() * 0.35;
    G.ctx.strokeStyle = `rgba(0, 212, 255, ${a})`;
    G.ctx.lineWidth = 0.8 + Math.random() * 0.8;
    G.ctx.beginPath();
    G.ctx.moveTo(x, lineY + (Math.random() - 0.5) * 1.2);
    G.ctx.lineTo(x + segW, lineY + (Math.random() - 0.5) * 1.2);
    G.ctx.stroke();
  }
  G.ctx.restore();
}

export function drawPauseButton() {
  const { x, y, size } = pauseBtnLayout();
  G.ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
  G.ctx.fillRect(x, y, size, size);
  G.ctx.fillStyle = '#ffffff';
  const barW = Math.round(size * 0.13);
  const barH = Math.round(size * 0.53);
  const padX = Math.round(size * 0.3);
  const padY = Math.round(size * 0.23);
  G.ctx.fillRect(x + padX, y + padY, barW, barH);
  G.ctx.fillRect(x + size - padX - barW, y + padY, barW, barH);
}

export function drawPauseScreen() {
  const cx = CONFIG.canvas.width / 2;
  const cy = CONFIG.canvas.height / 2;
  const s = gameScale();
  const halfW = Math.round(CONFIG.canvas.width * 0.4);
  const btnH = Math.round(44 * s);
  const gap = Math.round(16 * s);

  G.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
  G.ctx.fillRect(0, 0, CONFIG.canvas.width, CONFIG.canvas.height);

  G.ctx.save();
  G.ctx.textAlign = 'center';

  G.ctx.fillStyle = '#00d4ff';
  G.ctx.font = `bold ${Math.round(32 * s)}px monospace`;
  G.ctx.fillText('PAUSE', cx, cy - 40 * s);

  // Bouton REPRENDRE
  G.ctx.fillStyle = 'rgba(0, 212, 255, 0.15)';
  G.ctx.fillRect(cx - halfW, cy, halfW * 2, btnH);
  G.ctx.strokeStyle = '#00d4ff';
  G.ctx.lineWidth = 1;
  G.ctx.strokeRect(cx - halfW, cy, halfW * 2, btnH);
  G.ctx.fillStyle = '#ffffff';
  G.ctx.font = `${Math.round(20 * s)}px monospace`;
  G.ctx.fillText('REPRENDRE', cx, cy + btnH * 0.65);

  // Bouton MENU
  const menuY = cy + btnH + gap;
  G.ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
  G.ctx.fillRect(cx - halfW, menuY, halfW * 2, btnH);
  G.ctx.strokeStyle = '#334455';
  G.ctx.strokeRect(cx - halfW, menuY, halfW * 2, btnH);
  G.ctx.fillStyle = '#667788';
  G.ctx.fillText('MENU', cx, menuY + btnH * 0.65);

  // Instructions clavier
  const isMobile = 'ontouchstart' in window;
  if (!isMobile) {
    G.ctx.font = `${Math.round(12 * s)}px monospace`;
    G.ctx.fillStyle = '#445566';
    G.ctx.fillText('ÉCHAP REPRENDRE  ·  R MENU', cx, menuY + btnH + 30 * s);
  }

  G.ctx.restore();
}

export function drawEndScreen(text) {
  const s = gameScale();
  G.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
  G.ctx.fillRect(0, 0, CONFIG.canvas.width, CONFIG.canvas.height);
  G.ctx.fillStyle = '#ffffff';
  G.ctx.font = `bold ${Math.round(32 * s)}px monospace`;
  G.ctx.textAlign = 'center';
  G.ctx.fillText(text, CONFIG.canvas.width / 2, CONFIG.canvas.height / 2);
  G.ctx.font = `${Math.round(16 * s)}px monospace`;
  G.ctx.fillText('Appuie pour retourner au menu', CONFIG.canvas.width / 2, CONFIG.canvas.height / 2 + 40 * s);
  G.ctx.textAlign = 'start';
}
