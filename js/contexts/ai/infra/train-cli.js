#!/usr/bin/env node
// --- Entraînement IA en ligne de commande ---
// Usage : node js/contexts/ai/infra/train-cli.js [options]
//   --generations N    nombre de générations (défaut: 100)
//   --population N     taille de la population (défaut: 50)
//   --level ID         niveau d'entraînement (défaut: z1-1)
//   --levels IDs       niveaux séparés par virgule (rotation par génération)
//   --curriculum       curriculum learning (ajoute progressivement les niveaux)
//   --mutation-rate N  taux de mutation (défaut: 0.20)
//   --mutation-power N puissance de mutation (défaut: 0.4)
//   --output FILE      fichier de sortie du modèle (défaut: js/contexts/ai/models/best.json)
//   --input FILE       fichier modèle à charger comme point de départ
//   --silent           pas de sortie par génération (juste le résultat final)

import { readFileSync, writeFileSync } from 'fs';
import { Population } from '../domain/genome.js';
import { TOPOLOGY } from '../use-cases/ai-player.js';
import { simulateAgent } from '../use-cases/simulation.js';
import { computeGenStats, formatGenStats, genStatsHeader, genStatsSeparator } from '../use-cases/gen-stats.js';
import { createHeadlessGame } from './headless-game.js';

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
const MUTATION_RATE  = parseFloat(arg('mutation-rate', '0.20'));
const MUTATION_POWER = parseFloat(arg('mutation-power', '0.4'));
const OUTPUT_FILE    = arg('output', 'js/contexts/ai/models/best.json');
const INPUT_FILE     = arg('input', '');
const SILENT         = flag('silent');

// ─── PRNG déterministe (mulberry32) ──────────────────

function mulberry32(seed) {
  return function() {
    seed |= 0; seed = seed + 0x6D2B79F5 | 0;
    let t = Math.imul(seed ^ seed >>> 15, 1 | seed);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

function withSeededRandom(seed, fn) {
  const original = Math.random;
  Math.random = mulberry32(seed);
  try { return fn(); }
  finally { Math.random = original; }
}

// ─── Headless game setup ───────────────────────────

const { startGame, tick, gameState } = createHeadlessGame();

/** Retourne les niveaux disponibles pour cette génération (curriculum). */
function getLevelsForGen(gen) {
  if (!CURRICULUM || LEVEL_IDS.length <= 1) return LEVEL_IDS;
  // Débloquer un niveau tous les N gens (répartition uniforme)
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
  console.log(`\n🧠 Entraînement IA — ${GENERATIONS} générations, pop ${POP_SIZE}, niveaux ${LEVEL_IDS.join(',')}`);
  console.log(`   Mutation: rate=${MUTATION_RATE} power=${MUTATION_POWER}${CURRICULUM ? ' (curriculum)' : ''}`);
  console.log(`   Sortie: ${OUTPUT_FILE}\n`);
  console.log(genStatsHeader());
  console.log(genStatsSeparator());
}

const t0 = Date.now();

for (let gen = 0; gen < GENERATIONS; gen++) {
  // Même niveau pour tous les agents d'une génération (rotation)
  const levels = getLevelsForGen(gen);
  const levelId = levels[gen % levels.length];
  for (const genome of population.genomes) {
    const result = simulateAgent(genome, gameState, startGame, tick, levelId);
    genome.fitness = result.fitness;
    genome._details = result;
  }

  const genStats = computeGenStats(population.genomes, population.generation, population);
  genHistory.push(genStats);

  if (!SILENT) console.log(formatGenStats(genStats));

  population.evolve(MUTATION_RATE, MUTATION_POWER);
}

const elapsed = ((Date.now() - t0) / 1000).toFixed(1);

// ─── Sauvegarde ────────────────────────────────────

const model = population.exportModel({ genHistory });
if (model) {
  writeFileSync(OUTPUT_FILE, JSON.stringify(model, null, 2));
  // Mettre à jour index.json si la sortie est dans le dossier models/
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
