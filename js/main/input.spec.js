import { describe, it, expect, vi, beforeEach } from 'vitest';
import { InputHandler } from './input.js';

// Stubs globaux
globalThis.document = {
  addEventListener: vi.fn(),
};

function mockInfra() {
  const handlers = {};
  return {
    setupTouch: vi.fn(),
    setTapHandler: vi.fn((fn) => { handlers.tap = fn; }),
    setMenuTapHandler: vi.fn((fn) => { handlers.menuTap = fn; }),
    setDragHandler: vi.fn((fn) => { handlers.drag = fn; }),
    setReleaseHandler: vi.fn((fn) => { handlers.release = fn; }),
    handleMenuInput: vi.fn(),
    handleMenuTap: vi.fn(),
    handleMenuDrag: vi.fn(),
    handleMenuRelease: vi.fn(),
    resetMenu: vi.fn(),
    isDevPanelActive: vi.fn(() => false),
    handleDevTap: vi.fn(),
    handleDevDrag: vi.fn(),
    handleDevRelease: vi.fn(),
    hideDevPanel: vi.fn(),
    isDevMode: vi.fn(() => false),
    showDevPanel: vi.fn(),
    isMusicLabActive: vi.fn(() => false),
    handleMusicLabTap: vi.fn(),
    handleMusicLabScroll: vi.fn(),
    // Expose handlers for test access
    _handlers: handlers,
  };
}

function makeDeps(overrides = {}) {
  const ship = { x: 100, y: 600, width: 80, movingLeft: false, movingRight: false };
  const drone = { launched: false, launchAtAngle: vi.fn() };
  const infra = mockInfra();
  return {
    entities: { ship, drones: [drone] },
    session: { state: 'menu', pause: vi.fn(), resume: vi.fn(), backToMenu: vi.fn(), start: vi.fn() },
    systems: { intensity: { onPause: vi.fn(), onResume: vi.fn(), onLaunch: vi.fn() } },
    canvas: { width: 500, height: 700 },
    gameScale: () => 1,
    pauseBtnLayout: () => ({ x: 440, y: 8, size: 40 }),
    startGame: vi.fn(),
    infra,
    ...overrides,
  };
}

describe('InputHandler', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('appelle setupTouch à la construction', () => {
    const d = makeDeps();
    new InputHandler(d);
    expect(d.infra.setupTouch).toHaveBeenCalled();
  });

  it('enregistre les 4 handlers touch', () => {
    const d = makeDeps();
    new InputHandler(d);
    expect(d.infra.setTapHandler).toHaveBeenCalled();
    expect(d.infra.setMenuTapHandler).toHaveBeenCalled();
    expect(d.infra.setDragHandler).toHaveBeenCalled();
    expect(d.infra.setReleaseHandler).toHaveBeenCalled();
  });

  it('bind 3 event listeners clavier (keydown, keyup, wheel)', () => {
    const d = makeDeps();
    new InputHandler(d);
    const calls = document.addEventListener.mock.calls;
    const events = calls.map(c => c[0]);
    expect(events).toContain('keydown');
    expect(events).toContain('keyup');
    expect(events).toContain('wheel');
  });

  describe('tap handler', () => {
    it('pause quand on tap le bouton pause en playing', () => {
      const d = makeDeps();
      d.session.state = 'playing';
      new InputHandler(d);
      d.infra._handlers.tap(445, 10); // dans la zone du bouton pause
      expect(d.session.pause).toHaveBeenCalled();
      expect(d.systems.intensity.onPause).toHaveBeenCalled();
    });

    it('lance les drones quand on tap ailleurs en playing', () => {
      const d = makeDeps();
      d.session.state = 'playing';
      new InputHandler(d);
      d.infra._handlers.tap(100, 300);
      expect(d.entities.drones[0].launchAtAngle).toHaveBeenCalled();
      expect(d.systems.intensity.onLaunch).toHaveBeenCalled();
    });

    it('ne lance pas si tous les drones sont déjà lancés', () => {
      const d = makeDeps();
      d.session.state = 'playing';
      d.entities.drones[0].launched = true;
      new InputHandler(d);
      d.infra._handlers.tap(100, 300);
      expect(d.entities.drones[0].launchAtAngle).not.toHaveBeenCalled();
      expect(d.systems.intensity.onLaunch).not.toHaveBeenCalled();
    });

    it('retour au menu quand on tap en gameOver', () => {
      const d = makeDeps();
      d.session.state = 'gameOver';
      new InputHandler(d);
      d.infra._handlers.tap(100, 300);
      expect(d.infra.resetMenu).toHaveBeenCalled();
      expect(d.session.backToMenu).toHaveBeenCalled();
    });
  });

  describe('menuTap handler', () => {
    it('handleMenuTap quand state=menu', () => {
      const d = makeDeps();
      d.session.state = 'menu';
      d.infra.handleMenuTap.mockReturnValue('play');
      new InputHandler(d);
      d.infra._handlers.menuTap(250, 400);
      expect(d.infra.handleMenuTap).toHaveBeenCalled();
      expect(d.startGame).toHaveBeenCalled();
    });

    it('délègue au devPanel quand actif', () => {
      const d = makeDeps();
      d.infra.isDevPanelActive.mockReturnValue(true);
      d.infra.handleDevTap.mockReturnValue('launch');
      new InputHandler(d);
      d.infra._handlers.menuTap(250, 400);
      expect(d.infra.hideDevPanel).toHaveBeenCalled();
      expect(d.startGame).toHaveBeenCalled();
    });

    it('délègue au musicLab quand actif', () => {
      const d = makeDeps();
      d.infra.isMusicLabActive.mockReturnValue(true);
      new InputHandler(d);
      d.infra._handlers.menuTap(250, 400);
      expect(d.infra.handleMusicLabTap).toHaveBeenCalled();
    });
  });
});
