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

// --- Explosion alien (tentacule détruite) ---
const ALIEN_COLORS = ['#33cc55', '#22aa44', '#44dd66', '#119933', '#55ff77'];
export function spawnAlienExplosion(x, y) {
  const rnd = () => ALIEN_COLORS[Math.floor(Math.random() * ALIEN_COLORS.length)];
  // Flash vert
  particles.push({ x, y, dx: 0, dy: 0, size: 22, life: 1, decay: 0.06, color: '#55ff77', noGravity: true });
  // Éclats verts
  for (let i = 0; i < 18; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = 1 + Math.random() * 3.5;
    particles.push({
      x: x + (Math.random() - 0.5) * 12,
      y: y + (Math.random() - 0.5) * 12,
      dx: Math.cos(angle) * speed,
      dy: Math.sin(angle) * speed,
      size: 2 + Math.random() * 4,
      life: 1, decay: 0.012 + Math.random() * 0.015,
      color: rnd(), noGravity: true,
    });
  }
}

// --- Explosion boss (destruction spectaculaire) ---
const BOSS_COLORS = ['#33cc55', '#22aa44', '#55ff77', '#ffffff', '#88ffaa', '#44dd66', '#00ff44'];
export function spawnBossExplosion(x, y) {
  const rnd = () => BOSS_COLORS[Math.floor(Math.random() * BOSS_COLORS.length)];
  const ng = true;

  // Double flash (blanc puis vert)
  particles.push({ x, y, dx: 0, dy: 0, size: 50, life: 1, decay: 0.025, color: '#ffffff', noGravity: ng });
  particles.push({ x, y, dx: 0, dy: 0, size: 35, life: 1, decay: 0.02, color: '#55ff77', noGravity: ng });

  // Vague 1 : boule d'énergie — grosses particules lentes
  for (let i = 0; i < 35; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = 0.3 + Math.random() * 1.5;
    particles.push({
      x: x + (Math.random() - 0.5) * 40,
      y: y + (Math.random() - 0.5) * 30,
      dx: Math.cos(angle) * speed,
      dy: Math.sin(angle) * speed,
      size: 5 + Math.random() * 8,
      life: 1, decay: 0.004 + Math.random() * 0.006,
      color: rnd(), noGravity: ng,
    });
  }

  // Vague 2 : débris moyens
  for (let i = 0; i < 30; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = 1.5 + Math.random() * 4;
    particles.push({
      x: x + (Math.random() - 0.5) * 20,
      y: y + (Math.random() - 0.5) * 15,
      dx: Math.cos(angle) * speed,
      dy: Math.sin(angle) * speed,
      size: 2.5 + Math.random() * 5,
      life: 1, decay: 0.008 + Math.random() * 0.012,
      color: rnd(), noGravity: ng,
    });
  }

  // Vague 3 : étincelles rapides
  for (let i = 0; i < 25; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = 3.5 + Math.random() * 6;
    particles.push({
      x, y,
      dx: Math.cos(angle) * speed,
      dy: Math.sin(angle) * speed,
      size: 1 + Math.random() * 2.5,
      life: 1, decay: 0.015 + Math.random() * 0.02,
      color: '#aaffcc', noGravity: ng,
    });
  }

  // Vague 4 : braises organiques lentes
  for (let i = 0; i < 15; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = 0.2 + Math.random() * 0.7;
    particles.push({
      x: x + (Math.random() - 0.5) * 50,
      y: y + (Math.random() - 0.5) * 30,
      dx: Math.cos(angle) * speed,
      dy: Math.sin(angle) * speed,
      size: 1.5 + Math.random() * 3,
      life: 1, decay: 0.004 + Math.random() * 0.005,
      color: '#33cc55', noGravity: ng,
    });
  }
}

// --- Flash de rebond vaisseau ---
export function spawnBounceFlash(x, y) {
  // Arc lumineux cyan au point de contact
  particles.push({ x, y, dx: 0, dy: 0, size: 10, life: 1, decay: 0.12, color: '#88eeff', noGravity: true });
  // 5 micro-étincelles directionnelles (vers le haut)
  for (let i = 0; i < 5; i++) {
    const angle = -Math.PI / 2 + (Math.random() - 0.5) * 1.2; // ±35° vers le haut
    const speed = 1.5 + Math.random() * 2.5;
    particles.push({
      x: x + (Math.random() - 0.5) * 8,
      y,
      dx: Math.cos(angle) * speed,
      dy: Math.sin(angle) * speed,
      size: 1 + Math.random() * 1.5,
      life: 1, decay: 0.06 + Math.random() * 0.04,
      color: i < 3 ? '#aaeeff' : '#ffffff', noGravity: true,
    });
  }
}

// --- Sparkles combo milestones (burst doré aux paliers 5, 10, 15…) ---
const COMBO_COLORS = ['#ffdd44', '#ffcc00', '#ffaa22', '#ffffff', '#ffee88'];
const RAINBOW = ['#ff4444', '#ff8800', '#ffcc00', '#44ff44', '#4488ff', '#aa44ff', '#ff44aa'];
export function spawnComboSparkle(x, y, combo) {
  const count = Math.min(6 + Math.floor(combo / 5) * 2, 18);
  const useRainbow = combo >= 20;
  const palette = useRainbow ? RAINBOW : COMBO_COLORS;
  const rnd = () => palette[Math.floor(Math.random() * palette.length)];

  // Flash doré central
  const flashSize = 12 + combo * 0.5;
  particles.push({ x, y, dx: 0, dy: 0, size: flashSize, life: 1, decay: 0.08, color: useRainbow ? '#ffffff' : '#ffee88', noGravity: true });

  // Burst de sparkles
  for (let i = 0; i < count; i++) {
    const angle = (i / count) * Math.PI * 2 + Math.random() * 0.3;
    const speed = 1.5 + Math.random() * 3;
    particles.push({
      x, y,
      dx: Math.cos(angle) * speed,
      dy: Math.sin(angle) * speed,
      size: 1.5 + Math.random() * 2,
      life: 1, decay: 0.03 + Math.random() * 0.02,
      color: rnd(), noGravity: true,
    });
  }
}

// --- Trainée du drone (améliorée : taille + couleur selon vitesse) ---
export function spawnTrail(x, y, dx = 0, dy = 0) {
  const speed = Math.sqrt(dx * dx + dy * dy);
  const fast = Math.min(speed / 6, 1); // 0→1 normalisé

  // Taille proportionnelle à la vitesse + jitter (renforcée pour visibilité)
  const size = 2.5 + fast * 3 + Math.random() * 2;
  // Couleur : jaune → blanc quand rapide
  const r = 255;
  const g = Math.round(200 + fast * 55);
  const b = Math.round(fast * 200);

  trail.push({ x, y, size, life: 1, decay: 0.05 + Math.random() * 0.02, color: `rgb(${r},${g},${b})` });

  // Deuxième particule quand vitesse élevée
  if (speed > 4) {
    trail.push({
      x: x + (Math.random() - 0.5) * 3,
      y: y + (Math.random() - 0.5) * 3,
      size: 1 + Math.random() * 1.5,
      life: 0.8,
      decay: 0.06 + Math.random() * 0.03,
      color: `rgb(255,${Math.round(230 + Math.random() * 25)},${Math.round(100 + Math.random() * 100)})`,
    });
  }
}

// --- Update & Draw ---
// --- Onde de choc (anneau qui s'étend) ---
const shockwaves = [];

export function spawnShockwaveRing(x, y, maxRadius = 120, color = '#00e5ff') {
  shockwaves.push({ x, y, radius: 0, maxRadius, color, life: 1 });
}

export function updateParticles(ctx, dt = 1) {
  // Ondes de choc
  for (let i = shockwaves.length - 1; i >= 0; i--) {
    const sw = shockwaves[i];
    sw.radius += dt * 6;
    sw.life = 1 - sw.radius / sw.maxRadius;
    if (sw.life <= 0) { shockwaves.splice(i, 1); continue; }
    ctx.strokeStyle = sw.color;
    ctx.lineWidth = 3 * sw.life;
    ctx.globalAlpha = sw.life * 0.8;
    ctx.beginPath();
    ctx.arc(sw.x, sw.y, sw.radius, 0, Math.PI * 2);
    ctx.stroke();
    // Glow
    ctx.lineWidth = 8 * sw.life;
    ctx.globalAlpha = sw.life * 0.2;
    ctx.beginPath();
    ctx.arc(sw.x, sw.y, sw.radius, 0, Math.PI * 2);
    ctx.stroke();
    ctx.globalAlpha = 1;
  }

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

    const alpha = t.life * 0.7;
    // Glow externe pour renforcer la visibilité
    ctx.globalAlpha = alpha * 0.3;
    ctx.fillStyle = t.color || '#ffcc00';
    ctx.beginPath();
    ctx.arc(t.x, t.y, t.size * t.life * 2, 0, Math.PI * 2);
    ctx.fill();
    // Particule principale
    ctx.globalAlpha = alpha;
    ctx.fillStyle = t.color || '#ffcc00';
    ctx.beginPath();
    ctx.arc(t.x, t.y, t.size * t.life, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.globalAlpha = 1;
}
