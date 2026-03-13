import { describe, it, expect } from 'vitest';
import { NeuralNetwork } from './neural-network.js';

describe('NeuralNetwork', () => {
  const topology = [4, 3, 2];

  describe('constructor', () => {
    it('crée les couches avec les bonnes dimensions', () => {
      const nn = new NeuralNetwork(topology);
      expect(nn.weights).toHaveLength(2);          // 2 couches
      expect(nn.weights[0]).toHaveLength(3 * 4);    // hidden: 3×4
      expect(nn.weights[1]).toHaveLength(2 * 3);    // output: 2×3
      expect(nn.biases[0]).toHaveLength(3);
      expect(nn.biases[1]).toHaveLength(2);
    });

    it('stocke la topologie', () => {
      const nn = new NeuralNetwork(topology);
      expect(nn.topology).toEqual(topology);
    });
  });

  describe('paramCount', () => {
    it('compte poids + biais de toutes les couches', () => {
      const nn = new NeuralNetwork(topology);
      // couche 1 : 3×4 poids + 3 biais = 15
      // couche 2 : 2×3 poids + 2 biais = 8
      expect(nn.paramCount()).toBe(23);
    });

    it('fonctionne avec 3 couches cachées', () => {
      const nn = new NeuralNetwork([2, 4, 4, 1]);
      // 2→4: 8+4=12, 4→4: 16+4=20, 4→1: 4+1=5
      expect(nn.paramCount()).toBe(37);
    });
  });

  describe('encode / decode', () => {
    it('round-trip préserve tous les poids', () => {
      const nn = new NeuralNetwork(topology);
      const encoded = nn.encode();
      expect(encoded).toHaveLength(nn.paramCount());

      const nn2 = new NeuralNetwork(topology);
      nn2.decode(encoded);

      // Vérifier que les poids sont identiques
      for (let l = 0; l < nn.weights.length; l++) {
        for (let i = 0; i < nn.weights[l].length; i++) {
          expect(nn2.weights[l][i]).toBe(nn.weights[l][i]);
        }
        for (let i = 0; i < nn.biases[l].length; i++) {
          expect(nn2.biases[l][i]).toBe(nn.biases[l][i]);
        }
      }
    });

    it('encode retourne un Float32Array', () => {
      const nn = new NeuralNetwork(topology);
      expect(nn.encode()).toBeInstanceOf(Float32Array);
    });
  });

  describe('forward', () => {
    it('retourne le bon nombre de sorties', () => {
      const nn = new NeuralNetwork(topology);
      const output = nn.forward(new Float32Array(4));
      expect(output).toHaveLength(2);
    });

    it('les sorties sont bornées par tanh [-1, 1]', () => {
      const nn = new NeuralNetwork(topology);
      const output = nn.forward(new Float32Array([100, -100, 50, -50]));
      for (const v of output) {
        expect(v).toBeGreaterThanOrEqual(-1);
        expect(v).toBeLessThanOrEqual(1);
      }
    });

    it('donne le même résultat pour les mêmes inputs', () => {
      const nn = new NeuralNetwork(topology);
      const input = new Float32Array([0.5, -0.3, 0.8, 0.1]);
      const out1 = nn.forward(input);
      const out2 = nn.forward(input);
      expect(Array.from(out1)).toEqual(Array.from(out2));
    });

    it('poids à zéro + biais à zéro → sortie zéro', () => {
      const nn = new NeuralNetwork(topology);
      const zeros = new Float32Array(nn.paramCount());
      nn.decode(zeros);
      const output = nn.forward(new Float32Array([1, 2, 3, 4]));
      for (const v of output) expect(v).toBe(0);
    });
  });

  describe('randomMatrix', () => {
    it('crée une matrice de la bonne taille', () => {
      const m = NeuralNetwork.randomMatrix(3, 4);
      expect(m).toHaveLength(12);
      expect(m).toBeInstanceOf(Float32Array);
    });

    it('les valeurs sont proches de zéro (Xavier init)', () => {
      const m = NeuralNetwork.randomMatrix(10, 10);
      const max = Math.max(...m);
      const min = Math.min(...m);
      // Xavier scale = sqrt(2/20) ≈ 0.316, valeurs dans [-0.316, 0.316]
      expect(max).toBeLessThan(1);
      expect(min).toBeGreaterThan(-1);
    });
  });
});
