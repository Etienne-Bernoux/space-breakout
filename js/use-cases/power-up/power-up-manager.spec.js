import { expect } from 'chai';
import { PowerUpManager } from './power-up-manager.js';
import { DroneManager } from '../drone/drone-manager.js';
import { PropModifier } from '../../shared/prop-modifier.js';

function makeDrone(overrides = {}) {
  const d = {
    sticky: false, piercing: false, warp: false, fireball: false,
    radiusMod: new PropModifier(6),
    speedMod: new PropModifier(3),
    _baseRadius: 6, _baseSpeed: 3,
    launched: true, color: '#ffcc00', speedBoost: 1,
    launch() { this.launched = true; },
    launchAtAngle() { this.launched = true; },
    reset() { this.radiusMod.clear(); this.speedMod.clear(); this.piercing = false; this.sticky = false; this.warp = false; this.fireball = false; },
    ...overrides,
  };
  // Getters pour radius/speed via modifier
  Object.defineProperty(d, 'radius', { get() { return this.radiusMod.current; }, set(v) { this.radiusMod.base = v; }, enumerable: true });
  Object.defineProperty(d, 'speed', { get() { return this.speedMod.currentRaw; }, set(v) { this.speedMod.base = v; }, enumerable: true });
  return d;
}

function makeGameState(overrides = {}) {
  const drone = makeDrone(overrides.drone);
  return {
    ship: { widthMod: new PropModifier(100), get width() { return this.widthMod.current; }, set width(v) { this.widthMod.base = v; }, x: 0, y: 400, height: 10, ...(overrides.ship || {}) },
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
    it('reset le timer si déjà actif (non-ship)', () => {
      const pm = new PowerUpManager();
      const gs = makeGameState();
      pm.activate('dronePiercing', gs, 0);
      pm.activate('dronePiercing', gs, 10000); // re-active à t=10s
      pm.update(gs, 15001); // 15s après t=0, mais seulement 5s après re-active
      expect(gs.drone.piercing).to.be.true; // encore actif
      pm.update(gs, 25001); // 15s après re-active → expiré
      expect(gs.drone.piercing).to.be.false;
    });

    it('re-activation reset timer sans cumuler (modifier remplace le facteur)', () => {
      const pm = new PowerUpManager();
      const gs = makeGameState();
      pm.activate('shipWide', gs, 0);
      expect(gs.ship.width).to.equal(150);
      pm.activate('shipWide', gs, 5000); // re-active : même facteur, timer reset
      expect(gs.ship.width).to.equal(150); // pas de cumul
    });

    it('revert après re-activation restaure la largeur originale', () => {
      const pm = new PowerUpManager();
      const gs = makeGameState();
      pm.activate('shipWide', gs, 0);
      pm.activate('shipWide', gs, 5000);
      pm.update(gs, 25001); // expiré
      expect(gs.ship.width).to.equal(100);
    });

    it('shipWide + shipNarrow simultanés → base × 1.5 × 0.6 = 90', () => {
      const pm = new PowerUpManager();
      const gs = makeGameState();
      pm.activate('shipWide', gs, 0);
      pm.activate('shipNarrow', gs, 0);
      expect(gs.ship.width).to.equal(90); // 100 × 1.5 × 0.6
    });

    it('expire shipWide puis shipNarrow → retour à 100', () => {
      const pm = new PowerUpManager();
      const gs = makeGameState();
      pm.activate('shipWide', gs, 0);    // durée 20s
      pm.activate('shipNarrow', gs, 0);  // durée 10s
      pm.update(gs, 10001); // narrow expiré
      expect(gs.ship.width).to.equal(150); // reste wide
      pm.update(gs, 20001); // wide expiré
      expect(gs.ship.width).to.equal(100); // retour base
    });

    it('droneLarge re-activation ne cumule pas', () => {
      const pm = new PowerUpManager();
      const gs = makeGameState();
      pm.activate('droneLarge', gs, 0);
      expect(gs.drone.radius).to.equal(11); // 6 × 1.8 arrondi
      pm.activate('droneLarge', gs, 5000);
      expect(gs.drone.radius).to.equal(11); // même facteur
    });

    it('droneLarge revert restaure le radius original', () => {
      const pm = new PowerUpManager();
      const gs = makeGameState();
      pm.activate('droneLarge', gs, 0);
      pm.update(gs, 15001);
      expect(gs.drone.radius).to.equal(6);
    });
  });

  describe('clearDroneEffects', () => {
    it('supprime les power-ups drone sans toucher aux autres', () => {
      const pm = new PowerUpManager();
      const gs = makeGameState();
      pm.activate('shipWide', gs, 0);
      pm.activate('dronePiercing', gs, 0);
      pm.activate('droneFast', gs, 0);
      pm.activate('droneWarp', gs, 0);
      expect(pm.active.size).to.equal(4);
      pm.clearDroneEffects();
      expect(pm.active.size).to.equal(1); // seul shipWide reste
      expect(pm.active.has('shipWide')).to.be.true;
    });

    it('pas de revert obsolète après clear + expire', () => {
      const pm = new PowerUpManager();
      const gs = makeGameState();
      pm.activate('droneFast', gs, 0);
      expect(gs.drone.speed).to.be.closeTo(5.4, 0.01);
      // Simule drone.reset() → nettoie les modifiers
      gs.drone.reset();
      pm.clearDroneEffects();
      // Le power-up n'est plus dans active → update ne devrait rien casser
      pm.update(gs, 10001);
      expect(gs.drone.speed).to.equal(3); // pas de double-revert
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

  describe('droneLarge', () => {
    it('multiplie le radius ×1.8 (arrondi)', () => {
      const pm = new PowerUpManager();
      const gs = makeGameState();
      pm.activate('droneLarge', gs, 0);
      expect(gs.drone.radius).to.equal(11); // Math.round(6 × 1.8) = 11
    });

    it('revert restaure le radius original', () => {
      const pm = new PowerUpManager();
      const gs = makeGameState();
      pm.activate('droneLarge', gs, 0);
      pm.update(gs, 15001);
      expect(gs.drone.radius).to.equal(6);
    });
  });

  describe('droneMini', () => {
    it('réduit le radius ×0.5 (arrondi)', () => {
      const pm = new PowerUpManager();
      const gs = makeGameState();
      pm.activate('droneMini', gs, 0);
      expect(gs.drone.radius).to.equal(3); // Math.round(6 × 0.5) = 3
    });
  });

  describe('droneFast', () => {
    it('multiplie speed ×1.8', () => {
      const pm = new PowerUpManager();
      const gs = makeGameState();
      pm.activate('droneFast', gs, 0);
      expect(gs.drone.speed).to.be.closeTo(5.4, 0.01);
    });

    it('revert restaure speed original', () => {
      const pm = new PowerUpManager();
      const gs = makeGameState();
      pm.activate('droneFast', gs, 0);
      pm.update(gs, 10001);
      expect(gs.drone.speed).to.equal(3);
    });
  });

  describe('droneWarp', () => {
    it('active warp sur le drone', () => {
      const pm = new PowerUpManager();
      const gs = makeGameState();
      pm.activate('droneWarp', gs, 0);
      expect(gs.drone.warp).to.be.true;
    });

    it('désactive après expiration', () => {
      const pm = new PowerUpManager();
      const gs = makeGameState();
      pm.activate('droneWarp', gs, 0);
      pm.update(gs, 10001);
      expect(gs.drone.warp).to.be.false;
    });
  });

  describe('droneMulti (spawn)', () => {
    it('ajoute un drone dans gs.drones', () => {
      const pm = new PowerUpManager({ droneManager: new DroneManager() });
      const gs = makeGameState();
      expect(gs.drones).to.have.length(1);
      pm.activate('droneMulti', gs, 0);
      expect(gs.drones).to.have.length(2);
      expect(pm.active.size).to.equal(0); // instant, pas stocké
    });

    it('le nouveau drone copie les flags du premier', () => {
      const pm = new PowerUpManager({ droneManager: new DroneManager() });
      const gs = makeGameState({ drone: { piercing: true } });
      pm.activate('droneMulti', gs, 0);
      expect(gs.drones[1].piercing).to.be.true;
    });

    it('le nouveau drone est lancé immédiatement', () => {
      const pm = new PowerUpManager({ droneManager: new DroneManager() });
      const gs = makeGameState();
      pm.activate('droneMulti', gs, 0);
      expect(gs.drones[1].launched).to.be.true;
    });
  });

  describe('multi-drone : apply/revert boucle sur drones', () => {
    it('piercing s\'applique à tous les drones', () => {
      const pm = new PowerUpManager({ droneManager: new DroneManager() });
      const gs = makeGameState();
      pm.activate('droneMulti', gs, 0); // 2 drones
      pm.activate('dronePiercing', gs, 0);
      expect(gs.drones[0].piercing).to.be.true;
      expect(gs.drones[1].piercing).to.be.true;
    });

    it('revert piercing sur tous les drones', () => {
      const pm = new PowerUpManager({ droneManager: new DroneManager() });
      const gs = makeGameState();
      pm.activate('droneMulti', gs, 0);
      pm.activate('dronePiercing', gs, 0);
      pm.update(gs, 15001);
      expect(gs.drones[0].piercing).to.be.false;
      expect(gs.drones[1].piercing).to.be.false;
    });
  });
});
