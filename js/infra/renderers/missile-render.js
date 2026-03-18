// --- Rendu des missiles (projectiles joueur) ---

export function drawMissile(ctx, m) {
  if (!m.alive) return;
  const { x, y, radius, color } = m;
  const t = Date.now() * 0.001;

  // Traînée de flamme
  const trailLen = 12;
  const trailGrad = ctx.createLinearGradient(x, y, x, y + trailLen);
  trailGrad.addColorStop(0, color);
  trailGrad.addColorStop(1, 'transparent');
  ctx.fillStyle = trailGrad;
  ctx.fillRect(x - radius * 0.6, y, radius * 1.2, trailLen);

  // Corps du missile (triangle pointu)
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(x, y - radius * 2);
  ctx.lineTo(x - radius, y + radius);
  ctx.lineTo(x + radius, y + radius);
  ctx.closePath();
  ctx.fill();

  // Lueur
  const pulse = 0.4 + Math.sin(t * 12) * 0.2;
  const glow = ctx.createRadialGradient(x, y, 0, x, y, radius * 3);
  glow.addColorStop(0, `rgba(255, 100, 80, ${pulse})`);
  glow.addColorStop(1, 'transparent');
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.arc(x, y, radius * 3, 0, Math.PI * 2);
  ctx.fill();
}
