// --- AI Lab DOM Update ---

/** Met à jour les stats affichées. */
export function updateStats(el, trainer) {
  if (!el || !trainer) return;
  const pop = trainer.population;
  const s = trainer.stats;

  if (trainer.watchBest) {
    // Mode watch : stats simplifiées du meilleur agent en cours
    el.innerHTML = `
      <div class="ai-stat">Génération <b>${pop.generation}</b> (watch)</div>
      <div class="ai-stat">Fitness <b>${s.current}</b></div>
      <div class="ai-stat">Record <b class="ai-best">${Math.round(pop.bestFitness)}</b></div>
    `;
    return;
  }

  // Mode entraînement : stats détaillées
  const streak = s.improvementStreak > 0 ? ` ↑${s.improvementStreak}` : '';
  el.innerHTML = `
    <div class="ai-stat">Génération <b>${pop.generation}</b></div>
    <div class="ai-stat">Agent <b>${s.agent}</b> / ${pop.size}</div>
    <div class="ai-stat-sep"></div>
    <div class="ai-stat">Record <b class="ai-best">${s.best}</b>${streak}</div>
    <div class="ai-stat">Gen best <b>${s.genBestFitness}</b></div>
    <div class="ai-stat">Moyenne <b>${s.avgFitness}</b></div>
    <div class="ai-stat-sep"></div>
    <div class="ai-stat">🏓 Rattrapages <b>${s.genBestCatches}</b></div>
    <div class="ai-stat">💥 Destructions <b>${s.genBestDestroys}</b> (rally ${s.genBestRallyScore})</div>
    <div class="ai-stat">☠️ Pertes drone <b>${s.genBestDrops}</b></div>
    <div class="ai-stat">🏆 Victoires gen <b>${s.genWinCount}</b> / ${pop.size}</div>
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
