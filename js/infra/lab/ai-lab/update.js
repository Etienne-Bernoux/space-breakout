// --- AI Lab DOM Update ---

import { formatGenStats, genStatsHeader, genStatsSeparator } from '../../../ai/gen-stats.js';

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
    // Entre deux parties (redémarrage)
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

  // Limiter aux N dernières lignes visibles
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

/** Dessine le graphe de fitness par génération (best + moyenne). */
export function drawGraph(canvas, bestHistory, avgHistory = []) {
  if (!canvas || bestHistory.length < 2) return;
  const ctx = canvas.getContext('2d');
  const W = canvas.width;
  const H = canvas.height;
  ctx.clearRect(0, 0, W, H);

  const allValues = [...bestHistory, ...avgHistory];
  const max = Math.max(...allValues, 1);
  const step = W / (bestHistory.length - 1);

  // Fond grille
  ctx.strokeStyle = 'rgba(255,255,255,0.05)';
  ctx.lineWidth = 1;
  for (let y = 0; y < H; y += H / 4) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(W, y);
    ctx.stroke();
  }

  // Courbe moyenne (en dessous, plus discrète)
  if (avgHistory.length >= 2) {
    drawCurve(ctx, avgHistory, max, step, W, H, 'rgba(255,200,0,0.4)', 1);
  }

  // Courbe best fitness
  drawCurve(ctx, bestHistory, max, step, W, H, '#0f0', 2);

  // Labels
  ctx.font = '10px monospace';
  ctx.fillStyle = '#0f08';
  ctx.fillText(`best ${Math.round(max)}`, 4, 12);
  if (avgHistory.length > 0) {
    ctx.fillStyle = 'rgba(255,200,0,0.5)';
    ctx.fillText(`avg ${Math.round(avgHistory[avgHistory.length - 1])}`, 4, 24);
  }
}

function drawCurve(ctx, data, max, step, W, H, color, width) {
  ctx.beginPath();
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  for (let i = 0; i < data.length; i++) {
    const x = i * step;
    const y = H - (data[i] / max) * (H - 10) - 5;
    if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
  }
  ctx.stroke();
}
