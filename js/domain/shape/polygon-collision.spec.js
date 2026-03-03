import { describe, it } from 'vitest';
import { expect } from 'chai';
import {
  polarToCartesian, polyBounds, pointInPolygon, circleIntersectsPolygon,
} from './polygon-collision.js';

// --- Helpers ---
const square = [
  { x: -10, y: -10 }, { x: 10, y: -10 },
  { x: 10, y: 10 },  { x: -10, y: 10 },
];

const triangle = [
  { x: 0, y: -20 }, { x: 20, y: 10 }, { x: -20, y: 10 },
];

// --- polarToCartesian ---
describe('polarToCartesian', () => {
  it('convertit un carré polaire sans rotation', () => {
    const polar = [
      { angle: 0, jitter: 1 },             // droite
      { angle: Math.PI / 2, jitter: 1 },   // bas
      { angle: Math.PI, jitter: 1 },        // gauche
      { angle: 3 * Math.PI / 2, jitter: 1 }, // haut
    ];
    const poly = polarToCartesian(polar, 10, 10, 0, 100, 50);
    expect(poly[0].x).to.be.closeTo(110, 0.01);
    expect(poly[0].y).to.be.closeTo(50, 0.01);
    expect(poly[2].x).to.be.closeTo(90, 0.01);
  });

  it('applique la rotation', () => {
    const polar = [{ angle: 0, jitter: 1 }];
    const poly = polarToCartesian(polar, 10, 10, Math.PI / 2, 0, 0);
    // (10, 0) rotated 90° → (0, 10)
    expect(poly[0].x).to.be.closeTo(0, 0.01);
    expect(poly[0].y).to.be.closeTo(10, 0.01);
  });

  it('applique le jitter', () => {
    const polar = [{ angle: 0, jitter: 0.5 }];
    const poly = polarToCartesian(polar, 20, 10, 0, 0, 0);
    expect(poly[0].x).to.be.closeTo(10, 0.01); // 20 * 0.5
  });

  it('gère rx != ry (ellipse)', () => {
    const polar = [
      { angle: 0, jitter: 1 },
      { angle: Math.PI / 2, jitter: 1 },
    ];
    const poly = polarToCartesian(polar, 30, 10, 0, 0, 0);
    expect(poly[0].x).to.be.closeTo(30, 0.01);
    expect(poly[1].y).to.be.closeTo(10, 0.01);
  });
});

// --- polyBounds ---
describe('polyBounds', () => {
  it('retourne le AABB du polygone', () => {
    const b = polyBounds(square);
    expect(b.x).to.equal(-10);
    expect(b.y).to.equal(-10);
    expect(b.w).to.equal(20);
    expect(b.h).to.equal(20);
  });

  it('fonctionne avec un triangle', () => {
    const b = polyBounds(triangle);
    expect(b.x).to.equal(-20);
    expect(b.y).to.equal(-20);
    expect(b.w).to.equal(40);
    expect(b.h).to.equal(30);
  });
});

// --- pointInPolygon ---
describe('pointInPolygon', () => {
  it('point au centre → true', () => {
    expect(pointInPolygon(0, 0, square)).to.be.true;
  });

  it('point dehors → false', () => {
    expect(pointInPolygon(50, 50, square)).to.be.false;
  });

  it('point dans un triangle', () => {
    expect(pointInPolygon(0, 0, triangle)).to.be.true;
  });

  it('point hors triangle (coin)', () => {
    expect(pointInPolygon(-15, -15, triangle)).to.be.false;
  });
});

// --- circleIntersectsPolygon ---
describe('circleIntersectsPolygon', () => {
  it('cercle centre dedans → true', () => {
    expect(circleIntersectsPolygon(0, 0, 5, square)).to.be.true;
  });

  it('cercle loin → false', () => {
    expect(circleIntersectsPolygon(100, 100, 5, square)).to.be.false;
  });

  it('cercle tangent à un edge → true', () => {
    // Edge droit du carré à x=10, cercle centre à (14, 0) rayon 5
    expect(circleIntersectsPolygon(14, 0, 5, square)).to.be.true;
  });

  it('cercle juste hors portée d un edge → false', () => {
    // Edge droit à x=10, cercle centre à (16, 0) rayon 5
    expect(circleIntersectsPolygon(16, 0, 5, square)).to.be.false;
  });

  it('cercle touche un sommet → true', () => {
    // Sommet à (10, 10), cercle centre (13, 13) rayon 6 (dist = ~4.24)
    expect(circleIntersectsPolygon(13, 13, 6, square)).to.be.true;
  });

  it('cercle hors sommet → false', () => {
    // Sommet à (10, 10), cercle centre (13, 13) rayon 3 (dist = ~4.24)
    expect(circleIntersectsPolygon(13, 13, 3, square)).to.be.false;
  });

  it('gros cercle englobant le polygone → true', () => {
    expect(circleIntersectsPolygon(0, 0, 100, square)).to.be.true;
  });

  it('fonctionne avec un triangle', () => {
    expect(circleIntersectsPolygon(0, 5, 3, triangle)).to.be.true;
    expect(circleIntersectsPolygon(0, -30, 3, triangle)).to.be.false;
  });
});
