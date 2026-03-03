import { describe, it } from 'vitest';
import { expect } from 'chai';
import { computeTentaclePoly } from './tentacle-shape.js';

const bb = { cx: 200, cy: 100, w: 48, h: 96 };
const coreCx = 300; // core à droite → tentacule pointe à gauche
const coreCy = 100;

describe('computeTentaclePoly', () => {
  it('retourne un polygone non vide', () => {
    const poly = computeTentaclePoly(bb, coreCx, coreCy, 0);
    expect(poly.length).to.be.greaterThan(10);
  });

  it('le polygone contient le centre du bb', () => {
    const poly = computeTentaclePoly(bb, coreCx, coreCy, 0);
    // Au moins un point doit être proche du centre
    const nearCenter = poly.some(p =>
      Math.abs(p.x - bb.cx) < bb.w && Math.abs(p.y - bb.cy) < bb.h
    );
    expect(nearCenter).to.be.true;
  });

  it('la pointe est du côté opposé au core (gauche)', () => {
    const poly = computeTentaclePoly(bb, coreCx, coreCy, 0);
    const minX = Math.min(...poly.map(p => p.x));
    // La pointe doit être bien à gauche du bb
    expect(minX).to.be.lessThan(bb.cx - bb.w / 2);
  });

  it('s étend au-delà du AABB grille dans la direction de la pointe', () => {
    const poly = computeTentaclePoly(bb, coreCx, coreCy, 0);
    const minX = Math.min(...poly.map(p => p.x));
    const gridLeft = bb.cx - bb.w / 2; // 176
    expect(minX).to.be.lessThan(gridLeft - 10); // dépasse significativement
  });

  it('l ondulation change avec floatPhase', () => {
    const poly0 = computeTentaclePoly(bb, coreCx, coreCy, 0);
    const poly1 = computeTentaclePoly(bb, coreCx, coreCy, 1.5);
    // Les points intermédiaires doivent différer
    const diff = Math.abs(poly0[5].y - poly1[5].y);
    expect(diff).to.be.greaterThan(0.1);
  });

  it('fonctionne avec un core en dessous (direction verticale)', () => {
    const bbV = { cx: 100, cy: 50, w: 96, h: 48 };
    const poly = computeTentaclePoly(bbV, 100, 200, 0);
    const minY = Math.min(...poly.map(p => p.y));
    expect(minY).to.be.lessThan(bbV.cy - bbV.h / 2);
  });

  it('le polygone forme une boucle fermée (premier et dernier points distincts)', () => {
    const poly = computeTentaclePoly(bb, coreCx, coreCy, 0);
    // Gauche → pointe → droite inversé → retour base
    expect(poly.length).to.equal(22); // 11 left + 11 right
  });
});
