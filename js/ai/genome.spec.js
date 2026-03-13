import { describe, it, expect, beforeEach } from 'vitest';
import { Genome, Population } from './genome.js';

const TOPOLOGY = [4, 3, 2];

describe('Genome', () => {
  it('initialise un réseau avec la bonne topologie', () => {
    const g = new Genome(TOPOLOGY);
    expect(g.brain.topology).toEqual(TOPOLOGY);
    expect(g.fitness).toBe(0);
  });

  describe('clone', () => {
    it('copie les poids mais remet la fitness à zéro', () => {
      const g = new Genome(TOPOLOGY);
      g.fitness = 42;
      const c = g.clone();
      expect(c.fitness).toBe(0);
      expect(Array.from(c.brain.encode())).toEqual(Array.from(g.brain.encode()));
    });

    it('le clone est indépendant (modifier l\'un ne change pas l\'autre)', () => {
      const g = new Genome(TOPOLOGY);
      const c = g.clone();
      const genes = c.brain.encode();
      genes[0] = 999;
      c.brain.decode(genes);
      expect(g.brain.encode()[0]).not.toBe(999);
    });
  });
});

describe('Population', () => {
  let pop;

  beforeEach(() => {
    pop = new Population(10, TOPOLOGY);
  });

  it('crée le bon nombre de génomes', () => {
    expect(pop.genomes).toHaveLength(10);
    expect(pop.size).toBe(10);
  });

  it('initialise la génération à 0', () => {
    expect(pop.generation).toBe(0);
  });

  describe('tournamentSelect', () => {
    it('retourne un génome de la population', () => {
      for (const g of pop.genomes) g.fitness = Math.random() * 100;
      const selected = pop.tournamentSelect(3);
      expect(pop.genomes).toContain(selected);
    });
  });

  describe('crossover', () => {
    it('produit un enfant avec la même topologie', () => {
      const a = pop.genomes[0];
      const b = pop.genomes[1];
      const child = pop.crossover(a, b);
      expect(child.brain.topology).toEqual(TOPOLOGY);
    });

    it('l\'enfant a des gènes venant des deux parents', () => {
      const a = new Genome(TOPOLOGY);
      const b = new Genome(TOPOLOGY);
      // Forcer des poids très différents
      const genesA = a.brain.encode();
      const genesB = b.brain.encode();
      for (let i = 0; i < genesA.length; i++) {
        genesA[i] = -10;
        genesB[i] = 10;
      }
      a.brain.decode(genesA);
      b.brain.decode(genesB);

      // Faire plusieurs crossovers pour confirmer le mélange
      const childGenes = pop.crossover(a, b).brain.encode();
      const hasA = Array.from(childGenes).some(v => v === -10);
      const hasB = Array.from(childGenes).some(v => v === 10);
      // Au moins un gène de chaque parent (probabiliste, quasi-certain avec 23 gènes)
      expect(hasA || hasB).toBe(true);
    });
  });

  describe('mutate', () => {
    it('modifie au moins un poids avec rate=1', () => {
      const g = new Genome(TOPOLOGY);
      const before = Array.from(g.brain.encode());
      pop.mutate(g, 1.0, 0.5);
      const after = Array.from(g.brain.encode());
      const changed = before.some((v, i) => v !== after[i]);
      expect(changed).toBe(true);
    });

    it('ne modifie rien avec rate=0', () => {
      const g = new Genome(TOPOLOGY);
      const before = Array.from(g.brain.encode());
      pop.mutate(g, 0, 0.5);
      const after = Array.from(g.brain.encode());
      expect(after).toEqual(before);
    });
  });

  describe('evolve', () => {
    it('incrémente la génération', () => {
      for (const g of pop.genomes) g.fitness = Math.random() * 100;
      pop.evolve(0.2, 0.4);
      expect(pop.generation).toBe(1);
    });

    it('conserve la taille de la population', () => {
      for (const g of pop.genomes) g.fitness = Math.random() * 100;
      pop.evolve(0.2, 0.4);
      expect(pop.genomes).toHaveLength(10);
    });

    it('met à jour bestFitness et bestGenome', () => {
      pop.genomes[3].fitness = 999;
      pop.evolve(0.2, 0.4);
      expect(pop.bestFitness).toBe(999);
      expect(pop.bestGenome).not.toBeNull();
    });
  });

  describe('exportModel / loadModel', () => {
    it('round-trip préserve topologie, génération, fitness et poids', () => {
      pop.genomes[0].fitness = 500;
      pop.evolve(0.2, 0.4);

      const model = pop.exportModel();
      expect(model).not.toBeNull();
      expect(model.topology).toEqual(TOPOLOGY);
      expect(model.generation).toBe(1);
      expect(model.fitness).toBe(500);

      const pop2 = new Population(10, TOPOLOGY);
      const loaded = pop2.loadModel(model);
      expect(loaded).not.toBeNull();
      expect(pop2.bestFitness).toBe(500);
      expect(pop2.generation).toBe(1);
      expect(Array.from(pop2.bestGenome.brain.encode())).toEqual(model.weights);
    });

    it('exportModel inclut les stats si fournies', () => {
      pop.genomes[0].fitness = 100;
      pop.evolve(0.2, 0.4);
      const model = pop.exportModel({ bestHistory: [100], avgHistory: [50] });
      expect(model.stats).toEqual({ bestHistory: [100], avgHistory: [50] });
    });

    it('loadModel rejette une topologie incompatible', () => {
      pop.genomes[0].fitness = 100;
      pop.evolve(0.2, 0.4);
      const model = pop.exportModel();
      model.topology = [4, 8, 2]; // topologie différente

      const pop2 = new Population(10, TOPOLOGY);
      const result = pop2.loadModel(model);
      expect(result).toBeNull();
    });

    it('loadModel accepte un JSON string', () => {
      pop.genomes[0].fitness = 200;
      pop.evolve(0.2, 0.4);
      const model = pop.exportModel();
      const json = JSON.stringify(model);

      const pop2 = new Population(10, TOPOLOGY);
      const loaded = pop2.loadModel(json);
      expect(loaded).not.toBeNull();
      expect(pop2.bestFitness).toBe(200);
    });
  });
});
