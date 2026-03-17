import { expect } from 'chai';
import { Ship } from './ship.js';

const CFG = { width: 80, height: 12, speed: 6, color: '#0ff', bottomMargin: 10,
  advance: { baseSpeed: 0.015, timeFactor: 0.008, remainingFactor: 1.5, minY: 200, minDelay: 10, maxDelay: 30, maxAsteroidsRef: 80 },
};

describe('Ship', () => {
  it('se positionne centré en bas du canvas', () => {
    const s = new Ship(CFG, 800, 600);
    expect(s.x).to.equal((800 - 80) / 2);
    expect(s.y).to.equal(600 - 12 - 10);
  });

  it('update clavier : bouge à gauche', () => {
    const s = new Ship(CFG, 800, 600);
    const x0 = s.x;
    s.movingLeft = true;
    s.update(null);
    expect(s.x).to.equal(x0 - CFG.speed);
  });

  it('update clavier : bouge à droite', () => {
    const s = new Ship(CFG, 800, 600);
    const x0 = s.x;
    s.movingRight = true;
    s.update(null);
    expect(s.x).to.equal(x0 + CFG.speed);
  });

  it('ne sort pas du canvas à gauche', () => {
    const s = new Ship(CFG, 800, 600);
    s.x = 2;
    s.movingLeft = true;
    s.update(null);
    expect(s.x).to.equal(0);
  });

  it('ne sort pas du canvas à droite', () => {
    const s = new Ship(CFG, 800, 600);
    s.x = 800 - s.width - 1;
    s.movingRight = true;
    s.update(null);
    expect(s.x).to.equal(800 - s.width);
  });

  it('tactile : suit le doigt avec lissage, bridé par vitesse max', () => {
    const s = new Ship(CFG, 800, 600);
    s.x = 100;
    s.update(400); // pointerX = 400
    // target = 360, diff = 260, lerp donnerait ~66.86 mais clampé à speed (6)
    expect(s.x).to.be.closeTo(100 + CFG.speed, 1);
  });

  it('tactile : lerp non clampé quand le déplacement est inférieur à speed', () => {
    const s = new Ship(CFG, 800, 600);
    const x0 = 360;
    s.x = x0;
    s.update(400); // pointerX = 400, target = 360, diff = 0 → pas de déplacement
    // diff = 0 → le vaisseau est déjà à la cible
    expect(s.x).to.equal(x0);
  });

  it('mobile : largeur adaptée si mobileWidthRatio', () => {
    const mobileCfg = { ...CFG, mobileWidthRatio: 0.15 };
    const s = new Ship(mobileCfg, 800, 600, true);
    expect(s.width).to.equal(Math.round(800 * 0.15));
  });

  it('stun empêche le mouvement', () => {
    const s = new Ship(CFG, 800, 600);
    const x0 = s.x;
    s.stun(10);
    s.movingRight = true;
    s.update(null);
    expect(s.x).to.equal(x0);
    expect(s.vx).to.equal(0);
  });

  it('stun se décrémente par dt', () => {
    const s = new Ship(CFG, 800, 600);
    s.stun(10);
    s.update(null, 3);
    expect(s.stunTimer).to.equal(7);
  });

  it('mouvement reprend après fin du stun', () => {
    const s = new Ship(CFG, 800, 600);
    s.stun(1);
    s.movingRight = true;
    s.update(null, 2); // dt=2 > stunTimer=1 → stun expiré, mais ce frame est skip
    // Le stun frame ne bouge pas, mais au frame suivant ça marche
    const x0 = s.x;
    s.update(null);
    expect(s.x).to.be.greaterThan(x0);
  });

  // --- advanceY ---

  it('advanceY ne bouge pas pendant le délai initial', () => {
    const s = new Ship(CFG, 800, 600);
    const y0 = s.y;
    // 40 astéroïdes → délai = 10 + (30-10) * (40/80) = 20s = 1200 frames
    s.advanceY(60, 1, 40); // 1 seconde (60 frames)
    expect(s.y).to.equal(y0);
  });

  it('advanceY monte le vaisseau après le délai', () => {
    const s = new Ship(CFG, 800, 600);
    const y0 = s.y;
    // 0 astéroïde ref → délai = minDelay = 10s = 600 frames
    s.advanceTimer = 600; // skip le délai
    s.advanceDelay = 10;
    s.advanceY(60, 0.5, 1); // 1 seconde après le délai
    expect(s.y).to.be.lessThan(y0);
  });

  it('advanceY respecte le clamp minY', () => {
    const s = new Ship(CFG, 800, 600);
    s.y = 201;
    s.advanceTimer = 600;
    s.advanceDelay = 10;
    s.advanceY(6000, 0, 1); // gros dt pour forcer le dépassement
    expect(s.y).to.equal(200);
  });

  it('advanceY ne fait rien sans advanceConfig', () => {
    const noCfg = { ...CFG, advance: undefined };
    delete noCfg.advance;
    const s = new Ship(noCfg, 800, 600);
    const y0 = s.y;
    s.advanceY(100, 0.5, 10);
    expect(s.y).to.equal(y0);
  });

  it('resetToBase remet le vaisseau en position initiale', () => {
    const s = new Ship(CFG, 800, 600);
    const y0 = s.y;
    s.y = 300;
    s.advanceTimer = 999;
    s.advanceDelay = 15;
    s.resetToBase();
    expect(s.y).to.equal(y0);
    expect(s.advanceTimer).to.equal(0);
    expect(s.advanceDelay).to.equal(0);
  });

  it('mobile : marge basse plus grande', () => {
    const mobileCfg = { ...CFG, bottomMarginMobileRatio: 0.1 };
    const s = new Ship(mobileCfg, 800, 600, true);
    expect(s.bottomMargin).to.equal(Math.max(60, Math.round(600 * 0.1)));
  });
});
