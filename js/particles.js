const particles = [];
const trail = [];

// --- Explosion d'astéroïde ---
export function spawnExplosion(x, y, color) {
  const count = 8 + Math.floor(Math.random() * 6);
  for (let i = 0; i < count; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = 1 + Math.random() * 3;
    particles.push({
      x,
      y,
      dx: Math.cos(angle) * speed,
      dy: Math.sin(angle) * speed,
      size: 2 + Math.random() * 3,
      life: 1,
      decay: 0.02 + Math.random() * 0.02,
      color,
    });
  }
  // Flash blanc à l'impact
  particles.push({
    x,
    y,
    dx: 0,
    dy: 0,
    size: 15,
    life: 1,
    decay: 0.1,
    color: '#ffffff',
  });
}

// --- Trainée du drone ---
export function spawnTrail(x, y) {
  trail.push({
    x,
    y,
    size: 2 + Math.random() * 1.5,
    life: 1,
    decay: 0.06,
  });
}

// --- Update & Draw ---
export function updateParticles(ctx) {
  // Particules d'explosion
  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];
    p.x += p.dx;
    p.y += p.dy;
    p.life -= p.decay;
    p.dy += 0.05; // légère gravité

    if (p.life <= 0) {
      particles.splice(i, 1);
      continue;
    }

    ctx.globalAlpha = p.life;
    ctx.fillStyle = p.color;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2);
    ctx.fill();
  }

  // Trainée du drone
  for (let i = trail.length - 1; i >= 0; i--) {
    const t = trail[i];
    t.life -= t.decay;

    if (t.life <= 0) {
      trail.splice(i, 1);
      continue;
    }

    ctx.globalAlpha = t.life * 0.5;
    ctx.fillStyle = '#ffcc00';
    ctx.beginPath();
    ctx.arc(t.x, t.y, t.size * t.life, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.globalAlpha = 1;
}
