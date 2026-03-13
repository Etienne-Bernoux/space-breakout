import { describe, it, expect } from 'vitest';
import { MineralWallet } from './mineral-wallet.js';

describe('MineralWallet', () => {
  it('démarre à 0 pour tous les minerais', () => {
    const w = new MineralWallet();
    expect(w.get('copper')).toBe(0);
    expect(w.get('platinum')).toBe(0);
  });

  it('ajouter augmente le solde', () => {
    const w = new MineralWallet();
    w.add('copper', 5);
    expect(w.get('copper')).toBe(5);
    w.add('copper', 3);
    expect(w.get('copper')).toBe(8);
  });

  it('canAfford vérifie un coût multi-minerai', () => {
    const w = new MineralWallet();
    w.add('copper', 10);
    w.add('silver', 5);
    expect(w.canAfford({ copper: 10, silver: 5 })).toBe(true);
    expect(w.canAfford({ copper: 11 })).toBe(false);
    expect(w.canAfford({ copper: 5, gold: 1 })).toBe(false);
  });

  it('spend déduit les minerais et retourne true', () => {
    const w = new MineralWallet();
    w.add('copper', 20);
    w.add('silver', 10);
    expect(w.spend({ copper: 15, silver: 5 })).toBe(true);
    expect(w.get('copper')).toBe(5);
    expect(w.get('silver')).toBe(5);
  });

  it('spend retourne false si solde insuffisant', () => {
    const w = new MineralWallet();
    w.add('copper', 5);
    expect(w.spend({ copper: 10 })).toBe(false);
    expect(w.get('copper')).toBe(5); // unchanged
  });

  it('getAll retourne un snapshot du solde', () => {
    const w = new MineralWallet();
    w.add('gold', 3);
    const all = w.getAll();
    expect(all.gold).toBe(3);
    expect(all.copper).toBe(0);
  });

  it('reset remet tous les minerais à 0', () => {
    const w = new MineralWallet();
    w.add('copper', 99);
    w.add('platinum', 50);
    w.reset();
    expect(w.get('copper')).toBe(0);
    expect(w.get('platinum')).toBe(0);
  });

  it('sérialise et désérialise', () => {
    const w = new MineralWallet();
    w.add('silver', 7);
    w.add('gold', 2);
    const json = w.toJSON();
    const w2 = new MineralWallet(json);
    expect(w2.get('silver')).toBe(7);
    expect(w2.get('gold')).toBe(2);
  });
});
