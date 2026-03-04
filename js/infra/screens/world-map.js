// Rendu canvas de la carte du monde — style Mario World.
// Chemin sinueux avec nœuds (niveaux), étoiles, vaisseau sur le nœud sélectionné.

import { gameScale } from '../../shared/responsive.js';

/** Calcule les positions des nœuds en zigzag. */
export function getNodePositions(W, H, count) {
  const nodes = [];
  const marginX = W * 0.12;
  const marginTop = H * 0.18;
  const marginBot = H * 0.78;
  for (let i = 0; i < count; i++) {
    const t = count > 1 ? i / (count - 1) : 0.5;
    const x = marginX + t * (W - 2 * marginX);
    // Zigzag vertical
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

  // --- Titre avec glow ---
  ctx.shadowColor = '#8b6914';
  ctx.shadowBlur = 10 + Math.sin(t * 1.5) * 4;
  ctx.fillStyle = '#8b6914';
  ctx.font = `bold ${Math.round(22 * s)}px monospace`;
  ctx.textAlign = 'center';
  ctx.fillText('NUAGE D\'ASTÉROÏDES', W / 2, H * 0.08);
  ctx.shadowBlur = 0;

  // --- Chemin entre les nœuds (shimmer animé) ---
  const shimmerOff = t * 40;
  ctx.strokeStyle = 'rgba(255,255,255,0.12)';
  ctx.lineWidth = 2;
  ctx.setLineDash([6, 6]);
  ctx.lineDashOffset = -shimmerOff;
  ctx.beginPath();
  for (let i = 0; i < nodes.length; i++) {
    i === 0 ? ctx.moveTo(nodes[i].x, nodes[i].y) : ctx.lineTo(nodes[i].x, nodes[i].y);
  }
  ctx.stroke();
  // Deuxième passe décalée (shimmer)
  ctx.strokeStyle = 'rgba(255,255,255,0.06)';
  ctx.lineDashOffset = -shimmerOff + 3;
  ctx.stroke();
  ctx.setLineDash([]);

  // --- Nœuds ---
  const nodeR = Math.round(18 * s);
  for (let i = 0; i < levels.length; i++) {
    const n = nodes[i];
    const lvl = levels[i];
    const unlocked = progress.isUnlocked(lvl.id);
    const stars = progress.getStars(lvl.id);
    const selected = i === selectedIndex;

    // Glow derrière le nœud sélectionné
    if (selected && unlocked) {
      const glowR = nodeR * 2.2;
      const pulse = 0.2 + Math.sin(t * 3) * 0.08;
      const nGlow = ctx.createRadialGradient(n.x, n.y, nodeR * 0.5, n.x, n.y, glowR);
      nGlow.addColorStop(0, `rgba(0, 212, 255, ${pulse})`);
      nGlow.addColorStop(1, 'rgba(0, 212, 255, 0)');
      ctx.fillStyle = nGlow;
      ctx.beginPath();
      ctx.arc(n.x, n.y, glowR, 0, Math.PI * 2);
      ctx.fill();
    }

    // Cercle du nœud avec gradient
    ctx.beginPath();
    ctx.arc(n.x, n.y, nodeR, 0, Math.PI * 2);
    if (!unlocked) {
      ctx.fillStyle = 'rgba(60,60,70,0.5)';
      ctx.strokeStyle = '#444';
    } else if (selected) {
      const selGrad = ctx.createRadialGradient(n.x - nodeR * 0.3, n.y - nodeR * 0.3, 0, n.x, n.y, nodeR);
      selGrad.addColorStop(0, 'rgba(80, 240, 255, 0.4)');
      selGrad.addColorStop(1, 'rgba(0, 150, 200, 0.2)');
      ctx.fillStyle = selGrad;
      ctx.strokeStyle = '#00d4ff';
    } else {
      const nGrad = ctx.createRadialGradient(n.x - nodeR * 0.3, n.y - nodeR * 0.3, 0, n.x, n.y, nodeR);
      nGrad.addColorStop(0, 'rgba(180, 150, 60, 0.35)');
      nGrad.addColorStop(1, 'rgba(100, 80, 20, 0.2)');
      ctx.fillStyle = nGrad;
      ctx.strokeStyle = '#8b6914';
    }
    ctx.fill();
    if (selected) { ctx.shadowColor = '#00d4ff'; ctx.shadowBlur = 8; }
    ctx.lineWidth = selected ? 3 : 2;
    ctx.stroke();
    ctx.shadowBlur = 0;

    // Numéro du niveau
    ctx.fillStyle = unlocked ? '#fff' : '#555';
    ctx.font = `bold ${Math.round(14 * s)}px monospace`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(String(i + 1), n.x, n.y);

    // Étoiles en dessous (gagnées avec glow doré)
    if (unlocked) {
      _drawStars(ctx, n.x, n.y + nodeR + 8 * s, stars, s, t);
    }

    // Nom du niveau au-dessus (si sélectionné)
    if (selected && unlocked) {
      ctx.shadowColor = '#00d4ff';
      ctx.shadowBlur = 6;
      ctx.fillStyle = '#fff';
      ctx.font = `${Math.round(11 * s)}px monospace`;
      ctx.fillText(lvl.name, n.x, n.y - nodeR - 10 * s);
      ctx.shadowBlur = 0;
    }
  }

  // --- Vaisseau sur le nœud sélectionné ---
  if (nodes[selectedIndex]) {
    const sn = nodes[selectedIndex];
    const shipY = sn.y - nodeR - 22 * s + Math.sin(animPhase * 0.05) * 3;
    _drawMiniShip(ctx, sn.x, shipY, s);
  }

  // --- Instructions (pulsation douce) ---
  const instrA = 0.3 + Math.sin(t * 2) * 0.08;
  ctx.fillStyle = `rgba(255,255,255,${instrA})`;
  ctx.font = `${Math.round(11 * s)}px monospace`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  ctx.fillText('← → pour naviguer  •  ESPACE pour jouer', W / 2, H * 0.94);
  ctx.restore();
}

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
