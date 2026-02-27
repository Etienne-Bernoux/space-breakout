import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GameLoop } from './loop.js';

// Stub global requestAnimationFrame
globalThis.requestAnimationFrame = vi.fn();
globalThis.document = { body: { classList: { toggle: vi.fn() } } };

function mockCtx() {
  return {
    clearRect: vi.fn(),
    save: vi.fn(),
    restore: vi.fn(),
    translate: vi.fn(),
    fillRect: vi.fn(),
    fillText: vi.fn(),
    measureText: vi.fn(() => ({ width: 50 })),
    createRadialGradient: vi.fn(() => ({ addColorStop: vi.fn() })),
    createLinearGradient: vi.fn(() => ({ addColorStop: vi.fn() })),
    beginPath: vi.fn(),
    moveTo: vi.fn(),
    lineTo: vi.fn(),
    stroke: vi.fn(),
    strokeRect: vi.fn(),
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

function mockInfra() {
  return {
    updateStars: vi.fn(),
    getMousePos: vi.fn(() => ({ x: 0, y: 0 })),
    getTouchX: vi.fn(() => null),
    updateMenu: vi.fn(),
    updateMenuHover: vi.fn(),
    spawnTrail: vi.fn(),
    updateParticles: vi.fn(),
    updateShake: vi.fn(() => ({ x: 0, y: 0 })),
    setAmbientShake: vi.fn(),
    drawCapsule: vi.fn(),
    drawPowerUpHUD: vi.fn(),
    isDevPanelActive: vi.fn(() => false),
    drawDevPanel: vi.fn(),
    handleDevHover: vi.fn(),
    isMusicLabActive: vi.fn(() => false),
    drawMusicLab: vi.fn(),
    handleMusicLabHover: vi.fn(),
    updateDevOverlay: vi.fn(),
    drawShip: vi.fn(),
    drawDrone: vi.fn(),
    drawField: vi.fn(),
  };
}

function makeDeps(overrides = {}) {
  const ctx = mockCtx();
  const ship = { x: 100, y: 600, width: 80, height: 20, bottomMargin: 10, isMobile: false, update: vi.fn(), color: '#00aaff' };
  const drone = { x: 140, y: 580, launched: true, update: vi.fn(), radius: 6, color: '#ffcc00' };
  const field = { draw: vi.fn(), update: vi.fn(), remaining: 5 };
  const hud = {
    drawHUD: vi.fn(), drawCombo: vi.fn(), drawDeathLine: vi.fn(),
    drawPauseButton: vi.fn(), drawPauseScreen: vi.fn(), drawEndScreen: vi.fn(),
  };
  const collisionHandler = { update: vi.fn() };
  const intensity = {
    update: vi.fn(),
    getEffects: vi.fn(() => ({
      starSpeed: 1, microShake: 0, scoreColor: '#fff', scoreGlow: 0,
      deathLine: [0, 212, 255], deathLineGlow: 0.07,
      vignetteAlpha: 0, vignetteHue: [0, 0, 0],
    })),
  };
  const powerUp = { getActive: vi.fn(() => []) };

  return {
    render: { ctx },
    entities: { ship, drones: [drone], field, capsules: [] },
    session: { state: 'playing', lives: 3, score: 0 },
    systems: { intensity, powerUp },
    ui: { combo: 0, comboDisplay: 0, comboFadeTimer: 0, slowMoTimer: 0 },
    canvas: { width: 500, height: 700 },
    hud,
    collisionHandler,
    infra: mockInfra(),
    ...overrides,
  };
}

describe('GameLoop', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('appelle intensity.update et getEffects à chaque frame', () => {
    const d = makeDeps();
    const loop = new GameLoop(d);
    loop.loop();
    expect(d.systems.intensity.update).toHaveBeenCalled();
    expect(d.systems.intensity.getEffects).toHaveBeenCalled();
  });

  it('appelle updateStars avec fx.starSpeed', () => {
    const d = makeDeps();
    const loop = new GameLoop(d);
    loop.loop();
    expect(d.infra.updateStars).toHaveBeenCalledWith(1);
  });

  it('affiche le menu quand state=menu', () => {
    const d = makeDeps();
    d.session.state = 'menu';
    const loop = new GameLoop(d);
    loop.loop();
    expect(d.infra.updateMenu).toHaveBeenCalled();
    expect(d.collisionHandler.update).not.toHaveBeenCalled();
  });

  it('affiche le devPanel quand actif', () => {
    const d = makeDeps();
    d.infra.isDevPanelActive.mockReturnValue(true);
    const loop = new GameLoop(d);
    loop.loop();
    expect(d.infra.drawDevPanel).toHaveBeenCalled();
  });

  it('affiche le musicLab quand actif', () => {
    const d = makeDeps();
    d.infra.isMusicLabActive.mockReturnValue(true);
    const loop = new GameLoop(d);
    loop.loop();
    expect(d.infra.drawMusicLab).toHaveBeenCalled();
  });

  it('affiche pause screen quand state=paused', () => {
    const d = makeDeps();
    d.session.state = 'paused';
    const loop = new GameLoop(d);
    loop.loop();
    expect(d.hud.drawPauseScreen).toHaveBeenCalled();
    expect(d.hud.drawHUD).toHaveBeenCalled();
  });

  it('affiche GAME OVER quand state=gameOver', () => {
    const d = makeDeps();
    d.session.state = 'gameOver';
    const loop = new GameLoop(d);
    loop.loop();
    expect(d.hud.drawEndScreen).toHaveBeenCalledWith('GAME OVER');
  });

  it('affiche ZONE NETTOYÉE quand state=won', () => {
    const d = makeDeps();
    d.session.state = 'won';
    const loop = new GameLoop(d);
    loop.loop();
    expect(d.hud.drawEndScreen).toHaveBeenCalledWith('ZONE NETTOYÉE !');
  });

  it('met à jour les entités quand playing', () => {
    const d = makeDeps();
    const loop = new GameLoop(d);
    loop.loop();
    expect(d.entities.field.update).toHaveBeenCalled();
    expect(d.entities.ship.update).toHaveBeenCalled();
    expect(d.entities.drones[0].update).toHaveBeenCalled();
    expect(d.collisionHandler.update).toHaveBeenCalled();
  });

  it('spawne trail pour les drones lancés', () => {
    const d = makeDeps();
    const loop = new GameLoop(d);
    loop.loop();
    expect(d.infra.spawnTrail).toHaveBeenCalledWith(140, 580);
  });

  it('ne spawne pas trail pour les drones non lancés', () => {
    const d = makeDeps();
    d.entities.drones[0].launched = false;
    const loop = new GameLoop(d);
    loop.loop();
    expect(d.infra.spawnTrail).not.toHaveBeenCalled();
  });

  it('slow-mo saute des frames (2 sur 3)', () => {
    const d = makeDeps();
    d.ui.slowMoTimer = 10;
    const loop = new GameLoop(d);
    loop.loop();
    // slowMoTimer was 10, decremented to 9. 9 % 3 === 0 → update runs
    expect(d.entities.field.update).toHaveBeenCalled();
    expect(d.ui.slowMoTimer).toBe(9);
  });

  it('slow-mo saute la frame quand timer % 3 !== 0', () => {
    const d = makeDeps();
    d.ui.slowMoTimer = 11; // 11-1=10, 10 % 3 = 1 ≠ 0 → skip
    const loop = new GameLoop(d);
    loop.loop();
    expect(d.entities.field.update).not.toHaveBeenCalled();
  });

  it('filtre les capsules mortes', () => {
    const d = makeDeps();
    d.entities.capsules = [
      { alive: true, update: vi.fn() },
      { alive: false, update: vi.fn() },
    ];
    const loop = new GameLoop(d);
    loop.loop();
    expect(d.entities.capsules.length).toBe(1);
    expect(d.entities.capsules[0].alive).toBe(true);
  });
});
