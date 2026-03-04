// Façade world-map — même API publique que l'ancien fichier monolithique.
// Exports : getNodePositions, drawWorldMap.

import { gameScale } from '../../../shared/responsive.js';
import { drawNebula, drawDustTrail, drawDebris, drawStars, drawMiniShip } from './draw-effects.js';
import { drawAsteroidNode } from './draw-nodes.js';

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

/** Dessine la carte du monde. */
export function drawWorldMap(ctx, W, H, levels, progress, selectedIndex, animPhase) {
  ctx.save();
  const s = gameScale(W);
  const nodes = getNodePositions(W, H, levels.length);
  const t = Date.now() * 0.001;

  // Titre avec glow doré
  ctx.shadowColor = '#8b6914';
  ctx.shadowBlur = 10 + Math.sin(t * 1.5) * 4;
  ctx.fillStyle = '#8b6914';
  ctx.font = `bold ${Math.round(22 * s)}px monospace`;
  ctx.textAlign = 'center';
  ctx.fillText('NUAGE D\'ASTÉROÏDES', W / 2, H * 0.08);
  ctx.shadowBlur = 0;

  // Couches de fond
  drawNebula(ctx, nodes, s, t);
  drawDustTrail(ctx, nodes, s, t);
  drawDebris(ctx, nodes, W, H, s, t);

  // Nœuds-astéroïdes
  const nodeR = Math.round(18 * s);
  for (let i = 0; i < levels.length; i++) {
    const n = nodes[i];
    const lvl = levels[i];
    const unlocked = progress.isUnlocked(lvl.id);
    const stars = progress.getStars(lvl.id);
    const selected = i === selectedIndex;
    const isBoss = i === levels.length - 1;
    const R = isBoss ? Math.round(24 * s) : nodeR;

    drawAsteroidNode(ctx, n, R, i, unlocked, selected, s, t, isBoss);

    // Numéro ou icône boss
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    if (isBoss && unlocked) {
      ctx.fillStyle = '#ff4466';
      ctx.font = `bold ${Math.round(16 * s)}px monospace`;
      ctx.fillText('☠', n.x, n.y);
    } else {
      ctx.fillStyle = unlocked ? '#fff' : '#555';
      ctx.font = `bold ${Math.round(14 * s)}px monospace`;
      ctx.fillText(String(i + 1), n.x, n.y);
    }

    // Étoiles en dessous
    if (unlocked) drawStars(ctx, n.x, n.y + R + 10 * s, stars, s, t);

    // Nom du niveau (si sélectionné)
    if (selected && unlocked) {
      ctx.shadowColor = isBoss ? '#ff4466' : '#00d4ff';
      ctx.shadowBlur = 6;
      ctx.fillStyle = isBoss ? '#ff8899' : '#fff';
      ctx.font = `${Math.round(11 * s)}px monospace`;
      ctx.fillText(lvl.name, n.x, n.y - R - 14 * s);
      ctx.shadowBlur = 0;
    }
  }

  // Vaisseau sur le nœud sélectionné
  if (nodes[selectedIndex]) {
    const sn = nodes[selectedIndex];
    const selBoss = selectedIndex === levels.length - 1;
    const selR = selBoss ? Math.round(24 * s) : nodeR;
    const shipY = sn.y - selR - 26 * s + Math.sin(animPhase * 0.05) * 3;
    drawMiniShip(ctx, sn.x, shipY, s);
  }

  // Instructions
  const instrA = 0.3 + Math.sin(t * 2) * 0.08;
  ctx.fillStyle = `rgba(255,255,255,${instrA})`;
  ctx.font = `${Math.round(11 * s)}px monospace`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  ctx.fillText('← → pour naviguer  •  ESPACE pour jouer', W / 2, H * 0.94);
  ctx.restore();
}
