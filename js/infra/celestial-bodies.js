// --- Corps célestes : planètes et nébuleuses en fond ---
// Couche intermédiaire entre les étoiles parallaxe (rapides) et le canvas de jeu.

const BODY_COUNT = 4;
const BODY_SPEED = 0.15;
const BODY_TYPES = ['planet', 'planet', 'planet', 'nebula'];

const PALETTES = [
  { core: '#664422', glow: '#aa6633' },
  { core: '#334466', glow: '#5588bb' },
  { core: '#553344', glow: '#996677' },
  { core: '#445533', glow: '#88aa55' },
  { core: '#553322', glow: '#cc6644' },
];

function hexToRgb(hex) {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function shiftColor(hex, offset) {
  const [r, g, b] = hexToRgb(hex);
  const shift = Math.round(offset * 60);
  const clamp = v => Math.max(0, Math.min(255, v + shift));
  return `rgb(${clamp(r)},${clamp(g)},${clamp(b)})`;
}

export function randomBody(canvas, startY) {
  const w = canvas.width;
  const type = BODY_TYPES[Math.floor(Math.random() * BODY_TYPES.length)];
  const palette = PALETTES[Math.floor(Math.random() * PALETTES.length)];
  const radius = type === 'planet'
    ? 30 + Math.random() * 50
    : 50 + Math.random() * 80;

  const bandCount = 4 + Math.floor(Math.random() * 5);
  const bands = Array.from({ length: bandCount }, () => ({
    offset: Math.random() * 0.15 - 0.075,
    width: 0.08 + Math.random() * 0.15,
  }));
  const hasRing = type === 'planet' && Math.random() < 0.35;
  const ringTilt = 0.2 + Math.random() * 0.25;
  const ringGap = hasRing ? 0.05 + Math.random() * 0.1 : 0;
  const lightAngle = Math.random() * Math.PI * 2;

  return {
    type, radius, alpha: 0.15 + Math.random() * 0.1, palette,
    x: radius + Math.random() * (w - radius * 2),
    y: startY !== undefined ? startY : Math.random() * (canvas.height + radius * 2) - radius,
    rotation: Math.random() * Math.PI * 2,
    hasRing, bands, ringTilt, ringGap, lightAngle,
  };
}

export function initBodies(canvas) {
  return Array.from({ length: BODY_COUNT }, () => randomBody(canvas));
}

function drawRing(ctx, x, y, r, palette, tilt) {
  ctx.strokeStyle = palette.glow;
  ctx.lineWidth = r * 0.12;
  ctx.beginPath();
  ctx.ellipse(x, y, r * 1.8, r * tilt, 0, 0, Math.PI * 2);
  ctx.stroke();

  ctx.strokeStyle = shiftColor(palette.glow, -0.05);
  ctx.lineWidth = r * 0.06;
  ctx.beginPath();
  ctx.ellipse(x, y, r * 1.5, r * (tilt * 0.8), 0, 0, Math.PI * 2);
  ctx.stroke();
}

function drawPlanet(ctx, b) {
  const { x, y, radius, alpha, palette, hasRing, bands, ringTilt, lightAngle } = b;
  const r = radius;
  ctx.save();
  ctx.globalAlpha = alpha;

  // Glow atmosphérique
  const glow = ctx.createRadialGradient(x, y, r * 0.8, x, y, r * 1.3);
  glow.addColorStop(0, palette.glow);
  glow.addColorStop(1, 'transparent');
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.arc(x, y, r * 1.3, 0, Math.PI * 2);
  ctx.fill();

  // Clip circulaire
  ctx.save();
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.clip();

  ctx.fillStyle = palette.core;
  ctx.fillRect(x - r, y - r, r * 2, r * 2);

  // Bandes atmosphériques
  let bandY = y - r;
  for (const band of bands) {
    const bh = band.width * r * 2;
    ctx.fillStyle = shiftColor(palette.core, band.offset);
    ctx.fillRect(x - r, bandY, r * 2, bh);
    bandY += bh;
  }

  // Dégradé sphérique (volume)
  const lx = x + Math.cos(lightAngle) * r * 0.3;
  const ly = y + Math.sin(lightAngle) * r * 0.3;
  const sphere = ctx.createRadialGradient(lx, ly, r * 0.05, x, y, r);
  sphere.addColorStop(0, 'rgba(255,255,255,0.15)');
  sphere.addColorStop(0.5, 'rgba(255,255,255,0.03)');
  sphere.addColorStop(1, 'rgba(0,0,0,0.4)');
  ctx.fillStyle = sphere;
  ctx.fillRect(x - r, y - r, r * 2, r * 2);

  // Terminateur (ombre jour/nuit)
  const sx = x - Math.cos(lightAngle) * r * 0.6;
  const sy = y - Math.sin(lightAngle) * r * 0.6;
  const shadow = ctx.createRadialGradient(sx, sy, r * 0.2, sx, sy, r * 1.2);
  shadow.addColorStop(0, 'rgba(0,0,0,0.5)');
  shadow.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = shadow;
  ctx.fillRect(x - r, y - r, r * 2, r * 2);

  ctx.restore(); // fin clip

  // Anneau (si présent)
  if (hasRing) {
    ctx.globalAlpha = alpha * 0.5;

    // Anneau arrière
    ctx.save();
    ctx.beginPath();
    ctx.rect(x - r * 2.2, y, r * 4.4, r * 2.2);
    ctx.clip();
    drawRing(ctx, x, y, r, palette, ringTilt);
    ctx.restore();

    // Re-dessiner la planète par-dessus
    ctx.globalAlpha = alpha;
    ctx.save();
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.clip();
    ctx.fillStyle = palette.core;
    ctx.fillRect(x - r, y - r, r * 2, r * 2);
    let by = y - r;
    for (const band of bands) {
      const bh = band.width * r * 2;
      ctx.fillStyle = shiftColor(palette.core, band.offset);
      ctx.fillRect(x - r, by, r * 2, bh);
      by += bh;
    }
    const sphere2 = ctx.createRadialGradient(lx, ly, r * 0.05, x, y, r);
    sphere2.addColorStop(0, 'rgba(255,255,255,0.15)');
    sphere2.addColorStop(0.5, 'rgba(255,255,255,0.03)');
    sphere2.addColorStop(1, 'rgba(0,0,0,0.4)');
    ctx.fillStyle = sphere2;
    ctx.fillRect(x - r, y - r, r * 2, r * 2);
    ctx.restore();

    // Anneau avant
    ctx.globalAlpha = alpha * 0.5;
    ctx.save();
    ctx.beginPath();
    ctx.rect(x - r * 2.2, y - r * 2.2, r * 4.4, r * 2.2);
    ctx.clip();
    drawRing(ctx, x, y, r, palette, ringTilt);
    ctx.restore();
  }

  ctx.restore();
}

function drawNebula(ctx, b) {
  const { x, y, radius, alpha, palette } = b;
  ctx.save();
  ctx.globalAlpha = alpha * 0.7;

  for (let i = 0; i < 3; i++) {
    const ox = Math.cos(b.rotation + i * 2.1) * radius * 0.3;
    const oy = Math.sin(b.rotation + i * 2.1) * radius * 0.3;
    const r = radius * (0.6 + i * 0.2);
    const grad = ctx.createRadialGradient(x + ox, y + oy, 0, x + ox, y + oy, r);
    grad.addColorStop(0, i % 2 === 0 ? palette.glow : palette.core);
    grad.addColorStop(1, 'transparent');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(x + ox, y + oy, r, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
}

export function updateBodies(ctx, canvas, bodies) {
  for (const b of bodies) {
    b.y += BODY_SPEED;
    b.rotation += 0.0003;
    if (b.y - b.radius * 1.5 > canvas.height) {
      Object.assign(b, randomBody(canvas, -(b.radius * 2 + Math.random() * canvas.height * 0.5)));
    }
  }
  for (const b of bodies) {
    if (b.type === 'planet') drawPlanet(ctx, b);
    else drawNebula(ctx, b);
  }
}
