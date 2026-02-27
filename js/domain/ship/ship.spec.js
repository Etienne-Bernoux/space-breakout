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

  it('tactile : suit le doigt avec lissage', () => {
    const s = new Ship(CFG, 800, 600);
    s.x = 100;
    s.update(400); // touchX = 400
    // target = 400 - 40 = 360, diff = 260, x += 260*0.3 = 78 → 178
    expect(s.x).to.be.closeTo(178, 1);
  });

  it('mobile : largeur adaptée si mobileWidthRatio', () => {
    const mobileCfg = { ...CFG, mobileWidthRatio: 0.15 };
    const s = new Ship(mobileCfg, 800, 600, true);
    expect(s.width).to.equal(Math.round(800 * 0.15));
  });

  it('mobile : marge basse plus grande', () => {
    const mobileCfg = { ...CFG, bottomMarginMobileRatio: 0.1 };
    const s = new Ship(mobileCfg, 800, 600, true);
    expect(s.bottomMargin).to.equal(Math.max(60, Math.round(600 * 0.1)));
  });
});
