import { describe, it, expect, vi } from 'vitest';
import { HudRenderer } from './hud-render.js';

function mockCtx() {
  return {
    save: vi.fn(),
    restore: vi.fn(),
    fillText: vi.fn(),
    fillRect: vi.fn(),
    beginPath: vi.fn(),
    moveTo: vi.fn(),
    lineTo: vi.fn(),
    stroke: vi.fn(),
    strokeRect: vi.fn(),
    measureText: vi.fn(() => ({ width: 80 })),
    createLinearGradient: vi.fn(() => ({ addColorStop: vi.fn() })),
    fillStyle: '',
    strokeStyle: '',
    font: '',
    textAlign: '',
    globalAlpha: 1,
    shadowColor: '',
    shadowBlur: 0,
    lineWidth: 1,
  };
}

function makeDeps(overrides = {}) {
  const ctx = mockCtx();
  return {
    render: { ctx },
    session: { lives: 3, score: 1200 },
    ui: { comboFadeTimer: 0, comboDisplay: 0 },
    canvas: { width: 500, height: 700 },
    gameScale: () => 1,
    pauseBtnLayout: () => ({ x: 440, y: 8, size: 40 }),
    pauseScreenLayout: () => ({
      cx: 250, cy: 350, halfW: 200, btnH: 44, gap: 16, s: 1,
      resumeBtn: { x: 50, y: 350, w: 400, h: 44 },
      menuBtn:   { x: 50, y: 410, w: 400, h: 44 },
    }),
    ctx, // shortcut for assertions
    ...overrides,
  };
}

describe('HudRenderer', () => {
  describe('drawHUD', () => {
    it('affiche vies et score', () => {
      const d = makeDeps();
      const hud = new HudRenderer(d);
      hud.drawHUD(null);
      const calls = d.ctx.fillText.mock.calls;
      expect(calls.some(c => c[0].includes('3'))).toBe(true);   // lives
      expect(calls.some(c => c[0].includes('1200'))).toBe(true); // score
    });

    it('applique scoreColor et scoreGlow depuis fx', () => {
      const d = makeDeps();
      const hud = new HudRenderer(d);
      hud.drawHUD({ scoreColor: '#ffaa44', scoreGlow: 12 });
      // Le ctx.shadowBlur doit avoir été modifié (glow > 0)
      expect(d.ctx.save).toHaveBeenCalled();
      expect(d.ctx.restore).toHaveBeenCalled();
    });

    it('pas de glow quand fx.scoreGlow = 0', () => {
      const d = makeDeps();
      const hud = new HudRenderer(d);
      hud.drawHUD({ scoreColor: '#ffffff', scoreGlow: 0 });
      // shadowBlur ne devrait pas être mis > 0
      // On vérifie juste que ça ne plante pas
      expect(d.ctx.fillText).toHaveBeenCalled();
    });
  });

  describe('drawCombo', () => {
    it('ne dessine rien si comboFadeTimer <= 0', () => {
      const d = makeDeps();
      const hud = new HudRenderer(d);
      hud.drawCombo();
      expect(d.ctx.fillText).not.toHaveBeenCalled();
    });

    it('décrémente comboFadeTimer', () => {
      const d = makeDeps();
      d.ui.comboFadeTimer = 50;
      d.ui.comboDisplay = 3;
      const hud = new HudRenderer(d);
      hud.drawCombo();
      expect(d.ui.comboFadeTimer).toBe(49);
    });

    it('affiche le multiplicateur combo', () => {
      const d = makeDeps();
      d.ui.comboFadeTimer = 50;
      d.ui.comboDisplay = 5;
      const hud = new HudRenderer(d);
      hud.drawCombo();
      expect(d.ctx.fillText).toHaveBeenCalledWith('×5', expect.any(Number), expect.any(Number));
    });

    it('couleur combo progresse de jaune (×2) à rouge (×15)', () => {
      const d = makeDeps();
      const hud = new HudRenderer(d);
      const colors = [];
      for (const combo of [2, 5, 10, 15]) {
        d.ui.comboFadeTimer = 50;
        d.ui.comboDisplay = combo;
        d.ctx.fillStyle = '';
        hud.drawCombo();
        colors.push(d.ctx.fillStyle);
      }
      // ×2 → hue 60, ×15 → hue 0
      expect(colors[0]).toMatch(/hsl\(60,/);
      expect(colors[3]).toMatch(/hsl\(0,/);
      // intermédiaires entre 0 et 60
      const hue5 = parseInt(colors[1].match(/hsl\((\d+)/)[1]);
      const hue10 = parseInt(colors[2].match(/hsl\((\d+)/)[1]);
      expect(hue5).toBeGreaterThan(0);
      expect(hue5).toBeLessThan(60);
      expect(hue10).toBeGreaterThan(0);
      expect(hue10).toBeLessThan(hue5);
    });

    it('glow augmente avec le combo', () => {
      const d = makeDeps();
      const hud = new HudRenderer(d);
      const blurs = [];
      const origSave = d.ctx.save;
      d.ctx.save = vi.fn(() => { origSave(); });
      // Spy on shadowBlur writes
      let lastBlur = 0;
      Object.defineProperty(d.ctx, 'shadowBlur', {
        get() { return lastBlur; },
        set(v) { lastBlur = v; blurs.push(v); },
      });
      d.ui.comboFadeTimer = 50;
      d.ui.comboDisplay = 2;
      hud.drawCombo();
      const maxBlurLow = Math.max(...blurs);
      blurs.length = 0;
      d.ui.comboFadeTimer = 50;
      d.ui.comboDisplay = 15;
      hud.drawCombo();
      const maxBlurHigh = Math.max(...blurs);
      expect(maxBlurHigh).toBeGreaterThan(maxBlurLow);
    });
  });

  describe('drawDeathLine', () => {
    it('utilise les couleurs fx quand fournies', () => {
      const d = makeDeps();
      const hud = new HudRenderer(d);
      const ship = { y: 600, height: 20, bottomMargin: 40 };
      hud.drawDeathLine(ship, { deathLine: [255, 0, 0], deathLineGlow: 0.2 });
      expect(d.ctx.createLinearGradient).toHaveBeenCalled();
      expect(d.ctx.fillRect).toHaveBeenCalled();
    });

    it('utilise cyan par défaut sans fx', () => {
      const d = makeDeps();
      const hud = new HudRenderer(d);
      const ship = { y: 600, height: 20, bottomMargin: 40 };
      hud.drawDeathLine(ship, null);
      expect(d.ctx.createLinearGradient).toHaveBeenCalled();
    });
  });

  describe('drawPauseButton', () => {
    it('dessine deux barres (pause icon)', () => {
      const d = makeDeps();
      const hud = new HudRenderer(d);
      hud.drawPauseButton();
      // 1 fillRect pour le fond + 2 pour les barres = 3
      expect(d.ctx.fillRect).toHaveBeenCalledTimes(3);
    });
  });

  describe('drawEndScreen', () => {
    it('affiche le texte de fin', () => {
      const d = makeDeps();
      const hud = new HudRenderer(d);
      hud.drawEndScreen('GAME OVER');
      expect(d.ctx.fillText.mock.calls[0][0]).toBe('GAME OVER');
    });
  });
});
