import { expect } from 'chai';
import { PowerUpManager } from './power-up-manager.js';

function makeDrone(overrides = {}) {
  return { sticky: false, piercing: false, launched: true, launch() { this.launched = true; }, ...overrides };
}

function makeGameState(overrides = {}) {
  const drone = makeDrone(overrides.drone);
  return {
    ship: { width: 100, x: 0, ...overrides.ship },
    drones: [drone],
    get drone() { return this.drones[0]; },
    session: { lives: 3, scoreMultiplier: 1, ...overrides.session },
    field: { grid: overrides.grid || [] },
  };
}

describe('PowerUpManager', () => {
  describe('shipWide', () => {
    it('élargit le vaisseau ×1.5', () => {
      const pm = new PowerUpManager();
      const gs = makeGameState();
      pm.activate('shipWide', gs, 0);
      expect(gs.ship.width).to.equal(150);
    });

    it('revert restaure la largeur', () => {
      const pm = new PowerUpManager();
      const gs = makeGameState();
      pm.activate('shipWide', gs, 0);
      pm.update(gs, 20001);
      expect(gs.ship.width).to.equal(100);
    });
  });

  describe('shipNarrow', () => {
    it('rétrécit le vaisseau ×0.6', () => {
      const pm = new PowerUpManager();
      const gs = makeGameState();
      pm.activate('shipNarrow', gs, 0);
      expect(gs.ship.width).to.equal(60);
    });
  });

  describe('dronePiercing', () => {
    it('active piercing sur le drone', () => {
      const pm = new PowerUpManager();
      const gs = makeGameState();
      pm.activate('dronePiercing', gs, 0);
      expect(gs.drone.piercing).to.be.true;
    });

    it('désactive après expiration', () => {
      const pm = new PowerUpManager();
      const gs = makeGameState();
      pm.activate('dronePiercing', gs, 0);
      pm.update(gs, 15001);
      expect(gs.drone.piercing).to.be.false;
    });
  });

  describe('droneSticky', () => {
    it('active sticky (durée infinie)', () => {
      const pm = new PowerUpManager();
      const gs = makeGameState();
      pm.activate('droneSticky', gs, 0);
      expect(gs.drone.sticky).to.be.true;
      // Expire après 30s
      pm.update(gs, 30001);
      expect(gs.drone.sticky).to.be.false;
    });
  });

  describe('scoreDouble', () => {
    it('double le multiplicateur', () => {
      const pm = new PowerUpManager();
      const gs = makeGameState();
      pm.activate('scoreDouble', gs, 0);
      expect(gs.session.scoreMultiplier).to.equal(2);
    });
  });

  describe('extraLife (instant)', () => {
    it('ajoute une vie sans stocker d\'effet actif', () => {
      const pm = new PowerUpManager();
      const gs = makeGameState();
      pm.activate('extraLife', gs, 0);
      expect(gs.session.lives).to.equal(4);
      expect(pm.active.size).to.equal(0);
    });
  });

  describe('weaken (instant)', () => {
    it('réduit les HP de tous les astéroïdes destructibles (min 1)', () => {
      const grid = [
        { alive: true, destructible: true, hp: 3 },
        { alive: true, destructible: true, hp: 1 },
        { alive: true, destructible: false, hp: Infinity },
      ];
      const pm = new PowerUpManager();
      const gs = makeGameState({ grid });
      pm.activate('weaken', gs, 0);
      expect(grid[0].hp).to.equal(2);
      expect(grid[1].hp).to.equal(1);       // plancher à 1 — weaken ne tue pas
      expect(grid[1].alive).to.be.true;
      expect(grid[2].hp).to.equal(Infinity); // indestructible pas touché
    });
  });

  describe('cumul', () => {
    it('plusieurs power-ups actifs simultanément', () => {
      const pm = new PowerUpManager();
      const gs = makeGameState();
      pm.activate('shipWide', gs, 0);
      pm.activate('dronePiercing', gs, 0);
      expect(gs.ship.width).to.equal(150);
      expect(gs.drone.piercing).to.be.true;
      expect(pm.active.size).to.equal(2);
    });
  });

  describe('re-activation', () => {
    it('reset le timer si déjà actif', () => {
      const pm = new PowerUpManager();
      const gs = makeGameState();
      pm.activate('shipWide', gs, 0);
      pm.activate('shipWide', gs, 15000); // re-active à t=15s
      pm.update(gs, 20001); // 20s après t=0, mais seulement 5s après re-active
      expect(gs.ship.width).to.equal(150); // encore actif
      pm.update(gs, 35001); // 20s après re-active → expiré
      expect(gs.ship.width).to.equal(100);
    });
  });

  describe('clear', () => {
    it('revert tout', () => {
      const pm = new PowerUpManager();
      const gs = makeGameState();
      pm.activate('shipWide', gs, 0);
      pm.activate('dronePiercing', gs, 0);
      pm.clear(gs);
      expect(gs.ship.width).to.equal(100);
      expect(gs.drone.piercing).to.be.false;
      expect(pm.active.size).to.equal(0);
    });
  });

  describe('getActive', () => {
    it('retourne la liste avec temps restant', () => {
      const pm = new PowerUpManager();
      const gs = makeGameState();
      pm.activate('shipWide', gs, 0);
      const list = pm.getActive(5000);
      expect(list).to.have.length(1);
      expect(list[0].id).to.equal('shipWide');
      expect(list[0].remaining).to.equal(15000);
    });
  });

  describe('droneMulti (spawn)', () => {
    it('ajoute un drone dans gs.drones', () => {
      const pm = new PowerUpManager();
      const gs = makeGameState();
      expect(gs.drones).to.have.length(1);
      pm.activate('droneMulti', gs, 0);
      expect(gs.drones).to.have.length(2);
      expect(pm.active.size).to.equal(0); // instant, pas stocké
    });

    it('le nouveau drone copie les flags du premier', () => {
      const pm = new PowerUpManager();
      const gs = makeGameState({ drone: { piercing: true } });
      pm.activate('droneMulti', gs, 0);
      expect(gs.drones[1].piercing).to.be.true;
    });

    it('le nouveau drone est non lancé', () => {
      const pm = new PowerUpManager();
      const gs = makeGameState();
      pm.activate('droneMulti', gs, 0);
      expect(gs.drones[1].launched).to.be.false;
    });
  });

  describe('multi-drone : apply/revert boucle sur drones', () => {
    it('piercing s\'applique à tous les drones', () => {
      const pm = new PowerUpManager();
      const gs = makeGameState();
      pm.activate('droneMulti', gs, 0); // 2 drones
      pm.activate('dronePiercing', gs, 0);
      expect(gs.drones[0].piercing).to.be.true;
      expect(gs.drones[1].piercing).to.be.true;
    });

    it('revert piercing sur tous les drones', () => {
      const pm = new PowerUpManager();
      const gs = makeGameState();
      pm.activate('droneMulti', gs, 0);
      pm.activate('dronePiercing', gs, 0);
      pm.update(gs, 15001);
      expect(gs.drones[0].piercing).to.be.false;
      expect(gs.drones[1].piercing).to.be.false;
    });
  });
});
