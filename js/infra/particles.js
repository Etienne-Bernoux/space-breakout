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

// --- Grosse explosion (destruction vaisseau) ---
const SHIP_COLORS = ['#55eeff', '#00aaff', '#ff8800', '#ffffff', '#ffcc00', '#00ffcc', '#ff4400', '#ff6600'];
export function spawnShipExplosion(x, y) {
  const rndColor = () => SHIP_COLORS[Math.floor(Math.random() * SHIP_COLORS.length)];

  const ng = true; // noGravity — explosion dans toutes les directions

  // Flash blanc initial
  particles.push({ x, y, dx: 0, dy: 0, size: 40, life: 1, decay: 0.03, color: '#ffffff', noGravity: ng });
  // Second flash cyan décalé
  particles.push({ x, y, dx: 0, dy: 0, size: 25, life: 1, decay: 0.02, color: '#55eeff', noGravity: ng });

  // Vague 1 : boule de feu — grosses particules lentes
  for (let i = 0; i < 30; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = 0.3 + Math.random() * 1.5;
    particles.push({
      x: x + (Math.random() - 0.5) * 30,
      y: y + (Math.random() - 0.5) * 14,
      dx: Math.cos(angle) * speed,
      dy: Math.sin(angle) * speed,
      size: 4 + Math.random() * 7,
      life: 1,
      decay: 0.005 + Math.random() * 0.008,
      color: rndColor(), noGravity: ng,
    });
  }

  // Vague 2 : éclats moyens
  for (let i = 0; i < 25; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = 1 + Math.random() * 3;
    particles.push({
      x: x + (Math.random() - 0.5) * 16,
      y: y + (Math.random() - 0.5) * 8,
      dx: Math.cos(angle) * speed,
      dy: Math.sin(angle) * speed,
      size: 2 + Math.random() * 4,
      life: 1,
      decay: 0.01 + Math.random() * 0.015,
      color: rndColor(), noGravity: ng,
    });
  }

  // Vague 3 : étincelles rapides
  for (let i = 0; i < 20; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = 3 + Math.random() * 5;
    particles.push({
      x, y,
      dx: Math.cos(angle) * speed,
      dy: Math.sin(angle) * speed,
      size: 1 + Math.random() * 2,
      life: 1,
      decay: 0.015 + Math.random() * 0.025,
      color: '#ffdd88', noGravity: ng,
    });
  }

  // Vague 4 : braises dans toutes les directions
  for (let i = 0; i < 10; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = 0.3 + Math.random() * 0.8;
    particles.push({
      x: x + (Math.random() - 0.5) * 40,
      y,
      dx: Math.cos(angle) * speed,
      dy: Math.sin(angle) * speed,
      size: 1.5 + Math.random() * 2,
      life: 1,
      decay: 0.006 + Math.random() * 0.006,
      color: '#ff6600', noGravity: ng,
    });
  }
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
export function updateParticles(ctx, dt = 1) {
  // Particules d'explosion
  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];
    p.x += p.dx * dt;
    p.y += p.dy * dt;
    p.life -= p.decay * dt;
    if (!p.noGravity) p.dy += 0.05 * dt; // légère gravité

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
    t.life -= t.decay * dt;

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
