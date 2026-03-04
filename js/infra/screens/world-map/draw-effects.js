// Effets visuels de la carte : nébuleuse, poussière, débris, étoiles, mini-vaisseau.

import { seededRng } from './utils.js';

/** Halos de nébuleuse violette entre les nœuds. */
export function drawNebula(ctx, nodes, s, t) {
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

/** Chemins segment par segment : discret si locked, flux d'énergie si unlocked. */
export function drawPaths(ctx, nodes, levels, progress, s, t) {
  if (nodes.length < 2) return;
  ctx.save();
  ctx.lineCap = 'round';

  for (let i = 0; i < nodes.length - 1; i++) {
    const a = nodes[i], b = nodes[i + 1];
    // Un segment est « unlocked » si les DEUX nœuds qu'il relie sont débloqués
    const segUnlocked = progress.isUnlocked(levels[i].id) && progress.isUnlocked(levels[i + 1].id);

    if (segUnlocked) {
      _drawEnergyFlow(ctx, a, b, i, s, t);
    } else {
      _drawLockedPath(ctx, a, b, s, t);
    }
  }
  ctx.restore();
}

/** Segment verrouillé : ligne discrète, pointillés sombres. */
function _drawLockedPath(ctx, a, b, s, t) {
  const shimmer = t * 20;
  // Trait fin semi-transparent
  ctx.beginPath();
  ctx.moveTo(a.x, a.y);
  ctx.lineTo(b.x, b.y);
  ctx.strokeStyle = 'rgba(80, 70, 50, 0.12)';
  ctx.lineWidth = 3 * s;
  ctx.setLineDash([]);
  ctx.stroke();
  // Pointillés
  ctx.strokeStyle = 'rgba(100, 90, 60, 0.15)';
  ctx.lineWidth = 1 * s;
  ctx.setLineDash([4, 10]);
  ctx.lineDashOffset = -shimmer;
  ctx.stroke();
  ctx.setLineDash([]);
}

/** Segment débloqué : flux d'énergie cyan/doré animé. */
function _drawEnergyFlow(ctx, a, b, segIdx, s, t) {
  const dx = b.x - a.x, dy = b.y - a.y;
  const dist = Math.hypot(dx, dy);

  // Glow de fond du segment (trait large semi-transparent)
  ctx.beginPath();
  ctx.moveTo(a.x, a.y);
  ctx.lineTo(b.x, b.y);
  ctx.strokeStyle = 'rgba(0, 180, 220, 0.07)';
  ctx.lineWidth = 10 * s;
  ctx.setLineDash([]);
  ctx.stroke();

  // Trait central plus lumineux
  ctx.beginPath();
  ctx.moveTo(a.x, a.y);
  ctx.lineTo(b.x, b.y);
  ctx.strokeStyle = 'rgba(0, 212, 255, 0.15)';
  ctx.lineWidth = 2.5 * s;
  ctx.stroke();

  // Particules d'énergie qui se déplacent de a → b
  const particleCount = Math.max(3, Math.round(dist / (30 * s)));
  const speed = t * 0.6 + segIdx * 0.3;
  for (let p = 0; p < particleCount; p++) {
    // Position le long du segment (0→1), animée
    const phase = ((p / particleCount) + speed) % 1;
    const px = a.x + dx * phase;
    const py = a.y + dy * phase;
    // Oscillation perpendiculaire (ondulation)
    const nx = -dy / dist, ny = dx / dist;
    const wave = Math.sin(phase * Math.PI * 4 + t * 3 + segIdx) * 3 * s;
    const fx = px + nx * wave;
    const fy = py + ny * wave;

    // Taille et opacité (fade in/out aux extrémités)
    const edgeFade = Math.min(phase * 4, (1 - phase) * 4, 1);
    const alpha = (0.4 + Math.sin(t * 5 + p * 1.7) * 0.15) * edgeFade;
    const r = (1.5 + Math.sin(t * 3 + p) * 0.5) * s;

    // Particule cyan avec halo
    const grad = ctx.createRadialGradient(fx, fy, 0, fx, fy, r * 2.5);
    grad.addColorStop(0, `rgba(100, 230, 255, ${alpha})`);
    grad.addColorStop(0.4, `rgba(0, 180, 230, ${alpha * 0.5})`);
    grad.addColorStop(1, 'rgba(0, 100, 180, 0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(fx, fy, r * 2.5, 0, Math.PI * 2);
    ctx.fill();

    // Point central brillant
    ctx.fillStyle = `rgba(200, 240, 255, ${alpha * 0.8})`;
    ctx.beginPath();
    ctx.arc(fx, fy, r * 0.6, 0, Math.PI * 2);
    ctx.fill();
  }
}

/** Débris flottants (petits cailloux le long du chemin). */
export function drawDebris(ctx, nodes, W, H, s, t) {
  const rng = seededRng(42);
  const count = Math.min(nodes.length * 4, 24);
  for (let i = 0; i < count; i++) {
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

/** Étoiles de notation (★) sous un nœud. */
export function drawStars(ctx, cx, cy, count, s, t) {
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

/** Mini vaisseau au-dessus du nœud sélectionné. */
export function drawMiniShip(ctx, x, y, s) {
  const w = 16 * s;
  const h = 6 * s;

  const halo = ctx.createRadialGradient(x, y + 2, 0, x, y + 2, w * 0.6);
  halo.addColorStop(0, 'rgba(0, 212, 255, 0.15)');
  halo.addColorStop(1, 'rgba(0, 212, 255, 0)');
  ctx.fillStyle = halo;
  ctx.beginPath();
  ctx.arc(x, y + 2, w * 0.6, 0, Math.PI * 2);
  ctx.fill();

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
