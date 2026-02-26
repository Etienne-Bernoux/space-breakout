const bgCanvas = document.getElementById('bg-canvas');
const bgCtx = bgCanvas.getContext('2d');

// === Étoiles (3 couches parallaxe) ===
const layers = [
  { count: 80, speed: 0.2, maxSize: 1.2, alpha: 0.4 },
  { count: 50, speed: 0.5, maxSize: 1.8, alpha: 0.6 },
  { count: 30, speed: 1.0, maxSize: 2.5, alpha: 0.9 },
];

let stars = [];

function initStars() {
  stars = layers.flatMap((layer) =>
    Array.from({ length: layer.count }, () => ({
      x: Math.random() * bgCanvas.width,
      y: Math.random() * bgCanvas.height,
      size: Math.random() * layer.maxSize + 0.5,
      alpha: layer.alpha * (0.5 + Math.random() * 0.5),
      speed: layer.speed,
    }))
  );
}

// === Corps célestes (couche intermédiaire) ===
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

let bodies = [];

function randomBody(startY) {
  const w = bgCanvas.width;
  const h = bgCanvas.height;
  const type = BODY_TYPES[Math.floor(Math.random() * BODY_TYPES.length)];
  const palette = PALETTES[Math.floor(Math.random() * PALETTES.length)];
  const radius = type === 'planet'
    ? 30 + Math.random() * 50
    : 50 + Math.random() * 80;

  // Propriétés planète
  const bandCount = 4 + Math.floor(Math.random() * 5);      // 4-8 bandes
  const bands = Array.from({ length: bandCount }, () => ({
    offset: Math.random() * 0.15 - 0.075,                   // variation de teinte
    width: 0.08 + Math.random() * 0.15,                     // épaisseur relative
  }));
  const hasRing = type === 'planet' && Math.random() < 0.35;
  const ringTilt = 0.2 + Math.random() * 0.25;              // inclinaison anneau
  const ringGap = hasRing ? 0.05 + Math.random() * 0.1 : 0; // espace entre anneaux
  const lightAngle = Math.random() * Math.PI * 2;           // angle d'éclairage

  return {
    type,
    x: radius + Math.random() * (w - radius * 2),
    y: startY !== undefined ? startY : Math.random() * (h + radius * 2) - radius,
    radius,
    alpha: 0.15 + Math.random() * 0.1,
    palette,
    rotation: Math.random() * Math.PI * 2,
    hasRing, bands, ringTilt, ringGap, lightAngle,
  };
}

function initBodies() {
  bodies = Array.from({ length: BODY_COUNT }, () => randomBody());
}

// === Resize ===
function resize() {
  bgCanvas.width = window.innerWidth;
  bgCanvas.height = window.innerHeight;
  initStars();
  initBodies();
}
window.addEventListener('resize', resize);
resize();

// === Rendu corps célestes ===
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

function drawPlanet(b) {
  const { x, y, radius, alpha, palette, hasRing, bands, ringTilt, ringGap, lightAngle } = b;
  const r = radius;
  bgCtx.save();
  bgCtx.globalAlpha = alpha;

  // --- Glow atmosphérique ---
  const glow = bgCtx.createRadialGradient(x, y, r * 0.8, x, y, r * 1.3);
  glow.addColorStop(0, palette.glow);
  glow.addColorStop(1, 'transparent');
  bgCtx.fillStyle = glow;
  bgCtx.beginPath();
  bgCtx.arc(x, y, r * 1.3, 0, Math.PI * 2);
  bgCtx.fill();

  // --- Clip circulaire pour le corps ---
  bgCtx.save();
  bgCtx.beginPath();
  bgCtx.arc(x, y, r, 0, Math.PI * 2);
  bgCtx.clip();

  // Couleur de base
  bgCtx.fillStyle = palette.core;
  bgCtx.fillRect(x - r, y - r, r * 2, r * 2);

  // --- Bandes atmosphériques ---
  let bandY = y - r;
  for (const band of bands) {
    const bh = band.width * r * 2;
    bgCtx.fillStyle = shiftColor(palette.core, band.offset);
    bgCtx.fillRect(x - r, bandY, r * 2, bh);
    bandY += bh;
  }

  // --- Dégradé sphérique (volume) ---
  const lx = x + Math.cos(lightAngle) * r * 0.3;
  const ly = y + Math.sin(lightAngle) * r * 0.3;
  const sphere = bgCtx.createRadialGradient(lx, ly, r * 0.05, x, y, r);
  sphere.addColorStop(0, 'rgba(255,255,255,0.15)');
  sphere.addColorStop(0.5, 'rgba(255,255,255,0.03)');
  sphere.addColorStop(1, 'rgba(0,0,0,0.4)');
  bgCtx.fillStyle = sphere;
  bgCtx.fillRect(x - r, y - r, r * 2, r * 2);

  // --- Terminateur (ombre jour/nuit) ---
  const sx = x - Math.cos(lightAngle) * r * 0.6;
  const sy = y - Math.sin(lightAngle) * r * 0.6;
  const shadow = bgCtx.createRadialGradient(sx, sy, r * 0.2, sx, sy, r * 1.2);
  shadow.addColorStop(0, 'rgba(0,0,0,0.5)');
  shadow.addColorStop(1, 'rgba(0,0,0,0)');
  bgCtx.fillStyle = shadow;
  bgCtx.fillRect(x - r, y - r, r * 2, r * 2);

  bgCtx.restore(); // fin clip

  // --- Anneau (si présent) ---
  if (hasRing) {
    bgCtx.globalAlpha = alpha * 0.5;

    // Anneau arrière (derrière la planète)
    bgCtx.save();
    bgCtx.beginPath();
    bgCtx.rect(x - r * 2.2, y, r * 4.4, r * 2.2);
    bgCtx.clip();
    drawRing(x, y, r, palette, ringTilt, ringGap);
    bgCtx.restore();

    // Re-dessiner la planète par-dessus pour masquer l'anneau devant
    bgCtx.globalAlpha = alpha;
    bgCtx.save();
    bgCtx.beginPath();
    bgCtx.arc(x, y, r, 0, Math.PI * 2);
    bgCtx.clip();
    bgCtx.fillStyle = palette.core;
    bgCtx.fillRect(x - r, y - r, r * 2, r * 2);
    let by = y - r;
    for (const band of bands) {
      const bh = band.width * r * 2;
      bgCtx.fillStyle = shiftColor(palette.core, band.offset);
      bgCtx.fillRect(x - r, by, r * 2, bh);
      by += bh;
    }
    const sphere2 = bgCtx.createRadialGradient(lx, ly, r * 0.05, x, y, r);
    sphere2.addColorStop(0, 'rgba(255,255,255,0.15)');
    sphere2.addColorStop(0.5, 'rgba(255,255,255,0.03)');
    sphere2.addColorStop(1, 'rgba(0,0,0,0.4)');
    bgCtx.fillStyle = sphere2;
    bgCtx.fillRect(x - r, y - r, r * 2, r * 2);
    bgCtx.restore();

    // Anneau avant (devant la planète)
    bgCtx.globalAlpha = alpha * 0.5;
    bgCtx.save();
    bgCtx.beginPath();
    bgCtx.rect(x - r * 2.2, y - r * 2.2, r * 4.4, r * 2.2);
    bgCtx.clip();
    drawRing(x, y, r, palette, ringTilt, ringGap);
    bgCtx.restore();
  }

  bgCtx.restore();
}

function drawRing(x, y, r, palette, tilt, gap) {
  // Anneau extérieur
  bgCtx.strokeStyle = palette.glow;
  bgCtx.lineWidth = r * 0.12;
  bgCtx.beginPath();
  bgCtx.ellipse(x, y, r * 1.8, r * tilt, 0, 0, Math.PI * 2);
  bgCtx.stroke();

  // Anneau intérieur
  bgCtx.strokeStyle = shiftColor(palette.glow, -0.05);
  bgCtx.lineWidth = r * 0.06;
  bgCtx.beginPath();
  bgCtx.ellipse(x, y, r * 1.5, r * (tilt * 0.8), 0, 0, Math.PI * 2);
  bgCtx.stroke();
}

function drawNebula(b) {
  const { x, y, radius, alpha, palette } = b;
  bgCtx.save();
  bgCtx.globalAlpha = alpha * 0.7;

  for (let i = 0; i < 3; i++) {
    const ox = Math.cos(b.rotation + i * 2.1) * radius * 0.3;
    const oy = Math.sin(b.rotation + i * 2.1) * radius * 0.3;
    const r = radius * (0.6 + i * 0.2);
    const grad = bgCtx.createRadialGradient(x + ox, y + oy, 0, x + ox, y + oy, r);
    grad.addColorStop(0, i % 2 === 0 ? palette.glow : palette.core);
    grad.addColorStop(1, 'transparent');
    bgCtx.fillStyle = grad;
    bgCtx.beginPath();
    bgCtx.arc(x + ox, y + oy, r, 0, Math.PI * 2);
    bgCtx.fill();
  }

  bgCtx.restore();
}

function updateBodies() {
  for (const b of bodies) {
    b.y += BODY_SPEED;
    b.rotation += 0.0003;
    if (b.y - b.radius * 1.5 > bgCanvas.height) {
      Object.assign(b, randomBody(-(b.radius * 2 + Math.random() * bgCanvas.height * 0.5)));
    }
  }
  for (const b of bodies) {
    if (b.type === 'planet') drawPlanet(b);
    else drawNebula(b);
  }
}

// === Boucle de rendu ===
export function updateStars() {
  bgCtx.clearRect(0, 0, bgCanvas.width, bgCanvas.height);

  for (const s of stars) {
    s.y += s.speed;
    if (s.y > bgCanvas.height) {
      s.y = -2;
      s.x = Math.random() * bgCanvas.width;
    }
    bgCtx.fillStyle = `rgba(255, 255, 255, ${s.alpha})`;
    bgCtx.fillRect(s.x, s.y, s.size, s.size);
  }

  updateBodies();
}
