// --- Drone Renderer — Engin de minage spatial ---
// Corps sphérique gradient, anneau orbitant, core pulsant, halo dynamique

export function drawDrone(ctx, drone) {
  const { x, y, radius, color } = drone;
  const t = Date.now() * 0.001;

  // Vitesse du drone (pour halo dynamique)
  const vx = drone.dx || 0;
  const vy = drone.dy || 0;
  const speed = Math.sqrt(vx * vx + vy * vy);

  // --- 1. Halo dynamique (plus large quand rapide) ---
  const haloRadius = radius + 4 + speed * 0.8;
  const haloPulse = 0.2 + Math.sin(t * 4) * 0.08;
  const haloGrad = ctx.createRadialGradient(x, y, radius * 0.5, x, y, haloRadius);
  haloGrad.addColorStop(0, `rgba(255, 204, 0, ${haloPulse})`);
  haloGrad.addColorStop(0.6, `rgba(255, 170, 0, ${haloPulse * 0.4})`);
  haloGrad.addColorStop(1, 'rgba(255, 140, 0, 0)');
  ctx.fillStyle = haloGrad;
  ctx.beginPath();
  ctx.arc(x, y, haloRadius, 0, Math.PI * 2);
  ctx.fill();

  // --- 2. Corps sphérique (gradient radial) ---
  const bodyGrad = ctx.createRadialGradient(
    x - radius * 0.25, y - radius * 0.25, radius * 0.1,
    x, y, radius,
  );
  bodyGrad.addColorStop(0, '#ffffcc');
  bodyGrad.addColorStop(0.3, color);
  bodyGrad.addColorStop(0.7, '#aa7700');
  bodyGrad.addColorStop(1, '#553300');
  ctx.fillStyle = bodyGrad;
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.fill();

  // --- 3. Anneau orbitant ---
  const ringAngle = t * 2.5;
  const ringRadius = radius + 1.5;
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(ringAngle);
  ctx.strokeStyle = 'rgba(255, 230, 150, 0.5)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.ellipse(0, 0, ringRadius, ringRadius * 0.35, 0, 0, Math.PI * 2);
  ctx.stroke();
  // Petit point sur l'anneau (satellite)
  const satAngle = ringAngle * 1.5;
  const satX = Math.cos(satAngle) * ringRadius;
  const satY = Math.sin(satAngle) * ringRadius * 0.35;
  ctx.fillStyle = '#ffffaa';
  ctx.beginPath();
  ctx.arc(satX, satY, 1.2, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // --- 4. Core lumineux pulsant ---
  const corePulse = 0.5 + Math.sin(t * 6) * 0.3;
  const coreRadius = radius * 0.35;
  const coreGrad = ctx.createRadialGradient(x, y, 0, x, y, coreRadius);
  coreGrad.addColorStop(0, `rgba(255, 255, 255, ${corePulse})`);
  coreGrad.addColorStop(0.5, `rgba(255, 220, 100, ${corePulse * 0.6})`);
  coreGrad.addColorStop(1, 'rgba(255, 200, 50, 0)');
  ctx.fillStyle = coreGrad;
  ctx.beginPath();
  ctx.arc(x, y, coreRadius, 0, Math.PI * 2);
  ctx.fill();

  // --- 5. Capteurs (2 antennes fines) ---
  ctx.strokeStyle = 'rgba(255, 230, 180, 0.4)';
  ctx.lineWidth = 0.6;
  for (const sign of [-1, 1]) {
    const ax = x + sign * radius * 0.6;
    const ay = y - radius * 0.5;
    const tipX = ax + sign * 3;
    const tipY = ay - 4;
    ctx.beginPath();
    ctx.moveTo(ax, ay);
    ctx.lineTo(tipX, tipY);
    ctx.stroke();
    // Point lumineux au bout
    ctx.fillStyle = `rgba(255, 255, 200, ${0.4 + Math.sin(t * 8 + sign) * 0.3})`;
    ctx.beginPath();
    ctx.arc(tipX, tipY, 0.8, 0, Math.PI * 2);
    ctx.fill();
  }

  // --- 6. Reflet convexe (highlight) ---
  const hlGrad = ctx.createRadialGradient(
    x - radius * 0.3, y - radius * 0.3, 0,
    x - radius * 0.3, y - radius * 0.3, radius * 0.6,
  );
  hlGrad.addColorStop(0, 'rgba(255, 255, 255, 0.35)');
  hlGrad.addColorStop(1, 'rgba(255, 255, 255, 0)');
  ctx.fillStyle = hlGrad;
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.fill();

  // --- 7. Aura fireball (quand actif) ---
  if (drone.fireball) {
    const firePulse = 0.5 + Math.sin(t * 6) * 0.2;
    const fireRadius = radius + 6 + Math.sin(t * 8) * 2;
    const fireGrad = ctx.createRadialGradient(x, y, radius * 0.3, x, y, fireRadius);
    fireGrad.addColorStop(0, `rgba(255, 100, 0, ${0.4 * firePulse})`);
    fireGrad.addColorStop(0.5, `rgba(255, 60, 0, ${0.2 * firePulse})`);
    fireGrad.addColorStop(1, 'rgba(255, 30, 0, 0)');
    ctx.fillStyle = fireGrad;
    ctx.beginPath();
    ctx.arc(x, y, fireRadius, 0, Math.PI * 2);
    ctx.fill();
    // Traînée de flamme (direction opposée au mouvement)
    if (speed > 0.5) {
      const trailX = x - (vx / speed) * radius * 2;
      const trailY = y - (vy / speed) * radius * 2;
      const trailGrad = ctx.createRadialGradient(trailX, trailY, 0, trailX, trailY, radius * 1.5);
      trailGrad.addColorStop(0, `rgba(255, 80, 0, ${0.3 * firePulse})`);
      trailGrad.addColorStop(1, 'rgba(255, 40, 0, 0)');
      ctx.fillStyle = trailGrad;
      ctx.beginPath();
      ctx.arc(trailX, trailY, radius * 1.5, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}
