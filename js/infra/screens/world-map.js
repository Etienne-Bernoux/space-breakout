// Rendu canvas de la carte du monde — thème « barrière d'astéroïdes ».
// Nœuds = astéroïdes irréguliers, chemin = traînée de poussière / nébuleuse,
// débris flottants entre les nœuds, vaisseau sur le nœud sélectionné.

import { gameScale } from '../../shared/responsive.js';

// --- Seed RNG pour formes déterministes par nœud ---
function seededRng(seed) {
  let s = seed;
  return () => { s = (s * 16807 + 0) % 2147483647; return (s & 0x7fffffff) / 0x7fffffff; };
}

/** Génère un polygone irrégulier (forme d'astéroïde) autour de (0,0). */
function asteroidShape(seed, r, points = 8) {
  const rng = seededRng(seed);
  const pts = [];
  for (let i = 0; i < points; i++) {
    const angle = (i / points) * Math.PI * 2;
    const jitter = 0.7 + rng() * 0.5; // rayon entre 70% et 120%
    pts.push({ x: Math.cos(angle) * r * jitter, y: Math.sin(angle) * r * jitter });
  }
  return pts;
}

/** Trace un polygone fermé. */
function tracePoly(ctx, pts, ox, oy) {
  ctx.beginPath();
  ctx.moveTo(ox + pts[0].x, oy + pts[0].y);
  for (let i = 1; i < pts.length; i++) ctx.lineTo(ox + pts[i].x, oy + pts[i].y);
  ctx.closePath();
}

/** Calcule les positions des nœuds en zigzag. */
export function getNodePositions(W, H, count) {
  const nodes = [];
  const marginX = W * 0.12;
  const marginTop = H * 0.18;
  const marginBot = H * 0.78;
  for (let i = 0; i < count; i++) {
    const t = count > 1 ? i / (count - 1) : 0.5;
    const x = marginX + t * (W - 2 * marginX);
    const y = i % 2 === 0
      ? marginTop + (marginBot - marginTop) * 0.3
      : marginTop + (marginBot - marginTop) * 0.7;
    nodes.push({ x, y });
  }
  return nodes;
}

/** Dessine la carte. */
export function drawWorldMap(ctx, W, H, levels, progress, selectedIndex, animPhase) {
  ctx.save();
  const s = gameScale(W);
  const nodes = getNodePositions(W, H, levels.length);
  const t = Date.now() * 0.001;

  // --- Titre avec glow doré ---
  ctx.shadowColor = '#8b6914';
  ctx.shadowBlur = 10 + Math.sin(t * 1.5) * 4;
  ctx.fillStyle = '#8b6914';
  ctx.font = `bold ${Math.round(22 * s)}px monospace`;
  ctx.textAlign = 'center';
  ctx.fillText('NUAGE D\'ASTÉROÏDES', W / 2, H * 0.08);
  ctx.shadowBlur = 0;

  // --- Nébuleuse de fond entre les nœuds ---
  _drawNebula(ctx, nodes, s, t);

  // --- Chemin de poussière entre nœuds ---
  _drawDustTrail(ctx, nodes, s, t);

  // --- Débris flottants (petits cailloux) ---
  _drawDebris(ctx, nodes, W, H, s, t);

  // --- Nœuds-astéroïdes ---
  const nodeR = Math.round(18 * s);
  for (let i = 0; i < levels.length; i++) {
    const n = nodes[i];
    const lvl = levels[i];
    const unlocked = progress.isUnlocked(lvl.id);
    const stars = progress.getStars(lvl.id);
    const selected = i === selectedIndex;

    _drawAsteroidNode(ctx, n, nodeR, i, unlocked, selected, s, t);

    // Numéro du niveau
    ctx.fillStyle = unlocked ? '#fff' : '#555';
    ctx.font = `bold ${Math.round(14 * s)}px monospace`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(String(i + 1), n.x, n.y);

    // Étoiles en dessous
    if (unlocked) _drawStars(ctx, n.x, n.y + nodeR + 10 * s, stars, s, t);

    // Nom du niveau (si sélectionné)
    if (selected && unlocked) {
      ctx.shadowColor = '#00d4ff';
      ctx.shadowBlur = 6;
      ctx.fillStyle = '#fff';
      ctx.font = `${Math.round(11 * s)}px monospace`;
      ctx.fillText(lvl.name, n.x, n.y - nodeR - 14 * s);
      ctx.shadowBlur = 0;
    }
  }

  // --- Vaisseau sur le nœud sélectionné ---
  if (nodes[selectedIndex]) {
    const sn = nodes[selectedIndex];
    const shipY = sn.y - nodeR - 26 * s + Math.sin(animPhase * 0.05) * 3;
    _drawMiniShip(ctx, sn.x, shipY, s);
  }

  // --- Instructions ---
  const instrA = 0.3 + Math.sin(t * 2) * 0.08;
  ctx.fillStyle = `rgba(255,255,255,${instrA})`;
  ctx.font = `${Math.round(11 * s)}px monospace`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  ctx.fillText('← → pour naviguer  •  ESPACE pour jouer', W / 2, H * 0.94);
  ctx.restore();
}

// ---------- Nébuleuse entre nœuds ----------

function _drawNebula(ctx, nodes, s, t) {
  for (let i = 0; i < nodes.length - 1; i++) {
    const a = nodes[i], b = nodes[i + 1];
    const mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2;
    const dist = Math.hypot(b.x - a.x, b.y - a.y);
    const r = dist * 0.35;
    const pulse = 0.04 + Math.sin(t * 0.8 + i * 1.7) * 0.015;
    const grad = ctx.createRadialGradient(mx, my, 0, mx, my, r);
    grad.addColorStop(0, `rgba(60, 30, 100, ${pulse})`);
    grad.addColorStop(0.5, `rgba(30, 50, 120, ${pulse * 0.6})`);
    grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(mx, my, r, 0, Math.PI * 2);
    ctx.fill();
  }
}

// ---------- Chemin de poussière ----------

function _drawDustTrail(ctx, nodes, s, t) {
  if (nodes.length < 2) return;
  const shimmer = t * 30;

  // Courbe épaisse semi-transparente (poussière)
  ctx.save();
  ctx.lineWidth = 8 * s;
  ctx.strokeStyle = 'rgba(139, 105, 20, 0.06)';
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.beginPath();
  ctx.moveTo(nodes[0].x, nodes[0].y);
  for (let i = 1; i < nodes.length; i++) {
    const prev = nodes[i - 1], cur = nodes[i];
    const cpx = (prev.x + cur.x) / 2, cpy = (prev.y + cur.y) / 2;
    ctx.quadraticCurveTo(prev.x, prev.y, cpx, cpy);
  }
  ctx.lineTo(nodes[nodes.length - 1].x, nodes[nodes.length - 1].y);
  ctx.stroke();

  // Shimmer animé (dashed)
  ctx.lineWidth = 1.5 * s;
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
  ctx.setLineDash([4, 8]);
  ctx.lineDashOffset = -shimmer;
  ctx.stroke();
  ctx.strokeStyle = 'rgba(139, 105, 20, 0.12)';
  ctx.lineDashOffset = -shimmer + 6;
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.restore();
}

// ---------- Débris flottants ----------

function _drawDebris(ctx, nodes, W, H, s, t) {
  const rng = seededRng(42);
  const count = Math.min(nodes.length * 4, 24);
  for (let i = 0; i < count; i++) {
    // Position autour du chemin
    const segIdx = Math.floor(rng() * Math.max(1, nodes.length - 1));
    const seg = rng();
    const a = nodes[segIdx], b = nodes[Math.min(segIdx + 1, nodes.length - 1)];
    const bx = a.x + (b.x - a.x) * seg + (rng() - 0.5) * 80 * s;
    const by = a.y + (b.y - a.y) * seg + (rng() - 0.5) * 60 * s;
    const dr = 2 + rng() * 4;
    const drift = Math.sin(t * (0.5 + rng() * 0.5) + i * 2.1) * 2;
    const alpha = 0.15 + rng() * 0.15;

    ctx.fillStyle = `rgba(120, 100, 70, ${alpha})`;
    ctx.beginPath();
    ctx.arc(bx + drift, by + drift * 0.5, dr * s, 0, Math.PI * 2);
    ctx.fill();
  }
}

// ---------- Nœud astéroïde ----------

function _drawAsteroidNode(ctx, n, R, idx, unlocked, selected, s, t) {
  const pts = asteroidShape(idx * 7 + 137, R, 10);
  const rotation = t * 0.15 + idx * 0.7;

  ctx.save();
  ctx.translate(n.x, n.y);

  // Glow derrière le nœud sélectionné
  if (selected && unlocked) {
    const glowR = R * 2.5;
    const pulse = 0.22 + Math.sin(t * 3) * 0.08;
    const glow = ctx.createRadialGradient(0, 0, R * 0.4, 0, 0, glowR);
    glow.addColorStop(0, `rgba(0, 212, 255, ${pulse})`);
    glow.addColorStop(1, 'rgba(0, 212, 255, 0)');
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(0, 0, glowR, 0, Math.PI * 2);
    ctx.fill();
  }

  // Rotation lente du nœud
  ctx.rotate(rotation);

  // Corps de l'astéroïde
  tracePoly(ctx, pts, 0, 0);
  if (!unlocked) {
    ctx.fillStyle = 'rgba(40, 40, 50, 0.7)';
    ctx.strokeStyle = '#333';
  } else if (selected) {
    const grad = ctx.createRadialGradient(-R * 0.3, -R * 0.3, 0, 0, 0, R);
    grad.addColorStop(0, 'rgba(180, 160, 100, 0.8)');
    grad.addColorStop(0.6, 'rgba(120, 100, 50, 0.6)');
    grad.addColorStop(1, 'rgba(80, 60, 30, 0.4)');
    ctx.fillStyle = grad;
    ctx.strokeStyle = '#00d4ff';
  } else {
    const grad = ctx.createRadialGradient(-R * 0.3, -R * 0.3, 0, 0, 0, R);
    grad.addColorStop(0, 'rgba(160, 140, 80, 0.6)');
    grad.addColorStop(0.6, 'rgba(100, 80, 40, 0.45)');
    grad.addColorStop(1, 'rgba(60, 50, 25, 0.3)');
    ctx.fillStyle = grad;
    ctx.strokeStyle = '#8b6914';
  }
  ctx.fill();

  // Bordure
  if (selected && unlocked) {
    ctx.shadowColor = '#00d4ff';
    ctx.shadowBlur = 10;
  }
  tracePoly(ctx, pts, 0, 0);
  ctx.lineWidth = selected ? 2.5 : 1.5;
  ctx.stroke();
  ctx.shadowBlur = 0;

  // Cratères (2-3 par astéroïde)
  if (unlocked) {
    const rng = seededRng(idx * 13 + 53);
    const craterCount = 2 + Math.floor(rng() * 2);
    for (let c = 0; c < craterCount; c++) {
      const angle = rng() * Math.PI * 2;
      const dist = R * (0.2 + rng() * 0.35);
      const cr = R * (0.1 + rng() * 0.1);
      const cx = Math.cos(angle) * dist;
      const cy = Math.sin(angle) * dist;
      ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
      ctx.beginPath();
      ctx.arc(cx, cy, cr, 0, Math.PI * 2);
      ctx.fill();
      // Rim clair en haut du cratère
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
      ctx.lineWidth = 0.8;
      ctx.beginPath();
      ctx.arc(cx, cy, cr, Math.PI * 0.8, Math.PI * 1.6);
      ctx.stroke();
    }
  }

  // Rim lighting (highlight en haut-gauche)
  tracePoly(ctx, pts, 0, 0);
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
  ctx.lineWidth = 1;
  ctx.stroke();

  ctx.restore();
}

// ---------- Étoiles ----------

function _drawStars(ctx, cx, cy, count, s, t) {
  const gap = 12 * s;
  const startX = cx - (2 * gap) / 2;
  for (let i = 0; i < 3; i++) {
    const earned = i < count;
    if (earned) {
      ctx.shadowColor = '#ffd700';
      ctx.shadowBlur = 4 + Math.sin(t * 3 + i * 1.2) * 2;
    }
    ctx.fillStyle = earned ? '#ffd700' : 'rgba(255,255,255,0.12)';
    ctx.font = `${Math.round(10 * s)}px monospace`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('★', startX + i * gap, cy);
    ctx.shadowBlur = 0;
  }
}

// ---------- Mini vaisseau ----------

function _drawMiniShip(ctx, x, y, s) {
  const w = 16 * s;
  const h = 6 * s;

  // Halo sous le vaisseau
  const halo = ctx.createRadialGradient(x, y + 2, 0, x, y + 2, w * 0.6);
  halo.addColorStop(0, 'rgba(0, 212, 255, 0.15)');
  halo.addColorStop(1, 'rgba(0, 212, 255, 0)');
  ctx.fillStyle = halo;
  ctx.beginPath();
  ctx.arc(x, y + 2, w * 0.6, 0, Math.PI * 2);
  ctx.fill();

  // Corps gradient
  const shipGrad = ctx.createLinearGradient(x, y - h, x, y);
  shipGrad.addColorStop(0, '#55eeff');
  shipGrad.addColorStop(0.5, '#00d4ff');
  shipGrad.addColorStop(1, '#0088aa');
  ctx.fillStyle = shipGrad;
  ctx.beginPath();
  ctx.moveTo(x, y - h);
  ctx.lineTo(x + w / 2, y);
  ctx.lineTo(x - w / 2, y);
  ctx.closePath();
  ctx.fill();

  // Micro-flamme
  const flameH = 3 * s + Math.random() * 2 * s;
  const fGrad = ctx.createLinearGradient(x, y, x, y + flameH);
  fGrad.addColorStop(0, 'rgba(255, 200, 80, 0.7)');
  fGrad.addColorStop(0.5, 'rgba(255, 100, 0, 0.4)');
  fGrad.addColorStop(1, 'rgba(255, 50, 0, 0)');
  ctx.fillStyle = fGrad;
  ctx.beginPath();
  ctx.moveTo(x - 2 * s, y);
  ctx.lineTo(x + 2 * s, y);
  ctx.lineTo(x, y + flameH);
  ctx.closePath();
  ctx.fill();
}
