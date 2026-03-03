import { describe, it } from 'vitest';
import { expect } from 'chai';
import { computeCorePoly } from './core-shape.js';

const core = { x: 100, y: 50, width: 80, height: 60 };

describe('computeCorePoly', () => {
  it('retourne 12 points', () => {
    const poly = computeCorePoly(core);
    expect(poly).to.have.length(12);
  });

  it('les points sont centrés sur le core', () => {
    const poly = computeCorePoly(core);
    const avgX = poly.reduce((s, p) => s + p.x, 0) / poly.length;
    const avgY = poly.reduce((s, p) => s + p.y, 0) / poly.length;
    expect(avgX).to.be.closeTo(140, 1); // 100 + 80/2
    expect(avgY).to.be.closeTo(80, 1);  // 50 + 60/2
  });

  it('le pulse dilate le polygone', () => {
    const poly0 = computeCorePoly(core, 0);
    const poly1 = computeCorePoly(core, 0.3);
    const maxX0 = Math.max(...poly0.map(p => p.x));
    const maxX1 = Math.max(...poly1.map(p => p.x));
    expect(maxX1).to.be.greaterThan(maxX0);
  });

  it('le rayon X correspond à width/2', () => {
    const poly = computeCorePoly(core, 0);
    const cx = 140;
    const maxDx = Math.max(...poly.map(p => Math.abs(p.x - cx)));
    expect(maxDx).to.be.closeTo(40, 1); // width/2 = 40
  });

  it('le rayon Y correspond à height/2', () => {
    const poly = computeCorePoly(core, 0);
    const cy = 80;
    const maxDy = Math.max(...poly.map(p => Math.abs(p.y - cy)));
    expect(maxDy).to.be.closeTo(30, 1); // height/2 = 30
  });
});
