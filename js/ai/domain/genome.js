// --- Algorithme génétique ---
// Gère une population de génomes (vecteurs de poids).
// Sélection par tournoi, crossover uniforme, mutation gaussienne.

import { NeuralNetwork } from './neural-network.js';
import { nullStorageAdapter } from '../infra/population-storage.js';

const ELITE_RATIO = 0.10; // top 10% sauvegardés et réutilisés au redémarrage

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
   * @param {object} [storage] - adapter { save(data), load() → data|null }
   */
  constructor(size, topology, storage = nullStorageAdapter) {
    this.size = size;
    this.topology = topology;
    this.generation = 0;
    this.genomes = [];
    this.bestFitness = -Infinity;
    this.bestGenome = null;
    this._storage = storage;
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
    // Élitisme : garder les top 10% sans mutation
    const eliteCount = Math.max(3, Math.ceil(this.size * ELITE_RATIO));
    this._elites = [];
    for (let i = 0; i < eliteCount; i++) {
      const clone = this.genomes[i].clone();
      next.push(clone);
      this._elites.push(this.genomes[i].clone());
    }

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

    // Calculer les métriques de diversité des élites
    this._eliteDiversity = this.#computeEliteDiversity();
  }

  /** Distance euclidienne moyenne normalisée entre les élites (0–~10). */
  #computeEliteDiversity() {
    const elites = this._elites;
    if (!elites || elites.length < 2) return 0;
    const encoded = elites.map(g => g.brain.encode());
    const dim = encoded[0].length || 1;
    let totalDist = 0;
    let pairs = 0;
    for (let i = 0; i < encoded.length; i++) {
      for (let j = i + 1; j < encoded.length; j++) {
        let sum = 0;
        for (let k = 0; k < dim; k++) {
          const d = encoded[i][k] - encoded[j][k];
          sum += d * d;
        }
        totalDist += Math.sqrt(sum);
        pairs++;
      }
    }
    // Normaliser par √dim pour ramener dans une plage lisible (~0–10)
    return pairs > 0 ? totalDist / pairs / Math.sqrt(dim) : 0;
  }

  /** Sauvegarde les top 10% via le storage adapter injecté. */
  saveBest(stats) {
    if (!this.bestGenome) return;
    const data = this.exportModel(stats);
    if (data) this._storage.save(data);
  }

  /** Charge le modèle depuis le storage adapter et seede la population. */
  loadBest() {
    const data = this._storage.load();
    if (!data) return null;
    const genome = this.#applyModelData(data);
    if (genome) this.#seedPopulation();
    return genome;
  }

  /** Charge un modèle depuis un objet JSON et seede la population. */
  loadModel(json) {
    const raw = typeof json === 'string' ? json : JSON.stringify(json);
    const genome = this.#applyModelData(raw);
    if (genome) this.#seedPopulation();
    return genome;
  }

  /**
   * Exporte le modèle sous forme d'objet JSON sérialisable.
   * Inclut les top 10% pour pouvoir reprendre l'entraînement.
   */
  exportModel(stats) {
    if (!this.bestGenome) return null;
    const data = {
      topology: this.topology,
      generation: this.generation,
      fitness: this.bestFitness,
      weights: Array.from(this.bestGenome.brain.encode()),
    };
    // Sauvegarder les élites (top 10%) si disponibles
    if (this._elites && this._elites.length > 0) {
      data.elites = this._elites.map(g => Array.from(g.brain.encode()));
    }
    if (stats) data.stats = stats;
    return data;
  }

  /**
   * Seede la population à partir des élites sauvegardées.
   * Les élites sont injectées telles quelles, le reste est engendré
   * par crossover + mutation des élites.
   */
  #seedPopulation() {
    const elites = this._elites || (this.bestGenome ? [this.bestGenome] : []);
    if (elites.length === 0) return;

    let idx = 0;
    // Injecter les élites telles quelles
    for (const elite of elites) {
      if (idx >= this.size) break;
      this.genomes[idx++] = elite.clone();
    }
    // Remplir le reste par crossover + mutation des élites
    while (idx < this.size) {
      const a = elites[Math.floor(Math.random() * elites.length)];
      const b = elites[Math.floor(Math.random() * elites.length)];
      const child = this.crossover(a, b);
      this.mutate(child, 0.25, 0.4);
      this.genomes[idx++] = child;
    }
  }

  /** Charge un modèle depuis des données (objet ou string JSON). */
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

      // Restaurer les élites si présentes
      if (data.elites && data.elites.length > 0) {
        this._elites = data.elites.map(weights => {
          const g = new Genome(data.topology);
          g.brain.decode(new Float32Array(weights));
          return g;
        });
      } else {
        // Rétro-compatibilité : seulement le best
        this._elites = [genome];
      }

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
