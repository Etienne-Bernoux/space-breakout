import { expect } from 'chai';
import { Capsule } from './capsule.js';

describe('Capsule', () => {
  it('se crée avec powerUpId et position', () => {
    const c = new Capsule('shipWide', 100, 50);
    expect(c.powerUpId).to.equal('shipWide');
    expect(c.x).to.equal(100);
    expect(c.y).to.equal(50);
    expect(c.alive).to.be.true;
  });

  it('descend à chaque update', () => {
    const c = new Capsule('extraLife', 100, 50);
    const y0 = c.y;
    c.update(600);
    expect(c.y).to.be.above(y0);
  });

  it('meurt quand elle sort du canvas', () => {
    const c = new Capsule('scoreDouble', 100, 620, { speedY: 20 });
    c.update(600); // y=640, 640-10=630 > 600
    expect(c.alive).to.be.false;
  });

  it('reste vivante tant que dans le canvas', () => {
    const c = new Capsule('weaken', 100, 200);
    c.update(600);
    expect(c.alive).to.be.true;
  });

  it('a un mouvement latéral (bobbing)', () => {
    const c = new Capsule('dronePiercing', 100, 50);
    const x0 = c.x;
    for (let i = 0; i < 30; i++) c.update(600);
    expect(c.x).to.not.equal(x0);
  });

  it('tourne (rotation progresse)', () => {
    const c = new Capsule('droneSticky', 100, 50);
    c.update(600);
    expect(c.rotation).to.be.above(0);
  });
});
