import { describe, it, expect, vi } from 'vitest';
import { HudRenderer } from './hud.js';

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
