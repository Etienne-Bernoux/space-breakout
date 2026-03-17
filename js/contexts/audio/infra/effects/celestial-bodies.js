// --- Corps célestes : planètes et nébuleuses en fond ---
// Couche intermédiaire entre les étoiles parallaxe (rapides) et le canvas de jeu.
// Supporte des thèmes par zone : 'default' (menus), 'belt' (zone1), 'ice' (zone2).

const BODY_COUNT = 4;
const BODY_SPEED = 0.15;
const BODY_TYPES = ['planet', 'planet', 'planet', 'nebula'];

let _canvas = null; // référence au bg-canvas pour setBodyTheme

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
  // Scale radius for small screens (mobile portrait)
  const sizeScale = Math.min(1, w / 800);
  const radius = (type === 'planet'
    ? 30 + Math.random() * 50
    : 50 + Math.random() * 80) * sizeScale;

  const bandCount = 4 + Math.floor(Math.random() * 5);
  const bands = Array.from({ length: bandCount }, () => ({
    offset: Math.random() * 0.15 - 0.075,
    width: 0.08 + Math.random() * 0.15,
  }));
  const hasRing = type === 'planet' && Math.random() < 0.35;
  const ringTilt = 0.2 + Math.random() * 0.25;
  const ringGap = hasRing ? 0.05 + Math.random() * 0.1 : 0;
  const lightAngle = Math.random() * Math.PI * 2;

  const alphaScale = Math.min(1, w / 600); // dimmer on small screens
  return {
    type, radius, alpha: (0.15 + Math.random() * 0.1) * alphaScale, palette,
    x: radius + Math.random() * (w - radius * 2),
    y: startY !== undefined ? startY : Math.random() * (canvas.height + radius * 2) - radius,
    rotation: Math.random() * Math.PI * 2,
    hasRing, bands, ringTilt, ringGap, lightAngle,
  };
}

export function initBodies(canvas) {
  _canvas = canvas;
  return Array.from({ length: BODY_COUNT }, () => randomBody(canvas));
}

// === Thème belt : petits astéroïdes sombres ===

function randomBeltRock(canvas, startY) {
  const sizeScale = Math.min(1, canvas.width / 800);
  const radius = (5 + Math.random() * 12) * sizeScale;
  const numPoints = 6 + Math.floor(Math.random() * 3);
  const shape = Array.from({ length: numPoints }, (_, i) => {
    const angle = (i / numPoints) * Math.PI * 2;
    const jitter = 0.65 + Math.random() * 0.35;
    return { angle, jitter };
  });
  return {
    type: 'beltRock', radius, shape,
    x: Math.random() * canvas.width,
    y: startY !== undefined ? startY : Math.random() * canvas.height,
    speed: 0.1 + Math.random() * 0.3,
    alpha: (0.08 + Math.random() * 0.07) * Math.min(1, canvas.width / 600),
    rotation: Math.random() * Math.PI * 2,
    rotSpeed: (Math.random() - 0.5) * 0.002,
  };
}

function randomIceChunk(canvas, startY) {
  const sizeScale = Math.min(1, canvas.width / 800);
  const radius = (8 + Math.random() * 14) * sizeScale;
  const numPoints = 5 + Math.floor(Math.random() * 4);
  const shape = Array.from({ length: numPoints }, (_, i) => {
    const angle = (i / numPoints) * Math.PI * 2;
    const jitter = 0.55 + Math.random() * 0.45; // plus anguleux
    return { angle, jitter };
  });
  return {
    type: 'iceChunk', radius, shape,
    x: Math.random() * canvas.width,
    y: startY !== undefined ? startY : Math.random() * canvas.height,
    speed: 0.1 + Math.random() * 0.15,
    alpha: (0.12 + Math.random() * 0.08) * Math.min(1, canvas.width / 600),
    rotation: Math.random() * Math.PI * 2,
    rotSpeed: (Math.random() - 0.5) * 0.0015,
  };
}

function randomIcePlanet(canvas) {
  const sizeScale = Math.min(1, canvas.width / 800);
  const radius = (200 + Math.random() * 60) * sizeScale;
  const bandCount = 5 + Math.floor(Math.random() * 4);
  const bands = Array.from({ length: bandCount }, () => ({
    offset: Math.random() * 0.08 - 0.04,
    width: 0.08 + Math.random() * 0.12,
  }));
  const alphaScale = Math.min(1, canvas.width / 600);
  return {
    type: 'planet', radius,
    palette: { core: '#1a3a5c', glow: '#5bc0eb' },
    alpha: 0.25 * alphaScale,
    x: canvas.width * (0.3 + Math.random() * 0.4),
    y: canvas.height * (0.3 + Math.random() * 0.4),
    speed: 0.03,
    rotation: Math.random() * Math.PI * 2,
    hasRing: false, bands, ringTilt: 0, ringGap: 0,
    lightAngle: Math.random() * Math.PI * 2,
  };
}

function initBeltBodies(canvas) {
  const count = 15 + Math.floor(Math.random() * 6);
  return Array.from({ length: count }, () => randomBeltRock(canvas));
}

function initIceBodies(canvas) {
  const planet = randomIcePlanet(canvas);
  const count = 10;
  // Répartir les chunks sur toute la hauteur pour éviter les regroupements
  const chunks = Array.from({ length: count }, (_, i) => {
    const chunk = randomIceChunk(canvas);
    chunk.y = (i / count) * (canvas.height + 100) - 50;
    chunk.x = chunk.radius + Math.random() * (canvas.width - chunk.radius * 2);
    return chunk;
  });
  return [planet, ...chunks];
}

/** Change le thème de fond. Retourne le nouveau tableau de bodies. */
export function setBodyTheme(theme, canvas) {
  const c = canvas || _canvas;
  if (!c) return [];
  if (theme === 'belt') return initBeltBodies(c);
  if (theme === 'ice') return initIceBodies(c);
  return initBodies(c);
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

function drawBeltAsteroid(ctx, b) {
  const { x, y, radius, alpha, shape, rotation } = b;
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.translate(x, y);
  ctx.rotate(rotation);
  const grad = ctx.createRadialGradient(0, 0, radius * 0.1, 0, 0, radius);
  grad.addColorStop(0, '#2a2a3e');
  grad.addColorStop(1, '#1a1a2e');
  ctx.fillStyle = grad;
  ctx.beginPath();
  for (let i = 0; i < shape.length; i++) {
    const px = Math.cos(shape[i].angle) * radius * shape[i].jitter;
    const py = Math.sin(shape[i].angle) * radius * shape[i].jitter;
    i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
  }
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function drawIceChunk(ctx, b) {
  const { x, y, radius, alpha, shape, rotation } = b;
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.translate(x, y);
  ctx.rotate(rotation);
  const grad = ctx.createRadialGradient(0, 0, radius * 0.1, 0, 0, radius);
  grad.addColorStop(0, '#aaddff');
  grad.addColorStop(0.6, '#88ccee');
  grad.addColorStop(1, '#5599bb');
  ctx.fillStyle = grad;
  ctx.beginPath();
  for (let i = 0; i < shape.length; i++) {
    const px = Math.cos(shape[i].angle) * radius * shape[i].jitter;
    const py = Math.sin(shape[i].angle) * radius * shape[i].jitter;
    i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
  }
  ctx.closePath();
  ctx.fill();
  // Reflet blanc (specularity)
  ctx.globalAlpha = alpha * 0.4;
  ctx.fillStyle = '#fff';
  ctx.beginPath();
  ctx.arc(-radius * 0.2, -radius * 0.2, radius * 0.25, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function respawnBody(b, canvas) {
  if (b.type === 'beltRock') {
    Object.assign(b, randomBeltRock(canvas, -(b.radius * 2 + Math.random() * 100)));
  } else if (b.type === 'iceChunk') {
    Object.assign(b, randomIceChunk(canvas, -(b.radius * 2 + Math.random() * 100)));
  } else {
    Object.assign(b, randomBody(canvas, -(b.radius * 2 + Math.random() * canvas.height * 0.5)));
  }
}

export function updateBodies(ctx, canvas, bodies) {
  for (const b of bodies) {
    b.y += b.speed || BODY_SPEED;
    b.rotation += b.rotSpeed || 0.0003;
    if (b.y - b.radius * 1.5 > canvas.height) {
      respawnBody(b, canvas);
    }
  }
  // Dessiner par couches : planètes d'abord (fond), puis chunks/rocks (avant-plan)
  for (const b of bodies) {
    if (b.type === 'planet') drawPlanet(ctx, b);
    else if (b.type === 'nebula') drawNebula(ctx, b);
  }
  for (const b of bodies) {
    if (b.type === 'beltRock') drawBeltAsteroid(ctx, b);
    else if (b.type === 'iceChunk') drawIceChunk(ctx, b);
  }
}
