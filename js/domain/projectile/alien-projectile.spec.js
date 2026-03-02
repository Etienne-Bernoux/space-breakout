import { expect } from 'chai';
import { AlienProjectile } from './alien-projectile.js';

const ship = { x: 350, y: 580, width: 100, height: 14 };

describe('AlienProjectile', () => {
  it('initialise la direction vers la cible', () => {
    const p = new AlienProjectile(400, 100, { x: 400, y: 580 });
    expect(p.vx).to.be.closeTo(0, 0.01);   // cible alignée → vx ≈ 0
    expect(p.vy).to.be.greaterThan(0);       // vers le bas
  });

  it('se déplace avec dt', () => {
    const p = new AlienProjectile(400, 100, { x: 400, y: 580 });
    const y0 = p.y;
    p.update(800, 600, ship, 1);
    expect(p.y).to.be.greaterThan(y0);
  });

  it('dt=0.5 parcourt la moitié de la distance', () => {
    const p1 = new AlienProjectile(400, 100, { x: 400, y: 580 });
    const p2 = new AlienProjectile(400, 100, { x: 400, y: 580 });
    p1.update(800, 600, ship, 1);
    p2.update(800, 600, ship, 0.5);
    const dist1 = p1.y - 100;
    const dist2 = p2.y - 100;
    expect(dist2).to.be.closeTo(dist1 / 2, 0.1);
  });

  it('trajectoire rectiligne (pas de tracking)', () => {
    const p = new AlienProjectile(200, 100, { x: 200, y: 580 });
    expect(p.vx).to.be.closeTo(0, 0.01);
    // Même avec un ship décalé, le projectile garde sa direction initiale
    const rightShip = { x: 600, y: 580, width: 100, height: 14 };
    p.update(800, 600, rightShip, 10);
    expect(p.vx).to.be.closeTo(0, 0.01); // pas de correction
  });

  it('meurt quand hors écran (bas)', () => {
    const p = new AlienProjectile(400, 595, { x: 400, y: 700 });
    p.update(800, 600, ship, 10);
    expect(p.alive).to.be.false;
  });

  it('garde une vitesse constante', () => {
    const p = new AlienProjectile(100, 100, { x: 500, y: 580 }, { speed: 2 });
    p.update(800, 600, ship, 5);
    const mag = Math.sqrt(p.vx * p.vx + p.vy * p.vy);
    expect(mag).to.be.closeTo(2, 0.01);
  });
});
