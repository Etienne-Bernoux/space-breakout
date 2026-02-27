import { expect } from 'chai';
import { DroneManager } from './drone-manager.js';
import { Drone } from '../../domain/drone/drone.js';

const SHIP = { x: 100, y: 400, width: 80, height: 10 };
const DRONE_CFG = { radius: 6, speed: 3, color: '#0ff' };

describe('DroneManager', () => {
  describe('spawn', () => {
    it('ajoute un drone au tableau', () => {
      const dm = new DroneManager();
      const drones = [new Drone(DRONE_CFG, SHIP)];
      dm.spawn(drones, SHIP);
      expect(drones).to.have.length(2);
    });

    it('le nouveau drone copie piercing/sticky du premier', () => {
      const dm = new DroneManager();
      const d = new Drone(DRONE_CFG, SHIP);
      d.piercing = true;
      d.sticky = true;
      const drones = [d];
      dm.spawn(drones, SHIP);
      expect(drones[1].piercing).to.be.true;
      expect(drones[1].sticky).to.be.true;
    });

    it('ne fait rien si drones est vide', () => {
      const dm = new DroneManager();
      const drones = [];
      dm.spawn(drones, SHIP);
      expect(drones).to.have.length(0);
    });

    it('le nouveau drone est lancé', () => {
      const dm = new DroneManager();
      const drones = [new Drone(DRONE_CFG, SHIP)];
      dm.spawn(drones, SHIP);
      expect(drones[1].launched).to.be.true;
    });
  });

  describe('removeExtra', () => {
    it('retire un drone si plus de 1', () => {
      const dm = new DroneManager();
      const drones = [new Drone(DRONE_CFG, SHIP), new Drone(DRONE_CFG, SHIP)];
      const removed = dm.removeExtra(drones, 1);
      expect(removed).to.be.true;
      expect(drones).to.have.length(1);
    });

    it('refuse de retirer le dernier drone', () => {
      const dm = new DroneManager();
      const drones = [new Drone(DRONE_CFG, SHIP)];
      const removed = dm.removeExtra(drones, 0);
      expect(removed).to.be.false;
      expect(drones).to.have.length(1);
    });
  });

  describe('resetLast', () => {
    it('reset le premier drone et appelle clearDroneEffects', () => {
      let cleared = false;
      const dm = new DroneManager({ clearDroneEffects: () => { cleared = true; } });
      const d = new Drone(DRONE_CFG, SHIP);
      d.launched = true;
      d.piercing = true;
      dm.resetLast([d], SHIP);
      expect(d.launched).to.be.false;
      expect(d.piercing).to.be.false;
      expect(cleared).to.be.true;
    });
  });
});
