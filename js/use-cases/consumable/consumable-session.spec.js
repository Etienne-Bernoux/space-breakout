import { describe, it, expect } from 'vitest';
import { ConsumableInventory } from './consumable-inventory.js';
import { ConsumableSession } from './consumable-session.js';

function makeSession(stocks = {}) {
  const inv = new ConsumableInventory();
  for (const [id, qty] of Object.entries(stocks)) inv.addStock(id, qty);
  return { session: new ConsumableSession(inv), inv };
}

describe('ConsumableSession', () => {
  it('snapshot les charges depuis l\'inventaire', () => {
    const { session } = makeSession({ safetyNet: 3, shockwave: 1 });
    expect(session.getCharges('safetyNet')).toBe(1); // 1 charge par unité
    expect(session.getCharges('shockwave')).toBe(1);
  });

  it('missiles : 1 stock = 3 tirs', () => {
    const { session } = makeSession({ missiles: 2 });
    expect(session.getCharges('missiles')).toBe(3); // shotsPerCharge = 3
  });

  it('0 stock = 0 charges', () => {
    const { session } = makeSession({});
    expect(session.getCharges('safetyNet')).toBe(0);
    expect(session.hasCharge('safetyNet')).toBe(false);
  });

  it('use consomme 1 charge et déduit du stock', () => {
    const { session, inv } = makeSession({ safetyNet: 2 });
    expect(session.use('safetyNet')).toBe(true);
    expect(session.getCharges('safetyNet')).toBe(0);
    expect(inv.getStock('safetyNet')).toBe(1); // déduit 1
  });

  it('use retourne false si plus de charge', () => {
    const { session } = makeSession({});
    expect(session.use('safetyNet')).toBe(false);
  });

  it('missiles : stock déduit quand les 3 tirs sont écoulés', () => {
    const { session, inv } = makeSession({ missiles: 1 });
    expect(session.use('missiles')).toBe(true); // tir 1
    expect(inv.getStock('missiles')).toBe(1);   // pas encore déduit
    expect(session.use('missiles')).toBe(true); // tir 2
    expect(inv.getStock('missiles')).toBe(1);
    expect(session.use('missiles')).toBe(true); // tir 3
    expect(inv.getStock('missiles')).toBe(0);   // maintenant déduit
  });

  it('getActiveConsumables retourne les actifs avec charges', () => {
    const { session } = makeSession({ shockwave: 1, safetyNet: 1 });
    const active = session.getActiveConsumables();
    // safetyNet est passif → pas dans la liste
    expect(active).toHaveLength(1);
    expect(active[0].id).toBe('shockwave');
  });
});
