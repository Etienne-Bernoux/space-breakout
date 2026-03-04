const COMBO_ALPHA_FRAMES = 30;       // frames pendant lesquelles le combo est pleinement opaque
const COMBO_PULSE_AMP = 0.3;         // amplitude du pulse sinusoïdal
const COMBO_MIN = 2;                 // combo minimum affiché
const COMBO_MAX = 15;                // combo pour couleur max (rouge vif)
const COMBO_HUE_START = 60;          // hue jaune
const COMBO_HUE_END = 0;             // hue rouge
const COMBO_LIT_START = 60;          // lightness au combo min (%)
const COMBO_LIT_END = 75;            // lightness au combo max (%)
const COMBO_GLOW_MIN = 12;           // glow minimum (px)
const COMBO_GLOW_MAX = 20;           // glow maximum (px)
const DEATH_LINE_MARGIN_RATIO = 0.4; // ratio de bottomMargin pour la death line

export class HudRenderer {
  /**
   * @param {object} deps
   * @param {object} deps.render   - { ctx }
   * @param {object} deps.session  - { lives, score }
   * @param {object} deps.ui       - { comboFadeTimer, comboDisplay }
   * @param {object} deps.canvas   - { width, height } (CONFIG.canvas)
   * @param {function} deps.gameScale
   * @param {function} deps.pauseBtnLayout
   * @param {function} deps.pauseScreenLayout
   */
  constructor({ render, session, ui, canvas, config, gameScale, pauseBtnLayout, pauseScreenLayout, getLevel }) {
    this.render = render;
    this.session = session;
    this.ui = ui;
    this.canvas = canvas;
    this.config = config;
    this.gameScale = gameScale;
    this.pauseBtnLayout = pauseBtnLayout;
    this.pauseScreenLayout = pauseScreenLayout;
    this.getLevel = getLevel || (() => null);
  }

  drawHUD(fx) {
    const ctx = this.render.ctx;
    const s = this.gameScale();
    const fontSize = Math.round(18 * s);
    const pad = Math.round(15 * s);
    const pb = this.pauseBtnLayout();
    const color = fx ? fx.scoreColor : '#ffffff';
    const glow = fx ? fx.scoreGlow : 0;
    ctx.save();
    ctx.fillStyle = color;
    ctx.font = `${fontSize}px monospace`;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';
    if (glow > 0) {
      ctx.shadowColor = color;
      ctx.shadowBlur = glow;
    }
    ctx.fillText(`VIES: ${this.session.lives}`, pad, pad + fontSize * 0.6);
    const scoreText = `SCORE: ${this.session.score}`;
    const scoreW = ctx.measureText(scoreText).width;
    ctx.fillText(scoreText, pb.x - scoreW - 8, pad + fontSize * 0.6);
    ctx.restore();
  }

  drawCombo(dt = 1) {
    if (this.ui.comboFadeTimer <= 0) return;
    this.ui.comboFadeTimer -= dt;
    const ctx = this.render.ctx;
    const alpha = Math.min(1, this.ui.comboFadeTimer / COMBO_ALPHA_FRAMES);
    const progress = 1 - this.ui.comboFadeTimer / this.config.combo.fadeDuration;
    const s = this.gameScale();
    const baseSize = Math.round(36 * s);
    const pulse = 1 + Math.sin(progress * Math.PI) * COMBO_PULSE_AMP;
    const fontSize = Math.round(baseSize * pulse);

    const cx = this.canvas.width / 2;
    const cy = this.canvas.height * 0.45 - progress * 30;

    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.font = `bold ${fontSize}px monospace`;
    ctx.textAlign = 'center';

    const t = Math.min(1, (this.ui.comboDisplay - COMBO_MIN) / (COMBO_MAX - COMBO_MIN));
    const hue = Math.round(COMBO_HUE_START - t * (COMBO_HUE_START - COMBO_HUE_END));
    const lit = Math.round(COMBO_LIT_START + t * (COMBO_LIT_END - COMBO_LIT_START));
    ctx.fillStyle = `hsl(${hue}, 100%, ${lit}%)`;
    ctx.shadowColor = `hsl(${hue}, 100%, ${lit - 20}%)`;
    ctx.shadowBlur = Math.round(COMBO_GLOW_MIN + t * (COMBO_GLOW_MAX - COMBO_GLOW_MIN));
    ctx.fillText(`×${this.ui.comboDisplay}`, cx, cy);
    ctx.shadowBlur = 0;
    ctx.globalAlpha = 1;
    ctx.textAlign = 'start';
    ctx.restore();
  }

  drawDeathLine(ship, fx) {
    const ctx = this.render.ctx;
    const lineY = ship.y + ship.height + ship.bottomMargin * DEATH_LINE_MARGIN_RATIO;
    const w = this.canvas.width;
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

  drawPauseButton() {
    const ctx = this.render.ctx;
    const { x, y, size } = this.pauseBtnLayout();
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

  drawPauseScreen() {
    const ctx = this.render.ctx;
    const layout = this.pauseScreenLayout();
    const { cx, cy, s, resumeBtn, mapBtn, menuBtn } = layout;
    const t = Date.now() * 0.001;

    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    ctx.save();
    ctx.textAlign = 'center';

    // Titre PAUSE avec glow pulsant
    const pausePulse = 14 + Math.sin(t * 2.5) * 6;
    ctx.shadowColor = '#00d4ff';
    ctx.shadowBlur = pausePulse;
    ctx.fillStyle = '#00d4ff';
    ctx.font = `bold ${Math.round(32 * s)}px monospace`;
    ctx.fillText('PAUSE', cx, cy - 70 * s);
    ctx.shadowBlur = 0;

    // Infos partie en cours
    const infoY = cy - 38 * s;
    const infoSize = Math.round(13 * s);
    ctx.font = `${infoSize}px monospace`;
    const level = this.getLevel(this.session.currentLevelId);
    const levelName = level?.name || '';
    if (levelName) {
      ctx.fillStyle = '#667788';
      ctx.fillText(levelName, cx, infoY);
    }
    ctx.fillStyle = '#8899aa';
    ctx.fillText(`SCORE: ${this.session.score}   VIES: ${this.session.lives}`, cx, infoY + infoSize + 4 * s);

    // Bouton REPRENDRE (primaire, glow cyan)
    this.#drawButton(ctx, resumeBtn, 'REPRENDRE', {
      fillColor: 'rgba(0, 212, 255, 0.12)',
      strokeColor: '#00d4ff',
      textColor: '#ffffff',
      glowColor: '#00d4ff',
      glowBlur: 6,
      cx, s,
    });

    // Bouton CARTE (secondaire doré)
    this.#drawButton(ctx, mapBtn, 'CARTE', {
      fillColor: 'rgba(139, 105, 20, 0.1)',
      strokeColor: '#8b6914',
      textColor: '#ccaa44',
      glowColor: '#8b6914',
      glowBlur: 4,
      cx, s,
    });

    // Bouton MENU (tertiaire, subtil)
    this.#drawButton(ctx, menuBtn, 'MENU', {
      fillColor: 'rgba(255, 255, 255, 0.04)',
      strokeColor: '#445566',
      textColor: '#8899aa',
      glowColor: '#445566',
      glowBlur: 3,
      cx, s,
    });

    const isMobile = 'ontouchstart' in window;
    if (!isMobile) {
      ctx.font = `${Math.round(12 * s)}px monospace`;
      const instrA = 0.35 + Math.sin(t * 2) * 0.1;
      ctx.fillStyle = `rgba(68, 85, 102, ${instrA})`;
      ctx.fillText('ÉCHAP REPRENDRE  ·  C CARTE  ·  R MENU', cx, menuBtn.y + menuBtn.h + 30 * s);
    }

    ctx.restore();
  }

  /** Bouton avec gradient fond + glow bordure. */
  #drawButton(ctx, btn, label, { fillColor, strokeColor, textColor, glowColor, glowBlur, cx, s }) {
    // Fond avec gradient vertical subtil
    const bgGrad = ctx.createLinearGradient(btn.x, btn.y, btn.x, btn.y + btn.h);
    bgGrad.addColorStop(0, fillColor);
    bgGrad.addColorStop(1, 'rgba(0, 0, 0, 0.1)');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(btn.x, btn.y, btn.w, btn.h);
    // Bordure avec glow
    ctx.shadowColor = glowColor;
    ctx.shadowBlur = glowBlur;
    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = 1;
    ctx.strokeRect(btn.x, btn.y, btn.w, btn.h);
    ctx.shadowBlur = 0;
    // Texte
    ctx.fillStyle = textColor;
    ctx.font = `${Math.round(20 * s)}px monospace`;
    ctx.fillText(label, cx, btn.y + btn.h * 0.65);
  }

  drawEndScreen(text) {
    const ctx = this.render.ctx;
    const s = this.gameScale();
    const t = Date.now() * 0.001;

    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    ctx.save();
    ctx.textAlign = 'center';

    // Titre avec glow
    const isGameOver = text.includes('OVER');
    const glowColor = isGameOver ? '#ff4444' : '#00d4ff';
    ctx.shadowColor = glowColor;
    ctx.shadowBlur = 14 + Math.sin(t * 2) * 6;
    ctx.fillStyle = isGameOver ? '#ff6666' : '#ffffff';
    ctx.font = `bold ${Math.round(32 * s)}px monospace`;
    ctx.fillText(text, this.canvas.width / 2, this.canvas.height / 2);
    ctx.shadowBlur = 0;

    // Instruction pulsante
    const instrA = 0.4 + Math.sin(t * 2.5) * 0.15;
    ctx.font = `${Math.round(16 * s)}px monospace`;
    ctx.fillStyle = `rgba(255, 255, 255, ${instrA})`;
    ctx.fillText('Appuie pour retourner au menu', this.canvas.width / 2, this.canvas.height / 2 + 40 * s);

    ctx.restore();
  }
}
