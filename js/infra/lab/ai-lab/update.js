// --- AI Lab DOM Update ---

import { formatGenStats, genStatsHeader, genStatsSeparator } from '../../../ai/gen-stats.js';
import { graphDataCache, drawAndCache, drawElitesGraph, drawGraph } from './graph-draw.js';
export { drawZoomedGraph } from './graph-draw.js';

/** Met à jour les stats affichées selon le mode (training ou watch). */
export function updateStats(el, trainer) {
  if (!el || !trainer) return;

  if (trainer.watchBest) {
    updateWatchStats(el, trainer);
  } else {
    updateTrainingStats(el, trainer);
  }
}

/** Stats temps réel du meilleur agent en mode watch. */
function updateWatchStats(el, trainer) {
  const p = trainer.currentPlayer;
  const pop = trainer.population;

  if (!p) {
    el.innerHTML = `
      <div class="ai-stat ai-best">Record <b>${Math.round(pop.bestFitness)}</b></div>
      <div class="ai-stat-muted">Redémarrage…</div>
    `;
    return;
  }

  const state = trainer.gameState.session.state;
  const stateLabel = state === 'won' ? ' ✓' : state === 'gameOver' ? ' ✗' : '';
  const progress = p.asteroidsDestroyed > 0
    ? Math.round(p.asteroidsDestroyed / (trainer.gameState.entities.totalAsteroids || 1) * 100) : 0;

  el.innerHTML = `
    <div class="ai-stat ai-best">Record <b>${Math.round(pop.bestFitness)}</b></div>
    <div class="ai-stat-sep"></div>
    <div class="ai-stat">Fitness <b>${trainer.stats.current}</b>${stateLabel}</div>
    <div class="ai-stat">Progression <b>${progress}%</b></div>
    <div class="ai-stat">Pertes drone <b>${p.dropCount}</b></div>
    <div class="ai-stat">Capsules <b>${p.capsulesCaught}</b></div>
    <div class="ai-stat">Rattrapages <b>${p.catchCount}</b></div>
    <div class="ai-stat">Rally <b>${Math.round(p.rallyScore)}</b></div>
    <div class="ai-stat-sep"></div>
    <div class="ai-stat-muted">frame ${trainer.frameCount}</div>
  `;
}

/** Stats de la boucle d'entraînement batch (tableau monospace comme CLI). */
function updateTrainingStats(el, trainer) {
  const pop = trainer.population;
  const s = trainer.stats;
  const streak = s.improvementStreak > 0 ? ` ↑${s.improvementStreak}` : '';
  const history = trainer.genHistory;

  const MAX_LINES = 20;
  const visible = history.slice(-MAX_LINES);
  const lines = visible.map(g => formatGenStats(g)).join('\n');

  el.innerHTML = `
    <div class="ai-stat">Agent <b>${s.agent}</b> / ${pop.size}</div>
    <div class="ai-stat ai-best">Record <b>${s.best}</b>${streak}</div>
    <div class="ai-stat-sep"></div>
    <pre class="ai-log">${genStatsHeader()}\n${genStatsSeparator()}\n${lines}</pre>
  `;
}

const ALL_DETAIL_KEYS = [
  'ai-graph-catches', 'ai-graph-drops', 'ai-graph-wins',
  'ai-graph-destroys', 'ai-graph-stars', 'ai-graph-diversity', 'ai-graph-elites',
];

/**
 * Dessine tous les mini-graphes.
 * Accepte un trainer (avec genHistory) ou un objet modelData brut.
 */
export function drawAllGraphs(canvases, source) {
  if (!canvases) return;

  if (!source) {
    for (const key of Object.keys(canvases)) {
      const ctx = canvases[key].getContext('2d');
      ctx.clearRect(0, 0, canvases[key].width, canvases[key].height);
    }
    return;
  }

  const h = source.genHistory || source.stats?.genHistory || [];

  if (h.length >= 2) {
    drawAndCache('ai-graph-fitness', canvases,
      h.map(g => g.bestFitness), h.map(g => g.avg),
      { color1: '#0f0', color2: 'rgba(255,200,0,0.5)', label1: 'best', label2: 'avg' });
    drawAndCache('ai-graph-catches', canvases,
      h.map(g => g.catches), [],
      { color1: '#0af', label1: 'catches' });
    drawAndCache('ai-graph-drops', canvases,
      h.map(g => g.drops), [],
      { color1: '#f55', label1: 'drops' });
    drawAndCache('ai-graph-wins', canvases,
      h.map(g => g.winCount), [],
      { color1: '#ff0', label1: 'wins' });
    drawAndCache('ai-graph-destroys', canvases,
      h.map(g => g.destroys), [],
      { color1: '#f80', label1: 'destroys' });
    drawAndCache('ai-graph-stars', canvases,
      h.map(g => g.stars), [],
      { color1: '#fa0', label1: 'stars' });
    drawAndCache('ai-graph-diversity', canvases,
      h.map(g => g.diversity || 0), [],
      { color1: '#c6f', label1: 'div' });
    drawElitesGraph(canvases['ai-graph-elites'], h);
  }
}
