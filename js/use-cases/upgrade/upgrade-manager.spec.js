import { describe, it, expect } from 'vitest';
import { UpgradeManager } from './upgrade-manager.js';
import { MineralWallet } from '../mineral/mineral-wallet.js';
import { UPGRADE_IDS } from './upgrade-catalog.js';

describe('UpgradeManager', () => {
  it('starts all upgrades at level 0', () => {
    const um = new UpgradeManager();
    for (const id of UPGRADE_IDS) {
      expect(um.getLevel(id)).toBe(0);
    }
  });

  it('getNextCost returns first tier cost at level 0', () => {
    const um = new UpgradeManager();
    const cost = um.getNextCost('shipSpeed');
    expect(cost).toEqual({ copper: 10 });
  });

  it('getNextCost returns null when maxed', () => {
    const um = new UpgradeManager({ shipSpeed: 3 });
    expect(um.getNextCost('shipSpeed')).toBeNull();
  });

  it('canBuy checks wallet funds', () => {
    const um = new UpgradeManager();
    const wallet = new MineralWallet();
    expect(um.canBuy('shipSpeed', wallet)).toBe(false);
    wallet.add('copper', 10);
    expect(um.canBuy('shipSpeed', wallet)).toBe(true);
  });

  it('buy succeeds and increments level', () => {
    const um = new UpgradeManager();
    const wallet = new MineralWallet();
    wallet.add('copper', 100);
    expect(um.buy('shipSpeed', wallet)).toBe(true);
    expect(um.getLevel('shipSpeed')).toBe(1);
    expect(wallet.get('copper')).toBe(90); // 100 - 10
  });

  it('buy fails if insufficient funds', () => {
    const um = new UpgradeManager();
    const wallet = new MineralWallet();
    wallet.add('copper', 5);
    expect(um.buy('shipSpeed', wallet)).toBe(false);
    expect(um.getLevel('shipSpeed')).toBe(0);
  });

  it('getEffectFactor returns 1 at level 0', () => {
    const um = new UpgradeManager();
    expect(um.getEffectFactor('shipSpeed')).toBe(1);
  });

  it('getEffectFactor returns factor at bought level', () => {
    const um = new UpgradeManager({ shipSpeed: 2 });
    expect(um.getEffectFactor('shipSpeed')).toBe(1.3);
  });

  it('getActiveEffects groups by target', () => {
    const um = new UpgradeManager({ shipSpeed: 1, droneSpeed: 2 });
    const effects = um.getActiveEffects();
    expect(effects.ship.speed).toBe(1.15);
    expect(effects.drone.speed).toBe(1.3);
  });

  it('isMaxed returns true at max level', () => {
    const um = new UpgradeManager({ shipSpeed: 3 });
    expect(um.isMaxed('shipSpeed')).toBe(true);
  });

  it('isMaxed returns false below max', () => {
    const um = new UpgradeManager({ shipSpeed: 1 });
    expect(um.isMaxed('shipSpeed')).toBe(false);
  });

  it('reset zeros all levels', () => {
    const um = new UpgradeManager({ shipSpeed: 3, droneSpeed: 2 });
    um.reset();
    expect(um.getLevel('shipSpeed')).toBe(0);
    expect(um.getLevel('droneSpeed')).toBe(0);
  });

  it('serializes and deserializes', () => {
    const um = new UpgradeManager({ shipSpeed: 2, droneDamage: 1 });
    const json = um.toJSON();
    const um2 = new UpgradeManager(json);
    expect(um2.getLevel('shipSpeed')).toBe(2);
    expect(um2.getLevel('droneDamage')).toBe(1);
    expect(um2.getLevel('puDuration')).toBe(0);
  });
});
