#!/usr/bin/env node
// --- Entraînement IA en ligne de commande ---
// Usage : node js/ai/train-cli.js [options]
//   --generations N   nombre de générations (défaut: 100)
//   --population N    taille de la population (défaut: 50)
//   --level ID        niveau d'entraînement (défaut: z1-1)
//   --mutation-rate N taux de mutation (défaut: 0.20)
//   --mutation-power N puissance de mutation (défaut: 0.4)
//   --output FILE     fichier de sortie du modèle (défaut: js/ai/models/best.json)
//   --input FILE      fichier modèle à charger comme point de départ
//   --silent          pas de sortie par génération (juste le résultat final)

import { readFileSync, writeFileSync } from 'fs';
import { CONFIG } from '../config.js';
import { Ship } from '../domain/ship/ship.js';
import { Drone } from '../domain/drone/drone.js';
import { AsteroidField } from '../domain/asteroid/index.js';
import { GameSession } from '../use-cases/game-logic/game-session.js';
import { CollisionHandler } from '../use-cases/collision/collision-handler.js';
import { DropSystem } from '../use-cases/drop/drop-system.js';
import { PowerUpManager } from '../use-cases/power-up/power-up-manager.js';
import { MineralDropSystem } from '../use-cases/mineral/mineral-drop-system.js';
import { DroneManager } from '../use-cases/drone/drone-manager.js';
import { getLevel } from '../domain/progression/level-catalog.js';
import { Population } from './genome.js';
import { TOPOLOGY } from './ai-player.js';
import { simulateAgent } from './simulation.js';

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
const OUTPUT_FILE    = arg('output', 'js/ai/models/best.json');
const INPUT_FILE     = arg('input', '');
const SILENT         = flag('silent');

// ─── Headless game setup ───────────────────────────

const noop = () => {};
const noopEffects = {
  spawnExplosion: noop, triggerShake: noop, spawnComboSparkle: noop,
  spawnAlienExplosion: noop, spawnBossExplosion: noop, spawnDebris: () => null,
  spawnShipExplosion: noop, spawnBounceFlash: noop,
};

const session = new GameSession(CONFIG);
const entities = {
  ship: null, drones: [], field: null,
  capsules: [], mineralCapsules: [], projectiles: [], totalAsteroids: 0,
};
const ui = { combo: 0, comboDisplay: 0, comboFadeTimer: 0, slowMoTimer: 0, deathAnimTimer: 0, winAnimTimer: 0, deathZoomCenter: null, deathDebris: null };

const droneManager = new DroneManager({ clearDroneEffects: noop });
const powerUp = new PowerUpManager({ droneManager });
powerUp.droneManager = droneManager;
const drop = new DropSystem(CONFIG.drop);
const mineralDrop = new MineralDropSystem(CONFIG.mineralDrop);
const intensity = { update: noop, onBounce: noop, onAsteroidHit: noop, onAsteroidDestroyed: noop, onPowerUpActivated: noop, onPowerUpExpired: noop, onLifeChanged: noop, onGameOver: noop, onWin: noop, onBossDestroyed: noop, enable: noop };
const systems = { drop, powerUp, intensity, mineralDrop, droneManager };

const getGameState = () => ({ ship: entities.ship, drones: entities.drones, session, field: entities.field });

let collisionHandler;

function startGame(levelId) {
  const level = getLevel(levelId);
  const astConfig = level?.asteroids
    ? { ...CONFIG.asteroids, ...level.asteroids, _autoSize: true }
    : { ...CONFIG.asteroids };

  entities.ship = new Ship(CONFIG.ship, CONFIG.canvas.width, CONFIG.canvas.height, false);
  entities.drones = [new Drone(CONFIG.drone, entities.ship, false, CONFIG.canvas.width, CONFIG.canvas.height)];
  entities.field = new AsteroidField(astConfig);
  entities.capsules = [];
  entities.mineralCapsules = [];
  entities.projectiles = [];
  entities.totalAsteroids = entities.field.remaining;

  Object.assign(ui, { combo: 0, comboDisplay: 0, comboFadeTimer: 0, slowMoTimer: 0, deathAnimTimer: 0, winAnimTimer: 0, deathZoomCenter: null, deathDebris: null });
  powerUp.clear(getGameState());

  collisionHandler = new CollisionHandler({
    entities, session, systems, ui,
    config: { screenshake: CONFIG.screenshake, capsule: CONFIG.capsule, mineralCapsule: CONFIG.mineralCapsule, combo: CONFIG.combo },
    effects: noopEffects,
    getGameState, droneManager, wallet: null,
  });

  session.start(levelId);
}

function tick(pointerX) {
  const { ship, drones, field } = entities;
  field.update(1);
  ship.update(pointerX, 1);
  for (const d of drones) d.update(ship, CONFIG.canvas.width, 1);
  for (const c of entities.capsules) c.update(CONFIG.canvas.height, 1);
  entities.capsules = entities.capsules.filter(c => c.alive);
  for (const mc of entities.mineralCapsules) mc.update(CONFIG.canvas.height, 1);
  entities.mineralCapsules = entities.mineralCapsules.filter(mc => mc.alive);
  collisionHandler.update();
}

// ─── Simulation (via module partagé) ────────────────

const gameState = { entities, session, canvas: CONFIG.canvas };

function simulate(genome) {
  return simulateAgent(genome, gameState, startGame, tick, LEVEL_ID);
}

// ─── Training loop ─────────────────────────────────

const population = new Population(POP_SIZE, TOPOLOGY);

// Charger un modèle existant
if (INPUT_FILE) {
  try {
    const data = JSON.parse(readFileSync(INPUT_FILE, 'utf-8'));
    population.loadModel(data);
    if (!SILENT) console.log(`Modèle chargé : gen ${data.generation}, fitness ${Math.round(data.fitness)}`);
  } catch (e) {
    console.error(`Erreur chargement ${INPUT_FILE}: ${e.message}`);
  }
}

if (!SILENT) {
  console.log(`\n🧠 Entraînement IA — ${GENERATIONS} générations, pop ${POP_SIZE}, niveau ${LEVEL_ID}`);
  console.log(`   Mutation: rate=${MUTATION_RATE} power=${MUTATION_POWER}`);
  console.log(`   Sortie: ${OUTPUT_FILE}\n`);
  console.log('Gen'.padStart(5), 'Best'.padStart(7), 'Avg'.padStart(7), 'Catch'.padStart(6), 'Destr'.padStart(6), 'Rally'.padStart(6), 'Drops'.padStart(6), 'Wins'.padStart(5));
  console.log('-'.repeat(60));
}

const t0 = Date.now();
const bestHistory = [];
const avgHistory = [];

// Charger les historiques du modèle importé
if (INPUT_FILE) {
  try {
    const data = JSON.parse(readFileSync(INPUT_FILE, 'utf-8'));
    if (data.stats?.bestHistory) bestHistory.push(...data.stats.bestHistory);
    if (data.stats?.avgHistory) avgHistory.push(...data.stats.avgHistory);
  } catch { /* ignore */ }
}

for (let gen = 0; gen < GENERATIONS; gen++) {
  let genBest = null;
  let winCount = 0;

  for (const genome of population.genomes) {
    const result = simulate(genome);
    genome.fitness = result.fitness;
    genome._details = result;
    if (!genBest || genome.fitness > genBest.fitness) genBest = genome;
    if (result.won) winCount++;
  }

  const total = population.genomes.reduce((s, g) => s + g.fitness, 0);
  const avg = Math.round(total / POP_SIZE);
  const d = genBest._details || {};

  const bestFit = population.bestFitness > -Infinity ? population.bestFitness : genBest.fitness;
  bestHistory.push(Math.round(bestFit));
  avgHistory.push(avg);

  if (!SILENT) {
    const genStr = String(population.generation).padStart(5);
    const bestStr = String(Math.round(genBest.fitness)).padStart(7);
    const avgStr = String(avg).padStart(7);
    const catchStr = String(d.catches || 0).padStart(6);
    const destrStr = String(d.destroys || 0).padStart(6);
    const rallyStr = String(d.rallyScore || 0).padStart(6);
    const dropStr = String(d.drops || 0).padStart(6);
    const winStr = String(winCount).padStart(5);
    console.log(genStr, bestStr, avgStr, catchStr, destrStr, rallyStr, dropStr, winStr);
  }

  population.evolve(MUTATION_RATE, MUTATION_POWER);
}

const elapsed = ((Date.now() - t0) / 1000).toFixed(1);

// ─── Sauvegarde ────────────────────────────────────

const model = population.exportModel({ bestHistory, avgHistory });
if (model) {
  writeFileSync(OUTPUT_FILE, JSON.stringify(model, null, 2));
  console.log(`\n✅ Modèle sauvegardé dans ${OUTPUT_FILE}`);
  console.log(`   Génération: ${model.generation}, Fitness: ${Math.round(model.fitness)}`);
  console.log(`   Historique: ${bestHistory.length} générations`);
  console.log(`   Temps: ${elapsed}s`);
} else {
  console.log('\n❌ Aucun modèle à sauvegarder');
}
