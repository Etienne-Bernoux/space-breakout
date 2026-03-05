// Façade system-map — carte du système planétaire.
// Vue de dessus : étoile centrale, orbites concentriques, astres-zones.

import { gameScale } from '../../../shared/responsive.js';
import { drawSystemNode, getNodeRadius } from './draw-nodes.js';

/** Calcule les positions des nœuds en orbites autour du centre. */
export function getSystemNodePositions(W, H, zones) {
  const cx = W / 2;
  const cy = H * 0.48;
  const maxRadius = Math.min(W, H) * 0.38;
  const minRadius = maxRadius * 0.25;
  const nodes = [];

  for (let i = 0; i < zones.length; i++) {
    const t = zones.length > 1 ? i / (zones.length - 1) : 0;
    const orbitR = minRadius + t * (maxRadius - minRadius);
    // Répartir les astres sur un arc (~270°) pour éviter le chevauchement avec le titre
    const startAngle = -Math.PI * 0.6;
    const endAngle = Math.PI * 0.75;
    const angle = startAngle + t * (endAngle - startAngle);
    nodes.push({
      x: cx + Math.cos(angle) * orbitR,
      y: cy + Math.sin(angle) * orbitR * 0.7, // aplatir pour effet perspective
      orbitR,
      angle,
    });
  }
  return nodes;
}

/** Dessine la carte du système planétaire.
 * @param {object} [unlockAnim] - { zoneId, frame } si animation de déverrouillage en cours
 */
export function drawSystemMap(ctx, W, H, zones, progress, selectedIndex, animPhase, unlockAnim) {
  ctx.save();
  const s = gameScale(W);
  const t = Date.now() * 0.001;
  const nodes = getSystemNodePositions(W, H, zones);
  const cx = W / 2;
  const cy = H * 0.48;

  // --- Titre ---
  ctx.shadowColor = '#4488ff';
  ctx.shadowBlur = 8 + Math.sin(t * 1.5) * 3;
  ctx.fillStyle = '#6699cc';
  ctx.font = `bold ${Math.round(20 * s)}px monospace`;
  ctx.textAlign = 'center';
  ctx.fillText('SYSTÈME PLANÉTAIRE', cx, H * 0.06);
  ctx.shadowBlur = 0;

  // --- Étoile centrale ---
  drawStar(ctx, cx, cy, s, t);

  // --- Orbites ---
  ctx.strokeStyle = 'rgba(100, 150, 255, 0.12)';
  ctx.lineWidth = 1;
  for (const node of nodes) {
    ctx.beginPath();
    ctx.ellipse(cx, cy, node.orbitR, node.orbitR * 0.7, 0, 0, Math.PI * 2);
    ctx.stroke();
  }

  // --- Chemins entre zones débloquées ---
  for (let i = 0; i < zones.length - 1; i++) {
    const unlocked = progress.isZoneUnlocked(zones[i].id);
    const nextUnlocked = progress.isZoneUnlocked(zones[i + 1].id);
    const a = nodes[i], b = nodes[i + 1];

    if (unlocked && nextUnlocked) {
      // Trait d'énergie
      const grad = ctx.createLinearGradient(a.x, a.y, b.x, b.y);
      grad.addColorStop(0, zones[i].accent);
      grad.addColorStop(1, zones[i + 1].accent);
      ctx.strokeStyle = grad;
      ctx.lineWidth = 2;
      ctx.globalAlpha = 0.4 + Math.sin(t * 2 + i) * 0.1;
      ctx.beginPath();
      ctx.moveTo(a.x, a.y);
      ctx.lineTo(b.x, b.y);
      ctx.stroke();
      ctx.globalAlpha = 1;
    } else if (unlocked) {
      // Pointillés vers la prochaine zone locked
      ctx.strokeStyle = 'rgba(255,255,255,0.15)';
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 6]);
      ctx.beginPath();
      ctx.moveTo(a.x, a.y);
      ctx.lineTo(b.x, b.y);
      ctx.stroke();
      ctx.setLineDash([]);
    }
  }

  // --- Nœuds (astres) ---
  for (let i = 0; i < zones.length; i++) {
    const zone = zones[i];
    const unlocked = progress.isZoneUnlocked(zone.id);
    const selected = i === selectedIndex;
    drawSystemNode(ctx, nodes[i], zone, unlocked, selected, s, t);
  }

  // --- Animation de déverrouillage ---
  if (unlockAnim) {
    const ui = unlockAnim;
    const zi = zones.findIndex(z => z.id === ui.zoneId);
    if (zi >= 0) {
      const node = nodes[zi];
      const R = getNodeRadius(zones[zi].type, s);
      const progress01 = Math.min(ui.frame / 90, 1); // 90 frames (~1.5s)
      const ease = 1 - Math.pow(1 - progress01, 3); // ease-out cubic

      // Flash expansif
      if (progress01 < 0.6) {
        const flashR = R * (1 + ease * 4);
        const flashAlpha = 0.6 * (1 - progress01 / 0.6);
        ctx.beginPath();
        ctx.arc(node.x, node.y, flashR, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 255, 200, ${flashAlpha})`;
        ctx.fill();
      }

      // Glow accent qui pulse
      const glowR = R * (1.5 + Math.sin(ui.frame * 0.15) * 0.3) * ease;
      const glowGrad = ctx.createRadialGradient(node.x, node.y, R * 0.5, node.x, node.y, glowR);
      glowGrad.addColorStop(0, zones[zi].accent + 'aa');
      glowGrad.addColorStop(1, zones[zi].accent + '00');
      ctx.fillStyle = glowGrad;
      ctx.beginPath();
      ctx.arc(node.x, node.y, glowR, 0, Math.PI * 2);
      ctx.fill();

      // Chemin qui s'illumine (depuis la zone précédente)
      if (zi > 0 && ease > 0.3) {
        const prev = nodes[zi - 1];
        const pathAlpha = Math.min((ease - 0.3) / 0.7, 1) * 0.8;
        const grad = ctx.createLinearGradient(prev.x, prev.y, node.x, node.y);
        grad.addColorStop(0, zones[zi - 1].accent);
        grad.addColorStop(1, zones[zi].accent);
        ctx.strokeStyle = grad;
        ctx.lineWidth = 3;
        ctx.globalAlpha = pathAlpha;
        ctx.beginPath();
        ctx.moveTo(prev.x, prev.y);
        ctx.lineTo(node.x, node.y);
        ctx.stroke();
        ctx.globalAlpha = 1;
      }
    }
  }

  // --- Nom de la zone sélectionnée ---
  const selZone = zones[selectedIndex];
  const selNode = nodes[selectedIndex];
  if (selZone && selNode) {
    const unlocked = progress.isZoneUnlocked(selZone.id);
    const R = getNodeRadius(selZone.type, s);

    // Nom
    ctx.fillStyle = unlocked ? '#fff' : '#666';
    ctx.font = `bold ${Math.round(13 * s)}px monospace`;
    ctx.textAlign = 'center';
    ctx.shadowColor = unlocked ? selZone.accent : '#000';
    ctx.shadowBlur = unlocked ? 6 : 0;
    ctx.fillText(selZone.name.toUpperCase(), selNode.x, selNode.y + R + 18 * s);
    ctx.shadowBlur = 0;

    // Description
    if (unlocked) {
      ctx.fillStyle = 'rgba(255,255,255,0.5)';
      ctx.font = `${Math.round(10 * s)}px monospace`;
      ctx.fillText(selZone.description, selNode.x, selNode.y + R + 32 * s);
    } else {
      ctx.fillStyle = 'rgba(255,255,255,0.3)';
      ctx.font = `${Math.round(10 * s)}px monospace`;
      ctx.fillText('Zone verrouillée', selNode.x, selNode.y + R + 32 * s);
    }

    // Mini-vaisseau au-dessus si débloqué
    if (unlocked) {
      const shipY = selNode.y - R - 20 * s + Math.sin(animPhase * 0.05) * 3;
      drawMiniShip(ctx, selNode.x, shipY, s);
    }
  }

  // --- Instructions ---
  const instrA = 0.3 + Math.sin(t * 2) * 0.08;
  ctx.fillStyle = `rgba(255,255,255,${instrA})`;
  ctx.font = `${Math.round(11 * s)}px monospace`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  ctx.fillText('← → pour naviguer  •  ESPACE pour entrer  •  ÉCHAP pour le menu', cx, H * 0.94);

  ctx.restore();
}

// --- Helpers privés ---

function drawStar(ctx, cx, cy, s, t) {
  const R = 18 * s;
  // Glow externe
  const glow = ctx.createRadialGradient(cx, cy, 0, cx, cy, R * 3);
  glow.addColorStop(0, 'rgba(255, 220, 100, 0.3)');
  glow.addColorStop(0.5, 'rgba(255, 180, 50, 0.08)');
  glow.addColorStop(1, 'rgba(255, 150, 0, 0)');
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.arc(cx, cy, R * 3, 0, Math.PI * 2);
  ctx.fill();

  // Corps de l'étoile
  const body = ctx.createRadialGradient(cx, cy, 0, cx, cy, R);
  body.addColorStop(0, '#ffffcc');
  body.addColorStop(0.4, '#ffdd66');
  body.addColorStop(1, '#ff9900');
  ctx.fillStyle = body;
  ctx.beginPath();
  ctx.arc(cx, cy, R * (1 + Math.sin(t * 2) * 0.05), 0, Math.PI * 2);
  ctx.fill();
}

function drawMiniShip(ctx, x, y, s) {
  const sz = 8 * s;
  ctx.fillStyle = '#00d4ff';
  ctx.beginPath();
  ctx.moveTo(x, y - sz);
  ctx.lineTo(x - sz * 0.6, y + sz * 0.4);
  ctx.lineTo(x + sz * 0.6, y + sz * 0.4);
  ctx.closePath();
  ctx.fill();
  // Flamme
  ctx.fillStyle = '#ff8800';
  ctx.beginPath();
  ctx.moveTo(x - sz * 0.3, y + sz * 0.4);
  ctx.lineTo(x, y + sz * 0.9);
  ctx.lineTo(x + sz * 0.3, y + sz * 0.4);
  ctx.closePath();
  ctx.fill();
}
