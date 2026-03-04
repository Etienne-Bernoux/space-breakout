// Rendu des nœuds-astéroïdes (normal + boss).

import { seededRng, asteroidShape, tracePoly } from './utils.js';

/** Dessine un nœud astéroïde (normal ou boss). */
export function drawAsteroidNode(ctx, n, R, idx, unlocked, selected, s, t, isBoss = false) {
  const pts = asteroidShape(idx * 7 + 137, R, isBoss ? 12 : 10);
  const rotation = t * (isBoss ? 0.08 : 0.15) + idx * 0.7;

  ctx.save();
  ctx.translate(n.x, n.y);

  // Boss : aura menaçante permanente (rouge-violet pulsante)
  if (isBoss && unlocked) {
    const pulseB = 0.15 + Math.sin(t * 2) * 0.08;
    const auraR = R * 3;
    const aura = ctx.createRadialGradient(0, 0, R * 0.5, 0, 0, auraR);
    aura.addColorStop(0, `rgba(180, 40, 80, ${pulseB})`);
    aura.addColorStop(0.5, `rgba(100, 20, 60, ${pulseB * 0.4})`);
    aura.addColorStop(1, 'rgba(60, 10, 40, 0)');
    ctx.fillStyle = aura;
    ctx.beginPath();
    ctx.arc(0, 0, auraR, 0, Math.PI * 2);
    ctx.fill();
  }

  // Glow derrière le nœud sélectionné
  if (selected && unlocked) {
    const glowR = R * 2.5;
    const pulse = 0.22 + Math.sin(t * 3) * 0.08;
    const glowCol = isBoss ? `rgba(255, 60, 100, ${pulse})` : `rgba(0, 212, 255, ${pulse})`;
    const glow = ctx.createRadialGradient(0, 0, R * 0.4, 0, 0, glowR);
    glow.addColorStop(0, glowCol);
    glow.addColorStop(1, isBoss ? 'rgba(255, 60, 100, 0)' : 'rgba(0, 212, 255, 0)');
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(0, 0, glowR, 0, Math.PI * 2);
    ctx.fill();
  }

  // Rotation lente
  ctx.rotate(rotation);

  // Corps de l'astéroïde
  tracePoly(ctx, pts, 0, 0);
  if (!unlocked) {
    ctx.fillStyle = isBoss ? 'rgba(50, 20, 30, 0.7)' : 'rgba(40, 40, 50, 0.7)';
    ctx.strokeStyle = isBoss ? '#442' : '#333';
  } else if (isBoss) {
    const grad = ctx.createRadialGradient(-R * 0.3, -R * 0.3, 0, 0, 0, R);
    grad.addColorStop(0, 'rgba(100, 200, 80, 0.7)');
    grad.addColorStop(0.4, 'rgba(60, 120, 50, 0.6)');
    grad.addColorStop(0.8, 'rgba(80, 40, 100, 0.5)');
    grad.addColorStop(1, 'rgba(40, 20, 60, 0.4)');
    ctx.fillStyle = grad;
    ctx.strokeStyle = selected ? '#ff4466' : '#66cc44';
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
    ctx.shadowColor = isBoss ? '#ff4466' : '#00d4ff';
    ctx.shadowBlur = isBoss ? 14 : 10;
  }
  tracePoly(ctx, pts, 0, 0);
  ctx.lineWidth = selected ? 2.5 : 1.5;
  ctx.stroke();
  ctx.shadowBlur = 0;

  // Boss : veines organiques pulsantes
  if (isBoss && unlocked) {
    const veinAlpha = 0.2 + Math.sin(t * 2.5) * 0.1;
    const rng = seededRng(idx * 17 + 99);
    ctx.strokeStyle = `rgba(80, 255, 100, ${veinAlpha})`;
    ctx.lineWidth = 1.2;
    for (let v = 0; v < 4; v++) {
      const a1 = rng() * Math.PI * 2;
      const a2 = a1 + (rng() - 0.5) * 1.5;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.quadraticCurveTo(
        Math.cos(a1) * R * 0.5, Math.sin(a1) * R * 0.5,
        Math.cos(a2) * R * 0.8, Math.sin(a2) * R * 0.8,
      );
      ctx.stroke();
    }
  }

  // Cratères (2-3 par astéroïde, normaux uniquement)
  if (unlocked && !isBoss) {
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
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
      ctx.lineWidth = 0.8;
      ctx.beginPath();
      ctx.arc(cx, cy, cr, Math.PI * 0.8, Math.PI * 1.6);
      ctx.stroke();
    }
  }

  // Rim lighting
  tracePoly(ctx, pts, 0, 0);
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
  ctx.lineWidth = 1;
  ctx.stroke();

  ctx.restore();
}
