#!/usr/bin/env node
// --- Entraînement IA en ligne de commande ---
// Usage : node js/contexts/ai/infra/train-cli.js [options]
//   --generations N    nombre de générations (défaut: 100)
//   --population N     taille de la population (défaut: 50)
//   --level ID         niveau d'entraînement (défaut: z1-1)
//   --levels IDs       niveaux séparés par virgule (rotation par génération)
//   --curriculum       curriculum learning (ajoute progressivement les niveaux)
//   --evals N          nombre de parties par agent (défaut: 1, moyenne la fitness)
//   --workers N        nombre de threads parallèles (défaut: nb CPUs - 1)
//   --mutation-rate N  taux de mutation (défaut: 0.20)
//   --mutation-power N puissance de mutation (défaut: 0.4)
//   --output FILE      fichier de sortie du modèle (défaut: js/contexts/ai/models/best.json)
//   --input FILE       fichier modèle à charger comme point de départ
//   --silent           pas de sortie par génération (juste le résultat final)

import { readFileSync, writeFileSync } from 'fs';
import { cpus } from 'os';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { Worker } from 'worker_threads';
import { Population } from '../domain/genome.js';
import { TOPOLOGY } from '../use-cases/ai-player.js';
import { computeGenStats, formatGenStats, genStatsHeader, genStatsSeparator } from '../use-cases/gen-stats.js';

// ─── Parse args ────────────────────────────────────

const args = process.argv.slice(2);
function arg(name, fallback) {
  const idx = args.indexOf(`--${name}`);
  return idx >= 0 && args[idx + 1] ? args[idx + 1] : fallback;
}
const flag = (name) => args.includes(`--${name}`);

const GENERATIONS    = parseInt(arg('generations', '100'));
const POP_SIZE       = parseInt(arg('population', '50'));
const LEVEL_IDS      = (arg('levels', '') || arg('level', 'z1-1')).split(',').filter(Boolean);
const CURRICULUM     = flag('curriculum');
const EVALS          = parseInt(arg('evals', '1'));
const NUM_WORKERS    = parseInt(arg('workers', String(Math.max(1, cpus().length - 1))));
const MUTATION_RATE  = parseFloat(arg('mutation-rate', '0.20'));
const MUTATION_POWER = parseFloat(arg('mutation-power', '0.4'));
const OUTPUT_FILE    = arg('output', 'js/contexts/ai/models/best.json');
const INPUT_FILE     = arg('input', '');
const SILENT         = flag('silent');

// ─── Worker pool ───────────────────────────────────

const __dirname = dirname(fileURLToPath(import.meta.url));
const workerPath = join(__dirname, 'train-worker.js');

function createWorkerPool(size) {
  const workers = [];
  for (let i = 0; i < size; i++) {
    workers.push(new Worker(workerPath));
  }
  return workers;
}

/** Simule tous les génomes d'une génération en parallèle via le pool de workers. */
function simulateGeneration(genomes, levelId, levels, pool, seed) {
  return new Promise((resolve) => {
    const results = new Array(genomes.length);
    let nextIdx = 0;
    let doneCount = 0;

    function dispatch(worker) {
      if (nextIdx >= genomes.length) return;
      const idx = nextIdx++;
      const genome = genomes[idx];
      const weights = Array.from(genome.brain.encode());

      worker.once('message', (msg) => {
        results[idx] = msg;
        doneCount++;
        if (doneCount === genomes.length) {
          resolve(results);
        } else {
          dispatch(worker);
        }
      });

      worker.postMessage({
        weights,
        topology: TOPOLOGY,
        levelId,
        levels,
        evals: EVALS,
        seed,
      });
    }

    // Lancer un job par worker
    for (const worker of pool) {
      dispatch(worker);
    }
  });
}

// ─── Curriculum ────────────────────────────────────

function getLevelsForGen(gen) {
  if (!CURRICULUM || LEVEL_IDS.length <= 1) return LEVEL_IDS;
  const step = Math.max(1, Math.floor(GENERATIONS / LEVEL_IDS.length));
  const unlocked = Math.min(LEVEL_IDS.length, Math.floor(gen / step) + 1);
  return LEVEL_IDS.slice(0, unlocked);
}

// ─── Training loop ─────────────────────────────────

const population = new Population(POP_SIZE, TOPOLOGY);
const genHistory = [];

// Charger un modèle existant
if (INPUT_FILE) {
  try {
    const data = JSON.parse(readFileSync(INPUT_FILE, 'utf-8'));
    population.loadModel(data);
    if (data.stats?.genHistory) genHistory.push(...data.stats.genHistory);
    if (!SILENT) console.log(`Modèle chargé : gen ${data.generation}, fitness ${Math.round(data.fitness)}`);
  } catch (e) {
    console.error(`Erreur chargement ${INPUT_FILE}: ${e.message}`);
  }
}

if (!SILENT) {
  const extras = [
    CURRICULUM ? 'curriculum' : '',
    EVALS > 1 ? `${EVALS} evals` : '',
    `${NUM_WORKERS} workers`,
  ].filter(Boolean).join(', ');
  console.log(`\n🧠 Entraînement IA — ${GENERATIONS} générations, pop ${POP_SIZE}, niveaux ${LEVEL_IDS.join(',')}`);
  console.log(`   Mutation: rate=${MUTATION_RATE} power=${MUTATION_POWER} (${extras})`);
  console.log(`   Sortie: ${OUTPUT_FILE}\n`);
  console.log(genStatsHeader());
  console.log(genStatsSeparator());
}

const pool = createWorkerPool(NUM_WORKERS);
const t0 = Date.now();

for (let gen = 0; gen < GENERATIONS; gen++) {
  const levels = getLevelsForGen(gen);
  const levelId = levels[gen % levels.length];

  // Seed aléatoire par gen → même layout pour tous les agents, différent chaque gen
  const genSeed = Math.floor(Math.random() * 2147483647);
  const results = await simulateGeneration(population.genomes, levelId, levels, pool, genSeed);

  for (let i = 0; i < population.genomes.length; i++) {
    population.genomes[i].fitness = results[i].fitness;
    population.genomes[i]._details = results[i].details;
  }

  const genStats = computeGenStats(population.genomes, population.generation, population);
  genHistory.push(genStats);

  if (!SILENT) console.log(formatGenStats(genStats));

  population.evolve(MUTATION_RATE, MUTATION_POWER);
}

const elapsed = ((Date.now() - t0) / 1000).toFixed(1);

// Terminer les workers
for (const w of pool) w.terminate();

// ─── Sauvegarde ────────────────────────────────────

const model = population.exportModel({ genHistory });
if (model) {
  writeFileSync(OUTPUT_FILE, JSON.stringify(model, null, 2));
  if (OUTPUT_FILE.includes('models/')) {
    const indexPath = OUTPUT_FILE.replace(/[^/]+$/, 'index.json');
    try {
      const index = JSON.parse(readFileSync(indexPath, 'utf-8'));
      const fileName = OUTPUT_FILE.split('/').pop();
      const entry = index.find(e => e.file === fileName);
      if (entry) {
        entry.generation = model.generation;
        entry.fitness = Math.round(model.fitness);
      }
      writeFileSync(indexPath, JSON.stringify(index, null, 2) + '\n');
    } catch { /* index.json absent, pas grave */ }
  }
  console.log(`\n✅ Modèle sauvegardé dans ${OUTPUT_FILE}`);
  console.log(`   Génération: ${model.generation}, Fitness: ${Math.round(model.fitness)}`);
  console.log(`   Historique: ${genHistory.length} générations`);
  console.log(`   Temps: ${elapsed}s`);
} else {
  console.log('\n❌ Aucun modèle à sauvegarder');
}
