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

  // --- Titre ---
  ctx.fillStyle = '#8b6914';
  ctx.font = `bold ${Math.round(22 * s)}px monospace`;
  ctx.textAlign = 'center';
  ctx.fillText('NUAGE D\'ASTÉROÏDES', W / 2, H * 0.08);

  // --- Chemin entre les nœuds ---
  ctx.strokeStyle = 'rgba(255,255,255,0.15)';
  ctx.lineWidth = 2;
  ctx.setLineDash([6, 6]);
  ctx.beginPath();
  for (let i = 0; i < nodes.length; i++) {
    i === 0 ? ctx.moveTo(nodes[i].x, nodes[i].y) : ctx.lineTo(nodes[i].x, nodes[i].y);
  }
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

    // Cercle du nœud
    ctx.beginPath();
    ctx.arc(n.x, n.y, nodeR, 0, Math.PI * 2);
    if (!unlocked) {
      ctx.fillStyle = 'rgba(80,80,80,0.5)';
      ctx.strokeStyle = '#444';
    } else if (selected) {
      ctx.fillStyle = 'rgba(0,212,255,0.3)';
      ctx.strokeStyle = '#00d4ff';
    } else {
      ctx.fillStyle = 'rgba(139,105,20,0.3)';
      ctx.strokeStyle = '#8b6914';
    }
    ctx.fill();
    ctx.lineWidth = selected ? 3 : 2;
    ctx.stroke();

    // Numéro du niveau
    ctx.fillStyle = unlocked ? '#fff' : '#666';
    ctx.font = `bold ${Math.round(14 * s)}px monospace`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(String(i + 1), n.x, n.y);

    // Étoiles en dessous
    if (stars > 0) {
      _drawStars(ctx, n.x, n.y + nodeR + 8 * s, stars, s);
    }

    // Nom du niveau au-dessus (si sélectionné)
    if (selected && unlocked) {
      ctx.fillStyle = '#fff';
      ctx.font = `${Math.round(11 * s)}px monospace`;
      ctx.fillText(lvl.name, n.x, n.y - nodeR - 10 * s);
    }
  }

  // --- Vaisseau sur le nœud sélectionné ---
  if (nodes[selectedIndex]) {
    const sn = nodes[selectedIndex];
    const shipY = sn.y - nodeR - 22 * s + Math.sin(animPhase * 0.05) * 3;
    _drawMiniShip(ctx, sn.x, shipY, s);
  }

  // --- Instructions ---
  ctx.fillStyle = 'rgba(255,255,255,0.4)';
  ctx.font = `${Math.round(11 * s)}px monospace`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  ctx.fillText('← → pour naviguer  •  ESPACE pour jouer', W / 2, H * 0.94);
  ctx.restore();
}

function _drawStars(ctx, cx, cy, count, s) {
  const gap = 12 * s;
  const startX = cx - (2 * gap) / 2;
  for (let i = 0; i < 3; i++) {
    ctx.fillStyle = i < count ? '#ffd700' : 'rgba(255,255,255,0.15)';
    ctx.font = `${Math.round(10 * s)}px monospace`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('★', startX + i * gap, cy);
  }
}

function _drawMiniShip(ctx, x, y, s) {
  const w = 16 * s;
  const h = 6 * s;
  ctx.fillStyle = '#00d4ff';
  ctx.beginPath();
  ctx.moveTo(x, y - h);
  ctx.lineTo(x + w / 2, y);
  ctx.lineTo(x - w / 2, y);
  ctx.closePath();
  ctx.fill();
}
