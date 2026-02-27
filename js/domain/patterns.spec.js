import { expect } from 'chai';
import { parsePattern, PATTERNS, PATTERN_KEYS } from './patterns.js';

describe('patterns', () => {
  describe('parsePattern', () => {
    it('mappe . et espace en null', () => {
      const result = parsePattern(['. ']);
      expect(result).to.deep.equal([[null, null]]);
    });

    it('mappe ? en ?', () => {
      const result = parsePattern(['?']);
      expect(result).to.deep.equal([['?']]);
    });

    it('mappe R→rock, I→ice, L→lava, M→metal, C→crystal, O→obsidian', () => {
      const result = parsePattern(['RILMCO']);
      expect(result[0]).to.deep.equal(['rock', 'ice', 'lava', 'metal', 'crystal', 'obsidian']);
    });

    it('accepte les minuscules', () => {
      const result = parsePattern(['rilmco']);
      expect(result[0]).to.deep.equal(['rock', 'ice', 'lava', 'metal', 'crystal', 'obsidian']);
    });

    it('retourne null pour caractères inconnus', () => {
      const result = parsePattern(['X']);
      expect(result[0][0]).to.be.null;
    });
  });

  describe('PATTERNS', () => {
    it('contient au moins 5 patterns', () => {
      expect(PATTERN_KEYS.length).to.be.greaterThanOrEqual(5);
    });

    it('chaque pattern a un name', () => {
      for (const key of PATTERN_KEYS) {
        expect(PATTERNS[key].name, key).to.be.a('string');
      }
    });
  });
});
