// --- PropModifier : base + multiplicateurs actifs ---
// Remplace le pattern save/restore pour les propriétés modifiées par les power-ups.
// current = Math.round(base × produit(facteurs actifs))

export class PropModifier {
  constructor(base) {
    this.base = base;
    this._factors = new Map();
  }

  /** Ajoute ou remplace un facteur (ex: 'shipWide' → 1.5). */
  set(id, factor) { this._factors.set(id, factor); }

  /** Retire un facteur. */
  remove(id) { this._factors.delete(id); }

  /** Retire tous les facteurs (reset power-ups, garde la base). */
  clear() { this._factors.clear(); }

  /** Valeur courante arrondie = base × produit(facteurs). */
  get current() {
    let v = this.base;
    for (const f of this._factors.values()) v *= f;
    return Math.round(v);
  }

  /** Valeur courante non arrondie (pour speed). */
  get currentRaw() {
    let v = this.base;
    for (const f of this._factors.values()) v *= f;
    return v;
  }

  /** Copie les facteurs actifs depuis un autre modifier. */
  copyFrom(other) {
    this._factors.clear();
    for (const [id, f] of other._factors) this._factors.set(id, f);
  }
}
