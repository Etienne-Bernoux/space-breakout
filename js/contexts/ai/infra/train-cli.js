#!/usr/bin/env node
// --- Entraînement IA en ligne de commande ---
// Usage : node js/contexts/ai/infra/train-cli.js [options]
//   --generations N   nombre de générations (défaut: 100)
//   --population N    taille de la population (défaut: 50)
//   --level ID        niveau d'entraînement (défaut: z1-1)
//   --mutation-rate N taux de mutation (défaut: 0.20)
//   --mutation-power N puissance de mutation (défaut: 0.4)
//   --output FILE     fichier de sortie du modèle (défaut: js/contexts/ai/models/best.json)
//   --input FILE      fichier modèle à charger comme point de départ
//   --silent          pas de sortie par génération (juste le résultat final)

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
const LEVEL_ID       = arg('level', 'z1-1');
const MUTATION_RATE  = parseFloat(arg('mutation-rate', '0.20'));
const MUTATION_POWER = parseFloat(arg('mutation-power', '0.4'));
const OUTPUT_FILE    = arg('output', 'js/contexts/ai/models/best.json');
const INPUT_FILE     = arg('input', '');
const SILENT         = flag('silent');

// ─── Headless game setup ───────────────────────────

const { startGame, tick, gameState } = createHeadlessGame();

function simulate(genome) {
  return simulateAgent(genome, gameState, startGame, tick, LEVEL_ID);
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
  console.log(`\n🧠 Entraînement IA — ${GENERATIONS} générations, pop ${POP_SIZE}, niveau ${LEVEL_ID}`);
  console.log(`   Mutation: rate=${MUTATION_RATE} power=${MUTATION_POWER}`);
  console.log(`   Sortie: ${OUTPUT_FILE}\n`);
  console.log(genStatsHeader());
  console.log(genStatsSeparator());
}

const t0 = Date.now();

for (let gen = 0; gen < GENERATIONS; gen++) {
  for (const genome of population.genomes) {
    const result = simulate(genome);
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
  console.log(`\n✅ Modèle sauvegardé dans ${OUTPUT_FILE}`);
  console.log(`   Génération: ${model.generation}, Fitness: ${Math.round(model.fitness)}`);
  console.log(`   Historique: ${genHistory.length} générations`);
  console.log(`   Temps: ${elapsed}s`);
} else {
  console.log('\n❌ Aucun modèle à sauvegarder');
}
