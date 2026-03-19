// --- Rendu des projectiles aliens ---

/** Dessine un projectile alien (boule d'énergie verte avec glow). */
export function drawProjectile(ctx, p) {
  if (!p.alive) return;
  const { x, y, radius, color, rotation } = p;

  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rotation);

  // Glow externe
  const glow = ctx.createRadialGradient(0, 0, radius * 0.3, 0, 0, radius * 3);
  glow.addColorStop(0, color + '60');
  glow.addColorStop(0.5, color + '20');
  glow.addColorStop(1, 'transparent');
  ctx.fillStyle = glow;
  ctx.fillRect(-radius * 3, -radius * 3, radius * 6, radius * 6);

  // Corps
  if (p.frostShot) {
    // Losange cristallin pour éclats de glace
    const r = radius * 1.2;
    ctx.beginPath();
    ctx.moveTo(0, -r * 1.4);
    ctx.lineTo(r, 0);
    ctx.lineTo(0, r * 1.4);
    ctx.lineTo(-r, 0);
    ctx.closePath();
    ctx.fillStyle = color;
    ctx.fill();
    ctx.strokeStyle = 'rgba(220,240,255,0.6)';
    ctx.lineWidth = 0.8;
    ctx.stroke();
  } else {
    ctx.beginPath();
    ctx.arc(0, 0, radius, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();
  }

  // Reflet central
  const hl = ctx.createRadialGradient(-radius * 0.2, -radius * 0.3, 0, 0, 0, radius);
  hl.addColorStop(0, 'rgba(255,255,255,0.6)');
  hl.addColorStop(0.4, 'rgba(255,255,255,0.1)');
  hl.addColorStop(1, 'transparent');
  ctx.fillStyle = hl;
  ctx.beginPath();
  ctx.arc(0, 0, radius, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}
