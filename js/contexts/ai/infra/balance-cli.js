#!/usr/bin/env node
// --- Simulation d'équilibrage ---
// Fait jouer l'IA sur chaque niveau et affiche un rapport de métriques.
// Usage : node js/contexts/ai/infra/balance-cli.js [options]
//   --levels IDs     niveaux séparés par virgule (défaut: z1-1,...,z2-6)
//   --runs N         nombre de parties par niveau (défaut: 10)
//   --model FILE     modèle IA (défaut: js/contexts/ai/models/best.json)

import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { createHeadlessGame } from './headless-game.js';
import { AIPlayer, TOPOLOGY } from '../use-cases/ai-player.js';
import { Genome } from '../domain/genome.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

// ─── Parse args ────────────────────────────────────
const args = process.argv.slice(2);
function arg(name, fallback) {
  const idx = args.indexOf(`--${name}`);
  return idx >= 0 && idx + 1 < args.length ? args[idx + 1] : fallback;
}

const DEFAULT_LEVELS = 'z1-1,z1-2,z1-3,z1-4,z1-5,z1-6,z2-1,z2-2,z2-3,z2-4,z2-5,z2-6';
const levels = arg('levels', DEFAULT_LEVELS).split(',');
const runs = parseInt(arg('runs', '10'), 10);
const modelPath = arg('model', join(__dirname, '../models/best.json'));

// ─── Charger le modèle ─────────────────────────────
let modelData;
try {
  modelData = JSON.parse(readFileSync(modelPath, 'utf-8'));
} catch (e) {
  console.error(`Erreur : impossible de charger le modèle ${modelPath}`);
  console.error('Entraîne d\'abord un modèle avec : pnpm train');
  process.exit(1);
}

const MAX_FRAMES = 10800;

function simulateOneGame(genome, levelId) {
  const game = createHeadlessGame({ realisticDrops: true });
  const player = new AIPlayer(genome, game.gameState);
  game.startGame(levelId);

  for (let frame = 0; frame < MAX_FRAMES; frame++) {
    const state = game.gameState.session.state;
    if (state === 'won' || state === 'gameOver') break;
    if (state !== 'playing') continue;
    const decision = player.decide();
    const drone = game.gameState.entities.drones[0];
    if (drone && !drone.launched && (decision.shouldLaunch || frame > 10)) {
      drone.launch(game.gameState.entities.ship);
    }
    game.tick(decision.pointerX);
  }

  const won = game.gameState.session.state === 'won';
  const timeSec = player.framesSurvived / 60;
  return {
    won,
    timeSec,
    livesLost: player.dropCount,
    score: game.gameState.session.score,
    mineralsByType: { ...player.mineralsByType },
    powerUpsCaught: player.powerUpsCaught,
    asteroidsDestroyed: player.asteroidsDestroyed,
  };
}

// ─── Simulation ────────────────────────────────────
console.log(`\n🎮 Simulation d'équilibrage — ${runs} parties par niveau\n`);
console.log('Modèle :', modelPath);
console.log('Niveaux :', levels.join(', '));
console.log('Drop rate minerai : gameplay (0.08)\n');

const header = '│ Level   │ Win% │  Time │ Lives │ Score  │  Cu  │  Ag  │  Au  │  Pt  │ PU  │';
const sep =    '├─────────┼──────┼───────┼───────┼────────┼──────┼──────┼──────┼──────┼─────┤';
console.log('┌─────────┬──────┬───────┬───────┬────────┬──────┬──────┬──────┬──────┬─────┐');
console.log(header);
console.log(sep);

const totals = { z1: { copper: 0, silver: 0, gold: 0, platinum: 0 }, z2: { copper: 0, silver: 0, gold: 0, platinum: 0 } };

for (const levelId of levels) {
  const results = [];
  for (let i = 0; i < runs; i++) {
    const genome = new Genome(modelData.topology || TOPOLOGY);
    genome.brain.decode(new Float32Array(modelData.weights));
    results.push(simulateOneGame(genome, levelId));
  }

  const avg = (arr, fn) => arr.reduce((s, r) => s + fn(r), 0) / arr.length;
  const winRate = Math.round(avg(results, r => r.won ? 1 : 0) * 100);
  const time = avg(results, r => r.timeSec).toFixed(0);
  const lives = avg(results, r => r.livesLost).toFixed(1);
  const score = Math.round(avg(results, r => r.score));
  const cu = avg(results, r => r.mineralsByType.copper).toFixed(1);
  const ag = avg(results, r => r.mineralsByType.silver).toFixed(1);
  const au = avg(results, r => r.mineralsByType.gold).toFixed(1);
  const pt = avg(results, r => r.mineralsByType.platinum).toFixed(1);
  const pu = avg(results, r => r.powerUpsCaught).toFixed(1);

  const zone = levelId.startsWith('z1') ? 'z1' : 'z2';
  totals[zone].copper += parseFloat(cu);
  totals[zone].silver += parseFloat(ag);
  totals[zone].gold += parseFloat(au);
  totals[zone].platinum += parseFloat(pt);

  const pad = (v, n) => String(v).padStart(n);
  console.log(
    `│ ${levelId.padEnd(7)} │ ${pad(winRate, 3)}% │ ${pad(time, 4)}s │ ${pad(lives, 4)}  │ ${pad(score, 6)} │ ${pad(cu, 4)} │ ${pad(ag, 4)} │ ${pad(au, 4)} │ ${pad(pt, 4)} │ ${pad(pu, 3)} │`,
  );
}

console.log('└─────────┴──────┴───────┴───────┴────────┴──────┴──────┴──────┴──────┴─────┘');

console.log('\n📊 Revenus totaux par zone (moyenne sur 1 run complet) :');
for (const [zone, t] of Object.entries(totals)) {
  console.log(`  ${zone}: ${t.copper.toFixed(0)} Cu, ${t.silver.toFixed(0)} Ag, ${t.gold.toFixed(0)} Au, ${t.platinum.toFixed(0)} Pt`);
}
console.log();
