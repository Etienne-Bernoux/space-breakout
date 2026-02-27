import { expect } from 'chai';
import { Drone } from './drone.js';

const DRONE_CONFIG = { radius: 6, speed: 3, color: '#ffcc00' };

// Ship factice pour les tests
function makeShip(x = 100, y = 500, width = 100) {
  return { x, y, width };
}

function makeDrone(ship) {
  return new Drone(DRONE_CONFIG, ship);
}

describe('Drone', () => {
  describe('constructor + reset', () => {
    it('se positionne centré sur le vaisseau', () => {
      const ship = makeShip(100, 500, 100);
      const drone = makeDrone(ship);

      expect(drone.x).to.equal(150); // ship.x + width/2
      expect(drone.y).to.equal(500 - drone.radius);
      expect(drone.launched).to.be.false;
    });

    it('reset remet le drone sur le vaisseau', () => {
      const ship = makeShip(200, 400, 80);
      const drone = makeDrone(ship);
      drone.launched = true;
      drone.x = 999;
      drone.y = 999;

      drone.reset(ship);

      expect(drone.x).to.equal(240);
      expect(drone.launched).to.be.false;
    });

    it('reset restaure radius, speed et flags power-up', () => {
      const ship = makeShip(100, 500, 100);
      const drone = makeDrone(ship);
      // Simule des power-ups actifs
      drone.radius = 20;
      drone.speed = 10;
      drone.piercing = true;
      drone.sticky = true;
      drone.warp = true;

      drone.reset(ship);

      expect(drone.radius).to.equal(6);   // _baseRadius
      expect(drone.speed).to.equal(3);     // _baseSpeed
      expect(drone.piercing).to.be.false;
      expect(drone.sticky).to.be.false;
      expect(drone.warp).to.be.false;
    });
  });

  describe('update — non lancé', () => {
    it('suit le vaisseau tant que non lancé', () => {
      const ship = makeShip(100, 500, 100);
      const drone = makeDrone(ship);

      ship.x = 300;
      drone.update(ship, 800);

      expect(drone.x).to.equal(350);
      expect(drone.y).to.equal(500 - drone.radius);
    });
  });

  describe('update — mouvement', () => {
    it('se déplace selon dx/dy une fois lancé', () => {
      const ship = makeShip(100, 500, 100);
      const drone = makeDrone(ship);
      drone.launch(ship);
      const startY = drone.y;

      drone.update(ship, 800);

      // dy est toujours < 0 → y diminue
      expect(drone.y).to.not.equal(startY);
    });
  });

  describe('rebond mur gauche', () => {
    it('clamp la position et inverse dx', () => {
      const ship = makeShip(100, 500, 100);
      const drone = makeDrone(ship);
      drone.launched = true;
      drone.x = 2; // proche du bord gauche
      drone.dx = -3;

      drone.update(ship, 800);

      expect(drone.x).to.equal(drone.radius);
      expect(drone.dx).to.be.above(0);
    });
  });

  describe('rebond mur droit', () => {
    it('clamp la position et inverse dx', () => {
      const ship = makeShip(100, 500, 100);
      const drone = makeDrone(ship);
      drone.launched = true;
      drone.x = 798;
      drone.dx = 3;

      drone.update(ship, 800);

      expect(drone.x).to.equal(800 - drone.radius);
      expect(drone.dx).to.be.below(0);
    });
  });

  describe('rebond plafond', () => {
    it('clamp la position et inverse dy', () => {
      const ship = makeShip(100, 500, 100);
      const drone = makeDrone(ship);
      drone.launched = true;
      drone.y = 2;
      drone.dy = -3;

      drone.update(ship, 800);

      expect(drone.y).to.equal(drone.radius);
      expect(drone.dy).to.be.above(0);
    });
  });

  describe('angle minimum garanti', () => {
    it('force un dx minimum pour éviter les trajectoires verticales', () => {
      const ship = makeShip(100, 500, 100);
      const drone = makeDrone(ship);
      drone.launched = true;
      drone.dx = 0.01; // quasi-vertical
      drone.x = 400;
      drone.y = 300;

      drone.update(ship, 800);

      const minDx = drone.speed * 0.25;
      expect(Math.abs(drone.dx)).to.be.at.least(minDx);
    });

    it('préserve le signe de dx quand il est corrigé', () => {
      const ship = makeShip(100, 500, 100);
      const drone = makeDrone(ship);
      drone.launched = true;
      drone.dx = -0.01;
      drone.x = 400;
      drone.y = 300;

      drone.update(ship, 800);

      expect(drone.dx).to.be.below(0);
    });
  });

  describe('warp — traverse les murs latéraux', () => {
    it('sort à droite → réapparaît à gauche', () => {
      const ship = makeShip(100, 500, 100);
      const drone = makeDrone(ship);
      drone.launched = true;
      drone.warp = true;
      drone.x = 810; // dépassé à droite (> canvasWidth + radius)
      drone.dx = 3;
      drone.update(ship, 800);
      expect(drone.x).to.equal(-drone.radius);
    });

    it('sort à gauche → réapparaît à droite', () => {
      const ship = makeShip(100, 500, 100);
      const drone = makeDrone(ship);
      drone.launched = true;
      drone.warp = true;
      drone.x = -10; // dépassé à gauche (< -radius)
      drone.dx = -3;
      drone.update(ship, 800);
      expect(drone.x).to.equal(800 + drone.radius);
    });

    it('ne rebondit pas quand warp est actif', () => {
      const ship = makeShip(100, 500, 100);
      const drone = makeDrone(ship);
      drone.launched = true;
      drone.warp = true;
      drone.x = 2;
      drone.dx = -3;
      drone.update(ship, 800);
      // dx reste négatif (pas de rebond)
      expect(drone.dx).to.be.below(0);
    });
  });

  describe('pas de sortie par le bas (non géré par drone)', () => {
    it('ne clamp pas en bas — c\'est main.js qui gère la perte de vie', () => {
      const ship = makeShip(100, 500, 100);
      const drone = makeDrone(ship);
      drone.launched = true;
      drone.y = 700;
      drone.dy = 3;

      drone.update(ship, 800);

      expect(drone.y).to.be.above(700);
    });
  });
});
