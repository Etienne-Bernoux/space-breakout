// --- Fond étoilé parallaxe + corps célestes ---
// Les étoiles (3 couches) restent ici ; les planètes/nébuleuses sont dans celestial-bodies.js.

import { initBodies, updateBodies } from './celestial-bodies.js';

const bgCanvas = document.getElementById('bg-canvas');
const bgCtx = bgCanvas.getContext('2d');

// === Étoiles (3 couches parallaxe) ===
const layers = [
  { count: 80, speed: 0.2, maxSize: 1.2, alpha: 0.4 },
  { count: 50, speed: 0.5, maxSize: 1.8, alpha: 0.6 },
  { count: 30, speed: 1.0, maxSize: 2.5, alpha: 0.9 },
];

let stars = [];
let bodies = [];

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

// === Resize ===
function resize() {
  bgCanvas.width = window.innerWidth;
  bgCanvas.height = window.innerHeight;
  initStars();
  bodies = initBodies(bgCanvas);
}
window.addEventListener('resize', resize);
resize();

// === Boucle de rendu ===
export function updateStars(speedMultiplier = 1) {
  bgCtx.clearRect(0, 0, bgCanvas.width, bgCanvas.height);

  for (const s of stars) {
    s.y += s.speed * speedMultiplier;
    if (s.y > bgCanvas.height) {
      s.y = -2;
      s.x = Math.random() * bgCanvas.width;
    }
    bgCtx.fillStyle = `rgba(255, 255, 255, ${s.alpha})`;
    bgCtx.fillRect(s.x, s.y, s.size, s.size);
  }

  updateBodies(bgCtx, bgCanvas, bodies);
}
