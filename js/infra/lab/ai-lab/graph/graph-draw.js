// --- AI Lab Graph Drawing ---
// Fonctions de dessin canvas pour les graphes d'évolution.

/** Dernières données par graphId, pour pouvoir re-dessiner en zoom. */
export const graphDataCache = {};

/** Couleurs pour chaque élite (max 10). */
const ELITE_COLORS = [
  '#0f0', '#0af', '#ff0', '#f80', '#f0f',
  '#0ff', '#fa0', '#8f0', '#f55', '#88f',
];

export function drawAndCache(id, canvases, data1, data2, opts) {
  graphDataCache[id] = { data1, data2, opts };
  drawGraph(canvases[id], data1, data2, opts);
}

/** Dessine un graphe zoomé sur un canvas modal. */
export function drawZoomedGraph(graphId, modalCanvas) {
  const cached = graphDataCache[graphId];
  if (!cached || !modalCanvas) return false;
  const rect = modalCanvas.getBoundingClientRect();
  modalCanvas.width = rect.width * devicePixelRatio;
  modalCanvas.height = rect.height * devicePixelRatio;
  const ctx = modalCanvas.getContext('2d');
  ctx.scale(devicePixelRatio, devicePixelRatio);

  if (cached.eliteSeries) {
    drawElitesOnCanvas(modalCanvas, cached.eliteSeries, cached.maxElites);
  } else {
    drawGraph(modalCanvas, cached.data1, cached.data2,
      { ...cached.opts, fontScale: 2 });
  }
  return true;
}

/**
 * Dessine un graphe avec 1 ou 2 courbes.
 * @param {HTMLCanvasElement} canvas
 * @param {number[]} data1 - courbe principale
 * @param {number[]} data2 - courbe secondaire (optionnelle)
 * @param {object} opts - { color1, color2, label1, label2, fontScale }
 */
export function drawGraph(canvas, data1, data2 = [], opts = {}) {
  if (!canvas || data1.length < 2) return;
  const ctx = canvas.getContext('2d');
  const rect = canvas.getBoundingClientRect();
  const W = rect.width || canvas.width;
  const H = rect.height || canvas.height;

  const {
    color1 = '#0f0', color2 = 'rgba(255,200,0,0.4)',
    label1 = '', label2 = '',
    fontScale = 1,
  } = opts;

  ctx.save();
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.restore();

  const allValues = [...data1, ...data2];
  const min = Math.min(...allValues, 0);
  const max = Math.max(...allValues, 1);
  const range = max - min || 1;
  const step = W / (data1.length - 1);
  const pad = 5 * fontScale;
  const lineW = 1.5 * fontScale;

  drawGrid(ctx, W, H);

  if (min < 0) {
    const zeroY = H - (-min / range) * (H - pad * 2) - pad;
    ctx.strokeStyle = 'rgba(255,255,255,0.15)';
    ctx.beginPath();
    ctx.moveTo(0, zeroY);
    ctx.lineTo(W, zeroY);
    ctx.stroke();
  }

  if (data2.length >= 2) {
    drawCurve(ctx, data2, min, range, step, W, H, color2, lineW * 0.7, pad);
  }
  drawCurve(ctx, data1, min, range, step, W, H, color1, lineW, pad);

  const fontSize = Math.round(9 * fontScale);
  ctx.font = `${fontSize}px monospace`;
  ctx.fillStyle = color1 + '88';
  ctx.fillText(`${label1} ${Math.round(data1[data1.length - 1])}`, 3 * fontScale, fontSize + 2);
  if (data2.length > 0) {
    ctx.fillStyle = color2;
    ctx.fillText(`${label2} ${Math.round(data2[data2.length - 1])}`, 3 * fontScale, (fontSize + 2) * 2);
  }
}

/** Dessine une courbe par élite pour suivre chaque "espèce". */
export function drawElitesGraph(canvas, history) {
  if (!canvas || history.length < 2) return;
  const maxElites = Math.max(...history.map(g => (g.eliteFitnesses || []).length));
  if (maxElites === 0) return;

  const allSeries = [];
  for (let e = 0; e < maxElites; e++) {
    allSeries.push(history.map(g => (g.eliteFitnesses || [])[e] ?? null));
  }
  graphDataCache['ai-graph-elites'] = { eliteSeries: allSeries, maxElites };

  drawElitesOnCanvas(canvas, allSeries, maxElites, { fontSize: 9, lineW: 1.5, pad: 5, labelCount: 2 });
}

/** Dessine les courbes élites sur un canvas (mini ou zoom). */
function drawElitesOnCanvas(canvas, allSeries, maxElites, opts = {}) {
  const { fontSize = 16, lineW = 2.5, pad = 10, labelCount = 5 } = opts;
  const ctx = canvas.getContext('2d');
  const rect = canvas.getBoundingClientRect();
  const W = rect.width || canvas.width;
  const H = rect.height || canvas.height;
  const len = allSeries[0].length;
  if (len < 2) return;

  ctx.save();
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.restore();

  let min = 0, max = 1;
  for (const s of allSeries) {
    for (const v of s) {
      if (v !== null) { min = Math.min(min, v); max = Math.max(max, v); }
    }
  }
  const range = max - min || 1;
  const step = W / (len - 1);

  drawGrid(ctx, W, H);

  for (let e = maxElites - 1; e >= 0; e--) {
    const color = ELITE_COLORS[e % ELITE_COLORS.length];
    ctx.beginPath();
    ctx.strokeStyle = color;
    ctx.globalAlpha = e === 0 ? 1 : 0.4;
    ctx.lineWidth = e === 0 ? lineW : lineW * 0.6;
    let started = false;
    for (let i = 0; i < len; i++) {
      const v = allSeries[e][i];
      if (v === null) { started = false; continue; }
      const x = i * step;
      const y = H - ((v - min) / range) * (H - pad * 2) - pad;
      if (!started) { ctx.moveTo(x, y); started = true; } else ctx.lineTo(x, y);
    }
    ctx.stroke();
  }
  ctx.globalAlpha = 1;

  ctx.font = `${fontSize}px monospace`;
  for (let e = 0; e < Math.min(maxElites, labelCount); e++) {
    ctx.fillStyle = ELITE_COLORS[e % ELITE_COLORS.length] + (e === 0 ? '' : '88');
    const last = allSeries[e][len - 1];
    ctx.fillText(`#${e + 1} ${last != null ? Math.round(last) : '?'}`, 3, fontSize + 2 + e * (fontSize + 2));
  }
}

function drawGrid(ctx, W, H) {
  ctx.strokeStyle = 'rgba(255,255,255,0.05)';
  ctx.lineWidth = 1;
  for (let y = 0; y < H; y += H / 3) {
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
  }
}

function drawCurve(ctx, data, min, range, step, W, H, color, width, pad = 5) {
  ctx.beginPath();
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  for (let i = 0; i < data.length; i++) {
    const x = i * step;
    const y = H - ((data[i] - min) / range) * (H - pad * 2) - pad;
    if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
  }
  ctx.stroke();
}
