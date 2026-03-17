import { describe, it, expect } from 'vitest';
import { UpgradeManager } from './upgrade-manager.js';
import { MineralWallet } from '../../contexts/mineral/use-cases/mineral-wallet.js';
import { UPGRADE_IDS } from './upgrade-catalog.js';

describe('UpgradeManager', () => {
  it('démarre toutes les upgrades au niveau 0', () => {
    const um = new UpgradeManager();
    for (const id of UPGRADE_IDS) {
      expect(um.getLevel(id)).toBe(0);
    }
  });

  it('retourne le coût du premier palier au niveau 0', () => {
    const um = new UpgradeManager();
    const cost = um.getNextCost('shipSpeed');
    expect(cost).toEqual({ copper: 10 });
  });

  it('retourne null quand l\'upgrade est au max', () => {
    const um = new UpgradeManager({ shipSpeed: 3 });
    expect(um.getNextCost('shipSpeed')).toBeNull();
  });

  it('canBuy vérifie les fonds du wallet', () => {
    const um = new UpgradeManager();
    const wallet = new MineralWallet();
    expect(um.canBuy('shipSpeed', wallet)).toBe(false);
    wallet.add('copper', 10);
    expect(um.canBuy('shipSpeed', wallet)).toBe(true);
  });

  it('acheter incrémente le niveau et déduit le coût', () => {
    const um = new UpgradeManager();
    const wallet = new MineralWallet();
    wallet.add('copper', 100);
    expect(um.buy('shipSpeed', wallet)).toBe(true);
    expect(um.getLevel('shipSpeed')).toBe(1);
    expect(wallet.get('copper')).toBe(90); // 100 - 10
  });

  it('acheter échoue si fonds insuffisants', () => {
    const um = new UpgradeManager();
    const wallet = new MineralWallet();
    wallet.add('copper', 5);
    expect(um.buy('shipSpeed', wallet)).toBe(false);
    expect(um.getLevel('shipSpeed')).toBe(0);
  });

  it('le facteur d\'effet vaut 1 au niveau 0', () => {
    const um = new UpgradeManager();
    expect(um.getEffectFactor('shipSpeed')).toBe(1);
  });

  it('le facteur d\'effet correspond au niveau acheté', () => {
    const um = new UpgradeManager({ shipSpeed: 2 });
    expect(um.getEffectFactor('shipSpeed')).toBe(1.3);
  });

  it('getActiveEffects regroupe les effets par cible', () => {
    const um = new UpgradeManager({ shipSpeed: 1, droneSpeed: 2 });
    const effects = um.getActiveEffects();
    expect(effects.ship.speed).toBe(1.15);
    expect(effects.drone.speed).toBe(1.3);
  });

  it('isMaxed détecte le niveau maximum', () => {
    const um = new UpgradeManager({ shipSpeed: 3 });
    expect(um.isMaxed('shipSpeed')).toBe(true);
  });

  it('isMaxed retourne false sous le maximum', () => {
    const um = new UpgradeManager({ shipSpeed: 1 });
    expect(um.isMaxed('shipSpeed')).toBe(false);
  });

  it('reset remet tous les niveaux à 0', () => {
    const um = new UpgradeManager({ shipSpeed: 3, droneSpeed: 2 });
    um.reset();
    expect(um.getLevel('shipSpeed')).toBe(0);
    expect(um.getLevel('droneSpeed')).toBe(0);
  });

  it('sérialise et désérialise', () => {
    const um = new UpgradeManager({ shipSpeed: 2, droneMetalDamage: 1 });
    const json = um.toJSON();
    const um2 = new UpgradeManager(json);
    expect(um2.getLevel('shipSpeed')).toBe(2);
    expect(um2.getLevel('droneMetalDamage')).toBe(1);
    expect(um2.getLevel('puDuration')).toBe(0);
  });
});
