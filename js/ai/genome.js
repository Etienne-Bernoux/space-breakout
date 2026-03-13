// --- Algorithme génétique ---
// Gère une population de génomes (vecteurs de poids).
// Sélection par tournoi, crossover uniforme, mutation gaussienne.

import { NeuralNetwork } from './neural-network.js';

export class Genome {
  constructor(topology) {
    this.brain = new NeuralNetwork(topology);
    this.fitness = 0;
  }

  clone() {
    const g = new Genome(this.brain.topology);
    g.brain.decode(this.brain.encode().slice());
    g.fitness = 0;
    return g;
  }
}

export class Population {
  /**
   * @param {number} size - taille de la population
   * @param {number[]} topology - topologie du réseau [inputs, hidden, outputs]
   */
  constructor(size, topology) {
    this.size = size;
    this.topology = topology;
    this.generation = 0;
    this.genomes = [];
    this.bestFitness = -Infinity;
    this.bestGenome = null;
    for (let i = 0; i < size; i++) this.genomes.push(new Genome(topology));
  }

  /** Sélection par tournoi (k = 3). */
  tournamentSelect(k = 3) {
    let best = null;
    for (let i = 0; i < k; i++) {
      const idx = Math.floor(Math.random() * this.genomes.length);
      const g = this.genomes[idx];
      if (!best || g.fitness > best.fitness) best = g;
    }
    return best;
  }

  /** Crossover uniforme entre deux parents → un enfant. */
  crossover(a, b) {
    const child = new Genome(this.topology);
    const genesA = a.brain.encode();
    const genesB = b.brain.encode();
    const childGenes = new Float32Array(genesA.length);
    for (let i = 0; i < genesA.length; i++) {
      childGenes[i] = Math.random() < 0.5 ? genesA[i] : genesB[i];
    }
    child.brain.decode(childGenes);
    return child;
  }

  /** Mutation gaussienne sur les poids. */
  mutate(genome, rate = 0.20, power = 0.4) {
    const genes = genome.brain.encode();
    for (let i = 0; i < genes.length; i++) {
      if (Math.random() < rate) {
        genes[i] += gaussianRandom() * power;
      }
    }
    genome.brain.decode(genes);
  }

  /** Passe à la génération suivante (élitisme + sélection + crossover + mutation). */
  evolve(mutRate, mutPower) {
    // Trier par fitness décroissante
    this.genomes.sort((a, b) => b.fitness - a.fitness);

    // Tracker le meilleur
    if (this.genomes[0].fitness > this.bestFitness) {
      this.bestFitness = this.genomes[0].fitness;
      this.bestGenome = this.genomes[0].clone();
    }

    const next = [];
    // Élitisme : garder les 3 meilleurs sans mutation
    const eliteCount = Math.min(3, this.size);
    for (let i = 0; i < eliteCount; i++) next.push(this.genomes[i].clone());

    // Remplir le reste par crossover + mutation
    while (next.length < this.size) {
      const parentA = this.tournamentSelect();
      const parentB = this.tournamentSelect();
      const child = this.crossover(parentA, parentB);
      this.mutate(child, mutRate, mutPower);
      next.push(child);
    }

    this.genomes = next;
    this.generation++;
  }

  /** Sauvegarde le meilleur génome en localStorage. */
  saveBest() {
    if (!this.bestGenome) return;
    const data = this.exportModel();
    if (data) localStorage.setItem('ai-best-genome', JSON.stringify(data));
  }

  /** Charge le meilleur génome depuis localStorage. */
  loadBest() {
    const raw = localStorage.getItem('ai-best-genome');
    if (!raw) return null;
    return this.#applyModelData(raw);
  }

  /** Charge un modèle depuis un objet JSON (import ou fichier commité). */
  loadModel(json) {
    const raw = typeof json === 'string' ? json : JSON.stringify(json);
    return this.#applyModelData(raw);
  }

  /**
   * Exporte le meilleur modèle sous forme d'objet JSON sérialisable.
   * @param {object} [stats] - statistiques d'évolution optionnelles
   * @param {number[]} [stats.bestHistory] - fitness du meilleur par génération
   * @param {number[]} [stats.avgHistory] - fitness moyenne par génération
   */
  exportModel(stats) {
    if (!this.bestGenome) return null;
    const data = {
      topology: this.topology,
      generation: this.generation,
      fitness: this.bestFitness,
      weights: Array.from(this.bestGenome.brain.encode()),
    };
    if (stats) data.stats = stats;
    return data;
  }

  /** Charge un modèle depuis des données JSON brutes. */
  #applyModelData(raw) {
    try {
      const data = typeof raw === 'string' ? JSON.parse(raw) : raw;
      // Rejeter si la topologie ne correspond pas (ancien modèle incompatible)
      if (JSON.stringify(data.topology) !== JSON.stringify(this.topology)) return null;
      const genome = new Genome(data.topology);
      genome.brain.decode(new Float32Array(data.weights));
      genome.fitness = data.fitness;
      this.bestFitness = data.fitness;
      this.bestGenome = genome;
      this.generation = data.generation || 0;
      return genome;
    } catch { return null; }
  }
}

/** Générateur gaussien (Box-Muller). */
function gaussianRandom() {
  let u, v, s;
  do {
    u = Math.random() * 2 - 1;
    v = Math.random() * 2 - 1;
    s = u * u + v * v;
  } while (s >= 1 || s === 0);
  return u * Math.sqrt(-2 * Math.log(s) / s);
}
