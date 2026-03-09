import { expect } from 'chai';
import { Ship } from './ship.js';

const CFG = { width: 80, height: 12, speed: 6, color: '#0ff', bottomMargin: 10 };

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

  it('tactile : suit le doigt avec lissage modulé par speed', () => {
    const s = new Ship(CFG, 800, 600);
    s.x = 100;
    s.update(400); // touchX = 400
    // target = 400 - 40 = 360, diff = 260, lerpBase = 6/7*0.3 ≈ 0.2571
    // x += 260 * (1 - (1-0.2571)^1) ≈ 260 * 0.2571 ≈ 66.86 → ~166.86
    const lerpBase = Math.min(0.6, CFG.speed / 7 * 0.3);
    const expected = 100 + 260 * (1 - Math.pow(1 - lerpBase, 1));
    expect(s.x).to.be.closeTo(expected, 1);
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

  it('mobile : marge basse plus grande', () => {
    const mobileCfg = { ...CFG, bottomMarginMobileRatio: 0.1 };
    const s = new Ship(mobileCfg, 800, 600, true);
    expect(s.bottomMargin).to.equal(Math.max(60, Math.round(600 * 0.1)));
  });
});
